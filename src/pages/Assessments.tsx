import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, ClipboardList, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Assessments() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    assessment_type_id: '',
    class_subject_assignment_id: '',
    semester_id: '',
    max_score: 100,
    weight: 10,
    assessment_date: '',
  });

  const { data: teacherId } = useQuery({
    queryKey: ['teacher-id', user?.id],
    queryFn: async () => {
      if (!user?.id || role !== 'teacher') return null;
      const { data } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data?.id;
    },
    enabled: role === 'teacher' && !!user?.id,
  });

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', searchQuery, role, teacherId],
    queryFn: async () => {
      let query = supabase
        .from('assessments')
        .select(`
          *,
          assessment_type:assessment_types(name, code),
          class_subject_assignment:class_subject_assignments(
            class:classes(name, grade_level),
            subject:subjects(name, code),
            teacher:teachers(first_name, last_name)
          ),
          semester:semesters(name, academic_year:academic_years(name))
        `)
        .order('assessment_date', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: assessmentTypes } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('assessment_types')
        .select('*')
        .eq('is_active', true);
      return data || [];
    },
  });

  const { data: classSubjectAssignments } = useQuery({
    queryKey: ['class-subject-assignments', teacherId, role],
    queryFn: async () => {
      let query = supabase
        .from('class_subject_assignments')
        .select(`
          id,
          class:classes(name, grade_level),
          subject:subjects(name, code),
          teacher:teachers(first_name, last_name)
        `)
        .eq('is_active', true);

      if (role === 'teacher' && teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const { data } = await supabase
        .from('semesters')
        .select('*, academic_year:academic_years(name)')
        .eq('is_locked', false)
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  const createAssessment = useMutation({
    mutationFn: async (data: typeof formData) => {
      const assignment = classSubjectAssignments?.find((a: any) => a.id === data.class_subject_assignment_id);
      
      const { error } = await supabase.from('assessments').insert({
        title: data.title,
        assessment_type_id: data.assessment_type_id,
        class_subject_assignment_id: data.class_subject_assignment_id,
        semester_id: data.semester_id,
        max_score: data.max_score,
        weight: data.weight,
        assessment_date: data.assessment_date,
        created_by_teacher_id: teacherId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment created successfully');
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment');
    },
  });

  const updateAssessment = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('assessments')
        .update({
          title: data.updates.title,
          assessment_type_id: data.updates.assessment_type_id,
          max_score: data.updates.max_score,
          weight: data.updates.weight,
          assessment_date: data.updates.assessment_date,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment updated successfully');
      setIsDialogOpen(false);
      setEditingAssessment(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment');
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('assessments')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_published ? 'Assessment published' : 'Assessment unpublished');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to toggle publish');
    },
  });

  const deleteAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assessment deleted');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assessment');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      assessment_type_id: '',
      class_subject_assignment_id: '',
      semester_id: '',
      max_score: 100,
      weight: 10,
      assessment_date: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assessment_type_id || !formData.class_subject_assignment_id || !formData.semester_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingAssessment) {
      updateAssessment.mutate({ id: editingAssessment.id, updates: formData });
    } else {
      createAssessment.mutate(formData);
    }
  };

  const openEditDialog = (assessment: any) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      assessment_type_id: assessment.assessment_type_id,
      class_subject_assignment_id: assessment.class_subject_assignment_id,
      semester_id: assessment.semester_id,
      max_score: assessment.max_score,
      weight: assessment.weight,
      assessment_date: assessment.assessment_date,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
          <p className="text-muted-foreground">Manage quizzes, tests, and exams</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAssessment(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssessment ? 'Update assessment details' : 'Create a new assessment'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Quiz 1, Midterm Exam"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Assessment Type</Label>
                    <Select
                      value={formData.assessment_type_id}
                      onValueChange={(value) => setFormData({ ...formData, assessment_type_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assessmentTypes?.map((type: any) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class & Subject</Label>
                    <Select
                      value={formData.class_subject_assignment_id}
                      onValueChange={(value) => setFormData({ ...formData, class_subject_assignment_id: value })}
                      disabled={!!editingAssessment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class & subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSubjectAssignments?.map((assignment: any) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.class?.name} - {assignment.subject?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={formData.semester_id}
                      onValueChange={(value) => setFormData({ ...formData, semester_id: value })}
                      disabled={!!editingAssessment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters?.map((semester: any) => (
                          <SelectItem key={semester.id} value={semester.id}>
                            {semester.academic_year?.name} - {semester.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_score">Max Score</Label>
                    <Input
                      id="max_score"
                      type="number"
                      min="1"
                      value={formData.max_score}
                      onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (%)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessment_date">Assessment Date</Label>
                  <Input
                    id="assessment_date"
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createAssessment.isPending || updateAssessment.isPending}>
                  {(createAssessment.isPending || updateAssessment.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Assessment Records
          </CardTitle>
          <CardDescription>
            {assessments?.length || 0} assessments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assessments && assessments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class/Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment: any) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assessment.assessment_type?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.class_subject_assignment?.class?.name} - {assessment.class_subject_assignment?.subject?.name}
                      </TableCell>
                      <TableCell>{new Date(assessment.assessment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{assessment.max_score}</TableCell>
                      <TableCell>
                        <Badge variant={assessment.is_published ? 'default' : 'secondary'}>
                          {assessment.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish.mutate({ 
                              id: assessment.id, 
                              is_published: !assessment.is_published 
                            })}
                          >
                            {assessment.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(assessment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this assessment?')) {
                                deleteAssessment.mutate(assessment.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No assessments found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first assessment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
