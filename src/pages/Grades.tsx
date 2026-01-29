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
import { Plus, Search, Edit, Trash2, FileSpreadsheet, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Grades() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    assessment_id: '',
    score: 0,
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

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades', searchQuery, selectedAssessment],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          *,
          student:students(first_name, last_name, student_id_code),
          assessment:assessments(title, max_score),
          subject:subjects(name, code),
          class:classes(name),
          semester:semesters(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedAssessment) {
        query = query.eq('assessment_id', selectedAssessment);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: assessments } = useQuery({
    queryKey: ['assessments-for-grades', teacherId, role],
    queryFn: async () => {
      let query = supabase
        .from('assessments')
        .select(`
          id,
          title,
          max_score,
          class_subject_assignment:class_subject_assignments(
            class:classes(name),
            subject:subjects(name)
          )
        `)
        .order('assessment_date', { ascending: false });

      if (role === 'teacher' && teacherId) {
        query = query.eq('created_by_teacher_id', teacherId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-for-grades', selectedAssessment],
    queryFn: async () => {
      if (!selectedAssessment) return [];
      
      // Get the assessment to find class
      const { data: assessment } = await supabase
        .from('assessments')
        .select('class_subject_assignment:class_subject_assignments(class_id)')
        .eq('id', selectedAssessment)
        .single();

      if (!assessment?.class_subject_assignment?.class_id) return [];

      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id_code')
        .eq('current_class_id', assessment.class_subject_assignment.class_id)
        .eq('is_active', true)
        .order('last_name');
      return data || [];
    },
    enabled: !!selectedAssessment,
  });

  const createGrade = useMutation({
    mutationFn: async (data: typeof formData) => {
      const assessment = assessments?.find((a: any) => a.id === data.assessment_id);
      if (!assessment) throw new Error('Assessment not found');

      const { data: assessmentDetails } = await supabase
        .from('assessments')
        .select(`
          semester_id,
          class_subject_assignment:class_subject_assignments(
            class_id,
            subject_id
          ),
          semester:semesters(academic_year_id)
        `)
        .eq('id', data.assessment_id)
        .single();

      if (!assessmentDetails) throw new Error('Assessment details not found');

      const percentage = (data.score / assessment.max_score) * 100;

      const { error } = await supabase.from('grades').insert({
        student_id: data.student_id,
        assessment_id: data.assessment_id,
        score: data.score,
        percentage,
        teacher_id: teacherId,
        class_id: assessmentDetails.class_subject_assignment.class_id,
        subject_id: assessmentDetails.class_subject_assignment.subject_id,
        semester_id: assessmentDetails.semester_id,
        academic_year_id: assessmentDetails.semester.academic_year_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grade added successfully');
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add grade');
    },
  });

  const updateGrade = useMutation({
    mutationFn: async (data: { id: string; score: number; max_score: number }) => {
      const percentage = (data.score / data.max_score) * 100;
      const { error } = await supabase
        .from('grades')
        .update({ score: data.score, percentage })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grade updated successfully');
      setIsDialogOpen(false);
      setEditingGrade(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update grade');
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('grades')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_published ? 'Grade published' : 'Grade unpublished');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to toggle publish');
    },
  });

  const deleteGrade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grade deleted');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete grade');
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      assessment_id: selectedAssessment || '',
      score: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.assessment_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingGrade) {
      updateGrade.mutate({ 
        id: editingGrade.id, 
        score: formData.score,
        max_score: editingGrade.assessment?.max_score || 100
      });
    } else {
      createGrade.mutate(formData);
    }
  };

  const openEditDialog = (grade: any) => {
    setEditingGrade(grade);
    setFormData({
      student_id: grade.student_id,
      assessment_id: grade.assessment_id,
      score: grade.score,
    });
    setIsDialogOpen(true);
  };

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grades</h1>
          <p className="text-muted-foreground">Manage student grades and scores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingGrade(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? 'Edit Grade' : 'Add New Grade'}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade ? 'Update student score' : 'Enter a grade for a student'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Assessment</Label>
                  <Select
                    value={formData.assessment_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, assessment_id: value, student_id: '' });
                      setSelectedAssessment(value);
                    }}
                    disabled={!!editingGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments?.map((assessment: any) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          {assessment.title} - {assessment.class_subject_assignment?.class?.name} ({assessment.class_subject_assignment?.subject?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                    disabled={!formData.assessment_id || !!editingGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.student_id_code} - {student.first_name} {student.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={editingGrade?.assessment?.max_score || assessments?.find((a: any) => a.id === formData.assessment_id)?.max_score || 100}
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) })}
                    required
                  />
                  {formData.assessment_id && (
                    <p className="text-sm text-muted-foreground">
                      Max score: {assessments?.find((a: any) => a.id === formData.assessment_id)?.max_score || 100}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createGrade.isPending || updateGrade.isPending}>
                  {(createGrade.isPending || updateGrade.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingGrade ? 'Update Grade' : 'Add Grade'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  {assessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title} - {assessment.class_subject_assignment?.class?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Grade Records
          </CardTitle>
          <CardDescription>
            {grades?.length || 0} grades found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : grades && grades.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade: any) => (
                    <TableRow key={grade.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {grade.student?.first_name} {grade.student?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {grade.student?.student_id_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{grade.assessment?.title}</TableCell>
                      <TableCell>{grade.subject?.name}</TableCell>
                      <TableCell>
                        {grade.score} / {grade.assessment?.max_score}
                      </TableCell>
                      <TableCell>{grade.percentage?.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getLetterGrade(grade.percentage || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={grade.is_published ? 'default' : 'secondary'}>
                          {grade.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish.mutate({ 
                              id: grade.id, 
                              is_published: !grade.is_published 
                            })}
                          >
                            {grade.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(grade)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this grade?')) {
                                deleteGrade.mutate(grade.id);
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
              <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No grades found</h3>
              <p className="text-muted-foreground">
                {selectedAssessment 
                  ? 'No grades for this assessment yet' 
                  : 'Get started by adding grades'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
