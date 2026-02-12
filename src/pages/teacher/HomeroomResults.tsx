import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Home, Download, Search, Trophy, ArrowUpDown, Shield } from 'lucide-react';

interface SubjectResult {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  average: number;
  assessments_count: number;
}

interface StudentResult {
  student_id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  subjects: SubjectResult[];
  total: number;
  average: number;
  rank: number;
}

interface HomeroomClass {
  id: string;
  name: string;
  grade_level: number;
}

export default function HomeroomResults() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [homeroomClasses, setHomeroomClasses] = useState<HomeroomClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [semesters, setSemesters] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'id'>('rank');
  
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    loadHomeroomClasses();
    loadSemesters();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSemester) {
      loadResults();
    }
  }, [selectedClass, selectedSemester]);

  // Additional effect for grade filtering (super admin only)
  useEffect(() => {
    if (isSuperAdmin && selectedGrade) {
      // Filter classes by selected grade
      const filteredClasses = homeroomClasses.filter(c => c.grade_level.toString() === selectedGrade);
      if (filteredClasses.length > 0 && !filteredClasses.some(c => c.id === selectedClass)) {
        setSelectedClass(filteredClasses[0].id);
      }
    }
  }, [selectedGrade, isSuperAdmin, homeroomClasses]);

  const loadHomeroomClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSuperAdmin) {
        // Super admin can see all classes
        const { data: classesData, error } = await supabase
          .from('classes')
          .select('id, name, grade_level')
          .order('grade_level')
          .order('name');

        if (error) {
          console.error('Error loading all classes:', error);
          throw error;
        }
        
        console.log('All classes loaded for super admin:', classesData);
        setHomeroomClasses(classesData || []);
        
        // Get unique grades for filtering
        const uniqueGrades = [...new Set((classesData || []).map(c => c.grade_level))].sort((a, b) => a - b);
        console.log('Available grades:', uniqueGrades);
        
        if (classesData && classesData.length > 0) {
          setSelectedClass(classesData[0].id);
          setSelectedGrade(classesData[0].grade_level.toString());
        }
      } else {
        // Teacher logic - only their homeroom classes
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!teacherData) return;

        // Get classes where this teacher is homeroom teacher
        const { data: classesData, error } = await supabase
          .from('classes')
          .select('id, name, grade_level')
          .eq('homeroom_teacher_id', teacherData.id)
          .order('grade_level')
          .order('name');

        if (error) {
          console.error('Error loading homeroom classes:', error);
          throw error;
        }
        
        console.log('Homeroom classes loaded:', classesData);
        setHomeroomClasses(classesData || []);

        if (classesData && classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('id, name')
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

  const loadResults = async () => {
    try {
      setLoading(true);
      console.log('Loading results for class:', selectedClass, 'semester:', selectedSemester);

      // 1. Get all subjects assigned to this class (from ALL teachers)
      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select(`
          id,
          subject_id,
          subjects(id, name, code)
        `)
        .eq('class_id', selectedClass)
        .eq('is_active', true);

      if (csaError) {
        console.error('CSA Error:', csaError);
        throw csaError;
      }

      console.log('CSA Data loaded:', csaData);

      if (!csaData || csaData.length === 0) {
        console.log('No subject assignments found for this class');
        setSubjects([]);
        setStudentResults([]);
        return;
      }

      const uniqueSubjects = Array.from(
        new Map((csaData || []).map(csa => [csa.subject_id, {
          id: csa.subjects?.id || csa.subject_id,
          name: csa.subjects?.name || 'Unknown',
          code: csa.subjects?.code || 'N/A'
        }])).values()
      );
      setSubjects(uniqueSubjects);

      const csaIds = (csaData || []).map(c => c.id);

      // 2. Get all published assessments for this class (from ALL teachers)
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, class_subject_assignment_id, weight, max_score, title')
        .in('class_subject_assignment_id', csaIds)
        .eq('semester_id', selectedSemester)
        .eq('is_published', true);

      if (assessmentsError) {
        console.error('Assessments Error:', assessmentsError);
        throw assessmentsError;
      }

      console.log('Assessments loaded:', assessmentsData);

      const assessmentIds = (assessmentsData || []).map(a => a.id);

      // 3. Get enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          students(id, student_id_code, first_name, last_name)
        `)
        .eq('class_id', selectedClass)
        .eq('is_active', true);

      if (enrollmentsError) {
        console.error('Enrollments Error:', enrollmentsError);
        throw enrollmentsError;
      }

      console.log('Enrollments loaded:', enrollmentsData);

      if (!enrollmentsData || enrollmentsData.length === 0) {
        console.log('No students enrolled in this class');
        setStudentResults([]);
        return;
      }

      // 4. Get all grades
      let gradesData: any[] = [];
      if (assessmentIds.length > 0) {
        const { data, error } = await supabase
          .from('grades')
          .select('student_id, assessment_id, score, percentage')
          .in('assessment_id', assessmentIds)
          .eq('is_published', true);

        if (error) {
          console.error('Grades Error:', error);
          throw error;
        }
        gradesData = data || [];
      }

      console.log('Grades loaded:', gradesData);

      // 5. Build subject → assessment mapping
      const subjectAssessmentMap = new Map<string, typeof assessmentsData>();
      (csaData || []).forEach(csa => {
        const subjectAssessments = (assessmentsData || []).filter(
          a => a.class_subject_assignment_id === csa.id
        );
        const existing = subjectAssessmentMap.get(csa.subject_id) || [];
        subjectAssessmentMap.set(csa.subject_id, [...existing, ...subjectAssessments]);
      });

      // 6. Build student results
      const results: StudentResult[] = (enrollmentsData || []).map(enrollment => {
        const student = enrollment.students as any;

        const subjectResults: SubjectResult[] = uniqueSubjects.map(subject => {
          const subjectAssessments = subjectAssessmentMap.get(subject.id) || [];
          
          const gradedAssessments = subjectAssessments.map(assessment => {
            const grade = gradesData.find(
              g => g.student_id === student.id && g.assessment_id === assessment.id
            );
            return { ...assessment, grade };
          }).filter(a => a.grade);

          // Calculate weighted average for this subject
          const totalWeight = gradedAssessments.reduce((s, a) => s + a.weight, 0);
          const weightedSum = gradedAssessments.reduce((s, a) => {
            const pct = a.grade.percentage || (a.grade.score / a.max_score * 100);
            return s + (pct * a.weight);
          }, 0);

          const average = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;

          return {
            subject_id: subject.id,
            subject_name: subject.name,
            subject_code: subject.code,
            average,
            assessments_count: gradedAssessments.length
          };
        });

        const subjectsWithGrades = subjectResults.filter(s => s.assessments_count > 0);
        const total = subjectsWithGrades.reduce((s, sub) => s + sub.average, 0);
        const average = subjectsWithGrades.length > 0
          ? Math.round((total / subjectsWithGrades.length) * 10) / 10
          : 0;

        return {
          student_id: student.id,
          student_id_code: student.student_id_code,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: `${student.first_name} ${student.last_name}`,
          subjects: subjectResults,
          total: Math.round(total * 10) / 10,
          average,
          rank: 0
        };
      });

      // 7. Calculate ranks based on average
      results.sort((a, b) => b.average - a.average);
      results.forEach((r, i) => {
        r.rank = i + 1;
      });

      console.log('Final student results:', results);
      setStudentResults(results);
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load results: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    let filtered = studentResults.filter(s =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'name') filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sortBy === 'id') filtered.sort((a, b) => a.student_id_code.localeCompare(b.student_id_code));
    else filtered.sort((a, b) => a.rank - b.rank);

    return filtered;
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Student ID', 'Name', ...subjects.map(s => s.name), 'Total', 'Average'];
    const rows = getFilteredResults().map(student => [
      student.rank,
      student.student_id_code,
      student.full_name,
      ...subjects.map(s => {
        const sub = student.subjects.find(sr => sr.subject_id === s.id);
        return sub?.average || 0;
      }),
      student.total,
      student.average
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeroom_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Results exported');
  };

  if (homeroomClasses.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {isSuperAdmin ? <Shield className="h-8 w-8" /> : <Home className="h-8 w-8" />}
            {isSuperAdmin ? 'All Classes Results' : 'Homeroom Results'}
          </h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              {isSuperAdmin ? <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" /> : <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
              <p className="text-muted-foreground">
                {isSuperAdmin 
                  ? 'No classes found in the system.'
                  : 'You are not assigned as homeroom teacher for any class.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {isSuperAdmin ? <Shield className="h-8 w-8" /> : <Home className="h-8 w-8" />}
          {isSuperAdmin ? 'All Classes Results' : 'Homeroom Results'}
        </h1>
        <p className="text-muted-foreground">
          {isSuperAdmin 
            ? 'View all subjects results, averages, and ranks for any class in the school'
            : 'View all subjects results, sum, average, and rank for your homeroom class'
          }
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{isSuperAdmin ? 'Select Grade, Class & Semester' : 'Select Class & Semester'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(homeroomClasses.map(c => c.grade_level))].sort((a, b) => a - b).map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{isSuperAdmin ? 'Class' : 'Homeroom Class'}</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {homeroomClasses
                    .filter(cls => !isSuperAdmin || !selectedGrade || cls.grade_level.toString() === selectedGrade)
                    .map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Grade {cls.grade_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(sem => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Student Results ({studentResults.length} students, {subjects.length} subjects)
              </CardTitle>
              <CardDescription>All scores are out of 100. Rank is calculated automatically.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: 'rank' | 'name' | 'id') => setSortBy(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">By Rank</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="id">By Student ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : getFilteredResults().length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found. Make sure assessments are published and grades are entered.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 w-16 text-center">Rank</TableHead>
                    <TableHead className="sticky left-16 bg-background z-10 min-w-28">St. ID</TableHead>
                    <TableHead className="sticky left-44 bg-background z-10 min-w-40">Name</TableHead>
                    {subjects.map(subject => (
                      <TableHead key={subject.id} className="text-center min-w-24">
                        <div className="flex flex-col">
                          <span className="font-medium">{subject.name}</span>
                          <span className="text-xs text-muted-foreground">(/100)</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-20 font-bold">Total</TableHead>
                    <TableHead className="text-center min-w-24 font-bold">Average (/100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredResults().map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="sticky left-0 bg-background text-center font-bold">
                        {student.rank <= 3 ? (
                          <Badge variant={student.rank === 1 ? 'default' : 'secondary'}>
                            {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'} {student.rank}
                          </Badge>
                        ) : student.rank}
                      </TableCell>
                      <TableCell className="sticky left-16 bg-background font-mono text-sm">
                        {student.student_id_code}
                      </TableCell>
                      <TableCell className="sticky left-44 bg-background font-medium">
                        {student.full_name}
                      </TableCell>
                      {subjects.map(subject => {
                        const subResult = student.subjects.find(s => s.subject_id === subject.id);
                        const avg = subResult?.average || 0;
                        return (
                          <TableCell key={subject.id} className="text-center">
                            {subResult && subResult.assessments_count > 0 ? (
                              <span className={avg >= 50 ? 'text-foreground' : 'text-destructive font-medium'}>
                                {avg}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold">
                        {student.total}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${student.average >= 50 ? '' : 'text-destructive'}`}>
                          {student.average}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
