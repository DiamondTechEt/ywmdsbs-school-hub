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
import { Plus, Search, Edit, Trash2, GraduationCap, Loader2, Ban, Unlock, Shield, Eye } from 'lucide-react';
import { z } from 'zod';
import { logStudentAction, logBulkOperation } from '@/lib/audit-logger';
import { notifyStudentGrade } from '@/lib/notifications';

const studentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  student_id_code: z.string().min(1, 'Student ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other']),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  enrollment_year: z.number().min(2000).max(2100),
  boarding_status: z.enum(['boarding', 'day']),
  current_class_id: z.string().optional(),
});

export default function Students() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailsStudent, setDetailsStudent] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banNotes, setBanNotes] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    student_id_code: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male' as const,
    date_of_birth: '',
    enrollment_year: new Date().getFullYear(),
    boarding_status: 'boarding' as const,
    current_class_id: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          current_class:classes(name, grade_level),
          banned_by_teacher:teachers!banned_by(first_name, last_name)
        `)
        .order('last_name');

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,student_id_code.ilike.%${searchQuery}%`);
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

  const createStudent = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Use the RPC function to create student with proper RLS handling
      const { data: studentData, error: studentError } = await supabase.rpc('create_student_with_user', {
        p_email: data.email,
        p_password: data.password,
        p_student_id_code: data.student_id_code,
        p_first_name: data.first_name,
        p_middle_name: data.middle_name || null,
        p_last_name: data.last_name,
        p_gender: data.gender,
        p_date_of_birth: data.date_of_birth,
        p_enrollment_year: data.enrollment_year,
        p_boarding_status: data.boarding_status,
        p_current_class_id: data.current_class_id || null
      });

      if (studentError) throw studentError;
      return studentData;
    },
    onSuccess: (data: any) => {
      toast.success('Student created successfully');
      // Log student creation with readable name
      if (data?.[0]?.id) {
        const studentName = `${data[0].first_name} ${data[0].last_name}`;
        logStudentAction('CREATE', data[0].id, studentName, {
          student_id_code: data[0].student_id_code,
          email: data[0].email
        });
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create student');
    },
  });

  const updateStudent = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('students')
        .update({
          first_name: data.updates.first_name,
          middle_name: data.updates.middle_name || null,
          last_name: data.updates.last_name,
          gender: data.updates.gender,
          date_of_birth: data.updates.date_of_birth,
          boarding_status: data.updates.boarding_status,
          current_class_id: data.updates.current_class_id || null,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables: any) => {
      toast.success('Student updated successfully');
      // Log student update with readable name
      const studentName = `${variables.updates.first_name} ${variables.updates.last_name}`;
      logStudentAction('UPDATE', variables.id, studentName, {
        updates: variables.updates
      });
      setIsDialogOpen(false);
      setEditingStudent(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update student');
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables: any) => {
      toast.success('Student deactivated');
      // Log student deactivation
      logStudentAction('DELETE', variables, undefined, {
        action: 'deactivated',
        timestamp: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete student');
    },
  });

  const banStudent = useMutation({
    mutationFn: async (studentId: string) => {
      // Get current teacher/admin ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('students')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: adminData?.id,
          ban_reason: banReason.trim(),
          ban_notes: banNotes.trim() || null
        } as any)
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Student banned successfully');
      setIsBanDialogOpen(false);
      setSelectedStudent(null);
      setBanReason('');
      setBanNotes('');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to ban student');
    },
  });

  const unbanStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null,
          ban_notes: null
        } as any)
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Student unbanned successfully');
      setIsUnbanDialogOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unban student');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      student_id_code: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'male',
      date_of_birth: '',
      enrollment_year: new Date().getFullYear(),
      boarding_status: 'boarding',
      current_class_id: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStudent) {
      updateStudent.mutate({ id: editingStudent.id, updates: formData });
    } else {
      try {
        studentSchema.parse(formData);
        createStudent.mutate(formData);
      } catch (err) {
        if (err instanceof z.ZodError) {
          toast.error(err.errors[0].message);
        }
      }
    }
  };

  const openEditDialog = (student: any) => {
    setEditingStudent(student);
    setFormData({
      email: '',
      password: '',
      student_id_code: student.student_id_code,
      first_name: student.first_name,
      middle_name: student.middle_name || '',
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      enrollment_year: student.enrollment_year,
      boarding_status: student.boarding_status,
      current_class_id: student.current_class_id || '',
    });
    setIsDialogOpen(true);
  };

  const openBanDialog = (student: any) => {
    setSelectedStudent(student);
    setBanReason('');
    setBanNotes('');
    setIsBanDialogOpen(true);
  };

  const openUnbanDialog = (student: any) => {
    setSelectedStudent(student);
    setIsUnbanDialogOpen(true);
  };

  const handleBanStudent = () => {
    if (!selectedStudent || !banReason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }
    banStudent.mutate(selectedStudent.id);
  };

  const handleUnbanStudent = () => {
    if (!selectedStudent) return;
    unbanStudent.mutate(selectedStudent.id);
  };

  const openDetailsDialog = (student: any) => {
    setDetailsStudent(student);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage student records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStudent(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent ? 'Update student information' : 'Create a new student account'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {!editingStudent && (
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="student_id_code">Student ID</Label>
                    <Input
                      id="student_id_code"
                      value={formData.student_id_code}
                      onChange={(e) => setFormData({ ...formData, student_id_code: e.target.value })}
                      disabled={!!editingStudent}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label>Boarding Status</Label>
                    <Select
                      value={formData.boarding_status}
                      onValueChange={(value: any) => setFormData({ ...formData, boarding_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boarding">Boarding</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select
                      value={formData.current_class_id}
                      onValueChange={(value) => setFormData({ ...formData, current_class_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} (Grade {cls.grade_level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createStudent.isPending || updateStudent.isPending}>
                  {(createStudent.isPending || updateStudent.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Records
          </CardTitle>
          <CardDescription>
            {students?.length || 0} students found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students && students.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ban Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.student_id_code}</TableCell>
                      <TableCell className="font-medium">
                        {student.first_name} {student.middle_name} {student.last_name}
                      </TableCell>
                      <TableCell className="capitalize">{student.gender}</TableCell>
                      <TableCell>
                        {student.current_class ? (
                          <Badge variant="secondary">
                            {student.current_class.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? 'secondary' : 'destructive'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.is_banned ? (
                          <div className="space-y-1">
                            <Badge variant="destructive">Banned</Badge>
                            {student.banned_at && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(student.banned_at).toLocaleDateString()}
                              </div>
                            )}
                            {student.banned_by_teacher && (
                              <div className="text-xs text-muted-foreground">
                                By: {student.banned_by_teacher.first_name} {student.banned_by_teacher.last_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {student.is_banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openUnbanDialog(student)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openBanDialog(student)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to deactivate this student?')) {
                                deleteStudent.mutate(student.id);
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
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <GraduationCap className="h-12 w-12" />
              <p>No students found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Ban Student
            </DialogTitle>
            <DialogDescription>
              Ban {selectedStudent?.first_name} {selectedStudent?.last_name} from accessing the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ban Reason *</Label>
              <Select value={banReason} onValueChange={setBanReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic misconduct">Academic misconduct</SelectItem>
                  <SelectItem value="Code of conduct violation">Code of conduct violation</SelectItem>
                  <SelectItem value="Security breach">Security breach</SelectItem>
                  <SelectItem value="Inappropriate behavior">Inappropriate behavior</SelectItem>
                  <SelectItem value="Policy violation">Policy violation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={banNotes}
                onChange={(e) => setBanNotes(e.target.value)}
                placeholder="Provide any additional details about this ban..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBanStudent}>
                Confirm Ban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Unlock className="h-5 w-5" />
              Unban Student
            </DialogTitle>
            <DialogDescription>
              Restore access for {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                This action will immediately restore the student's access to the system.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUnbanDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUnbanStudent}>
                Confirm Unban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {detailsStudent?.first_name} {detailsStudent?.last_name}
            </DialogDescription>
          </DialogHeader>
          {detailsStudent && (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                    <p className="font-mono">{detailsStudent.student_id_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p>{detailsStudent.first_name} {detailsStudent.middle_name} {detailsStudent.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="capitalize">{detailsStudent.gender}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p>{new Date(detailsStudent.date_of_birth).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Enrollment Year</Label>
                    <p>{detailsStudent.enrollment_year}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current Class</Label>
                    <p>
                      {detailsStudent.current_class ? (
                        <Badge variant="secondary">
                          {detailsStudent.current_class.name} (Grade {detailsStudent.current_class.grade_level})
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Boarding Status</Label>
                    <Badge variant={detailsStudent.boarding_status === 'boarding' ? 'default' : 'secondary'}>
                      {detailsStudent.boarding_status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                    <Badge variant={detailsStudent.is_active ? 'default' : 'destructive'}>
                      {detailsStudent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Ban Information */}
              {detailsStudent.is_banned && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Ban Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Ban Status</Label>
                        <Badge variant="destructive">Banned</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Banned Date</Label>
                        <p>{new Date(detailsStudent.banned_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {detailsStudent.ban_reason && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Ban Reason</Label>
                        <p className="text-red-600">{detailsStudent.ban_reason}</p>
                      </div>
                    )}
                    {detailsStudent.ban_notes && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Additional Notes</Label>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{detailsStudent.ban_notes}</p>
                      </div>
                    )}
                    {detailsStudent.banned_by_teacher && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Banned By</Label>
                        <p>{detailsStudent.banned_by_teacher.first_name} {detailsStudent.banned_by_teacher.last_name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                    <p>{new Date(detailsStudent.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p>{new Date(detailsStudent.updated_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
