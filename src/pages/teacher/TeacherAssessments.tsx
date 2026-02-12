import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  Loader2,
  Power,
  MoreHorizontal
} from 'lucide-react';
import { CreateAssessmentDialog } from '@/components/teacher/CreateAssessmentDialog';
import { GradesManager } from '@/components/teacher/GradesManager';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
}

interface Assessment {
  id: string;
  title: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  assessment_type_name: string;
  assessment_type_id?: string;
  class_name: string;
  class_id?: string;
  subject_name: string;
  semester_id?: string;
  total_students?: number;
  graded_students?: number;
  average_score?: number;
}

interface Semester {
  id: string;
  name: string;
  academic_year_id: string;
}

interface AssessmentType {
  id: string;
  name: string;
  weight_default: number;
}

export function TeacherAssessments() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    loadTeacherClasses();
    loadSemesters();
    loadAssessmentTypes();
  }, []);

  useEffect(() => {
    if (teacherClasses.length > 0) {
      loadAssessments();
    }
  }, [teacherClasses]);

  const loadTeacherClasses = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name, grade_level),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      const classes = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        class_id: assignment.class_id,
        class_name: assignment.classes?.name || 'Unknown Class',
        grade_level: assignment.classes?.grade_level || 0,
        subject_id: assignment.subject_id,
        subject_name: assignment.subjects?.name
      }));

      setTeacherClasses(classes);
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(id, name),
          class_subject_assignments(
            id,
            class_id,
            classes(id, name),
            subjects(name)
          )
        `)
        .eq('created_by_teacher_id', user.id);

      if (assessmentsError) throw assessmentsError;

      // Get statistics for each assessment
      const assessmentsWithStats = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          // Get total students in the class
          const classId = assessment.class_subject_assignments?.class_id;
          const { count: totalStudents } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId || '')
            .eq('is_active', true);

          // Get graded students
          const { count: gradedStudents } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          // Get average score
          const { data: gradesData } = await supabase
            .from('grades')
            .select('score')
            .eq('assessment_id', assessment.id);

          const averageScore = gradesData && gradesData.length > 0
            ? gradesData.reduce((sum, grade) => sum + grade.score, 0) / gradesData.length
            : 0;

          return {
            id: assessment.id,
            title: assessment.title,
            max_score: assessment.max_score,
            weight: assessment.weight,
            assessment_date: assessment.assessment_date,
            is_published: assessment.is_published,
            assessment_type_name: assessment.assessment_types?.name || 'Unknown',
            assessment_type_id: assessment.assessment_type_id,
            class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown',
            class_id: assessment.class_subject_assignments?.class_id,
            subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown',
            semester_id: assessment.semester_id,
            total_students: totalStudents || 0,
            graded_students: gradedStudents || 0,
            average_score: Math.round(averageScore * 10) / 10
          };
        })
      );

      setAssessments(assessmentsWithStats);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSemesters(data || []);
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
    }
  };

  const loadAssessmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAssessmentTypes(data || []);
    } catch (error) {
      console.error('Error loading assessment types:', error);
      toast.error('Failed to load assessment types');
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This will also delete all associated grades.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      toast.success('Assessment deleted successfully');
      loadAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      setLoading(true);

      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) throw new Error('Teacher not found');

      // Update assessment directly using the existing class_subject_assignment_id
      // We don't need to find the assignment since we're not changing the class
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          title: selectedAssessment.title,
          assessment_type_id: selectedAssessment.assessment_type_id || null,
          max_score: selectedAssessment.max_score,
          weight: selectedAssessment.weight,
          assessment_date: selectedAssessment.assessment_date,
          semester_id: selectedAssessment.semester_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAssessment.id);

      if (updateError) throw updateError;

      toast.success('Assessment updated successfully');
      setIsEditDialogOpen(false);
      setSelectedAssessment(null);
      loadAssessments();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (assessment: Assessment) => {
    try {
      const newStatus = !assessment.is_published;
      const actionText = newStatus ? 'publish' : 'unpublish';
      
      if (!confirm(`Are you sure you want to ${actionText} this assessment?`)) {
        return;
      }

      const { error } = await supabase
        .from('assessments')
        .update({ is_published: newStatus })
        .eq('id', assessment.id);

      if (error) throw error;

      toast.success(`Assessment ${actionText}ed successfully`);
      loadAssessments();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error(`Failed to ${assessment.is_published ? 'unpublish' : 'publish'} assessment`);
    }
  };

  const getFilteredAssessments = () => {
    return assessments.filter(assessment => {
      const matchesSearch = 
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.subject_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = filterClass === 'all' || assessment.class_name === filterClass;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'published' && assessment.is_published) ||
        (filterStatus === 'draft' && !assessment.is_published);

      return matchesSearch && matchesClass && matchesStatus;
    });
  };

  const openGradesDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsGradesDialogOpen(true);
  };

  const openViewDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Assessments
          </h2>
          <p className="text-muted-foreground">
            Manage your assessments and track student performance
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Class:</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {teacherClasses.map(cls => (
                      <SelectItem key={cls.class_id} value={cls.class_name}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm">Status:</Label>
                <Select value={filterStatus} onValueChange={(value: 'all' | 'published' | 'draft') => setFilterStatus(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterClass('all');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments ({getFilteredAssessments().length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : getFilteredAssessments().length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {assessments.length === 0 
                  ? 'No assessments created yet' 
                  : 'No assessments match your search criteria'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAssessments().map((assessment) => (
                    <TableRow key={assessment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{assessment.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assessment.assessment_type_name}</Badge>
                      </TableCell>
                      <TableCell>{assessment.class_name}</TableCell>
                      <TableCell>{assessment.subject_name}</TableCell>
                      <TableCell>
                        {new Date(assessment.assessment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{assessment.max_score}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${assessment.total_students > 0 ? (assessment.graded_students / assessment.total_students) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {assessment.graded_students}/{assessment.total_students}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assessment.graded_students > 0 ? (
                          <div className="font-medium">{assessment.average_score}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assessment.is_published ? 'default' : 'secondary'}>
                          {assessment.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(assessment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditAssessment(assessment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Assessment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openGradesDialog(assessment)}>
                              <Award className="mr-2 h-4 w-4" />
                              Manage Grades
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleTogglePublish(assessment)}
                              className={assessment.is_published ? 'text-orange-600' : 'text-green-600'}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {assessment.is_published ? 'Unpublish' : 'Publish'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Assessment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Assessment Dialog */}
      <CreateAssessmentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          loadAssessments();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* Edit Assessment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>
              Update assessment details including title, type, semester, and scoring information.
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedAssessment.title}
                  onChange={(e) => setSelectedAssessment(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter assessment title"
                />
              </div>

              <div>
                <Label htmlFor="edit-class">Class</Label>
                <Input
                  id="edit-class"
                  value={`${selectedAssessment.class_name} - ${selectedAssessment.subject_name}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="edit-semester">Semester</Label>
                <Select
                  value={selectedAssessment.semester_id || ''}
                  onValueChange={(value) => setSelectedAssessment(prev => prev ? { ...prev, semester_id: value } : null)}
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
                  value={selectedAssessment.assessment_type_id || ''}
                  onValueChange={(value) => {
                    const selectedType = assessmentTypes.find(t => t.id === value);
                    setSelectedAssessment(prev => prev ? { 
                      ...prev, 
                      assessment_type_id: value,
                      weight: selectedType?.weight_default || prev.weight
                    } : null);
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
                    value={selectedAssessment.max_score}
                    onChange={(e) => setSelectedAssessment(prev => prev ? { ...prev, max_score: Number(e.target.value) } : null)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Weight (%)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={selectedAssessment.weight}
                    onChange={(e) => setSelectedAssessment(prev => prev ? { ...prev, weight: Number(e.target.value) } : null)}
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
                  value={selectedAssessment.assessment_date}
                  onChange={(e) => setSelectedAssessment(prev => prev ? { ...prev, assessment_date: e.target.value } : null)}
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

      {/* Grades Dialog */}
      <Dialog open={isGradesDialogOpen} onOpenChange={setIsGradesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Grades - {selectedAssessment?.title}</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <GradesManager 
              assessment={selectedAssessment}
              isOpen={isGradesDialogOpen}
              onClose={() => setIsGradesDialogOpen(false)}
              onSuccess={() => {
                loadAssessments();
                setIsGradesDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Assessment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title}</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="font-semibold">{selectedAssessment.assessment_type_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <p className="font-semibold">{selectedAssessment.class_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                  <p className="font-semibold">{selectedAssessment.subject_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="font-semibold">
                    {new Date(selectedAssessment.assessment_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Max Score</Label>
                  <p className="font-semibold">{selectedAssessment.max_score}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Weight</Label>
                  <p className="font-semibold">{selectedAssessment.weight}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedAssessment.total_students}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedAssessment.graded_students}</div>
                  <div className="text-sm text-muted-foreground">Graded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedAssessment.average_score || '-'}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
