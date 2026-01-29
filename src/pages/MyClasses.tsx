import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, School, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyClasses() {
  const { user } = useAuth();

  const { data: teacherId } = useQuery({
    queryKey: ['teacher-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data?.id;
    },
    enabled: !!user?.id,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacher-assignments', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const { data } = await supabase
        .from('class_subject_assignments')
        .select(`
          id,
          is_active,
          class:classes(
            id,
            name,
            grade_level,
            academic_year:academic_years(name)
          ),
          subject:subjects(
            id,
            name,
            code
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!teacherId,
  });

  const { data: homeroomClass } = useQuery({
    queryKey: ['homeroom-class', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade_level,
          academic_year:academic_years(name)
        `)
        .eq('homeroom_teacher_id', teacherId)
        .single();
      return data;
    },
    enabled: !!teacherId,
  });

  const { data: studentCounts } = useQuery({
    queryKey: ['student-counts', assignments],
    queryFn: async () => {
      if (!assignments || assignments.length === 0) return {};
      
      const classIds = [...new Set(assignments.map((a: any) => a.class?.id).filter(Boolean))];
      const counts: Record<string, number> = {};
      
      for (const classId of classIds) {
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('current_class_id', classId)
          .eq('is_active', true);
        counts[classId] = count || 0;
      }
      
      return counts;
    },
    enabled: !!assignments && assignments.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group assignments by class
  const classesByAssignment: Record<string, { class: any; subjects: any[] }> = {};
  assignments?.forEach((assignment: any) => {
    if (!assignment.class?.id) return;
    if (!classesByAssignment[assignment.class.id]) {
      classesByAssignment[assignment.class.id] = {
        class: assignment.class,
        subjects: [],
      };
    }
    classesByAssignment[assignment.class.id].subjects.push(assignment.subject);
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
        <p className="text-muted-foreground">View your assigned classes and subjects</p>
      </div>

      {/* Homeroom Section */}
      {homeroomClass && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Homeroom Class
                </CardTitle>
                <CardDescription>You are the homeroom teacher for this class</CardDescription>
              </div>
              <Badge variant="default">Homeroom</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{homeroomClass.name}</p>
                <p className="text-muted-foreground">
                  Grade {homeroomClass.grade_level} • {homeroomClass.academic_year?.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {studentCounts?.[homeroomClass.id] || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <Link to="/grades">
                  <Button variant="outline">
                    View Grades
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Assignments
          </CardTitle>
          <CardDescription>
            Classes and subjects you are assigned to teach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(classesByAssignment).length > 0 ? (
            <div className="space-y-6">
              {Object.values(classesByAssignment).map(({ class: cls, subjects }) => (
                <div key={cls.id} className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Grade {cls.grade_level} • {cls.academic_year?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{studentCounts?.[cls.id] || 0} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject: any) => (
                      <Badge key={subject.id} variant="secondary">
                        {subject.name} ({subject.code})
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <School className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No class assignments</h3>
              <p className="text-muted-foreground">
                You haven't been assigned to any classes yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
