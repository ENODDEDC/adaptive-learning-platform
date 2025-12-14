import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import Assignment from '@/models/Assignment';
import { Form } from '@/models/Form';
import Submission from '@/models/Submission';
import { verifyToken } from '@/utils/auth';

/**
 * Transform assignment to unified task format
 */
function transformAssignmentToTask(assignment, course, submission) {
  return {
    _id: assignment._id,
    type: 'assignment',
    title: assignment.title,
    description: assignment.description || '',
    courseId: course._id,
    courseName: course.title,
    courseSlug: course._id,
    dueDate: assignment.dueDate,
    createdAt: assignment.createdAt,
    completedAt: submission.submittedAt,
    status: 'submitted',
    assignmentType: assignment.type,
    grade: submission.grade,
    feedback: submission.feedback,
  };
}

/**
 * Transform form to unified task format
 */
function transformFormToTask(form, course, response) {
  return {
    _id: form._id,
    type: 'form',
    title: form.title,
    description: form.description || '',
    courseId: course._id,
    courseName: course.title,
    courseSlug: course._id,
    dueDate: null,
    createdAt: form.createdAt,
    completedAt: response.submittedAt,
    status: 'completed',
    questionCount: form.questions?.length || 0,
  };
}

/**
 * GET /api/students/todo/completed
 * Fetch all completed assignments and forms for the authenticated student
 */
export async function GET(request) {
  try {
    console.log('✅ COMPLETED API: Fetching completed tasks...');
    
    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ COMPLETED API: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const studentId = payload.userId;
    console.log('✅ COMPLETED API: Authenticated student:', studentId);
    
    // Connect to database
    await connectMongoDB();
    
    // Get all courses where student is enrolled
    const enrolledCourses = await Course.find({
      enrolledUsers: studentId,
      isArchived: { $ne: true }
    }).select('_id title');
    
    console.log('📚 COMPLETED API: Found', enrolledCourses.length, 'enrolled courses');
    
    if (enrolledCourses.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        count: 0
      }, { status: 200 });
    }
    
    const courseIds = enrolledCourses.map(course => course._id);
    const courseMap = new Map(enrolledCourses.map(course => [course._id.toString(), course]));
    
    // Fetch submitted assignments
    const submittedSubmissions = await Submission.find({
      studentId,
      status: 'submitted'
    }).populate({
      path: 'assignmentId',
      populate: {
        path: 'attachments'
      }
    });
    
    console.log('📤 COMPLETED API: Found', submittedSubmissions.length, 'submitted assignments');
    
    // Filter submissions for enrolled courses and transform
    const completedAssignments = submittedSubmissions
      .filter(sub => sub.assignmentId && courseIds.some(id => id.toString() === sub.assignmentId.courseId.toString()))
      .map(sub => {
        const course = courseMap.get(sub.assignmentId.courseId.toString());
        return transformAssignmentToTask(sub.assignmentId, course, sub);
      });
    
    // Fetch completed forms
    const forms = await Form.find({
      courseId: { $in: courseIds },
      isActive: true
    });
    
    console.log('📋 COMPLETED API: Found', forms.length, 'forms');
    
    // Filter completed forms
    const completedForms = [];
    forms.forEach(form => {
      const studentResponse = form.responses?.find(
        response => response.studentId?.toString() === studentId && response.isComplete
      );
      if (studentResponse) {
        const course = courseMap.get(form.courseId.toString());
        completedForms.push(transformFormToTask(form, course, studentResponse));
      }
    });
    
    console.log('📋 COMPLETED API: Found', completedForms.length, 'completed forms');
    
    // Combine all completed tasks
    const allCompletedTasks = [...completedAssignments, ...completedForms];
    
    // Sort by completion date (most recent first)
    allCompletedTasks.sort((a, b) => {
      const dateA = new Date(a.completedAt);
      const dateB = new Date(b.completedAt);
      return dateB - dateA;
    });
    
    console.log('✅ COMPLETED API: Returning', allCompletedTasks.length, 'completed tasks');
    
    return NextResponse.json({
      success: true,
      tasks: allCompletedTasks,
      count: allCompletedTasks.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ COMPLETED API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
