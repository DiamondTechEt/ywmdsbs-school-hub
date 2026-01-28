import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

export default function MyGrades() {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

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
    queryKey: ['my-grades', studentData?.id, selectedSemester],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(*),
          assessment:assessments(*),
          semester:semesters(*, academic_year:academic_years(*))
        `)
        .eq('student_id', studentData!.id)
        .eq('is_published', true);

      if (selectedSemester !== 'all') {
        query = query.eq('semester_id', selectedSemester);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!studentData,
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const { data } = await supabase
        .from('semesters')
        .select('*, academic_year:academic_years(*)')
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  // Group grades by subject
  const gradesBySubject = grades?.reduce((acc: Record<string, any[]>, grade: any) => {
    const subjectName = grade.subject?.name || 'Unknown';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(grade);
    return acc;
  }, {});

  // Calculate averages per subject
  const subjectAverages = Object.entries(gradesBySubject || {}).map(([subject, grades]: [string, any[]]) => {
    const totalPercentage = grades.reduce((sum, g) => sum + (g.percentage || 0), 0);
    const average = totalPercentage / grades.length;
    return {
      subject,
      grades,
      average: Math.round(average * 10) / 10,
      letterGrade: getLetterGrade(average),
    };
  });

  function getLetterGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D';
    return 'F';
  }

  const isLoading = studentLoading || gradesLoading;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Grades</h1>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters?.map((semester: any) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.academic_year?.name} - {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : subjectAverages.length > 0 ? (
        <div className="space-y-6">
          {subjectAverages.map(({ subject, grades, average, letterGrade }) => (
            <Card key={subject}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      {subject}
                    </CardTitle>
                    <CardDescription>{grades.length} assessments</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{average}%</p>
                    <Badge variant="secondary">{letterGrade}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade: any) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">
                            {grade.assessment?.title}
                          </TableCell>
                          <TableCell>
                            {grade.score}/{grade.assessment?.max_score}
                          </TableCell>
                          <TableCell>{grade.percentage?.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{grade.letter_grade}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(grade.assessment?.assessment_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12" />
            <p>No grades available yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
