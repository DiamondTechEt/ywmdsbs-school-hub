import React, { useState } from 'react';
import { TeacherClasses } from '@/components/teacher/TeacherClasses';
import { AssessmentManager } from '@/components/teacher/AssessmentManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, BookOpen, UserCheck, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TeacherStats {
  totalClasses: number;
  homeroomClasses: number;
  subjectClasses: number;
  totalStudents: number;
  upcomingAssessments: number;
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'classes' | 'assessments'>('classes');
  const [stats, setStats] = useState<TeacherStats>({
    totalClasses: 0,
    homeroomClasses: 0,
    subjectClasses: 0,
    totalStudents: 0,
    upcomingAssessments: 0
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadTeacherStats();
  }, []);

  const loadTeacherStats = async () => {
    try {
      setLoading(true);

      // Get current teacher ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      // Get teacher's classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_teachers')
        .select(`
          role,
          classes(id, name),
          subjects(id, name)
        `)
        .eq('teacher_id', teacherData.id)
        .eq('is_active', true);

      if (classesError) throw classesError;

      const classes = classesData || [];
      const homeroomCount = classes.filter(c => c.role === 'homeroom').length;
      const subjectCount = classes.filter(c => c.role === 'subject_teacher').length;

      // Get total students count
      const classIds = classes.map(c => c.classes?.id).filter(Boolean);
      let totalStudents = 0;

      if (classIds.length > 0) {
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds)
          .eq('is_active', true);

        totalStudents = count || 0;
      }

      // Get upcoming assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id')
        .eq('created_by_teacher_id', teacherData.id)
        .gte('assessment_date', new Date().toISOString().split('T')[0])
        .eq('is_published', false);

      if (assessmentsError) throw assessmentsError;

      setStats({
        totalClasses: classes.length,
        homeroomClasses: homeroomCount,
        subjectClasses: subjectCount,
        totalStudents: totalStudents,
        upcomingAssessments: (assessmentsData || []).length
      });

    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your classes, students, and assessments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.homeroomClasses} homeroom, {stats.subjectClasses} subject
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homeroom Classes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.homeroomClasses}</div>
            <p className="text-xs text-muted-foreground">
              Classes you oversee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subject Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subjectClasses}</div>
            <p className="text-xs text-muted-foreground">
              Classes you teach
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all your classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Assessments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Ready to publish
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'classes' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('classes')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          My Classes
        </Button>
        <Button
          variant={activeTab === 'assessments' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('assessments')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Assessments
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'classes' && <TeacherClasses />}
      {activeTab === 'assessments' && <AssessmentManager />}
    </div>
  );
}
