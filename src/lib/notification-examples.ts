import { notifyStudentGrade, notifyTeacherNewStudent, notifyAdminSystemAction } from '@/lib/notifications';

/**
 * Test function to demonstrate the notification system
 * This can be called from any component to test notifications
 */
export async function testNotificationSystem() {
  try {
    // Test student grade notification
    await notifyStudentGrade(
      'test-student-id',
      'John Doe',
      'A',
      'Mathematics'
    );

    // Test teacher new student notification
    await notifyTeacherNewStudent(
      'test-teacher-id',
      'Jane Smith',
      'Grade 10A'
    );

    // Test admin system action notification
    await notifyAdminSystemAction(
      'CREATE',
      'STUDENT - John Doe',
      'Admin User'
    );

    console.log('Test notifications sent successfully');
  } catch (error) {
    console.error('Failed to send test notifications:', error);
  }
}

/**
 * Example function to notify when a grade is posted
 */
export async function notifyGradePosted(studentId: string, studentName: string, grade: string, subject: string, assessmentName?: string) {
  await notifyStudentGrade(studentId, studentName, grade, subject);
  
  // If it's an assessment grade, also notify the teacher
  if (assessmentName) {
    // You would typically get the teacher ID from the assessment
    // This is just a demonstration
    console.log(`Grade posted for ${studentName} in ${assessmentName}`);
  }
}

/**
 * Example function to notify when a new student is enrolled
 */
export async function notifyStudentEnrolled(studentId: string, studentName: string, className: string, teacherId: string) {
  await notifyTeacherNewStudent(teacherId, studentName, className);
  
  // Also send a welcome notification to the student
  await notifyUser(
    studentId,
    'Welcome to School!',
    `You have been enrolled in ${className}. We're excited to have you join us!`,
    'SUCCESS',
    {
      actionUrl: '/dashboard',
      actionText: 'View Dashboard',
      metadata: { className, enrollmentDate: new Date().toISOString() }
    }
  );
}

// Helper function for general user notifications
async function notifyUser(userId: string, title: string, message: string, type: any, options?: any) {
  // This would use the createNotification function from the notifications library
  // For now, just log it
  console.log(`Notification for ${userId}: ${title} - ${message}`);
}
