import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  User, 
  BookOpen, 
  Calendar, 
  Award, 
  TrendingUp,
  Eye,
  Download,
  Loader2
} from 'lucide-react';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
  role: string;
}

interface Student {
  id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  enrollment_year: number;
  is_active: boolean;
  current_class_id?: string;
  current_class?: {
    name: string;
    grade_level: number;
  };
}

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
  percentage?: number;
  letter_grade?: string;
  score?: number;
}

interface StudentAssessmentDetail {
  assessment: Assessment;
  grade: {
    id: string;
    score: number;
    percentage: number;
    letter_grade: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  } | null;
}

export function StudentAssessmentViewer() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAssessments, setStudentAssessments] = useState<StudentAssessmentDetail[]>([]);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadTeacherClasses = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('class_teachers')
        .select(`
          *,
          classes(id, name, grade_level),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      const classes = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        class_id: assignment.class_id,
        class_name: assignment.classes?.name || 'Unknown Class',
        grade_level: assignment.classes?.grade_level || 0,
        subject_id: assignment.subject_id,
        subject_name: assignment.subjects?.name,
        role: assignment.role
      }));

      setTeacherClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0].class_id);
      }
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          current_class:classes(name, grade_level)
        `)
        .eq('current_class_id', selectedClass)
        .order('last_name');

      if (studentsError) throw studentsError;
      
      const studentsWithClass = (studentsData || []).map(student => ({
        ...student,
        full_name: `${student.first_name} ${student.last_name}`,
        current_class: student.current_class
      }));
      
      setStudents(studentsWithClass);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAssessments = async (student: Student) => {
    try {
      setLoadingAssessments(true);
      setSelectedStudent(student);

      // Get all assessments for this student
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(name),
          class_subject_assignments(
            classes(name),
            subjects(name)
          )
        `)
        .eq('created_by_teacher_id', (await supabase.auth.getUser()).data.user?.id)
        .order('assessment_date');

      if (assessmentsError) throw assessmentsError;

      // Get grades for each assessment
      const assessmentsWithGrades = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const { data: gradeData } = await supabase
            .from('grades')
            .select('*')
            .eq('assessment_id', assessment.id)
            .eq('student_id', student.id)
            .single();

          return {
            assessment: {
              id: assessment.id,
              title: assessment.title,
              assessment_type_name: assessment.assessment_types?.name || 'Unknown',
              max_score: assessment.max_score,
              weight: assessment.weight,
              assessment_date: assessment.assessment_date,
              is_published: assessment.is_published,
              class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown',
              subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown',
              percentage: gradeData?.percentage,
              letter_grade: gradeData?.letter_grade,
              score: gradeData?.score
            },
            grade: gradeData
          };
        })
      );

      setStudentAssessments(assessmentsWithGrades);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading student assessments:', error);
      toast.error('Failed to load student assessments');
    } finally {
      setLoadingAssessments(false);
    }
  };

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
        return students.some(s => s.id === student.id);
      } else if (gradeFilter === 'ungraded') {
        return !students.some(s => s.id === student.id);
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
          // This would need actual grade data - simplified for now
          comparison = a.full_name.localeCompare(b.full_name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredStudents;
  };

  const calculateStudentStats = () => {
    const gradedAssessments = studentAssessments.filter(sa => sa.grade);
    const totalScore = gradedAssessments.reduce((sum, sa) => sum + (sa.grade?.score || 0), 0);
    const maxScore = gradedAssessments.reduce((sum, sa) => sum + sa.assessment.max_score, 0);
    const averagePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      totalAssessments: studentAssessments.length,
      gradedAssessments: gradedAssessments.length,
      averagePercentage,
      averageGrade: averagePercentage >= 90 ? 'A' : averagePercentage >= 80 ? 'B' : averagePercentage >= 70 ? 'C' : averagePercentage >= 60 ? 'D' : 'F'
    };
  };

  const stats = selectedStudent ? calculateStudentStats() : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Student Assessment Viewer
        </h2>
        <p className="text-muted-foreground">
          Search, filter, and view detailed assessment information for your students
        </p>
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Choose a class to view its students</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map(cls => (
                <SelectItem key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} (Grade {cls.grade_level})
                  {cls.subject_name && ` - ${cls.subject_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
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

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Students 
                  {getFilteredAndSortedStudents().length !== students.length && 
                    ` (${getFilteredAndSortedStudents().length} of ${students.length})`
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : getFilteredAndSortedStudents().length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {students.length === 0 
                      ? 'No students enrolled in this class' 
                      : 'No students match your search criteria'
                    }
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAndSortedStudents().map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.gender} • Enrolled: {student.enrollment_year}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.student_id_code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.current_class?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Grade {student.current_class?.grade_level}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.is_active ? 'default' : 'secondary'}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadStudentAssessments(student)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Assessments
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Student Assessment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedStudent?.full_name} - Assessment Details
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.student_id_code} • {selectedStudent?.current_class?.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingAssessments ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Stats */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalAssessments}</div>
                        <div className="text-sm text-muted-foreground">Total Assessments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.gradedAssessments}</div>
                        <div className="text-sm text-muted-foreground">Graded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.averagePercentage}%</div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.averageGrade}</div>
                        <div className="text-sm text-muted-foreground">Average Grade</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessments Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Assessment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentAssessments.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assessments found for this student</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Assessment</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Max Score</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentAssessments.map(({ assessment, grade }) => (
                            <TableRow key={assessment.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {assessment.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {assessment.assessment_type_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assessment.subject_name}
                              </TableCell>
                              <TableCell>
                                {assessment.class_name}
                              </TableCell>
                              <TableCell>
                                {new Date(assessment.assessment_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {assessment.max_score}
                              </TableCell>
                              <TableCell className="font-medium">
                                {grade ? grade.score : '-'}
                              </TableCell>
                              <TableCell>
                                {grade ? `${grade.percentage}%` : '-'}
                              </TableCell>
                              <TableCell>
                                {grade ? (
                                  <Badge variant="outline" className="text-sm">
                                    {grade.letter_grade}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={assessment.is_published ? 'default' : 'secondary'}>
                                  {assessment.is_published ? 'Published' : 'Draft'}
                                </Badge>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
