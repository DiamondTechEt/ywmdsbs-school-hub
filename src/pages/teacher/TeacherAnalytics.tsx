import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Award,
  BarChart3,
  Calendar,
  Target,
  Activity,
  Loader2
} from 'lucide-react';

interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  subject_id?: string;
  subject_name?: string;
}

interface AnalyticsData {
  totalAssessments: number;
  totalStudents: number;
  totalGrades: number;
  averageScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  classPerformance: {
    class_name: string;
    total_students: number;
    average_score: number;
    assessments_count: number;
  }[];
  subjectPerformance: {
    subject_name: string;
    total_assessments: number;
    total_students: number;
    average_score: number;
  }[];
  recentActivity: {
    date: string;
    assessments_created: number;
    grades_recorded: number;
  }[];
  topPerformers: {
    student_name: string;
    student_id: string;
    average_score: number;
    total_assessments: number;
  }[];
  strugglingStudents: {
    student_name: string;
    student_id: string;
    average_score: number;
    total_assessments: number;
  }[];
}

export function TeacherAnalytics() {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  useEffect(() => {
    if (teacherClasses.length > 0) {
      loadAnalyticsData();
    }
  }, [teacherClasses, selectedClass, selectedSubject, timeRange]);

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

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range based on timeRange
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get assessments
      let assessmentsQuery = supabase
        .from('assessments')
        .select(`
          *,
          assessment_types(name),
          class_subject_assignments(
            classes(name, id),
            subjects(name)
          )
        `)
        .eq('created_by_teacher_id', user.id)
        .eq('is_published', true)
        .gte('created_at', startDate.toISOString());

      const { data: assessmentsData, error: assessmentsError } = await assessmentsQuery;
      if (assessmentsError) throw assessmentsError;

      // Get grades
      let gradesQuery = supabase
        .from('grades')
        .select(`
          *,
          assessments(
            id,
            title,
            class_subject_assignments(
              classes(name, id),
              subjects(name)
            )
          ),
          students(
            id,
            student_id_code,
            first_name,
            last_name
          )
        `)
        .gte('created_at', startDate.toISOString());

      const { data: gradesData, error: gradesError } = await gradesQuery;
      if (gradesError) throw gradesError;

      // Filter by class and subject if selected
      const filteredAssessments = assessmentsData?.filter(assessment => {
        const matchesClass = selectedClass === 'all' || 
          assessment.class_subject_assignments?.classes?.name === selectedClass;
        const matchesSubject = selectedSubject === 'all' || 
          assessment.class_subject_assignments?.subjects?.name === selectedSubject;
        return matchesClass && matchesSubject;
      }) || [];

      const filteredGrades = gradesData?.filter(grade => {
        const matchesClass = selectedClass === 'all' || 
          grade.assessments?.class_subject_assignments?.classes?.name === selectedClass;
        const matchesSubject = selectedSubject === 'all' || 
          grade.assessments?.class_subject_assignments?.subjects?.name === selectedSubject;
        return matchesClass && matchesSubject;
      }) || [];

      // Calculate analytics
      const totalAssessments = filteredAssessments.length;
      const totalGrades = filteredGrades.length;
      const uniqueStudents = new Set(filteredGrades.map(g => g.students?.id)).size;
      
      const scores = filteredGrades.map(g => g.score).filter(Boolean);
      const averageScore = scores.length > 0 
        ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
        : 0;

      const letterGrades = filteredGrades.map(g => g.letter_grade).filter(Boolean);
      const gradeDistribution = {
        A: letterGrades.filter(g => g === 'A').length,
        B: letterGrades.filter(g => g === 'B').length,
        C: letterGrades.filter(g => g === 'C').length,
        D: letterGrades.filter(g => g === 'D').length,
        F: letterGrades.filter(g => g === 'F').length,
      };

      // Class performance
      const classPerformanceMap = new Map();
      filteredGrades.forEach(grade => {
        const className = grade.assessments?.class_subject_assignments?.classes?.name || 'Unknown';
        if (!classPerformanceMap.has(className)) {
          classPerformanceMap.set(className, {
            class_name: className,
            total_students: new Set(),
            scores: [],
            assessments: new Set()
          });
        }
        const classData = classPerformanceMap.get(className);
        if (grade.students?.id) {
          classData.total_students.add(grade.students.id);
        }
        if (grade.score) {
          classData.scores.push(grade.score);
        }
        if (grade.assessments?.id) {
          classData.assessments.add(grade.assessments.id);
        }
      });

      const classPerformance = Array.from(classPerformanceMap.values()).map(classData => ({
        class_name: classData.class_name,
        total_students: classData.total_students.size,
        average_score: classData.scores.length > 0 
          ? Math.round((classData.scores.reduce((sum, score) => sum + score, 0) / classData.scores.length) * 10) / 10
          : 0,
        assessments_count: classData.assessments.size
      }));

      // Subject performance
      const subjectPerformanceMap = new Map();
      filteredGrades.forEach(grade => {
        const subjectName = grade.assessments?.class_subject_assignments?.subjects?.name || 'Unknown';
        if (!subjectPerformanceMap.has(subjectName)) {
          subjectPerformanceMap.set(subjectName, {
            subject_name: subjectName,
            total_assessments: new Set(),
            total_students: new Set(),
            scores: []
          });
        }
        const subjectData = subjectPerformanceMap.get(subjectName);
        if (grade.students?.id) {
          subjectData.total_students.add(grade.students.id);
        }
        if (grade.score) {
          subjectData.scores.push(grade.score);
        }
        if (grade.assessments?.id) {
          subjectData.total_assessments.add(grade.assessments.id);
        }
      });

      const subjectPerformance = Array.from(subjectPerformanceMap.values()).map(subjectData => ({
        subject_name: subjectData.subject_name,
        total_assessments: subjectData.total_assessments.size,
        total_students: subjectData.total_students.size,
        average_score: subjectData.scores.length > 0 
          ? Math.round((subjectData.scores.reduce((sum, score) => sum + score, 0) / subjectData.scores.length) * 10) / 10
          : 0
      }));

      // Student performance
      const studentPerformanceMap = new Map();
      filteredGrades.forEach(grade => {
        if (!grade.students?.id) return;
        
        if (!studentPerformanceMap.has(grade.students.id)) {
          studentPerformanceMap.set(grade.students.id, {
            student_name: `${grade.students?.first_name} ${grade.students?.last_name}`,
            student_id: grade.students.student_id_code,
            scores: [],
            assessments: new Set()
          });
        }
        const studentData = studentPerformanceMap.get(grade.students.id);
        if (grade.score) {
          studentData.scores.push(grade.score);
        }
        if (grade.assessments?.id) {
          studentData.assessments.add(grade.assessments.id);
        }
      });

      const studentPerformance = Array.from(studentPerformanceMap.values())
        .map(studentData => ({
          student_name: studentData.student_name,
          student_id: studentData.student_id,
          average_score: studentData.scores.length > 0 
            ? Math.round((studentData.scores.reduce((sum, score) => sum + score, 0) / studentData.scores.length) * 10) / 10
            : 0,
          total_assessments: studentData.assessments.size
        }))
        .filter(student => student.total_assessments >= 3); // Only include students with 3+ assessments

      const topPerformers = studentPerformance
        .sort((a, b) => b.average_score - a.average_score)
        .slice(0, 5);

      const strugglingStudents = studentPerformance
        .sort((a, b) => a.average_score - b.average_score)
        .slice(0, 5);

      // Recent activity (simplified)
      const recentActivity = [
        {
          date: new Date().toISOString().split('T')[0],
          assessments_created: totalAssessments,
          grades_recorded: totalGrades
        }
      ];

      setAnalyticsData({
        totalAssessments,
        totalStudents: uniqueStudents,
        totalGrades,
        averageScore,
        gradeDistribution,
        classPerformance,
        subjectPerformance,
        recentActivity,
        topPerformers,
        strugglingStudents
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getGradePercentage = (count: number) => {
    if (!analyticsData || analyticsData.totalGrades === 0) return 0;
    return Math.round((count / analyticsData.totalGrades) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track your teaching performance and student progress
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Class:</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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

            <div className="flex items-center gap-2">
              <Label className="text-sm">Time Range:</Label>
              <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalAssessments}</div>
                <p className="text-xs text-muted-foreground">
                  Created in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Unique students graded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalGrades}</div>
                <p className="text-xs text-muted-foreground">
                  Grades recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.averageScore}</div>
                <p className="text-xs text-muted-foreground">
                  Across all assessments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(analyticsData.gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">Grade {grade}</div>
                    <div className="text-xs text-muted-foreground">
                      {getGradePercentage(count)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          grade === 'A' ? 'bg-green-500' :
                          grade === 'B' ? 'bg-blue-500' :
                          grade === 'C' ? 'bg-yellow-500' :
                          grade === 'D' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${getGradePercentage(count)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Class Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.classPerformance.map((classPerf) => (
                    <div key={classPerf.class_name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{classPerf.class_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {classPerf.total_students} students • {classPerf.assessments_count} assessments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{classPerf.average_score}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.subjectPerformance.map((subjectPerf) => (
                    <div key={subjectPerf.subject_name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{subjectPerf.subject_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {subjectPerf.total_students} students • {subjectPerf.total_assessments} assessments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{subjectPerf.average_score}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPerformers.map((student, index) => (
                    <div key={student.student_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-800">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{student.student_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.student_id} • {student.total_assessments} assessments
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{student.average_score}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Struggling Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Students Needing Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.strugglingStudents.map((student, index) => (
                    <div key={student.student_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-medium text-red-800">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{student.student_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.student_id} • {student.total_assessments} assessments
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{student.average_score}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
