import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, BookOpen, Users } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  assessment_type_id: string;
  assessment_type_name: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  class_name: string;
  subject_name: string;
  class_id: string;
  semester_id?: string;
  students_count?: number;
}

interface AssessmentType {
  id: string;
  code: string;
  name: string;
  weight_default: number;
}

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  subject_id?: string;
  subject_name?: string;
  role: string;
}

interface Semester {
  id: string;
  name: string;
  academic_year_id: string;
}

interface NewAssessment {
  title: string;
  assessment_type_id: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  class_id: string;
  semester_id: string;
}

export function AssessmentManager() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAssessment, setNewAssessment] = useState<NewAssessment>({
    title: '',
    assessment_type_id: '',
    max_score: 100,
    weight: 10,
    assessment_date: new Date().toISOString().split('T')[0],
    class_id: '',
    semester_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Load teacher's classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (classesError) throw classesError;

      const classes = (classesData || []).map(item => ({
        id: item.id,
        class_id: item.class_id,
        class_name: item.classes?.name || 'Unknown Class',
        subject_id: item.subject_id,
        subject_name: item.subjects?.name,
        role: item.role
      }));

      setTeacherClasses(classes);

      // Load assessment types
      const { data: typesData, error: typesError } = await supabase
        .from('assessment_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;
      setAssessmentTypes(typesData || []);

      // Load semesters
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select('*')
        .order('start_date', { ascending: false });

      if (semestersError) throw semestersError;
      setSemesters(semestersData || []);
      
      // Auto-select current semester if available
      if (semestersData && semestersData.length > 0) {
        setNewAssessment(prev => ({ ...prev, semester_id: semestersData[0].id }));
      }

      // Load teacher's assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(name),
          class_subject_assignments(
            class_id,
            classes(name),
            subjects(name)
          )
        `)
        .eq('created_by_teacher_id', teacherData.id)
        .order('assessment_date', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      const assessments = (assessmentsData || []).map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        assessment_type_id: assessment.assessment_type_id,
        assessment_type_name: assessment.assessment_types?.name || 'Unknown',
        max_score: assessment.max_score,
        weight: assessment.weight,
        assessment_date: assessment.assessment_date,
        is_published: assessment.is_published,
        class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown Class',
        subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown Subject',
        class_id: assessment.class_subject_assignments?.class_id || '',
        semester_id: assessment.semester_id
      }));

      setAssessments(assessments);

    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      toast({
        title: "Error",
        description: "Failed to load assessments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.assessment_type_id || !newAssessment.class_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Find class subject assignment
      const selectedClass = teacherClasses.find(c => c.id === newAssessment.class_id);
      if (!selectedClass) throw new Error('Class not found');

      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('id')
        .eq('class_id', selectedClass.class_id)
        .eq('teacher_id', teacherData.id)
        .eq('subject_id', selectedClass.subject_id)
        .single();

      if (csaError) throw csaError;

      // Validate semester selection
      if (!newAssessment.semester_id) throw new Error('Please select a semester');

      // Create assessment
      const { error: createError } = await supabase
        .from('assessments')
        .insert({
          title: newAssessment.title,
          assessment_type_id: newAssessment.assessment_type_id,
          class_subject_assignment_id: csaData.id,
          max_score: newAssessment.max_score,
          weight: newAssessment.weight,
          assessment_date: newAssessment.assessment_date,
          created_by_teacher_id: teacherData.id,
          semester_id: newAssessment.semester_id,
          is_published: false
        });

      if (createError) throw createError;

      toast({
        title: "Success",
        description: "Assessment created successfully"
      });

      setNewAssessment({
        title: '',
        assessment_type_id: '',
        max_score: 100,
        weight: 10,
        assessment_date: new Date().toISOString().split('T')[0],
        class_id: '',
        semester_id: ''
      });
      setIsCreateDialogOpen(false);
      loadData();

    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assessment",
        variant: "destructive"
      });
    }
  };

  const handlePublishAssessment = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ is_published: true })
        .eq('id', assessmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment published successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error publishing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to publish assessment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment deleted successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive"
      });
    }
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssessment = async () => {
    if (!editingAssessment) return;

    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) throw new Error('Teacher not found');

      // Find class subject assignment using the assessment's current assignment
      const { data: currentCSA } = await supabase
        .from('class_subject_assignments')
        .select('id, class_id, subject_id')
        .eq('id', editingAssessment.class_id)
        .single();

      if (!currentCSA) throw new Error('Class-subject assignment not found');

      // Update assessment
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          title: editingAssessment.title,
          assessment_type_id: editingAssessment.assessment_type_id,
          max_score: editingAssessment.max_score,
          weight: editingAssessment.weight,
          assessment_date: editingAssessment.assessment_date,
          semester_id: editingAssessment.semester_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAssessment.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Assessment updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingAssessment(null);
      loadData();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assessment",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Assessments
          </h2>
          <p className="text-muted-foreground">
            Create and manage assessments for your classes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assessment</DialogTitle>
              <DialogDescription>
                Create a new assessment for one of your classes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter assessment title"
                />
              </div>

              <div>
                <Label htmlFor="class">Class</Label>
                <Select
                  value={newAssessment.class_id}
                  onValueChange={(value) => setNewAssessment(prev => ({ ...prev, class_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses
                      .filter(c => c.role === 'subject_teacher')
                      .map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} {cls.subject_name && `(${cls.subject_name})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={newAssessment.semester_id}
                  onValueChange={(value) => setNewAssessment(prev => ({ ...prev, semester_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Assessment Type</Label>
                <Select
                  value={newAssessment.assessment_type_id}
                  onValueChange={(value) => {
                    const selectedType = assessmentTypes.find(t => t.id === value);
                    setNewAssessment(prev => ({ 
                      ...prev, 
                      assessment_type_id: value,
                      weight: selectedType?.weight_default || 10
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} (Default weight: {type.weight_default})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_score">Max Score</Label>
                  <Input
                    id="max_score"
                    type="number"
                    value={newAssessment.max_score}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, max_score: Number(e.target.value) }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={newAssessment.weight}
                    onChange={(e) => setNewAssessment(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Assessment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newAssessment.assessment_date}
                  onChange={(e) => setNewAssessment(prev => ({ ...prev, assessment_date: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssessment}>
                  Create Assessment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Assessment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>
              Update assessment details
            </DialogDescription>
          </DialogHeader>
          {editingAssessment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingAssessment.title}
                  onChange={(e) => setEditingAssessment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter assessment title"
                />
              </div>

              <div>
                <Label htmlFor="edit-class">Class</Label>
                <Select
                  value={editingAssessment.class_id}
                  onValueChange={(value) => setEditingAssessment(prev => ({ ...prev, class_id: value }))}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses
                      .filter(c => c.role === 'subject_teacher')
                      .map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} {cls.subject_name && `(${cls.subject_name})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-semester">Semester</Label>
                <Select
                  value={editingAssessment.semester_id || ''}
                  onValueChange={(value) => setEditingAssessment(prev => ({ ...prev, semester_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-type">Assessment Type</Label>
                <Select
                  value={editingAssessment.assessment_type_id}
                  onValueChange={(value) => {
                    const selectedType = assessmentTypes.find(t => t.id === value);
                    setEditingAssessment(prev => ({ 
                      ...prev, 
                      assessment_type_id: value,
                      weight: selectedType?.weight_default || 10
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} (Default weight: {type.weight_default})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-max_score">Max Score</Label>
                  <Input
                    id="edit-max_score"
                    type="number"
                    value={editingAssessment.max_score}
                    onChange={(e) => setEditingAssessment(prev => ({ ...prev, max_score: Number(e.target.value) }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Weight (%)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={editingAssessment.weight}
                    onChange={(e) => setEditingAssessment(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-date">Assessment Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingAssessment.assessment_date}
                  onChange={(e) => setEditingAssessment(prev => ({ ...prev, assessment_date: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAssessment}>
                  Update Assessment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No assessments created</h3>
              <p className="text-muted-foreground">
                Create your first assessment to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{assessment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assessment.class_name} - {assessment.subject_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">
                        {assessment.assessment_type_name}
                      </Badge>
                      <span>Max Score: {assessment.max_score}</span>
                      <span>Weight: {assessment.weight}%</span>
                      <Badge variant={assessment.is_published ? "default" : "secondary"}>
                        {assessment.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(assessment.assessment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!assessment.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishAssessment(assessment.id)}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAssessment(assessment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
