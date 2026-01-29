import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClassTeacherRelations } from '@/lib/class-teacher-relations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Users, UserCheck, Edit, Eye, Calendar, BookOpen } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  grade_level?: number;
}

interface Teacher {
  id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface Class {
  id: string;
  name: string;
  grade_level: number;
}

interface ClassTeacherAssignment {
  id: string;
  class_id: string;
  teacher_id: string;
  subject_id?: string;
  role: string;
  is_active: boolean;
  assigned_at: string;
  classes?: Class;
  teachers?: Teacher;
  subjects?: Subject | null;
}

export function ClassTeacherManagement() {
  console.log('ClassTeacherManagement component rendered');
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClassTeacherAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState<{
    class_id: string;
    teacher_id: string;
    subject_id?: string;
    role: 'homeroom' | 'subject_teacher' | 'assistant';
  }>({
    class_id: '',
    teacher_id: '',
    subject_id: 'no-subject',
    role: 'subject_teacher'
  });
  const [editAssignment, setEditAssignment] = useState<{
    id: string;
    class_id: string;
    teacher_id: string;
    subject_id?: string;
    role: 'homeroom' | 'subject_teacher' | 'assistant';
  }>({
    id: '',
    class_id: '',
    teacher_id: '',
    subject_id: 'no-subject',
    role: 'subject_teacher'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Starting to load data...');
      setLoading(true);
      setError(null);
      
      // Load subjects
      console.log('Loading subjects...');
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code, grade_level')
        .eq('is_active', true)
        .order('name');
      
      if (subjectsError) {
        console.error('Subjects error:', subjectsError);
        throw subjectsError;
      }
      console.log('Subjects loaded:', subjectsData);
      setSubjects(subjectsData || []);

      // Load assignments with subject information
      console.log('Loading assignments...');
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name, grade_level),
          teachers(id, teacher_code, first_name, last_name),
          subjects(id, name, code)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError);
        throw assignmentsError;
      }
      console.log('Assignments loaded:', assignmentsData);
      
      const typedAssignments = assignmentsData?.map(assignment => ({
        ...assignment,
        teachers: assignment.teachers ? {
          ...assignment.teachers,
          full_name: `${assignment.teachers.first_name} ${assignment.teachers.last_name}`
        } : undefined
      })) || [];
      
      setAssignments(typedAssignments as any);

      // Load teachers
      console.log('Loading teachers...');
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id, teacher_code, first_name, last_name')
        .eq('is_active', true)
        .order('last_name, first_name');
      
      if (teachersError) {
        console.error('Teachers error:', teachersError);
        throw teachersError;
      }
      console.log('Teachers loaded:', teachersData);
      
      const teachersWithNames = teachersData?.map(teacher => ({
        ...teacher,
        full_name: `${teacher.first_name} ${teacher.last_name}`
      })) || [];
      setTeachers(teachersWithNames);

      // Load classes
      console.log('Loading classes...');
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .order('grade_level, name');
      
      if (classesError) {
        console.error('Classes error:', classesError);
        throw classesError;
      }
      console.log('Classes loaded:', classesData);
      setClasses(classesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      toast({
        title: "Error",
        description: "Failed to load class-teacher assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.class_id || !newAssignment.teacher_id) {
      toast({
        title: "Error",
        description: "Please select both a class and a teacher",
        variant: "destructive"
      });
      return;
    }

    try {
      const subjectId = newAssignment.subject_id === 'no-subject' ? null : newAssignment.subject_id;
      
      // Use direct table insert instead of RPC function
      const { error } = await supabase
        .from('class_teachers')
        .insert({
          class_id: newAssignment.class_id,
          teacher_id: newAssignment.teacher_id,
          subject_id: subjectId,
          role: newAssignment.role,
          is_active: true
        });

      if (error) {
        // If it's a duplicate, try to update existing record
        if (error.code === '23505') { // Unique violation
          const { error: updateError } = await supabase
            .from('class_teachers')
            .update({
              subject_id: subjectId,
              role: newAssignment.role,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('class_id', newAssignment.class_id)
            .eq('teacher_id', newAssignment.teacher_id)
            .eq('subject_id', subjectId);
          
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Teacher assigned to class successfully"
      });

      setNewAssignment({ 
        class_id: '', 
        teacher_id: '', 
        subject_id: 'no-subject',
        role: 'subject_teacher' 
      });
      setIsCreateDialogOpen(false);
      loadData();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign teacher to class",
        variant: "destructive"
      });
    }
  };

  const handleViewAssignment = (assignment: ClassTeacherAssignment) => {
    setSelectedAssignment(assignment);
    setIsViewDialogOpen(true);
  };

  const handleEditAssignment = (assignment: ClassTeacherAssignment) => {
    setEditAssignment({
      id: assignment.id,
      class_id: assignment.class_id,
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id || 'no-subject',
      role: assignment.role as 'homeroom' | 'subject_teacher' | 'assistant'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editAssignment.class_id || !editAssignment.teacher_id) {
      toast({
        title: "Error",
        description: "Please select both a class and a teacher",
        variant: "destructive"
      });
      return;
    }

    try {
      const subjectId = editAssignment.subject_id === 'no-subject' ? null : editAssignment.subject_id;
      
      const { error } = await supabase
        .from('class_teachers')
        .update({
          class_id: editAssignment.class_id,
          teacher_id: editAssignment.teacher_id,
          subject_id: subjectId,
          role: editAssignment.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editAssignment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment updated successfully"
      });

      setIsEditDialogOpen(false);
      loadData();

    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      // Use direct table update instead of RPC function
      const { error } = await supabase
        .from('class_teachers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });

      loadData();

    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove assignment",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'homeroom': return 'default';
      case 'subject_teacher': return 'secondary';
      case 'assistant': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'homeroom': return 'Homeroom Teacher';
      case 'subject_teacher': return 'Subject Teacher';
      case 'assistant': return 'Assistant';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading class-teacher assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Class-Teacher Assignments
          </h2>
          <p className="text-muted-foreground">
            Manage teacher assignments to classes with different roles
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teacher to Class</DialogTitle>
              <DialogDescription>
                Create a new assignment by selecting a class, teacher, optional subject, and role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="class">Class</Label>
                <Select
                  value={newAssignment.class_id}
                  onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Grade {cls.grade_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="teacher">Teacher</Label>
                <Select
                  value={newAssignment.teacher_id}
                  onValueChange={(value) => setNewAssignment(prev => ({ ...prev, teacher_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`} ({teacher.teacher_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Select
                  value={newAssignment.subject_id}
                  onValueChange={(value) => setNewAssignment(prev => ({ ...prev, subject_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-subject">No specific subject</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newAssignment.role}
                  onValueChange={(value: 'homeroom' | 'subject_teacher' | 'assistant') => 
                    setNewAssignment(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                    <SelectItem value="homeroom">Homeroom Teacher</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Assign Teacher
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No assignments found</h3>
                <p className="text-muted-foreground">
                  Start by assigning a teacher to a class
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">
                          {assignment.teachers?.full_name || `${assignment.teachers?.first_name} ${assignment.teachers?.last_name}` || 'Unknown Teacher'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.teachers?.teacher_code}
                        </p>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div>
                        <p className="font-semibold">
                          {assignment.classes?.name || 'Unknown Class'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Grade {assignment.classes?.grade_level}
                        </p>
                      </div>
                      {assignment.subjects && (
                        <>
                          <div className="text-muted-foreground">for</div>
                          <div>
                            <p className="font-semibold">
                              {assignment.subjects.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.subjects.code}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(assignment.role)}>
                        {getRoleLabel(assignment.role)}
                      </Badge>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAssignment(assignment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this class-teacher assignment.
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Teacher</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">
                      {selectedAssignment.teachers?.full_name || `${selectedAssignment.teachers?.first_name} ${selectedAssignment.teachers?.last_name}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.teachers?.teacher_code}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">{selectedAssignment.classes?.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Grade {selectedAssignment.classes?.grade_level}
                  </p>
                </div>
              </div>

              {selectedAssignment.subjects && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-semibold">{selectedAssignment.subjects.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.subjects.code}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                  <Badge variant={getRoleBadgeVariant(selectedAssignment.role)}>
                    {getRoleLabel(selectedAssignment.role)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={selectedAssignment.is_active ? "default" : "secondary"}>
                    {selectedAssignment.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Assigned Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedAssignment.assigned_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the class-teacher assignment details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-class">Class</Label>
              <Select
                value={editAssignment.class_id}
                onValueChange={(value) => setEditAssignment(prev => ({ ...prev, class_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Grade {cls.grade_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-teacher">Teacher</Label>
              <Select
                value={editAssignment.teacher_id}
                onValueChange={(value) => setEditAssignment(prev => ({ ...prev, teacher_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`} ({teacher.teacher_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-subject">Subject (Optional)</Label>
              <Select
                value={editAssignment.subject_id}
                onValueChange={(value) => setEditAssignment(prev => ({ ...prev, subject_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-subject">No specific subject</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editAssignment.role}
                onValueChange={(value: 'homeroom' | 'subject_teacher' | 'assistant') => 
                  setEditAssignment(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                  <SelectItem value="homeroom">Homeroom Teacher</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAssignment}>
                Update Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
