import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Loader2, TrendingUp, Award, Target, BookOpen } from 'lucide-react';

export default function MyPerformance() {
  const { user } = useAuth();

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['my-student-data', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['my-all-grades', studentData?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(*),
          assessment:assessments(*),
          semester:semesters(*, academic_year:academic_years(*))
        `)
        .eq('student_id', studentData!.id)
        .eq('is_published', true)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!studentData,
  });

  // Calculate statistics
  const stats = grades?.reduce((acc: any, grade: any) => {
    const subjectName = grade.subject?.name || 'Unknown';
    if (!acc.subjects[subjectName]) {
      acc.subjects[subjectName] = { total: 0, count: 0, grades: [] };
    }
    acc.subjects[subjectName].total += grade.percentage || 0;
    acc.subjects[subjectName].count += 1;
    acc.subjects[subjectName].grades.push(grade);
    acc.totalPercentage += grade.percentage || 0;
    acc.totalCount += 1;
    return acc;
  }, { subjects: {}, totalPercentage: 0, totalCount: 0 });

  const overallAverage = stats?.totalCount > 0 ? stats.totalPercentage / stats.totalCount : 0;
  const gpa = (overallAverage / 100) * 4;

  // Subject performance data
  const subjectData = Object.entries(stats?.subjects || {}).map(([name, data]: [string, any]) => ({
    subject: name,
    average: Math.round((data.total / data.count) * 10) / 10,
  }));

  // Performance trend over time
  const trendData = grades?.reduce((acc: any[], grade: any, index: number) => {
    const runningTotal = grades.slice(0, index + 1).reduce((sum: number, g: any) => sum + (g.percentage || 0), 0);
    const runningAverage = runningTotal / (index + 1);
    acc.push({
      index: index + 1,
      average: Math.round(runningAverage * 10) / 10,
      score: grade.percentage,
    });
    return acc;
  }, []) || [];

  // Radar chart data
  const radarData = subjectData.map((item) => ({
    subject: item.subject.length > 10 ? item.subject.substring(0, 10) + '...' : item.subject,
    value: item.average,
    fullMark: 100,
  }));

  // Grade distribution
  const gradeDistribution = grades?.reduce((acc: Record<string, number>, grade: any) => {
    const letter = grade.letter_grade || 'N/A';
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {}) || {};

  const distributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
  }));

  // Find strengths and weaknesses
  const sortedSubjects = [...subjectData].sort((a, b) => b.average - a.average);
  const strengths = sortedSubjects.slice(0, 3);
  const weaknesses = sortedSubjects.slice(-3).reverse();

  const isLoading = studentLoading || gradesLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Performance</h1>
        <p className="text-muted-foreground">Detailed analysis of your academic performance</p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectData.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Strengths</CardTitle>
            <CardDescription>Your best performing subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strengths.map((subject, index) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{subject.subject}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{subject.average}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Areas for Improvement</CardTitle>
            <CardDescription>Subjects that need more attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weaknesses.map((subject, index) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{subject.subject}</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{subject.average}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
            <CardDescription>Average score in each subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis dataKey="subject" type="category" width={80} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="index" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Running Average"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Individual Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Balance</CardTitle>
            <CardDescription>Visual representation of your performance across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="subject" className="text-xs" />
                    <PolarRadiusAxis domain={[0, 100]} className="text-xs" />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of your letter grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="grade" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
