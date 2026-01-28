import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function TeacherDashboard() {
  const { user } = useAuth();

  const { data: teacherData } = useQuery({
    queryKey: ['teacher-data', user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!teacher) return null;

      const { data: assignments } = await supabase
        .from('class_subject_assignments')
        .select(`
          *,
          class:classes(*),
          subject:subjects(*)
        `)
        .eq('teacher_id', teacher.id);

      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('created_by_teacher_id', teacher.id);

      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('teacher_id', teacher.id);

      return {
        teacher,
        assignments: assignments || [],
        assessments: assessments || [],
        grades: grades || [],
      };
    },
    enabled: !!user,
  });

  const classDistribution = teacherData?.assignments?.reduce((acc: Record<string, number>, assignment: any) => {
    const className = assignment.class?.name || 'Unknown';
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {});

  const classData = Object.entries(classDistribution || {}).map(([name, count]) => ({
    name,
    subjects: count,
  }));

  const gradeDistribution = teacherData?.grades?.reduce((acc: Record<string, number>, grade: any) => {
    const letter = grade.letter_grade || 'Ungraded';
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {});

  const gradeData = Object.entries(gradeDistribution || {}).map(([grade, count]) => ({
    grade,
    count,
  }));

  const pendingAssessments = teacherData?.assessments?.filter(a => !a.is_published).length || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {teacherData?.teacher?.first_name || 'Teacher'}
        </h1>
        <p className="text-muted-foreground">Here's an overview of your classes and students</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherData?.assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Class-subject assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherData?.assessments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{pendingAssessments} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Grades Entered</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherData?.grades?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total grade entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild size="sm" className="w-full">
              <Link to="/upload-grades">Upload Grades</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Class Assignments</CardTitle>
            <CardDescription>Subjects per class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {classData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="subjects" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No class assignments yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Your students' performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="grade"
                      label={({ grade, count }) => `${grade}: ${count}`}
                    >
                      {gradeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No grades entered yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Classes List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Class Assignments</CardTitle>
          <CardDescription>Classes and subjects you teach</CardDescription>
        </CardHeader>
        <CardContent>
          {teacherData?.assignments && teacherData.assignments.length > 0 ? (
            <div className="space-y-4">
              {teacherData.assignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{assignment.class?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.subject?.name} ({assignment.subject?.code})
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/grades?class=${assignment.class?.id}&subject=${assignment.subject?.id}`}>
                      View Grades
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No class assignments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
