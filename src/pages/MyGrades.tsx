import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileSpreadsheet, TrendingUp, Award, Target } from 'lucide-react';
import { useState } from 'react';
import { useStudentGradesWithSubjects } from '@/components/teacher/useStudentGradesWithSubjects';

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

  // Use the new hook to get grades with subject information
  const { data: grades, isLoading: gradesLoading } = useStudentGradesWithSubjects(studentData?.id, selectedSemester);

  // Get semesters for filter
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

  // Group grades by subject for statistics
  const gradesBySubject: Record<string, any[]> = grades?.reduce((acc, grade) => {
    const subjectName = grade.subject?.name || 'Unknown Subject';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(grade);
    return acc;
  }, {}) || {};

  // Calculate statistics
  const overallAverage = grades?.length > 0 
    ? grades.reduce((sum, grade) => sum + (grade.percentage || 0), 0) / grades.length 
    : 0;

  const gpa = (overallAverage / 100) * 4;

  const subjectAverages = Object.entries(gradesBySubject || {}).map(([subject, grades]: [string, any[]]) => {
    const totalPercentage = grades.reduce((sum, g) => sum + (g.percentage || 0), 0);
    const average = totalPercentage / grades.length;
    return {
      subject,
      grades,
      average: Math.round(average * 10) / 10,
      letterGrade: getLetterGrade(average),
      subjectCode: grades[0]?.subject?.code || 'SUBJ001',
      credits: grades[0]?.subject?.credit || 1,
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
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
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectAverages.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : grades && grades.length > 0 ? (
        <div className="space-y-6">
          {/* Subject Performance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Subject</CardTitle>
                <CardDescription>Average score in each subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectAverages.map(({ subject, average, letterGrade, subjectCode, credits }) => (
                    <div key={subject} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {subjectCode} • {credits} credit{credits !== 1 ? 's' : ''} • {gradesBySubject[subject]?.length || 0} assessments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{average}%</div>
                        <Badge variant="outline" className="text-sm">
                          {letterGrade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Your latest graded assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grades.slice(0, 5).map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{grade.assessment?.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {grade.subject?.name || 'Unknown Subject'} • {new Date(grade.assessment?.assessment_date || grade.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{grade.percentage}%</div>
                        <Badge variant={grade.percentage >= 70 ? 'default' : 'secondary'}>
                          {grade.letter_grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Grades Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Grades by Subject</CardTitle>
              <CardDescription>Detailed view of all your graded assessments organized by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
                <div key={subject} className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{subject}</h3>
                    <Badge variant="outline">
                      {subjectGrades.length} assessment{subjectGrades.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
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
                        {subjectGrades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.assessment?.title}
                            </TableCell>
                            <TableCell>
                              {grade.score}/{grade.assessment?.max_score || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{grade.percentage}%</span>
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${grade.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={grade.percentage >= 70 ? 'default' : 'secondary'}>
                                {grade.letter_grade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(grade.assessment?.assessment_date || grade.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Grades Found</h3>
          <p className="text-muted-foreground">
            You don't have any graded assessments yet. Check back once your teachers have published your grades.
          </p>
        </div>
      )}
    </div>
  );
}
