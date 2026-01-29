import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Users, BookOpen, UserCheck, Plus, Eye, Calendar, Edit } from 'lucide-react';
import { CreateAssessmentDialog } from './CreateAssessmentDialog';
import { GradesManager } from './GradesManager';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  role: string;
  is_active: boolean;
  students_count?: number;
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
}

interface ClassWithStudents {
  class: TeacherClass;
  students: Student[];
}

interface Assessment {
  id: string;
  title: string;
  assessment_type_name: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  class_name: string;
  subject_name: string;
}

export function TeacherClasses() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isCreateAssessmentDialogOpen, setIsCreateAssessmentDialogOpen] = useState(false);
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [classAssessments, setClassAssessments] = useState<Assessment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  const loadTeacherClasses = async () => {
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

      // Get teacher's class assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name, grade_level),
          subjects(id, name, code)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Transform data and get student counts
      const classesWithCounts = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', assignment.class_id)
            .eq('is_active', true);

          return {
            id: assignment.id,
            class_id: assignment.class_id,
            class_name: assignment.classes?.name || 'Unknown Class',
            grade_level: assignment.classes?.grade_level || 0,
            subject_id: assignment.subject_id,
            subject_name: assignment.subjects?.name,
            subject_code: assignment.subjects?.code,
            role: assignment.role,
            is_active: assignment.is_active,
            students_count: count || 0
          };
        })
      );

      setTeacherClasses(classesWithCounts);

    } catch (error) {
      console.error('Error loading teacher classes:', error);
      setError(error instanceof Error ? error.message : 'Failed to load classes');
      toast({
        title: "Error",
        description: "Failed to load your classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classData: TeacherClass) => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('enrollments')
        .select(`
          students(
            id,
            student_id_code,
            first_name,
            last_name,
            middle_name,
            gender,
            date_of_birth,
            enrollment_year,
            is_active
          )
        `)
        .eq('class_id', classData.class_id)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      const students = (studentsData || []).map(enrollment => enrollment.students).filter(Boolean);

      // Load assessments for this class
      await loadClassAssessments(classData);

      setSelectedClass({
        class: classData,
        students: students as Student[]
      });
      setIsStudentsDialogOpen(true);

    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  const loadClassAssessments = async (classData: TeacherClass) => {
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

      // Get assessments for this class
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(name),
          class_subject_assignments(
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
        assessment_type_name: assessment.assessment_types?.name || 'Unknown',
        max_score: assessment.max_score,
        weight: assessment.weight,
        assessment_date: assessment.assessment_date,
        is_published: assessment.is_published,
        class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown Class',
        subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown Subject'
      }));

      setClassAssessments(assessments);

    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const handleCreateAssessment = (classData?: TeacherClass) => {
    setSelectedClass(classData ? { class: classData, students: [] } : null);
    setIsCreateAssessmentDialogOpen(true);
  };

  const handleManageGrades = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsGradesDialogOpen(true);
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
          <p>Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={loadTeacherClasses}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          My Classes
        </h2>
        <p className="text-muted-foreground">
          Manage your class assignments and view student information
        </p>
      </div>

      {teacherClasses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No classes assigned</h3>
              <p className="text-muted-foreground">
                You haven't been assigned to any classes yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teacherClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Grade {classItem.grade_level}
                    </p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(classItem.role)}>
                    {getRoleLabel(classItem.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {classItem.subject_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>{classItem.subject_name} ({classItem.subject_code})</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classItem.students_count} students</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadClassStudents(classItem)}
                    >
                      <Eye className="h-4 w-4" />
                      Students
                    </Button>
                    {classItem.role === 'subject_teacher' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateAssessment(classItem)}
                        >
                          <Plus className="h-4 w-4" />
                          Assessment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Students - {selectedClass?.class.class_name}</DialogTitle>
            <DialogDescription>
              {selectedClass?.class.subject_name && `Subject: ${selectedClass.class.subject_name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedClass.students.length} students enrolled
                </div>
                <div className="flex gap-2">
                  {selectedClass.class.role === 'subject_teacher' && (
                    <Button
                      onClick={() => handleCreateAssessment(selectedClass.class)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assessment
                    </Button>
                  )}
                </div>
              </div>

              {selectedClass.students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students enrolled in this class</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {selectedClass.students.map((student) => (
                      <Card key={student.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {student.first_name} {student.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                ID: {student.student_id_code}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>Gender: {student.gender}</span>
                                <span>Enrolled: {student.enrollment_year}</span>
                              </div>
                            </div>
                            <Badge variant={student.is_active ? "default" : "secondary"}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Assessments Section */}
                  {classAssessments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Assessments for this Class</h4>
                      <div className="grid gap-3">
                        {classAssessments.map((assessment) => (
                          <Card key={assessment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold">{assessment.title}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {assessment.assessment_type_name} • Max Score: {assessment.max_score}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <Badge variant="outline">{assessment.assessment_type_name}</Badge>
                                    <span>Weight: {assessment.weight}%</span>
                                    <Badge variant={assessment.is_published ? "default" : "secondary"}>
                                      {assessment.is_published ? 'Published' : 'Draft'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleManageGrades(assessment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Grades
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Assessment Dialog */}
      <CreateAssessmentDialog
        isOpen={isCreateAssessmentDialogOpen}
        onClose={() => setIsCreateAssessmentDialogOpen(false)}
        onSuccess={() => {
          if (selectedClass) {
            loadClassAssessments(selectedClass.class);
          }
        }}
        selectedClass={selectedClass?.class}
      />

      {/* Grades Manager Dialog */}
      {selectedAssessment && (
        <GradesManager
          assessment={selectedAssessment}
          isOpen={isGradesDialogOpen}
          onClose={() => setIsGradesDialogOpen(false)}
          onSuccess={() => {
            if (selectedClass) {
              loadClassAssessments(selectedClass.class);
            }
          }}
        />
      )}
    </div>
  );
}
