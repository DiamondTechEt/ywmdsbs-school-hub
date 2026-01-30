import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  BarChart3,
  Loader2
} from 'lucide-react';
import { GradesManager } from '@/components/teacher/GradesManager';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
}

interface Assessment {
  id: string;
  title: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  assessment_type_name: string;
  class_name: string;
  subject_name: string;
  total_students?: number;
  graded_students?: number;
  average_score?: number;
}

interface GradeSummary {
  assessment_id: string;
  assessment_title: string;
  class_name: string;
  subject_name: string;
  total_students: number;
  graded_students: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  grade_distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export function TeacherGrades() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [gradeSummaries, setGradeSummaries] = useState<GradeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false);

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  useEffect(() => {
    if (teacherClasses.length > 0) {
      loadAssessments();
      loadGradeSummaries();
    }
  }, [teacherClasses]);

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
        subject_name: assignment.subjects?.name
      }));

      setTeacherClasses(classes);
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(name),
          class_subject_assignments(
            class_id,
            classes(id, name),
            subjects(name)
          )
        `)
        .eq('created_by_teacher_id', user.id)
        .eq('is_published', true);

      if (assessmentsError) throw assessmentsError;

      const assessmentsWithStats = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const classId = assessment.class_subject_assignments?.class_id;
          const { count: totalStudents } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId || '')
            .eq('is_active', true);

          const { count: gradedStudents } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          const { data: gradesData } = await supabase
            .from('grades')
            .select('score')
            .eq('assessment_id', assessment.id);

          const averageScore = gradesData && gradesData.length > 0
            ? gradesData.reduce((sum, grade) => sum + grade.score, 0) / gradesData.length
            : 0;

          return {
            id: assessment.id,
            title: assessment.title,
            max_score: assessment.max_score,
            weight: assessment.weight,
            assessment_date: assessment.assessment_date,
            is_published: assessment.is_published,
            assessment_type_name: assessment.assessment_types?.name || 'Unknown',
            class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown',
            subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown',
            total_students: totalStudents || 0,
            graded_students: gradedStudents || 0,
            average_score: Math.round(averageScore * 10) / 10
          };
        })
      );

      setAssessments(assessmentsWithStats);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    }
  };

  const loadGradeSummaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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
        .eq('created_by_teacher_id', user.id)
        .eq('is_published', true);

      if (assessmentsError) throw assessmentsError;

      const summaries = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const { data: gradesData } = await supabase
            .from('grades')
            .select('score, letter_grade')
            .eq('assessment_id', assessment.id);

          const totalStudents = gradesData?.length || 0;
          const scores = gradesData?.map(g => g.score) || [];
          const letterGrades = gradesData?.map(g => g.letter_grade) || [];

          const gradeDistribution = {
            A: letterGrades.filter(g => g === 'A').length,
            B: letterGrades.filter(g => g === 'B').length,
            C: letterGrades.filter(g => g === 'C').length,
            D: letterGrades.filter(g => g === 'D').length,
            F: letterGrades.filter(g => g === 'F').length,
          };

          return {
            assessment_id: assessment.id,
            assessment_title: assessment.title,
            class_name: assessment.class_subject_assignments?.classes?.name || 'Unknown',
            subject_name: assessment.class_subject_assignments?.subjects?.name || 'Unknown',
            total_students: totalStudents,
            graded_students: totalStudents,
            average_score: scores.length > 0 ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0,
            highest_score: scores.length > 0 ? Math.max(...scores) : 0,
            lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
            grade_distribution: gradeDistribution
          };
        })
      );

      setGradeSummaries(summaries);
    } catch (error) {
      console.error('Error loading grade summaries:', error);
      toast.error('Failed to load grade summaries');
    }
  };

  const getFilteredSummaries = () => {
    return gradeSummaries.filter(summary => {
      const matchesSearch = 
        summary.assessment_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.subject_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = filterClass === 'all' || summary.class_name === filterClass;
      const matchesSubject = filterSubject === 'all' || summary.subject_name === filterSubject;

      return matchesSearch && matchesClass && matchesSubject;
    });
  };

  const openGradesDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsGradesDialogOpen(true);
  };

  const exportGrades = async (assessmentId: string) => {
    try {
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          students(student_id_code, first_name, last_name),
          assessments(title, max_score, assessment_date)
        `)
        .eq('assessment_id', assessmentId);

      if (gradesError) throw gradesError;

      // Create CSV content
      const headers = ['Student ID', 'First Name', 'Last Name', 'Score', 'Percentage', 'Letter Grade', 'Assessment', 'Max Score', 'Date'];
      const csvContent = [
        headers.join(','),
        ...(gradesData || []).map(grade => [
          grade.students?.student_id_code || '',
          grade.students?.first_name || '',
          grade.students?.last_name || '',
          grade.score || '',
          grade.percentage || '',
          grade.letter_grade || '',
          grade.assessments?.title || '',
          grade.assessments?.max_score || '',
          grade.assessments?.assessment_date || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grades_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Grades exported successfully');
    } catch (error) {
      console.error('Error exporting grades:', error);
      toast.error('Failed to export grades');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Grades Management
          </h2>
          <p className="text-muted-foreground">
            View and manage student grades across all assessments
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Class:</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {teacherClasses.map(cls => (
                      <SelectItem key={cls.class_id} value={cls.class_name}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm">Subject:</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {Array.from(new Set(teacherClasses.map(cls => cls.subject_name).filter(Boolean))).map(subject => (
                      <SelectItem key={subject} value={subject || ''}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterClass('all');
                  setFilterSubject('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Summaries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Summaries ({getFilteredSummaries().length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : getFilteredSummaries().length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {gradeSummaries.length === 0 
                  ? 'No graded assessments found' 
                  : 'No assessments match your search criteria'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Highest</TableHead>
                    <TableHead>Lowest</TableHead>
                    <TableHead>Grade Distribution</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredSummaries().map((summary) => (
                    <TableRow key={summary.assessment_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {summary.assessment_title}
                      </TableCell>
                      <TableCell>{summary.class_name}</TableCell>
                      <TableCell>{summary.subject_name}</TableCell>
                      <TableCell>{summary.total_students}</TableCell>
                      <TableCell className="font-medium">
                        {summary.average_score}
                      </TableCell>
                      <TableCell>{summary.highest_score}</TableCell>
                      <TableCell>{summary.lowest_score}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {summary.grade_distribution.A > 0 && (
                            <Badge variant="default" className="text-xs">A: {summary.grade_distribution.A}</Badge>
                          )}
                          {summary.grade_distribution.B > 0 && (
                            <Badge variant="secondary" className="text-xs">B: {summary.grade_distribution.B}</Badge>
                          )}
                          {summary.grade_distribution.C > 0 && (
                            <Badge variant="outline" className="text-xs">C: {summary.grade_distribution.C}</Badge>
                          )}
                          {summary.grade_distribution.D > 0 && (
                            <Badge variant="destructive" className="text-xs">D: {summary.grade_distribution.D}</Badge>
                          )}
                          {summary.grade_distribution.F > 0 && (
                            <Badge variant="destructive" className="text-xs">F: {summary.grade_distribution.F}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const assessment = assessments.find(a => a.id === summary.assessment_id);
                              if (assessment) openGradesDialog(assessment);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportGrades(summary.assessment_id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grades Dialog */}
      <Dialog open={isGradesDialogOpen} onOpenChange={setIsGradesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Grades - {selectedAssessment?.title}</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <GradesManager 
              assessment={selectedAssessment}
              isOpen={isGradesDialogOpen}
              onClose={() => setIsGradesDialogOpen(false)}
              onSuccess={() => {
                loadAssessments();
                loadGradeSummaries();
                setIsGradesDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
