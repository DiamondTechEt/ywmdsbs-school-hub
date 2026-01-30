import { supabase } from '@/integrations/supabase/client';
import { notifyAdminSystemAction } from './notifications';

export interface AuditLogData {
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'BULK_UPLOAD' | 'BULK_DELETE' | 'BULK_UPDATE' | 'PUBLISH' | 'UNPUBLISH';
  entityType: 'STUDENT' | 'TEACHER' | 'CLASS' | 'SUBJECT' | 'ASSESSMENT' | 'GRADE' | 'ENROLLMENT' | 'USER' | 'SEMESTER' | 'ACADEMIC_YEAR';
  entityId?: string;
  entityName?: string;
  details?: any;
  success?: boolean;
}

/**
 * Get client IP address from various sources
 */
async function getClientIPAddress(): Promise<string> {
  try {
    // Try multiple methods to get the real IP address
    const methods = [
      // Try ipify.org first
      fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip),
      // Try ipapi.co as backup
      fetch('https://ipapi.co/json/').then(res => res.json()).then(data => data.ip),
      // Try icanhazip.com as another backup
      fetch('https://icanhazip.com').then(res => res.text()).then(ip => ip.trim())
    ];

    for (const method of methods) {
      try {
        const ip = await method;
        if (ip && ip !== 'unknown' && ip.trim() !== '') {
          return ip;
        }
      } catch (error) {
        continue; // Try next method
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user agent string
 */
function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : null;
}

/**
 * Log an audit event to the database with readable information
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    // Get additional context
    const [ipAddress, userAgent] = await Promise.all([
      getClientIPAddress(),
      Promise.resolve(getUserAgent())
    ]);

    // Get user information
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile and role information
    let userEmail = user.email;
    let userName = null;
    let userRole = null;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (profileData) {
        userEmail = profileData.email || userEmail;
        userName = profileData.full_name;
      }
    } catch (error) {
      // Profile might not exist, use auth email
    }

    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        userRole = roleData.role;
      }
    } catch (error) {
      // Role might not exist, continue without it
    }

    // Prepare audit log data with proper type handling
    const auditData = {
      user_id: user.id,
      user_email: userEmail,
      user_name: userName,
      role: userRole,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      entity_name: data.entityName || null,
      details: data.details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: data.success !== false
    };

    // Insert audit log directly with readable information
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditData);

    if (error) {
      // Silently handle errors in production
      console.error('Audit logging failed:', error.message);
    } else {
      // Notify admins of important system actions
      if (data.action === 'CREATE' || data.action === 'DELETE' || data.action === 'UPDATE') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            
            const userName = profileData?.full_name || user.email || 'Unknown User';
            await notifyAdminSystemAction(
              data.action,
              `${data.entityType} - ${data.entityName || data.entityId}`,
              userName
            );
          }
        } catch (notificationError) {
          console.error('Failed to send admin notification:', notificationError);
        }
      }
    }
  } catch (error) {
    // Silently handle errors in production
    console.error('Audit logging error:', error.message);
  }
}

/**
 * Log user login event
 */
export async function logLogin(userId: string, success: boolean = true, details?: any): Promise<void> {
  await logAuditEvent({
    action: 'LOGIN',
    entityType: 'USER',
    entityId: userId,
    details,
    success
  });
}

/**
 * Log user logout event
 */
export async function logLogout(userId: string): Promise<void> {
  await logAuditEvent({
    action: 'LOGOUT',
    entityType: 'USER',
    entityId: userId
  });
}

/**
 * Log student creation/update/deletion
 */
export async function logStudentAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  studentId: string,
  studentName?: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action,
    entityType: 'STUDENT',
    entityId: studentId,
    entityName: studentName,
    details
  });
}

/**
 * Log teacher creation/update/deletion
 */
export async function logTeacherAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  teacherId: string,
  teacherName?: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action,
    entityType: 'TEACHER',
    entityId: teacherId,
    entityName: teacherName,
    details
  });
}

/**
 * Log class creation/update/deletion
 */
export async function logClassAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  classId: string,
  className?: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action,
    entityType: 'CLASS',
    entityId: classId,
    entityName: className,
    details
  });
}

/**
 * Log assessment creation/update/deletion/publishing
 */
export async function logAssessmentAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH',
  assessmentId: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action,
    entityType: 'ASSESSMENT',
    entityId: assessmentId,
    details
  });
}

/**
 * Log grade creation/update/deletion/publishing
 */
export async function logGradeAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH',
  gradeId: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action,
    entityType: 'GRADE',
    entityId: gradeId,
    details
  });
}

/**
 * Log bulk operations
 */
export async function logBulkOperation(
  entityType: 'STUDENT' | 'TEACHER' | 'GRADE',
  operation: 'BULK_UPLOAD' | 'BULK_DELETE' | 'BULK_UPDATE',
  details: { count: number; [key: string]: any }
): Promise<void> {
  await logAuditEvent({
    action: operation,
    entityType,
    details
  });
}

/**
 * Log data export operations
 */
export async function logDataExport(
  entityType: string,
  details: { format: string; count?: number; filters?: any }
): Promise<void> {
  await logAuditEvent({
    action: 'EXPORT',
    entityType: entityType as any,
    details
  });
}

/**
 * Log viewing of sensitive data
 */
export async function logDataView(
  entityType: 'STUDENT' | 'TEACHER' | 'GRADE' | 'ASSESSMENT',
  entityId: string,
  details?: any
): Promise<void> {
  await logAuditEvent({
    action: 'VIEW',
    entityType,
    entityId,
    details
  });
}
