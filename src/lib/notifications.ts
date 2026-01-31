import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GRADE' | 'ASSESSMENT' | 'STUDENT' | 'TEACHER' | 'SYSTEM';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  is_read: boolean;
  is_deleted: boolean;
  priority: number;
  action_url?: string;
  action_text?: string;
  metadata?: any;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  priority?: number;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  expiresHours?: number;
}

/**
 * Create a notification for a user using RPC function
 */
export async function createNotification(data: NotificationData): Promise<string | null> {
  try {
    const { data: result, error } = await supabase.rpc('create_notification', {
      p_user_id: data.userId,
      p_title: data.title,
      p_message: data.message,
      p_type: data.type || 'INFO',
      p_entity_type: data.entityType || null,
      p_entity_id: data.entityId || null,
      p_entity_name: data.entityName || null,
      p_priority: data.priority || 1,
      p_action_url: data.actionUrl || null,
      p_action_text: data.actionText || null,
      p_metadata: data.metadata || null,
      p_expires_hours: data.expiresHours || null
    });

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return result as string;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Get notifications for the current user
 */
export async function getUserNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    // Use direct table query with type casting
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('is_deleted', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return (data || []) as unknown as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false)
      .eq('is_deleted', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read using RPC function
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    });

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for the current user using RPC function
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      return 0;
    }

    return data as number;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
}

/**
 * Delete a notification using RPC function
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('delete_notification', {
      p_notification_id: notificationId
    });

    if (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Notification helper functions for different types of notifications
 */

// Student notifications
export async function notifyStudentGrade(studentId: string, studentName: string, grade: string, subject: string): Promise<void> {
  await createNotification({
    userId: studentId,
    title: 'New Grade Posted',
    message: `You received a grade of ${grade} in ${subject}`,
    type: 'GRADE',
    entityType: 'GRADE',
    entityName: `${subject} - ${grade}`,
    priority: 3,
    actionUrl: '/grades',
    actionText: 'View Grades',
    metadata: { grade, subject }
  });
}

export async function notifyStudentAssessment(studentId: string, studentName: string, assessmentTitle: string, dueDate: string): Promise<void> {
  await createNotification({
    userId: studentId,
    title: 'New Assessment',
    message: `New assessment "${assessmentTitle}" is due on ${dueDate}`,
    type: 'ASSESSMENT',
    entityType: 'ASSESSMENT',
    entityName: assessmentTitle,
    priority: 2,
    actionUrl: '/assessments',
    actionText: 'View Assessment',
    metadata: { assessmentTitle, dueDate }
  });
}

// Teacher notifications
export async function notifyTeacherNewStudent(teacherId: string, studentName: string, className: string): Promise<void> {
  await createNotification({
    userId: teacherId,
    title: 'New Student Added',
    message: `${studentName} has been added to your class ${className}`,
    type: 'STUDENT',
    entityType: 'STUDENT',
    entityName: studentName,
    priority: 2,
    actionUrl: '/students',
    actionText: 'View Students',
    metadata: { studentName, className }
  });
}

export async function notifyTeacherStudentSubmission(teacherId: string, studentName: string, assessmentTitle: string): Promise<void> {
  await createNotification({
    userId: teacherId,
    title: 'Assessment Submitted',
    message: `${studentName} submitted their assessment "${assessmentTitle}"`,
    type: 'ASSESSMENT',
    entityType: 'ASSESSMENT',
    entityName: assessmentTitle,
    priority: 3,
    actionUrl: '/assessments',
    actionText: 'Review Submission',
    metadata: { studentName, assessmentTitle }
  });
}

// Admin notifications
export async function notifyAdminSystemAction(action: string, entity: string, userName: string): Promise<void> {
  // Get all super admin users
  const { data: adminUsers } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');

  if (adminUsers) {
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.user_id,
        title: 'System Action',
        message: `${userName} performed ${action} on ${entity}`,
        type: 'SYSTEM',
        entityType: 'SYSTEM',
        entityName: entity,
        priority: 2,
        actionUrl: '/audit-logs',
        actionText: 'View Audit Logs',
        metadata: { action, entity, userName }
      });
    }
  }
}

export async function notifyAdminError(error: string, context: string): Promise<void> {
  // Get all super admin users
  const { data: adminUsers } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');

  if (adminUsers) {
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.user_id,
        title: 'System Error',
        message: `Error in ${context}: ${error}`,
        type: 'ERROR',
        entityType: 'SYSTEM',
        priority: 5,
        actionUrl: '/admin',
        actionText: 'Admin Panel',
        metadata: { error, context }
      });
    }
  }
}

// General notifications
export async function notifyUser(userId: string, title: string, message: string, type: NotificationType = 'INFO', options?: Partial<NotificationData>): Promise<void> {
  await createNotification({
    userId,
    title,
    message,
    type,
    ...options
  });
}

/**
 * Notify parents when student grades are published
 */
export async function notifyParentsGradePublished(studentId: string, studentName: string, subject: string, letterGrade: string): Promise<void> {
  try {
    // Get parents linked to this student
    const { data: parentLinks } = await supabase
      .from('parent_students')
      .select('parent_id, parents(user_id, first_name, last_name)')
      .eq('student_id', studentId)
      .eq('can_view_grades', true);

    if (parentLinks && parentLinks.length > 0) {
      for (const link of parentLinks) {
        const parent = link.parents as any;
        if (parent?.user_id) {
          await createNotification({
            userId: parent.user_id,
            title: 'New Grade Published',
            message: `${studentName} received a grade of ${letterGrade} in ${subject}`,
            type: 'GRADE',
            entityType: 'GRADE',
            entityName: `${studentName} - ${subject}`,
            priority: 3,
            actionUrl: '/parent-portal',
            actionText: 'View Grades',
            metadata: { studentId, studentName, subject, letterGrade }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error notifying parents:', error);
  }
}
