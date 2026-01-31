import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GradePublishedRequest {
  assessment_id: string;
  student_ids?: string[];
}

interface StudentWithGrade {
  student_id: string;
  student_name: string;
  student_email: string | null;
  parent_emails: string[];
  subject_name: string;
  letter_grade: string;
  score: number;
  max_score: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { assessment_id, student_ids }: GradePublishedRequest = await req.json();

    if (!assessment_id) {
      throw new Error('Assessment ID is required');
    }

    // Get assessment details with subject and class info
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        max_score,
        class_subject_assignments(
          subjects(name),
          classes(name)
        )
      `)
      .eq('id', assessment_id)
      .single();

    if (assessmentError || !assessmentData) {
      throw new Error('Assessment not found');
    }

    const subjectName = assessmentData.class_subject_assignments?.subjects?.name || 'Unknown Subject';
    const className = assessmentData.class_subject_assignments?.classes?.name || 'Unknown Class';

    // Get grades for this assessment
    let gradesQuery = supabase
      .from('grades')
      .select(`
        student_id,
        score,
        letter_grade,
        students(
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('assessment_id', assessment_id)
      .eq('is_published', true);

    if (student_ids && student_ids.length > 0) {
      gradesQuery = gradesQuery.in('student_id', student_ids);
    }

    const { data: gradesData, error: gradesError } = await gradesQuery;

    if (gradesError) {
      throw new Error(`Failed to fetch grades: ${gradesError.message}`);
    }

    const notifications: StudentWithGrade[] = [];

    for (const grade of gradesData || []) {
      const student = grade.students as any;
      if (!student) continue;

      // Get student email from profiles
      let studentEmail: string | null = null;
      if (student.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', student.user_id)
          .single();
        
        studentEmail = profileData?.email || null;
      }

      // Get parent emails
      const parentEmails: string[] = [];
      const { data: parentLinks } = await supabase
        .from('parent_students')
        .select(`
          parents(
            user_id,
            email
          )
        `)
        .eq('student_id', student.id)
        .eq('can_view_grades', true);

      if (parentLinks) {
        for (const link of parentLinks) {
          const parent = link.parents as any;
          if (parent?.email) {
            parentEmails.push(parent.email);
          } else if (parent?.user_id) {
            // Try to get email from profiles
            const { data: parentProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', parent.user_id)
              .single();
            
            if (parentProfile?.email) {
              parentEmails.push(parentProfile.email);
            }
          }
        }
      }

      // Create in-app notification for student
      if (student.user_id) {
        await supabase.rpc('create_notification', {
          p_user_id: student.user_id,
          p_title: 'New Grade Published',
          p_message: `You received a grade of ${grade.letter_grade} (${grade.score}/${assessmentData.max_score}) in ${subjectName} for ${assessmentData.title}`,
          p_type: 'GRADE',
          p_entity_type: 'GRADE',
          p_entity_name: `${subjectName} - ${assessmentData.title}`,
          p_priority: 3,
          p_action_url: '/my-grades',
          p_action_text: 'View Grades',
          p_metadata: {
            assessment_id,
            subject: subjectName,
            grade: grade.letter_grade,
            score: grade.score,
            max_score: assessmentData.max_score
          }
        });
      }

      // Notify parents via in-app notifications
      for (const parentLink of parentLinks || []) {
        const parent = parentLink.parents as any;
        if (parent?.user_id) {
          await supabase.rpc('create_notification', {
            p_user_id: parent.user_id,
            p_title: 'Grade Published for Your Child',
            p_message: `${student.first_name} ${student.last_name} received a grade of ${grade.letter_grade} (${grade.score}/${assessmentData.max_score}) in ${subjectName}`,
            p_type: 'GRADE',
            p_entity_type: 'GRADE',
            p_entity_name: `${student.first_name} - ${subjectName}`,
            p_priority: 3,
            p_action_url: '/parent-portal',
            p_action_text: 'View Portal',
            p_metadata: {
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              subject: subjectName,
              grade: grade.letter_grade,
              score: grade.score,
              max_score: assessmentData.max_score
            }
          });
        }
      }

      notifications.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        student_email: studentEmail,
        parent_emails: parentEmails,
        subject_name: subjectName,
        letter_grade: grade.letter_grade || 'N/A',
        score: grade.score,
        max_score: assessmentData.max_score
      });
    }

    // Log the notification activity
    console.log(`Grade notifications sent for assessment ${assessment_id}:`, {
      assessment_title: assessmentData.title,
      subject: subjectName,
      class: className,
      notifications_sent: notifications.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent for ${notifications.length} students`,
        data: {
          assessment_id,
          assessment_title: assessmentData.title,
          subject: subjectName,
          class: className,
          notifications
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-grades-published function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
