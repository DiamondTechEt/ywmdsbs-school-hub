import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to get student grades with proper subject information
export function useStudentGradesWithSubjects(studentId?: string, semesterId?: string) {
  return useQuery({
    queryKey: ['student-grades-with-subjects', studentId, semesterId],
    queryFn: async () => {
      if (!studentId) return [];

      // Get basic grades data first
      let gradesQuery = supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId);

      if (semesterId && semesterId !== 'all') {
        gradesQuery = gradesQuery.eq('semester_id', semesterId);
      }

      const { data: basicGrades } = await gradesQuery;

      if (!basicGrades || basicGrades.length === 0) {
        return [];
      }

      // Get assessment details with subject information
      const assessmentIds = basicGrades.map(g => g.assessment_id);
      const { data: assessmentDetails } = await supabase
        .from('assessments')
        .select(`
          *,
          class_subject_assignments:class_subject_assignments(
            subjects(id, name, code, credit)
          )
        `)
        .in('id', assessmentIds);

      // Get semester details if needed
      const semesterIds = [...new Set(basicGrades.map(g => g.semester_id).filter(Boolean))];
      let semesterDetails = [];
      if (semesterIds.length > 0) {
        const { data: semesters } = await supabase
          .from('semesters')
          .select('*, academic_year:academic_years(*)')
          .in('id', semesterIds);
        semesterDetails = semesters || [];
      }

      // Combine all the data
      return basicGrades.map(grade => {
        const assessment = assessmentDetails?.find(a => a.id === grade.assessment_id);
        const semester = semesterDetails?.find(s => s.id === grade.semester_id);
        return {
          ...grade,
          assessment,
          subject: assessment?.class_subject_assignments?.subjects,
          semester
        };
      });
    },
    enabled: !!studentId,
  });
}
