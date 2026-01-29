import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Loader2, Search, Filter, Download, Eye, Edit, RefreshCw } from 'lucide-react';

export default function Enrollments() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    academic_year_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    class_id: '',
    academic_year_id: '',
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          student:students(first_name, last_name, student_id_code),
          class:classes(name, grade_level),
          academic_year:academic_years(name)
        `)
        .order('created_at', { ascending: false });

      if (selectedClass && selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }
      if (selectedYear && selectedYear !== 'all') {
        query = query.eq('academic_year_id', selectedYear);
      }
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('is_active', selectedStatus === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-for-enrollment'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id_code')
        .eq('is_active', true)
        .order('last_name');
      return data || [];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-enrollment'],
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .order('grade_level')
        .order('name');
      return data || [];
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  const createEnrollment = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Check if enrollment already exists (including inactive ones)
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id, is_active')
        .eq('student_id', data.student_id)
        .eq('academic_year_id', data.academic_year_id)
        .single();

      if (existingEnrollment) {
        if (existingEnrollment.is_active) {
          throw new Error('Student is already enrolled for this academic year');
        } else {
          // Reactivate existing inactive enrollment
          const { error: reactivateError } = await supabase
            .from('enrollments')
            .update({
              is_active: true,
              class_id: data.class_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnrollment.id);

          if (reactivateError) throw reactivateError;

          toast.success('Student enrollment reactivated successfully');
          setIsDialogOpen(false);
          setFormData({ student_id: '', class_id: '', academic_year_id: '' });
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
          return;
        }
      }

      const { error } = await supabase.from('enrollments').insert({
        student_id: data.student_id,
        class_id: data.class_id,
        academic_year_id: data.academic_year_id,
      });
      if (error) throw error;

      // Also update student's current class
      await supabase
        .from('students')
        .update({ current_class_id: data.class_id })
        .eq('id', data.student_id);
    },
    onSuccess: () => {
      toast.success('Student enrolled successfully');
      setIsDialogOpen(false);
      setFormData({ student_id: '', class_id: '', academic_year_id: '' });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enroll student');
    },
  });

  const deleteEnrollment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enrollments')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enrollment removed');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const updateEnrollment = useMutation({
    mutationFn: async ({ id, class_id, academic_year_id }: any) => {
      const { error } = await supabase
        .from('enrollments')
        .update({
          class_id,
          academic_year_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enrollment updated successfully');
      setIsEditDialogOpen(false);
      setSelectedEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update enrollment');
    },
  });

  const exportEnrollments = () => {
    const csvContent = [
      ['Student ID', 'Student Name', 'Class', 'Grade Level', 'Academic Year', 'Status', 'Created Date'],
      ...(filteredEnrollments || []).map(enrollment => [
        enrollment.student?.student_id_code || '',
        `${enrollment.student?.first_name || ''} ${enrollment.student?.last_name || ''}`,
        enrollment.class?.name || '',
        enrollment.class?.grade_level || '',
        enrollment.academic_year?.name || '',
        enrollment.is_active ? 'Active' : 'Inactive',
        new Date(enrollment.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Enrollments exported successfully');
  };

  const handleViewEnrollment = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setIsViewDialogOpen(true);
  };

  const handleEditEnrollment = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setEditFormData({
      class_id: enrollment.class_id,
      academic_year_id: enrollment.academic_year_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.class_id || !editFormData.academic_year_id) {
      toast.error('Please fill in all fields');
      return;
    }
    updateEnrollment.mutate({
      id: selectedEnrollment.id,
      ...editFormData
    });
  };

  // Filter enrollments based on search term
  const filteredEnrollments = enrollments?.filter(enrollment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      enrollment.student?.first_name?.toLowerCase().includes(searchLower) ||
      enrollment.student?.last_name?.toLowerCase().includes(searchLower) ||
      enrollment.student?.student_id_code?.toLowerCase().includes(searchLower) ||
      enrollment.class?.name?.toLowerCase().includes(searchLower) ||
      enrollment.academic_year?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.class_id || !formData.academic_year_id) {
      toast.error('Please fill in all fields');
      return;
    }
    createEnrollment.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enrollments</h1>
          <p className="text-muted-foreground">Manage student class enrollments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportEnrollments} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['enrollments'] })} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Enroll Student</DialogTitle>
                  <DialogDescription>Assign a student to a class for an academic year</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select
                      value={formData.student_id}
                      onValueChange={(value) => setFormData({ ...formData, student_id: value })}
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
                    <Label>Class</Label>
                    <Select
                      value={formData.class_id}
                      onValueChange={(value) => setFormData({ ...formData, class_id: value })}
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
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select
                      value={formData.academic_year_id}
                      onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears?.map((year: any) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createEnrollment.isPending}>
                    {createEnrollment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enroll
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, ID, class, or academic year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Label className="text-sm text-muted-foreground mb-1">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes?.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-sm text-muted-foreground mb-1">Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears?.map((year: any) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-sm text-muted-foreground mb-1">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedClass('all');
                    setSelectedYear('all');
                    setSelectedStatus('all');
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrollment Records
          </CardTitle>
          <CardDescription>
            {filteredEnrollments?.length || 0} of {enrollments?.length || 0} enrollments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (filteredEnrollments?.length || 0) > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {enrollment.student?.first_name} {enrollment.student?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.student?.student_id_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {enrollment.class?.name} (Grade {enrollment.class?.grade_level})
                        </Badge>
                      </TableCell>
                      <TableCell>{enrollment.academic_year?.name}</TableCell>
                      <TableCell>
                        <Badge variant={enrollment.is_active ? 'default' : 'secondary'}>
                          {enrollment.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewEnrollment(enrollment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEnrollment(enrollment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {enrollment.is_active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Remove this enrollment?')) {
                                  deleteEnrollment.mutate(enrollment.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Reactivate enrollment
                                createEnrollment.mutate({
                                  student_id: enrollment.student_id,
                                  class_id: enrollment.class_id,
                                  academic_year_id: enrollment.academic_year_id
                                });
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (filteredEnrollments?.length === 0 || !filteredEnrollments) && enrollments?.length > 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No enrollments found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No enrollments found</h3>
              <p className="text-muted-foreground">
                Start by enrolling students in classes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Enrollment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
            <DialogDescription>
              View detailed information about this enrollment
            </DialogDescription>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                  <p className="font-semibold">
                    {selectedEnrollment.student?.first_name} {selectedEnrollment.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEnrollment.student?.student_id_code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <p className="font-semibold">{selectedEnrollment.class?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Grade {selectedEnrollment.class?.grade_level}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                  <p className="font-semibold">{selectedEnrollment.academic_year?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={selectedEnrollment.is_active ? 'default' : 'secondary'}>
                    {selectedEnrollment.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                <p>{new Date(selectedEnrollment.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Enrollment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateEnrollment}>
            <DialogHeader>
              <DialogTitle>Edit Enrollment</DialogTitle>
              <DialogDescription>
                Update the class and academic year for this enrollment
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={editFormData.class_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, class_id: value })}
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
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={editFormData.academic_year_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, academic_year_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.map((year: any) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEnrollment.isPending}>
                {updateEnrollment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Enrollment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
