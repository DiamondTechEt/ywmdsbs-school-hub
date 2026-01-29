import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Edit, Eye, Plus, Search, Filter, Loader2, UserPlus } from 'lucide-react';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
  role: string;
}

interface Student {
  id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: string;
  date_of_birth: string;
  enrollment_year: number;
  is_active: boolean;
  current_class_id?: string;
  current_class?: {
    name: string;
    grade_level: number;
  };
}

interface EditStudentData {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: string;
  date_of_birth: string;
  enrollment_year: number;
  is_active: boolean;
  current_class_id: string;
}

export function TeacherStudentManagement() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<EditStudentData>({
    id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    gender: '',
    date_of_birth: '',
    enrollment_year: new Date().getFullYear(),
    is_active: true,
    current_class_id: ''
  });

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  // Helper function to format gender display
  const formatGenderDisplay = (gender: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const loadTeacherClasses = async () => {
    try {
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
        subject_name: assignment.subjects?.name,
        role: assignment.role
      }));

      setTeacherClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0].class_id);
      }
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      // Simple query first to test
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('current_class_id', selectedClass)
        .order('last_name');

      if (studentsError) throw studentsError;
      
      // If we get students, try to get class info separately
      let studentsWithClass = studentsData || [];
      if (studentsWithClass.length > 0) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, grade_level')
          .eq('id', selectedClass)
          .single();
        
        if (classData) {
          studentsWithClass = studentsWithClass.map(student => ({
            ...student,
            current_class: classData
          }));
        }
      }
      
      setStudents(studentsWithClass);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || '',
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      enrollment_year: student.enrollment_year,
      is_active: student.is_active,
      current_class_id: student.current_class_id || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.first_name || !editFormData.last_name || !editFormData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create update data object with only the fields we want to update
      const updateData: any = {
        first_name: editFormData.first_name.trim(),
        last_name: editFormData.last_name.trim(),
        gender: editFormData.gender,
        is_active: editFormData.is_active,
        updated_at: new Date().toISOString()
      };

      // Only include optional fields if they have values
      if (editFormData.middle_name && editFormData.middle_name.trim()) {
        updateData.middle_name = editFormData.middle_name.trim();
      }

      if (editFormData.date_of_birth) {
        updateData.date_of_birth = editFormData.date_of_birth;
      }

      if (editFormData.enrollment_year) {
        updateData.enrollment_year = editFormData.enrollment_year.toString();
      }

      if (editFormData.current_class_id) {
        updateData.current_class_id = editFormData.current_class_id;
      }

      console.log('Updating student with data:', updateData);

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', editFormData.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
      loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.student_id_code.toLowerCase().includes(searchLower)
    );
  });

  if (loading && teacherClasses.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Student Management
        </h2>
        <p className="text-muted-foreground">
          Manage students in your assigned classes
        </p>
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Choose a class to manage its students</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map(cls => (
                <SelectItem key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} (Grade {cls.grade_level})
                  {cls.subject_name && ` - ${cls.subject_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Students ({filteredStudents.length})</span>
                <Button onClick={loadStudents} variant="outline" size="sm">
                  <Loader2 className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No students found matching your search' : 'No students in this class'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Enrollment Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {student.first_name} {student.last_name}
                              </p>
                              {student.middle_name && (
                                <p className="text-sm text-muted-foreground">
                                  {student.middle_name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{student.student_id_code}</TableCell>
                          <TableCell>{formatGenderDisplay(student.gender)}</TableCell>
                          <TableCell>{student.enrollment_year}</TableCell>
                          <TableCell>
                            <Badge variant={student.is_active ? 'default' : 'secondary'}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewStudent(student)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>View detailed student information</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                  <p className="font-semibold">{selectedStudent.first_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                  <p className="font-semibold">{selectedStudent.last_name}</p>
                </div>
                {selectedStudent.middle_name && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Middle Name</Label>
                    <p className="font-semibold">{selectedStudent.middle_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                  <p className="font-semibold">{selectedStudent.student_id_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                  <p className="font-semibold">{formatGenderDisplay(selectedStudent.gender)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                  <p className="font-semibold">{new Date(selectedStudent.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Enrollment Year</Label>
                  <p className="font-semibold">{selectedStudent.enrollment_year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Class</Label>
                  <p className="font-semibold">
                    {selectedStudent.current_class?.name} (Grade {selectedStudent.current_class?.grade_level})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={selectedStudent.is_active ? 'default' : 'secondary'}>
                    {selectedStudent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateStudent}>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update student information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input
                  value={editFormData.middle_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, middle_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Enrollment Year *</Label>
                  <Input
                    type="number"
                    value={editFormData.enrollment_year}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, enrollment_year: parseInt(e.target.value) }))}
                    min="2000"
                    max="2030"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editFormData.is_active.toString()}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, is_active: value === 'true' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Student</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
