import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Calendar,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Student {
  id: string;
  student_id_code: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  avatar_url: string | null;
  current_class_name: string;
  grade_level: number;
  boarding_status: string;
}

interface Grade {
  id: string;
  subject_name: string;
  assessment_title: string;
  score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  assessment_date: string;
}

interface PerformanceData {
  month: string;
  average: number;
}

export default function ParentPortal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get parent record
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (parentError) {
        // If no parent record exists, show empty state
        setChildren([]);
        setLoading(false);
        return;
      }

      // Get linked children
      const { data: childrenData, error: childrenError } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          relationship,
          can_view_grades,
          students(
            id,
            student_id_code,
            first_name,
            last_name,
            middle_name,
            avatar_url,
            boarding_status,
            current_class_id,
            classes(name, grade_level)
          )
        `)
        .eq('parent_id', parentData.id);

      if (childrenError) throw childrenError;

      const formattedChildren = (childrenData || []).map(item => ({
        id: item.students?.id || '',
        student_id_code: item.students?.student_id_code || '',
        first_name: item.students?.first_name || '',
        last_name: item.students?.last_name || '',
        middle_name: item.students?.middle_name || null,
        avatar_url: item.students?.avatar_url || null,
        current_class_name: item.students?.classes?.name || 'Not Assigned',
        grade_level: item.students?.classes?.grade_level || 0,
        boarding_status: item.students?.boarding_status || 'day'
      }));

      setChildren(formattedChildren);
      if (formattedChildren.length > 0) {
        setSelectedChild(formattedChildren[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      toast.error('Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (studentId: string) => {
    try {
      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          score,
          percentage,
          letter_grade,
          assessments(title, max_score, assessment_date),
          subjects(name)
        `)
        .eq('student_id', studentId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (gradesError) throw gradesError;

      const formattedGrades = (gradesData || []).map(grade => ({
        id: grade.id,
        subject_name: grade.subjects?.name || 'Unknown',
        assessment_title: grade.assessments?.title || 'Unknown',
        score: grade.score,
        max_score: grade.assessments?.max_score || 100,
        percentage: grade.percentage || 0,
        letter_grade: grade.letter_grade || '-',
        assessment_date: grade.assessments?.assessment_date || ''
      }));

      setGrades(formattedGrades);

      // Calculate performance data (monthly averages)
      const monthlyData: Record<string, number[]> = {};
      formattedGrades.forEach(grade => {
        const month = new Date(grade.assessment_date).toLocaleDateString('en', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = [];
        monthlyData[month].push(grade.percentage);
      });

      const performanceData = Object.entries(monthlyData).map(([month, scores]) => ({
        month,
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }));

      setPerformanceData(performanceData);
    } catch (error) {
      console.error('Error loading child data:', error);
    }
  };

  const getOverallAverage = () => {
    if (grades.length === 0) return 0;
    return Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Children Linked</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your account is not linked to any students yet. 
          Please contact the school administration to link your children to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Parent Portal
        </h1>
        <p className="text-muted-foreground">View your children's academic progress</p>
      </div>

      {/* Child Selection */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant={selectedChild?.id === child.id ? 'default' : 'outline'}
                  onClick={() => setSelectedChild(child)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={child.avatar_url || undefined} />
                    <AvatarFallback>{child.first_name[0]}{child.last_name[0]}</AvatarFallback>
                  </Avatar>
                  {child.first_name} {child.last_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <>
          {/* Student Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedChild.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {selectedChild.first_name[0]}{selectedChild.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {selectedChild.first_name} {selectedChild.middle_name || ''} {selectedChild.last_name}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline">{selectedChild.student_id_code}</Badge>
                    <span className="text-muted-foreground">
                      {selectedChild.current_class_name} • Grade {selectedChild.grade_level}
                    </span>
                    <Badge variant={selectedChild.boarding_status === 'boarding' ? 'default' : 'secondary'}>
                      {selectedChild.boarding_status === 'boarding' ? 'Boarding' : 'Day'}
                    </Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getGradeColor(getOverallAverage())}`}>
                    {getOverallAverage()}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Average</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="grades">
            <TabsList>
              <TabsTrigger value="grades">
                <Award className="h-4 w-4 mr-2" />
                Grades
              </TabsTrigger>
              <TabsTrigger value="performance">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Grades</CardTitle>
                  <CardDescription>Latest published assessment results</CardDescription>
                </CardHeader>
                <CardContent>
                  {grades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No published grades available yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{grade.assessment_title}</div>
                              <div className="text-sm text-muted-foreground">
                                {grade.subject_name} • {new Date(grade.assessment_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-xl font-bold ${getGradeColor(grade.percentage)}`}>
                                {grade.score}/{grade.max_score}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {grade.percentage}% • {grade.letter_grade}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Monthly average performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Not enough data to show performance trends.
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
