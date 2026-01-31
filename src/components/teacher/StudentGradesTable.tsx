import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Download, Users, Loader2, ArrowUpDown, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

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
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  semester_id: string;
}

interface StudentGradesTableProps {
  classId: string;
  subjectId: string;
  semesterId?: string;
  onGradeUpdate?: () => void;
  refreshKey?: number; // Add refreshKey prop
}

export function StudentGradesTable({ classId, subjectId, semesterId, onGradeUpdate, refreshKey }: StudentGradesTableProps) {
  const [loading, setLoading] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form states
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  useEffect(() => {
    if (classId && subjectId) {
      loadGradesData();
    }
  }, [classId, subjectId, semesterId, refreshKey]); // Add refreshKey to dependencies

  const loadGradesData = async () => {
    try {
      setLoading(true);
      console.log('Loading grades data for:', { classId, subjectId, semesterId });

      // Get class subject assignment
      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .single();

      console.log('CSA Data:', csaData);

      if (csaError && csaError.code !== 'PGRST116') {
        console.error('CSA Error:', csaError);
        throw csaError;
      }

      if (!csaData) {
        console.log('No CSA data found');
        setStudentGrades([]);
        setAssessments([]);
        return;
      }

      // Get assessments for this class-subject
      let assessmentsQuery = supabase
        .from('assessments')
        .select(`
          id, 
          title, 
          weight, 
          max_score, 
          semester_id,
          class_subject_assignments!inner(
            class_id,
            subject_id
          ),
          semesters!inner(
            academic_year_id
          )
        `)
        .eq('class_subject_assignment_id', csaData.id)
        .eq('is_published', true)
        .order('assessment_date', { ascending: true });

      if (semesterId) {
        assessmentsQuery = assessmentsQuery.eq('semester_id', semesterId);
      }

      const { data: assessmentsData, error: assessmentsError } = await assessmentsQuery;

      console.log('Assessments Data:', assessmentsData);
      console.log('Assessments Error:', assessmentsError);

      if (assessmentsError) {
        console.error('Assessments query error:', assessmentsError);
        throw assessmentsError;
      }

      // Transform assessment data to flatten nested structure
      const transformedAssessments = (assessmentsData || []).map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        weight: assessment.weight,
        max_score: assessment.max_score,
        semester_id: assessment.semester_id,
        class_id: assessment.class_subject_assignments.class_id,
        subject_id: assessment.class_subject_assignments.subject_id,
        academic_year_id: assessment.semesters.academic_year_id
      }));

      console.log('Transformed Assessments:', transformedAssessments);
      setAssessments(transformedAssessments);

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

  // CRUD Functions for Popup Forms
  const openCreateDialog = () => {
    setSelectedStudent('');
    setSelectedAssessment('');
    setSelectedScore('');
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (studentId: string, assessmentId: string, currentScore: number) => {
    const student = studentGrades.find(sg => sg.student_id === studentId);
    const assessment = assessments.find(a => a.id === assessmentId);
    
    setEditingGrade({
      studentId,
      assessmentId,
      studentName: student?.full_name || '',
      assessmentTitle: assessment?.title || '',
      currentScore,
      maxScore: assessment?.max_score || 100
    });
    setSelectedScore(currentScore.toString());
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (studentId: string, assessmentId: string, studentName: string, assessmentTitle: string) => {
    setEditingGrade({
      studentId,
      assessmentId,
      studentName,
      assessmentTitle
    });
    setIsDeleteDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setEditingGrade(null);
    setSelectedStudent('');
    setSelectedAssessment('');
    setSelectedScore('');
  };

  const createGrade = async () => {
    try {
      if (!selectedStudent || !selectedAssessment || !selectedScore) {
        toast.error('Please fill in all fields');
        return;
      }

      const assessment = assessments.find(a => a.id === selectedAssessment);
      if (!assessment) return;

      const score = parseFloat(selectedScore);
      if (isNaN(score) || score < 0 || score > assessment.max_score) {
        toast.error(`Score must be between 0 and ${assessment.max_score}`);
        return;
      }

      const percentage = Math.round((score / assessment.max_score) * 100);
      const letterGrade = calculateLetterGrade(percentage);

      // Get teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) throw new Error('Teacher not found');

      // Check if grade already exists
      const { data: existingGrade } = await supabase
        .from('grades')
        .select('id')
        .eq('student_id', selectedStudent)
        .eq('assessment_id', selectedAssessment)
        .single();

      if (existingGrade) {
        toast.error('Grade already exists for this student and assessment');
        return;
      }

      const { error } = await supabase
        .from('grades')
        .insert({
          student_id: selectedStudent,
          assessment_id: selectedAssessment,
          score,
          percentage,
          letter_grade: letterGrade,
          teacher_id: teacherData.id,
          class_id: assessment.class_id,
          subject_id: assessment.subject_id,
          academic_year_id: assessment.academic_year_id,
          semester_id: assessment.semester_id,
          is_published: true
        });

      if (error) throw error;
      toast.success('Grade created successfully');

      closeAllDialogs();
      loadGradesData();
      onGradeUpdate?.();
    } catch (error) {
      console.error('Error creating grade:', error);
      toast.error('Failed to create grade');
    }
  };

  const updateGrade = async () => {
    try {
      if (!editingGrade || !selectedScore) {
        toast.error('Please provide a score');
        return;
      }

      const assessment = assessments.find(a => a.id === editingGrade.assessmentId);
      if (!assessment) return;

      const score = parseFloat(selectedScore);
      if (isNaN(score) || score < 0 || score > assessment.max_score) {
        toast.error(`Score must be between 0 and ${assessment.max_score}`);
        return;
      }

      const percentage = Math.round((score / assessment.max_score) * 100);
      const letterGrade = calculateLetterGrade(percentage);

      const { error } = await supabase
        .from('grades')
        .update({
          score,
          percentage,
          letter_grade: letterGrade,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', editingGrade.studentId)
        .eq('assessment_id', editingGrade.assessmentId);

      if (error) throw error;
      toast.success('Grade updated successfully');

      closeAllDialogs();
      loadGradesData();
      onGradeUpdate?.();
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade');
    }
  };

  const deleteGrade = async () => {
    try {
      if (!editingGrade) return;

      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('student_id', editingGrade.studentId)
        .eq('assessment_id', editingGrade.assessmentId);

      if (error) throw error;
      toast.success('Grade deleted successfully');

      closeAllDialogs();
      loadGradesData();
      onGradeUpdate?.();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Failed to delete grade');
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const { data: enrollmentsData } = await supabase
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

      const students = (enrollmentsData || []).map(enrollment => enrollment.students);
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  useEffect(() => {
    if (isCreateDialogOpen) {
      loadAvailableStudents();
    }
  }, [isCreateDialogOpen]);

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{assessment.score}/{assessment.max_score}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openEditDialog(student.student_id, assessment.id, assessment.score)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => openDeleteDialog(student.student_id, assessment.id, student.full_name, assessment.title)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Badge 
                                variant={getGradeBadgeVariant(assessment.letter_grade)}
                                className="text-xs"
                              >
                                {assessment.letter_grade || '-'}
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => openEditDialog(student.student_id, assessment.id, 0)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
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
      
      {/* Create Grade Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Grade</DialogTitle>
            <DialogDescription>
              Add a new grade for a student and assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_id_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title} (Max: {assessment.max_score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Score</Label>
              <Input
                type="number"
                value={selectedScore}
                onChange={(e) => setSelectedScore(e.target.value)}
                placeholder="Enter score"
                min="0"
                max={assessments.find(a => a.id === selectedAssessment)?.max_score || 100}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeAllDialogs}>
                Cancel
              </Button>
              <Button onClick={createGrade}>
                Create Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update grade for {editingGrade?.studentName} - {editingGrade?.assessmentTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Score (Max: {editingGrade?.maxScore})</Label>
              <Input
                type="number"
                value={selectedScore}
                onChange={(e) => setSelectedScore(e.target.value)}
                placeholder="Enter score"
                min="0"
                max={editingGrade?.maxScore || 100}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeAllDialogs}>
                Cancel
              </Button>
              <Button onClick={updateGrade}>
                Update Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Grade Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the grade for {editingGrade?.studentName} - {editingGrade?.assessmentTitle}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The grade will be permanently deleted.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeAllDialogs}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteGrade}>
                Delete Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
