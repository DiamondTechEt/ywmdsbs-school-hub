import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, TrendingUp, Award, FileText, GraduationCap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: studentData } = useQuery({
    queryKey: ['student-data', user?.id],
    queryFn: async () => {
      const { data: student } = await supabase
        .from('students')
        .select(`
          *,
          current_class:classes(*)
        `)
        .eq('user_id', user!.id)
        .single();

      if (!student) return null;

      const { data: grades } = await supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(*),
          assessment:assessments(*)
        `)
        .eq('student_id', student.id)
        .eq('is_published', true);

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*, class:classes(*), academic_year:academic_years(*)')
        .eq('student_id', student.id)
        .eq('is_active', true)
        .single();

      return {
        student,
        grades: grades || [],
        enrollment,
      };
    },
    enabled: !!user,
  });

  // Calculate statistics
  const calculateStats = () => {
    const grades = studentData?.grades || [];
    if (grades.length === 0) {
      return { average: 0, gpa: 0, topSubject: 'N/A', subjectCount: 0 };
    }

    const totalPercentage = grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0);
    const average = totalPercentage / grades.length;

    // Group by subject and calculate averages
    const subjectAverages: Record<string, { total: number; count: number; name: string }> = {};
    grades.forEach((grade: any) => {
      const subjectId = grade.subject_id;
      const subjectName = grade.subject?.name || 'Unknown';
      if (!subjectAverages[subjectId]) {
        subjectAverages[subjectId] = { total: 0, count: 0, name: subjectName };
      }
      subjectAverages[subjectId].total += grade.percentage || 0;
      subjectAverages[subjectId].count += 1;
    });

    let topSubject = 'N/A';
    let topAverage = 0;
    Object.values(subjectAverages).forEach((subject) => {
      const avg = subject.total / subject.count;
      if (avg > topAverage) {
        topAverage = avg;
        topSubject = subject.name;
      }
    });

    // Simple GPA calculation (4.0 scale)
    const gpa = (average / 100) * 4;

    return {
      average: Math.round(average * 10) / 10,
      gpa: Math.round(gpa * 100) / 100,
      topSubject,
      subjectCount: Object.keys(subjectAverages).length,
    };
  };

  const stats = calculateStats();

  // Group grades by subject for chart
  const subjectPerformance = studentData?.grades?.reduce((acc: Record<string, { total: number; count: number; name: string }>, grade: any) => {
    const subjectName = grade.subject?.name || 'Unknown';
    if (!acc[subjectName]) {
      acc[subjectName] = { total: 0, count: 0, name: subjectName };
    }
    acc[subjectName].total += grade.percentage || 0;
    acc[subjectName].count += 1;
    return acc;
  }, {});

  const subjectData = Object.values(subjectPerformance || {}).map((subject: any) => ({
    subject: subject.name,
    average: Math.round((subject.total / subject.count) * 10) / 10,
  }));

  // Mock trend data - in production, this would come from historical grades
  const trendData = [
    { month: 'Sep', score: 75 },
    { month: 'Oct', score: 78 },
    { month: 'Nov', score: 82 },
    { month: 'Dec', score: 80 },
    { month: 'Jan', score: 85 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {studentData?.student?.first_name || 'Student'}
        </h1>
        <p className="text-muted-foreground">
          {studentData?.student?.current_class 
            ? `Class: ${(studentData.student.current_class as any).name} | ID: ${studentData.student.student_id_code}`
            : 'Your academic dashboard'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gpa}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Subject</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{stats.topSubject}</div>
            <p className="text-xs text-muted-foreground">Best performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subjectCount}</div>
            <p className="text-xs text-muted-foreground">Enrolled subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Button asChild>
          <Link to="/my-grades">
            <FileText className="mr-2 h-4 w-4" />
            View All Grades
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/my-transcript">
            <FileText className="mr-2 h-4 w-4" />
            Download Transcript
          </Link>
        </Button>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
            <CardDescription>Your average score in each subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis dataKey="subject" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No grades available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your progress over the semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[60, 100]} className="text-xs" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Grades</CardTitle>
          <CardDescription>Your latest published grades</CardDescription>
        </CardHeader>
        <CardContent>
          {studentData?.grades && studentData.grades.length > 0 ? (
            <div className="space-y-4">
              {studentData.grades.slice(0, 5).map((grade: any) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{grade.subject?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.assessment?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{grade.score}/{grade.assessment?.max_score}</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.percentage?.toFixed(1)}% - {grade.letter_grade || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No grades published yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
