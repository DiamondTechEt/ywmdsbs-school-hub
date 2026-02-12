import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingAssessment {
  id: string;
  title: string;
  assessment_date: string;
  class_name: string;
  subject_name: string;
  total_students: number;
  graded_students: number;
  pending_students: number;
  class_id: string;
  subject_id: string;
}

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
}

export function PendingGradesManager() {
  const [pendingAssessments, setPendingAssessments] = useState<PendingAssessment[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Load teacher's classes with subject assignments
      const { data: classesData, error: classesError } = await supabase
        .from('class_subject_assignments')
        .select(`
          id,
          class_id,
          subject_id,
          teacher_id,
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
        subject_name: item.subjects?.name || 'Unknown Subject'
      }));

      setTeacherClasses(classes);

      // Get published assessments that need grading
      let query = supabase
        .from('assessments')
        .select(`
          id,
          title,
          assessment_date,
          class_subject_assignment_id,
          class_subject_assignments(
            class_id,
            classes(id, name),
            subject_id,
            subjects(id, name)
          )
        `)
        .eq('created_by_teacher_id', teacherData.id)
        .eq('is_published', true)
        .order('assessment_date', { ascending: false });

      // Filter by selected class if not 'all'
      if (selectedClass !== 'all') {
        const selectedClassData = classes.find(c => c.id === selectedClass);
        if (selectedClassData) {
          query = query.eq('class_subject_assignment_id', selectedClass);
        }
      }

      const { data: assessmentsData, error: assessmentsError } = await query;

      if (assessmentsError) throw assessmentsError;

      // For each assessment, calculate grading progress
      const assessmentsWithProgress = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const classId = assessment.class_subject_assignments?.class_id;
          const subjectId = assessment.class_subject_assignments?.subject_id;

          if (!classId || !subjectId) {
            return null;
          }

          // Get total enrolled students
          const { count: totalStudents } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId)
            .eq('is_active', true);

          // Get graded students
          const { count: gradedStudents } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
            .eq('class_id', classId)
            .eq('subject_id', subjectId);

          const total = totalStudents || 0;
          const graded = gradedStudents || 0;
          const pending = total - graded;

          // Only include assessments that have pending grades
          if (pending === 0) {
            return null;
          }

          return {
            id: assessment.id,
            title: assessment.title,
            assessment_date: assessment.assessment_date,
            class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown Class',
            subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown Subject',
            total_students: total,
            graded_students: graded,
            pending_students: pending,
            class_id: classId,
            subject_id: subjectId
          };
        })
      );

      // Filter out null values and sort by pending students (most pending first)
      const validAssessments = assessmentsWithProgress
        .filter(Boolean)
        .sort((a, b) => b!.pending_students - a!.pending_students);

      setPendingAssessments(validAssessments as PendingAssessment[]);

    } catch (error) {
      console.error('Error loading pending grades:', error);
      toast({
        title: "Error",
        description: "Failed to load pending grades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeAssessment = (assessment: PendingAssessment) => {
    // Navigate to the grading page for this assessment
    navigate(`/teacher/grades/${assessment.id}?class_id=${assessment.class_id}&subject_id=${assessment.subject_id}`);
  };

  const getProgressPercentage = (graded: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((graded / total) * 100);
  };

  const getStatusBadge = (pending: number, total: number) => {
    if (pending === 0) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
    } else if (pending === total) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Not Started</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pending grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Grades</h2>
          <p className="text-muted-foreground">
            Assessments that need grading for your classes
          </p>
        </div>
        
        {teacherClasses.length > 1 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="class-filter" className="text-sm font-medium">
              Filter by class:
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {teacherClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name} - {cls.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {pendingAssessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-center">
              {selectedClass === 'all' 
                ? "You don't have any assessments that need grading."
                : "You don't have any pending grades for this class."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingAssessments.map((assessment) => {
            const progressPercentage = getProgressPercentage(assessment.graded_students, assessment.total_students);
            
            return (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{assessment.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {assessment.class_name}
                        </span>
                        <span>{assessment.subject_name}</span>
                        <span>{new Date(assessment.assessment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(assessment.pending_students, assessment.total_students)}
                      <Button
                        onClick={() => handleGradeAssessment(assessment)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Grade Now
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {assessment.graded_students} of {assessment.total_students} students graded
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressPercentage}% complete</span>
                      <span>{assessment.pending_students} pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
