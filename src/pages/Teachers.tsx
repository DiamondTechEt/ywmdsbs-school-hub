import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Users, Loader2, Eye, Calendar, BookOpen, Award } from 'lucide-react';
import { z } from 'zod';
import { logTeacherAction } from '@/lib/audit-logger';

const teacherSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teacher_code: z.string().min(1, 'Teacher code is required'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other']),
  hire_date: z.string().min(1, 'Hire date is required'),
});

export default function Teachers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [detailsTeacher, setDetailsTeacher] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    teacher_code: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male' as const,
    hire_date: '',
  });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('teachers')
        .select('*')
        .order('last_name');

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,teacher_code.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .order('grade_level')
        .order('name');
      return data || [];
    },
  });

  // Query to fetch teacher details and activities
  const { data: teacherDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['teacher-details', detailsTeacher?.id],
    queryFn: async () => {
      if (!detailsTeacher?.id) return null;

      const [
        assignmentsResult,
        assessmentsResult,
        gradesResult,
        profileResult
      ] = await Promise.all([
        // Get class assignments
        supabase
          .from('class_subject_assignments')
          .select(`
            *,
            class:classes(name, grade_level),
            subject:subjects(name, code)
          `)
          .eq('teacher_id', detailsTeacher.id)
          .eq('is_active', true),
        
        // Get assessments created by this teacher
        supabase
          .from('assessments')
          .select(`
            *,
            class_subject_assignment:class_subject_assignments(
              class:classes(name),
              subject:subjects(name)
            )
          `)
          .eq('created_by_teacher_id', detailsTeacher.id)
          .order('assessment_date', { ascending: false })
          .limit(10),
        
        // Get recent grades given by this teacher
        supabase
          .from('grades')
          .select(`
            *,
            student:students(first_name, last_name, student_id_code),
            assessment:assessments(title, assessment_date),
            class:classes(name),
            subject:subjects(name)
          `)
          .eq('teacher_id', detailsTeacher.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Get teacher profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', detailsTeacher.user_id)
          .single()
      ]);

      return {
        assignments: assignmentsResult.data || [],
        assessments: assessmentsResult.data || [],
        grades: gradesResult.data || [],
        profile: profileResult.data
      };
    },
    enabled: !!detailsTeacher?.id
  });

  const createTeacher = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${data.first_name} ${data.last_name}`,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        full_name: `${data.first_name} ${data.last_name}`,
      });

      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'teacher',
      });

      const { error: teacherError } = await supabase.from('teachers').insert({
        user_id: authData.user.id,
        teacher_code: data.teacher_code,
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        gender: data.gender,
        hire_date: data.hire_date,
      });

      if (teacherError) throw teacherError;
      
      return authData.user;
    },
    onSuccess: (data) => {
      toast.success('Teacher created successfully');
      // Log teacher creation
      if (data?.id) {
        const teacherName = `${data.user_metadata?.full_name || 'Unknown Teacher'}`;
        logTeacherAction('CREATE', data.id, teacherName, {
          teacher_code: formData.teacher_code,
          email: formData.email,
          hire_date: formData.hire_date
        });
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create teacher');
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('teachers')
        .update({
          first_name: data.updates.first_name,
          middle_name: data.updates.middle_name || null,
          last_name: data.updates.last_name,
          gender: data.updates.gender,
          hire_date: data.updates.hire_date,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Teacher updated successfully');
      // Log teacher update
      const teacherName = `${variables.updates.first_name} ${variables.updates.last_name}`;
      logTeacherAction('UPDATE', variables.id, teacherName, {
        updates: variables.updates
      });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update teacher');
    },
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teachers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Teacher deactivated');
      // Log teacher deactivation
      logTeacherAction('DELETE', variables, undefined, {
        action: 'deactivated',
        timestamp: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete teacher');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      teacher_code: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'male',
      hire_date: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTeacher) {
      updateTeacher.mutate({ id: editingTeacher.id, updates: formData });
    } else {
      try {
        teacherSchema.parse(formData);
        createTeacher.mutate(formData);
      } catch (err) {
        if (err instanceof z.ZodError) {
          toast.error(err.errors[0].message);
        }
      }
    }
  };

  const openEditDialog = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      email: '',
      password: '',
      teacher_code: teacher.teacher_code,
      first_name: teacher.first_name,
      middle_name: teacher.middle_name || '',
      last_name: teacher.last_name,
      gender: teacher.gender,
      hire_date: teacher.hire_date,
    });
    setIsDialogOpen(true);
  };

  const openDetailsDialog = (teacher: any) => {
    setDetailsTeacher(teacher);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground">Manage teacher records and assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTeacher(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </DialogTitle>
                <DialogDescription>
                  {editingTeacher ? 'Update teacher information' : 'Create a new teacher account'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {!editingTeacher && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="teacher_code">Teacher Code</Label>
                    <Input
                      id="teacher_code"
                      value={formData.teacher_code}
                      onChange={(e) => setFormData({ ...formData, teacher_code: e.target.value })}
                      disabled={!!editingTeacher}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createTeacher.isPending || updateTeacher.isPending}>
                  {(createTeacher.isPending || updateTeacher.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
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
              placeholder="Search teachers by name or code..."
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
            <Users className="h-5 w-5" />
            Teacher Records
          </CardTitle>
          <CardDescription>
            {teachers?.length || 0} teachers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teachers && teachers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher: any) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono">{teacher.teacher_code}</TableCell>
                      <TableCell className="font-medium">
                        {teacher.first_name} {teacher.middle_name} {teacher.last_name}
                      </TableCell>
                      <TableCell className="capitalize">{teacher.gender}</TableCell>
                      <TableCell>{new Date(teacher.hire_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(teacher)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to deactivate this teacher?')) {
                                deleteTeacher.mutate(teacher.id);
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
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No teachers found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first teacher
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
        setIsDetailsDialogOpen(open);
        if (!open) {
          setDetailsTeacher(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Teacher Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of teacher information and activities
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : teacherDetails && detailsTeacher ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-lg">
                      {detailsTeacher.first_name} {detailsTeacher.middle_name} {detailsTeacher.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Teacher Code</Label>
                    <p className="text-lg font-mono">{detailsTeacher.teacher_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p>{teacherDetails.profile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="capitalize">{detailsTeacher.gender}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                    <p>{new Date(detailsTeacher.hire_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={detailsTeacher.is_active ? 'default' : 'secondary'}>
                      {detailsTeacher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Class Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Class Assignments
                  </CardTitle>
                  <CardDescription>
                    Current class and subject assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherDetails.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {teacherDetails.assignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{assignment.class?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Grade {assignment.class?.grade_level} • {assignment.subject?.name} ({assignment.subject?.code})
                            </p>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No class assignments found</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Assessments
                  </CardTitle>
                  <CardDescription>
                    Latest 10 assessments created by this teacher
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherDetails.assessments.length > 0 ? (
                    <div className="space-y-2">
                      {teacherDetails.assessments.map((assessment: any) => (
                        <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{assessment.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {assessment.class_subject_assignment?.class?.name} • {assessment.class_subject_assignment?.subject?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(assessment.assessment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={assessment.is_published ? 'default' : 'secondary'}>
                            {assessment.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No assessments found</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Grades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Grades Given
                  </CardTitle>
                  <CardDescription>
                    Latest 10 grades assigned by this teacher
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherDetails.grades.length > 0 ? (
                    <div className="space-y-2">
                      {teacherDetails.grades.map((grade: any) => (
                        <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {grade.student?.first_name} {grade.student?.last_name} ({grade.student?.student_id_code})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {grade.assessment?.title} • {grade.score}/{grade.assessment?.max_score} points
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {grade.class?.name} • {grade.subject?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{grade.percentage}%</p>
                            <Badge variant={grade.is_published ? 'default' : 'secondary'}>
                              {grade.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No grades found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No teacher details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
