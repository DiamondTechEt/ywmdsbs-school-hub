import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, Users, GraduationCap, BookOpen, Target } from 'lucide-react';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const { role } = useAuth();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters', selectedYear],
    queryFn: async () => {
      let query = supabase
        .from('semesters')
        .select('*')
        .order('start_date', { ascending: false });

      if (selectedYear) {
        query = query.eq('academic_year_id', selectedYear);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats', selectedYear, selectedSemester],
    queryFn: async () => {
      // Get counts
      const [studentsResult, teachersResult, classesResult, subjectsResult] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('teachers').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('classes').select('id', { count: 'exact' }),
        supabase.from('subjects').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      return {
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalSubjects: subjectsResult.count || 0,
      };
    },
  });

  const { data: gradeDistribution } = useQuery({
    queryKey: ['grade-distribution', selectedYear, selectedSemester],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select('percentage')
        .eq('is_published', true);

      if (selectedSemester) {
        query = query.eq('semester_id', selectedSemester);
      } else if (selectedYear) {
        query = query.eq('academic_year_id', selectedYear);
      }

      const { data } = await query;
      if (!data) return [];

      const distribution = {
        'A (90-100)': 0,
        'B (80-89)': 0,
        'C (70-79)': 0,
        'D (60-69)': 0,
        'F (0-59)': 0,
      };

      data.forEach((grade: any) => {
        const pct = grade.percentage || 0;
        if (pct >= 90) distribution['A (90-100)']++;
        else if (pct >= 80) distribution['B (80-89)']++;
        else if (pct >= 70) distribution['C (70-79)']++;
        else if (pct >= 60) distribution['D (60-69)']++;
        else distribution['F (0-59)']++;
      });

      return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: subjectAverages } = useQuery({
    queryKey: ['subject-averages', selectedYear, selectedSemester],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          percentage,
          subject:subjects(name)
        `)
        .eq('is_published', true);

      if (selectedSemester) {
        query = query.eq('semester_id', selectedSemester);
      } else if (selectedYear) {
        query = query.eq('academic_year_id', selectedYear);
      }

      const { data } = await query;
      if (!data) return [];

      const subjectMap: Record<string, { total: number; count: number }> = {};
      data.forEach((grade: any) => {
        const subjectName = grade.subject?.name || 'Unknown';
        if (!subjectMap[subjectName]) {
          subjectMap[subjectName] = { total: 0, count: 0 };
        }
        subjectMap[subjectName].total += grade.percentage || 0;
        subjectMap[subjectName].count++;
      });

      return Object.entries(subjectMap)
        .map(([name, { total, count }]) => ({
          name,
          average: Math.round(total / count),
        }))
        .sort((a, b) => b.average - a.average);
    },
  });

  const { data: classPerformance } = useQuery({
    queryKey: ['class-performance', selectedYear, selectedSemester],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          percentage,
          class:classes(name, grade_level)
        `)
        .eq('is_published', true);

      if (selectedSemester) {
        query = query.eq('semester_id', selectedSemester);
      } else if (selectedYear) {
        query = query.eq('academic_year_id', selectedYear);
      }

      const { data } = await query;
      if (!data) return [];

      const classMap: Record<string, { total: number; count: number; passCount: number }> = {};
      data.forEach((grade: any) => {
        const className = grade.class?.name || 'Unknown';
        if (!classMap[className]) {
          classMap[className] = { total: 0, count: 0, passCount: 0 };
        }
        classMap[className].total += grade.percentage || 0;
        classMap[className].count++;
        if ((grade.percentage || 0) >= 50) {
          classMap[className].passCount++;
        }
      });

      return Object.entries(classMap)
        .map(([name, { total, count, passCount }]) => ({
          name,
          average: Math.round(total / count),
          passRate: Math.round((passCount / count) * 100),
        }))
        .sort((a, b) => b.average - a.average);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">School performance metrics and insights</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears?.map((year: any) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters?.map((semester: any) => (
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

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grade Distribution
            </CardTitle>
            <CardDescription>Distribution of grades by letter</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeDistribution && gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#FF7F11"
                    dataKey="value"
                  >
                    {gradeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No grade data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Averages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject Averages
            </CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectAverages && subjectAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="average" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No subject data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Class Performance
            </CardTitle>
            <CardDescription>Average scores and pass rates by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classPerformance && classPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" name="Average Score" fill="hsl(var(--primary))" />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No class performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
