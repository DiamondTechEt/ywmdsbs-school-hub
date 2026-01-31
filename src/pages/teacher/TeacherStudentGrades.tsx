import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Award, Loader2 } from 'lucide-react';
import { StudentGradesTable } from '@/components/teacher/StudentGradesTable';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
}

interface Semester {
  id: string;
  name: string;
  academic_year_id: string;
}

export default function TeacherStudentGrades() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeacherClasses();
    loadSemesters();
  }, []);

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

      // Get class subject assignments
      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select(`
          *,
          classes(id, name, grade_level),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (csaError) throw csaError;

      const classes = (csaData || []).map(assignment => ({
        id: assignment.id,
        class_id: assignment.class_id,
        class_name: assignment.classes?.name || 'Unknown Class',
        grade_level: assignment.classes?.grade_level || 0,
        subject_id: assignment.subject_id,
        subject_name: assignment.subjects?.name || 'Unknown Subject'
      }));

      setTeacherClasses(classes);

      // Auto-select first class and subject if available
      if (classes.length > 0) {
        setSelectedClass(classes[0].class_id);
        setSelectedSubject(classes[0].subject_id || '');
      }
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSemesters(data || []);
      
      if (data && data.length > 0) {
        setSelectedSemester(data[0].id);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    }
  };

  // Get unique classes
  const uniqueClasses = Array.from(
    new Map(teacherClasses.map(c => [c.class_id, { class_id: c.class_id, class_name: c.class_name, grade_level: c.grade_level }])).values()
  );

  // Get subjects for selected class
  const availableSubjects = teacherClasses.filter(c => c.class_id === selectedClass);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const subjects = teacherClasses.filter(c => c.class_id === classId);
    if (subjects.length > 0) {
      setSelectedSubject(subjects[0].subject_id || '');
    } else {
      setSelectedSubject('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8" />
          Student Grades Overview
        </h1>
        <p className="text-muted-foreground">
          View all student grades in tabular format with assessment details
        </p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class and Subject</CardTitle>
          <CardDescription>Choose a class and subject to view student grades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map(cls => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} (Grade {cls.grade_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(sub => (
                    <SelectItem key={sub.subject_id} value={sub.subject_id || ''}>
                      {sub.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester (Optional)</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Semesters</SelectItem>
                  {semesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      {selectedClass && selectedSubject ? (
        <StudentGradesTable
          classId={selectedClass}
          subjectId={selectedSubject}
          semesterId={selectedSemester || undefined}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Select a class and subject to view student grades
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
