import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Edit, Save, Users, Calendar, BookOpen, CheckCircle, AlertCircle, Search, Filter, ArrowUpDown, Loader2, Bell } from 'lucide-react';
import { notifyGradesPublished } from '@/lib/grade-notifications';
import { logGradeAction } from '@/lib/audit-logger';

interface Assessment {
  id: string;
  title: string;
  assessment_type_name: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  class_name: string;
  subject_name: string;
}

interface Student {
  id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface Grade {
  id: string;
  student_id: string;
  score: number;
  percentage: number | null;
  letter_grade: string | null;
  is_published: boolean;
  student?: Student;
}

interface GradesManagerProps {
  assessment: Assessment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GradesManager({ assessment, isOpen, onClose, onSuccess }: GradesManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGrades, setEditingGrades] = useState<Record<string, number>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'graded' | 'ungraded'>('all');

  useEffect(() => {
    if (isOpen && assessment) {
      loadStudents();
      loadGrades();
    }
  }, [isOpen, assessment]);

  const loadStudents = async () => {
    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Get class subject assignment for this assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('class_subject_assignment_id')
        .eq('id', assessment.id)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('class_id, subject_id')
        .eq('id', assessmentData.class_subject_assignment_id)
        .single();

      if (csaError) throw csaError;

      // Get students enrolled in this class
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
        .eq('class_id', csaData.class_id)
        .eq('is_active', true);

      if (enrollmentsError) throw enrollmentsError;

      const students = (enrollmentsData || []).map(enrollment => ({
        ...enrollment.students,
        full_name: `${enrollment.students.first_name} ${enrollment.students.last_name}`
      }));

      setStudents(students);

    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  const loadGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          students(
            id,
            student_id_code,
            first_name,
            last_name
          )
        `)
        .eq('assessment_id', assessment.id);

      if (error) throw error;

      const gradesWithStudents = (data || []).map(grade => ({
        ...grade,
        student: grade.students ? {
          ...grade.students,
          full_name: `${grade.students.first_name} ${grade.students.last_name}`
        } : undefined
      }));

      setGrades(gradesWithStudents);

      // Initialize editing state
      const editingState: Record<string, number> = {};
      gradesWithStudents.forEach(grade => {
        if (grade.student_id) {
          editingState[grade.student_id] = grade.score;
        }
      });
      setEditingGrades(editingState);

    } catch (error) {
      console.error('Error loading grades:', error);
      toast({
        title: "Error",
        description: "Failed to load existing grades",
        variant: "destructive"
      });
    }
  };

  const calculatePercentage = (score: number) => {
    return Math.round((score / assessment.max_score) * 100);
  };

  const calculateLetterGrade = (percentage: number) => {
    return `${Math.round(percentage)}`;
  };

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    let filteredStudents = students.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.student_id_code.toLowerCase().includes(searchLower) ||
        student.full_name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Apply grade filter
      if (gradeFilter === 'graded') {
        return grades.some(grade => grade.student_id === student.id);
      } else if (gradeFilter === 'ungraded') {
        return !grades.some(grade => grade.student_id === student.id);
      }

      return true;
    });

    // Sort students
    filteredStudents.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'id':
          comparison = a.student_id_code.localeCompare(b.student_id_code);
          break;
        case 'grade':
          const aGrade = grades.find(g => g.student_id === a.id)?.score || 0;
          const bGrade = grades.find(g => g.student_id === b.id)?.score || 0;
          comparison = aGrade - bGrade;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredStudents;
  };

  // Get academic year and semester data
  const getAcademicAndSemesterData = async () => {
    try {
      // Get the first available academic year
      const { data: academicYearData } = await supabase
        .from('academic_years')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get the first available semester
      const { data: semesterData } = await supabase
        .from('semesters')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        academic_year_id: academicYearData?.id || null,
        semester_id: semesterData?.id || null
      };
    } catch (error) {
      console.error('Error getting academic/semester data:', error);
      return {
        academic_year_id: null,
        semester_id: null
      };
    }
  };

  // Auto-save individual grade
  const autoSaveGrade = async (studentId: string, score: number) => {
    setSavingStatus(prev => ({ ...prev, [studentId]: 'saving' }));

    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const teacherResult = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherResult.error) throw teacherResult.error;
      const teacherData = teacherResult.data;

      // Get assessment details for grade creation
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('class_subject_assignment_id')
        .eq('id', assessment.id)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('class_id, subject_id')
        .eq('id', assessmentData.class_subject_assignment_id)
        .single();

      if (csaError) throw csaError;

      // Get academic year and semester data
      const { academic_year_id, semester_id } = await getAcademicAndSemesterData();

      const percentage = calculatePercentage(score);
      const letterGrade = calculateLetterGrade(percentage);

      // Check if grade already exists
      const existingGrade = grades.find(g => g.student_id === studentId);

      if (existingGrade) {
        // Update existing grade
        const { error: updateError } = await supabase
          .from('grades')
          .update({
            score,
            percentage,
            letter_grade: letterGrade,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGrade.id);

        if (updateError) throw updateError;
      } else {
        // Create new grade with all required columns
        const gradeData: any = {
          student_id: studentId,
          assessment_id: assessment.id,
          score,
          percentage,
          letter_grade: letterGrade,
          teacher_id: teacherData.id,
          class_id: csaData.class_id,
          subject_id: csaData.subject_id || null,
          academic_year_id: academic_year_id,
          semester_id: semester_id,
          is_published: false
        };

        const { error: insertError } = await supabase
          .from('grades')
          .insert(gradeData);

        if (insertError) throw insertError;
      }

      // Reload grades to get updated data
      await loadGrades();
      
      setSavingStatus(prev => ({ ...prev, [studentId]: 'saved' }));
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [studentId]: undefined }));
      }, 2000);

    } catch (error) {
      console.error('Error auto-saving grade:', error);
      setSavingStatus(prev => ({ ...prev, [studentId]: 'error' }));
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [studentId]: undefined }));
      }, 3000);
    }
  };

  // Handle grade change with auto-save
  const handleGradeChange = (studentId: string, score: number) => {
    setEditingGrades(prev => ({ ...prev, [studentId]: score }));
    
    // Auto-save the grade
    autoSaveGrade(studentId, score);
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    let teacherData: any;

    try {
      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const teacherResult = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherResult.error) throw teacherResult.error;
      teacherData = teacherResult.data;

      // Get assessment details for grade creation
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('class_subject_assignment_id')
        .eq('id', assessment.id)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: csaData, error: csaError } = await supabase
        .from('class_subject_assignments')
        .select('class_id, subject_id')
        .eq('id', assessmentData.class_subject_assignment_id)
        .single();

      if (csaError) throw csaError;

      // Get academic year and semester data
      const { academic_year_id, semester_id } = await getAcademicAndSemesterData();

      // Save or update grades
      for (const [studentId, score] of Object.entries(editingGrades)) {
        const percentage = calculatePercentage(score);
        const letterGrade = calculateLetterGrade(percentage);

        // Check if grade already exists
        const existingGrade = grades.find(g => g.student_id === studentId);

        if (existingGrade) {
          // Update existing grade
          const { error: updateError } = await supabase
            .from('grades')
            .update({
              score,
              percentage,
              letter_grade: letterGrade,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGrade.id);

          if (updateError) throw updateError;
        } else {
          // Create new grade
          const gradeData: any = {
            student_id: studentId,
            assessment_id: assessment.id,
            score,
            percentage,
            letter_grade: letterGrade,
            teacher_id: teacherData.id,
            class_id: csaData.class_id,
            subject_id: csaData.subject_id || null,
            academic_year_id: academic_year_id,
            semester_id: semester_id,
            is_published: false
          };

          const { error: insertError } = await supabase
            .from('grades')
            .insert(gradeData);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Grades saved successfully!"
      });

      await loadGrades();
      onSuccess();

    } catch (error) {
      console.error('Error saving grades:', error);
      console.error('Assessment data:', assessment);
      console.error('Editing grades:', editingGrades);
      console.error('Teacher data:', teacherData);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save grades",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishGrades = async () => {
    if (!confirm('Are you sure you want to publish these grades? Students and parents will be notified.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grades')
        .update({ is_published: true })
        .eq('assessment_id', assessment.id);

      if (error) throw error;

      // Log the publish action
      await logGradeAction('PUBLISH', assessment.id, {
        assessment_title: assessment.title,
        grades_count: grades.length
      });

      // Send notifications to students and parents
      const notificationResult = await notifyGradesPublished(assessment.id);
      
      toast({
        title: "Success",
        description: notificationResult.success 
          ? `Grades published and ${notificationResult.notificationCount || 0} notifications sent!`
          : "Grades published successfully!"
      });

      await loadGrades();

    } catch (error) {
      console.error('Error publishing grades:', error);
      toast({
        title: "Error",
        description: "Failed to publish grades",
        variant: "destructive"
      });
    }
  };

  const getStudentGrade = (studentId: string) => {
    return grades.find(g => g.student_id === studentId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Manage Grades
          </DialogTitle>
          <DialogDescription>
            {assessment.title} - {assessment.class_name} ({assessment.subject_name})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assessment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{assessment.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.assessment_type_name} • Max Score: {assessment.max_score} • Weight: {assessment.weight}%
                  </p>
                </div>
                <Badge variant={assessment.is_published ? "default" : "secondary"}>
                  {assessment.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Grades Table */}
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name, ID, or full name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Sort by:</Label>
                      <Select value={sortBy} onValueChange={(value: 'name' | 'id' | 'grade') => setSortBy(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="id">Student ID</SelectItem>
                          <SelectItem value="grade">Grade</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Filter:</Label>
                      <Select value={gradeFilter} onValueChange={(value: 'all' | 'graded' | 'ungraded') => setGradeFilter(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="graded">Graded</SelectItem>
                          <SelectItem value="ungraded">Ungraded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSortBy('name');
                        setSortOrder('asc');
                        setGradeFilter('all');
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Student Grades 
                {getFilteredAndSortedStudents().length !== students.length && 
                  ` (${getFilteredAndSortedStudents().length} of ${students.length})`
                }
              </h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-save enabled
                </div>
                {!assessment.is_published && grades.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePublishGrades}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Publish Grades
                  </Button>
                )}
              </div>
            </div>

            {getFilteredAndSortedStudents().length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {students.length === 0 
                        ? 'No students enrolled in this class' 
                        : 'No students match your search criteria'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">Student ID</th>
                      <th className="text-center p-3 font-medium">Score</th>
                      <th className="text-center p-3 font-medium">Percentage</th>
                      <th className="text-center p-3 font-medium">Grade</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAndSortedStudents().map((student) => {
                      const grade = getStudentGrade(student.id);
                      const currentScore = editingGrades[student.id] || 0;
                      const percentage = calculatePercentage(currentScore);
                      const letterGrade = calculateLetterGrade(percentage);

                      return (
                        <tr key={student.id} className="border-t">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{student.full_name}</div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {student.student_id_code}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={assessment.max_score}
                                value={currentScore}
                                onChange={(e) => handleGradeChange(student.id, Number(e.target.value))}
                                className="w-24 text-center"
                              />
                              {savingStatus[student.id] === 'saving' && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              )}
                              {savingStatus[student.id] === 'saved' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {savingStatus[student.id] === 'error' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium">{percentage}%</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{letterGrade}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            {grade?.is_published ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Published
                              </Badge>
                            ) : grade ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Edit className="h-3 w-3" />
                                Graded
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Not Graded
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
