import connectMongo from '@/config/mongoConfig';
import Activity from '@/models/Activity';

/**
 * Utility class for logging user activities throughout the application
 */
export class ActivityLogger {
  /**
   * Log a user registration activity
   */
  static async logUserRegistration(userId, userData, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'user_registered',
      targetType: 'user',
      targetId: userId,
      targetName: `${userData.name} ${userData.surname}`,
      description: `New user registered: ${userData.email}`,
      category: 'user',
      type: 'success',
      metadata: { ...metadata, email: userData.email }
    });
  }

  /**
   * Log a user login activity
   */
  static async logUserLogin(userId, userData, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'user_login',
      targetType: 'user',
      targetId: userId,
      targetName: `${userData.name} ${userData.surname}`,
      description: `User logged in: ${userData.email}`,
      category: 'user',
      type: 'info',
      metadata: { ...metadata, email: userData.email }
    });
  }

  /**
   * Log a user logout activity
   */
  static async logUserLogout(userId, userData, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'user_logout',
      targetType: 'user',
      targetId: userId,
      targetName: `${userData.name} ${userData.surname}`,
      description: `User logged out: ${userData.email}`,
      category: 'user',
      type: 'info',
      metadata: { ...metadata, email: userData.email }
    });
  }

  /**
   * Log a course creation activity
   */
  static async logCourseCreated(userId, courseData, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'course_created',
      targetType: 'course',
      targetId: courseData._id,
      targetName: courseData.subject,
      description: `Course created: ${courseData.subject}`,
      category: 'course',
      type: 'success',
      metadata: { ...metadata, section: courseData.section, uniqueKey: courseData.uniqueKey }
    });
  }

  /**
   * Log a course update activity
   */
  static async logCourseUpdated(userId, courseId, courseName, oldData, newData, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'course_updated',
      targetType: 'course',
      targetId: courseId,
      targetName: courseName,
      description: `Course updated: ${courseName}`,
      category: 'course',
      type: 'info',
      metadata: { ...metadata, changes: this.getChanges(oldData, newData) }
    });
  }

  /**
   * Log a course deletion activity
   */
  static async logCourseDeleted(userId, courseId, courseName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'course_deleted',
      targetType: 'course',
      targetId: courseId,
      targetName: courseName,
      description: `Course deleted: ${courseName}`,
      category: 'course',
      type: 'warning',
      metadata
    });
  }

  /**
   * Log a course enrollment activity
   */
  static async logCourseEnrollment(userId, courseId, courseName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'course_enrolled',
      targetType: 'course',
      targetId: courseId,
      targetName: courseName,
      description: `Enrolled in course: ${courseName}`,
      category: 'course',
      type: 'success',
      metadata
    });
  }

  /**
   * Log a course completion activity
   */
  static async logCourseCompleted(userId, courseId, courseName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'course_completed',
      targetType: 'course',
      targetId: courseId,
      targetName: courseName,
      description: `Completed course: ${courseName}`,
      category: 'course',
      type: 'success',
      metadata
    });
  }

  /**
   * Log an assignment submission activity
   */
  static async logAssignmentSubmitted(userId, assignmentId, assignmentName, courseId, courseName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'assignment_submitted',
      targetType: 'assignment',
      targetId: assignmentId,
      targetName: assignmentName,
      description: `Submitted assignment: ${assignmentName}`,
      category: 'assignment',
      type: 'success',
      metadata: { ...metadata, courseId, courseName }
    });
  }

  /**
   * Log an assignment grading activity
   */
  static async logAssignmentGraded(userId, assignmentId, assignmentName, studentId, studentName, grade, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'assignment_graded',
      targetType: 'assignment',
      targetId: assignmentId,
      targetName: assignmentName,
      description: `Graded assignment for ${studentName}: ${grade}`,
      category: 'assignment',
      type: 'info',
      metadata: { ...metadata, studentId, studentName, grade }
    });
  }

  /**
   * Log a form creation activity
   */
  static async logFormCreated(userId, formId, formName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'form_created',
      targetType: 'form',
      targetId: formId,
      targetName: formName,
      description: `Created form: ${formName}`,
      category: 'form',
      type: 'success',
      metadata
    });
  }

  /**
   * Log a form submission activity
   */
  static async logFormSubmitted(userId, formId, formName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'form_submitted',
      targetType: 'form',
      targetId: formId,
      targetName: formName,
      description: `Submitted form: ${formName}`,
      category: 'form',
      type: 'success',
      metadata
    });
  }

  /**
   * Log a profile update activity
   */
  static async logProfileUpdated(userId, userName, changes, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'profile_updated',
      targetType: 'user',
      targetId: userId,
      targetName: userName,
      description: `Updated profile information`,
      category: 'user',
      type: 'info',
      metadata: { ...metadata, changes: this.getChanges({}, changes) }
    });
  }

  /**
   * Log a password change activity
   */
  static async logPasswordChanged(userId, userName, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'password_changed',
      targetType: 'user',
      targetId: userId,
      targetName: userName,
      description: `Changed account password`,
      category: 'user',
      type: 'info',
      metadata
    });
  }

  /**
   * Log an admin action activity
   */
  static async logAdminAction(userId, adminName, actionDescription, targetInfo, metadata = {}) {
    await this.logActivity({
      user: userId,
      action: 'admin_action',
      targetType: targetInfo.type || 'system',
      targetId: targetInfo.id || userId,
      targetName: targetInfo.name || actionDescription,
      description: `Admin action: ${actionDescription}`,
      category: 'admin',
      type: 'info',
      metadata
    });
  }

  /**
   * Generic method to log any activity
   */
  static async logActivity(activityData) {
    try {
      await connectMongo();
      await Activity.logActivity(activityData);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent breaking the main functionality
    }
  }

  /**
   * Helper method to identify changes between old and new data
   */
  static getChanges(oldData, newData) {
    const changes = {};

    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    });

    return changes;
  }

  /**
   * Get client IP address from request headers
   */
  static getClientIP(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  /**
   * Get user agent from request headers
   */
  static getUserAgent(request) {
    return request.headers.get('user-agent') || 'unknown';
  }
}

export default ActivityLogger;