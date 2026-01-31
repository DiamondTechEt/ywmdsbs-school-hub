import { supabase } from '@/integrations/supabase/client';

/**
 * Send notifications when grades are published
 */
export async function notifyGradesPublished(assessmentId: string, studentIds?: string[]): Promise<{
  success: boolean;
  message: string;
  notificationCount?: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('notify-grades-published', {
      body: {
        assessment_id: assessmentId,
        student_ids: studentIds
      }
    });

    if (error) {
      console.error('Failed to send grade notifications:', error);
      return {
        success: false,
        message: error.message || 'Failed to send notifications'
      };
    }

    return {
      success: true,
      message: data?.message || 'Notifications sent successfully',
      notificationCount: data?.data?.notifications?.length || 0
    };
  } catch (error) {
    console.error('Error sending grade notifications:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send notification to a single student when their grade is published
 */
export async function notifyStudentGradePublished(
  studentUserId: string,
  studentName: string,
  subjectName: string,
  letterGrade: string,
  score: number,
  maxScore: number
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('create_notification', {
      p_user_id: studentUserId,
      p_title: 'New Grade Published',
      p_message: `You received a grade of ${letterGrade} (${score}/${maxScore}) in ${subjectName}`,
      p_type: 'GRADE',
      p_entity_type: 'GRADE',
      p_entity_name: `${subjectName} - ${letterGrade}`,
      p_priority: 3,
      p_action_url: '/my-grades',
      p_action_text: 'View Grades',
      p_metadata: {
        subject: subjectName,
        grade: letterGrade,
        score,
        max_score: maxScore
      }
    });

    if (error) {
      console.error('Failed to create student notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating student notification:', error);
    return false;
  }
}

/**
 * Send notification to parent when their child's grade is published
 */
export async function notifyParentGradePublished(
  parentUserId: string,
  studentName: string,
  subjectName: string,
  letterGrade: string,
  score: number,
  maxScore: number
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('create_notification', {
      p_user_id: parentUserId,
      p_title: 'Grade Published for Your Child',
      p_message: `${studentName} received a grade of ${letterGrade} (${score}/${maxScore}) in ${subjectName}`,
      p_type: 'GRADE',
      p_entity_type: 'GRADE',
      p_entity_name: `${studentName} - ${subjectName}`,
      p_priority: 3,
      p_action_url: '/parent-portal',
      p_action_text: 'View Portal',
      p_metadata: {
        student_name: studentName,
        subject: subjectName,
        grade: letterGrade,
        score,
        max_score: maxScore
      }
    });

    if (error) {
      console.error('Failed to create parent notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating parent notification:', error);
    return false;
  }
}
