import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Download, Users, Loader2, ArrowUpDown } from 'lucide-react';

interface StudentGrade {
  student_id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  assessments: {
    id: string;
    title: string;
    weight: number;
    max_score: number;
    score: number | null;
    percentage: number | null;
    letter_grade: string | null;
  }[];
  total_weighted: number;
  average_percentage: number;
  final_grade: string;
}

interface Assessment {
  id: string;
  title: string;
  weight: number;
  max_score: number;
}

interface StudentGradesTableProps {
  classId: string;
  subjectId: string;
  semesterId?: string;
}

export function StudentGradesTable({ classId, subjectId, semesterId }: StudentGradesTableProps) {
  const [loading, setLoading] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (classId && subjectId) {
      loadGradesData();
    }
  }, [classId, subjectId, semesterId]);

  const loadGradesData = async () => {
    try {
      setLoading(true);

      // Get class subject assignment
      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .single();

      if (csaError && csaError.code !== 'PGRST116') {
        throw csaError;
      }

      if (!csaData) {
        setStudentGrades([]);
        setAssessments([]);
        return;
      }

      // Get assessments for this class-subject
      let assessmentsQuery = supabase
        .from('assessments')
        .select('id, title, weight, max_score')
        .eq('class_subject_assignment_id', csaData.id)
        .eq('is_published', true)
        .order('assessment_date', { ascending: true });

      if (semesterId) {
        assessmentsQuery = assessmentsQuery.eq('semester_id', semesterId);
      }

      const { data: assessmentsData, error: assessmentsError } = await assessmentsQuery;

      if (assessmentsError) throw assessmentsError;

      setAssessments(assessmentsData || []);

      // Get enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          students(
            id,
            student_id_code,
            first_name,
            last_name
          )
        `)
        .eq('class_id', classId)
        .eq('is_active', true);

      if (enrollmentsError) throw enrollmentsError;

      // Get all grades for these assessments
      const assessmentIds = (assessmentsData || []).map(a => a.id);
      
      let gradesData: any[] = [];
      if (assessmentIds.length > 0) {
        const { data, error: gradesError } = await supabase
          .from('grades')
          .select('student_id, assessment_id, score, percentage, letter_grade')
          .in('assessment_id', assessmentIds);

        if (gradesError) throw gradesError;
        gradesData = data || [];
      }

      // Build student grades table
      const students = (enrollmentsData || []).map(enrollment => {
        const student = enrollment.students as any;
        
        const studentAssessments = (assessmentsData || []).map(assessment => {
          const grade = gradesData.find(
            g => g.student_id === student.id && g.assessment_id === assessment.id
          );

          return {
            id: assessment.id,
            title: assessment.title,
            weight: assessment.weight,
            max_score: assessment.max_score,
            score: grade?.score || null,
            percentage: grade?.percentage || null,
            letter_grade: grade?.letter_grade || null
          };
        });

        // Calculate weighted average
        const gradedAssessments = studentAssessments.filter(a => a.score !== null);
        const totalWeight = gradedAssessments.reduce((sum, a) => sum + a.weight, 0);
        const weightedSum = gradedAssessments.reduce((sum, a) => {
          const percentage = a.percentage || (a.score! / a.max_score * 100);
          return sum + (percentage * a.weight);
        }, 0);
        
        const averagePercentage = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Calculate final letter grade
        const finalGrade = calculateLetterGrade(averagePercentage);

        return {
          student_id: student.id,
          student_id_code: student.student_id_code,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: `${student.first_name} ${student.last_name}`,
          assessments: studentAssessments,
          total_weighted: totalWeight,
          average_percentage: Math.round(averagePercentage * 10) / 10,
          final_grade: finalGrade
        };
      });

      setStudentGrades(students);
    } catch (error) {
      console.error('Error loading grades data:', error);
      toast.error('Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getFilteredAndSortedStudents = () => {
    let filtered = studentGrades.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      return (
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.student_id_code.toLowerCase().includes(searchLower) ||
        student.full_name.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'id':
          comparison = a.student_id_code.localeCompare(b.student_id_code);
          break;
        case 'grade':
          comparison = b.average_percentage - a.average_percentage;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', ...assessments.map(a => `${a.title} (${a.weight}%)`), 'Average', 'Final Grade'];
    
    const rows = getFilteredAndSortedStudents().map(student => {
      const scores = student.assessments.map(a => a.score !== null ? `${a.score}/${a.max_score}` : '-');
      return [
        student.student_id_code,
        student.full_name,
        ...scores,
        `${student.average_percentage}%`,
        student.final_grade
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Grades exported successfully');
  };

  const getGradeBadgeVariant = (grade: string | null) => {
    if (!grade) return 'secondary';
    switch (grade) {
      case 'A': return 'default';
      case 'B': return 'secondary';
      case 'C': return 'outline';
      case 'D':
      case 'F': return 'destructive';
      default: return 'outline';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Grades ({studentGrades.length} students)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'name' | 'id' | 'grade') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="id">Student ID</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Grades Table */}
          {getFilteredAndSortedStudents().length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {studentGrades.length === 0 
                  ? 'No students enrolled or no assessments found' 
                  : 'No students match your search criteria'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-32">Student ID</TableHead>
                    <TableHead className="sticky left-32 bg-background z-10 min-w-48">Name</TableHead>
                    {assessments.map(assessment => (
                      <TableHead key={assessment.id} className="text-center min-w-28">
                        <div className="flex flex-col">
                          <span className="font-medium">{assessment.title}</span>
                          <span className="text-xs text-muted-foreground">
                            ({assessment.weight}% • Max: {assessment.max_score})
                          </span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-24">Average</TableHead>
                    <TableHead className="text-center min-w-24">Final Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedStudents().map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="sticky left-0 bg-background font-mono text-sm">
                        {student.student_id_code}
                      </TableCell>
                      <TableCell className="sticky left-32 bg-background font-medium">
                        {student.full_name}
                      </TableCell>
                      {student.assessments.map((assessment) => (
                        <TableCell key={assessment.id} className="text-center">
                          {assessment.score !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{assessment.score}/{assessment.max_score}</span>
                              <Badge 
                                variant={getGradeBadgeVariant(assessment.letter_grade)}
                                className="text-xs mt-1"
                              >
                                {assessment.letter_grade || '-'}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className="font-bold">{student.average_percentage}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getGradeBadgeVariant(student.final_grade)} className="text-lg px-3 py-1">
                          {student.final_grade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
