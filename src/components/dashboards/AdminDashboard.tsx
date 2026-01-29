import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, School, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [studentsRes, teachersRes, classesRes, subjectsRes, academicYearsRes] = await Promise.all([
        supabase.from('students').select('id, is_active').eq('is_active', true),
        supabase.from('teachers').select('id, is_active').eq('is_active', true),
        supabase.from('classes').select('id'),
        supabase.from('subjects').select('id, is_active').eq('is_active', true),
        supabase.from('academic_years').select('*').eq('is_active', true).single(),
      ]);

      return {
        students: studentsRes.data?.length || 0,
        teachers: teachersRes.data?.length || 0,
        classes: classesRes.data?.length || 0,
        subjects: subjectsRes.data?.length || 0,
        currentYear: academicYearsRes.data?.name || 'Not Set',
      };
    },
  });

  const { data: gradeDistribution } = useQuery({
    queryKey: ['grade-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('letter_grade')
        .not('letter_grade', 'is', null);

      const distribution: Record<string, number> = {};
      data?.forEach((grade) => {
        distribution[grade.letter_grade!] = (distribution[grade.letter_grade!] || 0) + 1;
      });

      return Object.entries(distribution).map(([grade, count]) => ({
        grade,
        count,
      }));
    },
  });

  const { data: additionalStats } = useQuery({
    queryKey: ['additional-admin-stats'],
    queryFn: async () => {
      const [assessmentsRes, gradesRes, recentGradesRes] = await Promise.all([
        supabase.from('assessments').select('id, created_at'),
        supabase.from('grades').select('id, created_at'),
        supabase
          .from('grades')
          .select(`
            id,
            created_at,
            student:students(first_name, last_name),
            assessment:assessments(title, assessment_date)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAssessments = assessmentsRes.data?.filter(
        (a: any) => new Date(a.created_at) > thirtyDaysAgo
      ).length || 0;

      const recentGrades = gradesRes.data?.filter(
        (g: any) => new Date(g.created_at) > thirtyDaysAgo
      ).length || 0;

      return {
        totalAssessments: assessmentsRes.data?.length || 0,
        totalGrades: gradesRes.data?.length || 0,
        recentAssessments,
        recentGrades,
        recentGradesList: recentGradesRes.data || []
      };
    },
  });

  const { data: enrollmentByGrade } = useQuery({
    queryKey: ['enrollment-by-grade'],
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('grade_level, id');

      const gradeCount: Record<number, number> = {};
      data?.forEach((cls) => {
        gradeCount[cls.grade_level] = (gradeCount[cls.grade_level] || 0) + 1;
      });

      return Object.entries(gradeCount).map(([grade, count]) => ({
        grade: `Grade ${grade}`,
        classes: count,
      }));
    },
  });

  const { data: genderDistribution } = useQuery({
    queryKey: ['gender-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('gender')
        .eq('is_active', true);

      const distribution: Record<string, number> = {};
      data?.forEach((student) => {
        const gender = student.gender || 'Unknown';
        distribution[gender] = (distribution[gender] || 0) + 1;
      });

      return Object.entries(distribution).map(([gender, count]) => ({
        gender,
        count,
        percentage: Math.round((count / (data?.length || 1)) * 100)
      }));
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to YWMDSBS School Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students || 0}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teachers || 0}</div>
            <p className="text-xs text-muted-foreground">Active faculty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.classes || 0}</div>
            <p className="text-xs text-muted-foreground">This academic year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subjects || 0}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{additionalStats?.totalAssessments || 0}</div>
            <p className="text-xs text-muted-foreground">Total assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Grades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{additionalStats?.totalGrades || 0}</div>
            <p className="text-xs text-muted-foreground">Total grades recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Overall student performance by letter grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="grade"
                    label={({ grade, count }) => `${grade}: ${count}`}
                  >
                    {gradeDistribution?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Distribution by Gender</CardTitle>
            <CardDescription>Demographic breakdown of active students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {genderDistribution && genderDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="gender"
                      label={({ gender, count, percentage }) => `${gender}: ${count} (${percentage}%)`}
                    >
                      {genderDistribution?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.percentage}%`,
                        `${name}: ${value} students`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No student data available</p>
                    <p className="text-sm">Student gender distribution will appear here once students are enrolled</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest grade entries in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {additionalStats?.recentGradesList && additionalStats.recentGradesList.length > 0 ? (
                additionalStats.recentGradesList.map((grade: any) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {grade.student?.first_name} {grade.student?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {grade.assessment?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(grade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Grade entries will appear here once recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes by Grade Level</CardTitle>
            <CardDescription>Distribution of classes across grade levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentByGrade || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="grade" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="classes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
