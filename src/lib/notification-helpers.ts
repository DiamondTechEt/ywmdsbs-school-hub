/**
 * Production-ready notification system
 * 
 * This file contains helper functions for creating different types of notifications
 * that can be used throughout the application.
 */

import { createNotification } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * Send a welcome notification to a user
 */
export async function sendWelcomeNotification(userId: string) {
  try {
    await createNotification({
      userId: userId,
      title: 'Welcome to School Hub!',
      message: 'Your account is ready. Explore all the features available to you.',
      type: 'SUCCESS',
      priority: 2,
      actionUrl: '/dashboard',
      actionText: 'Get Started',
      metadata: { welcome: true, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Failed to send welcome notification:', error);
  }
}

/**
 * Notify student about a new grade
 */
export async function notifyStudentGrade(studentId: string, studentName: string, grade: string, subject: string, assessmentName?: string) {
  try {
    await createNotification({
      userId: studentId,
      title: 'New Grade Posted',
      message: `You received a grade of ${grade} in ${subject}${assessmentName ? ` for ${assessmentName}` : ''}`,
      type: 'GRADE',
      entityType: 'GRADE',
      entityName: `${subject} - ${grade}`,
      priority: 3,
      actionUrl: '/grades',
      actionText: 'View Grades',
      metadata: { grade, subject, assessment: assessmentName }
    });
  } catch (error) {
    console.error('Failed to send grade notification:', error);
  }
}

/**
 * Notify student about a new assessment
 */
export async function notifyStudentAssessment(studentId: string, studentName: string, assessmentTitle: string, dueDate: string) {
  try {
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
  } catch (error) {
    console.error('Failed to send assessment notification:', error);
  }
}

/**
 * Notify teacher about a new student
 */
export async function notifyTeacherNewStudent(teacherId: string, studentName: string, className: string) {
  try {
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
  } catch (error) {
    console.error('Failed to send new student notification:', error);
  }
}

/**
 * Notify teacher about a student submission
 */
export async function notifyTeacherStudentSubmission(teacherId: string, studentName: string, assessmentTitle: string) {
  try {
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
  } catch (error) {
    console.error('Failed to send submission notification:', error);
  }
}

/**
 * Send a general notification to any user
 */
export async function notifyUser(userId: string, title: string, message: string, options?: {
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GRADE' | 'ASSESSMENT' | 'STUDENT' | 'TEACHER' | 'SYSTEM';
  priority?: number;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}) {
  try {
    await createNotification({
      userId,
      title,
      message,
      type: options?.type || 'INFO',
      priority: options?.priority || 1,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
      metadata: options?.metadata
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
