import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import Assignment from '@/models/Assignment';
import { Form } from '@/models/Form';
import Submission from '@/models/Submission';
import { verifyToken } from '@/utils/auth';

/**
 * Calculate priority level based on due date
 * @param {Date|null} dueDate - The due date of the task
 * @returns {'overdue'|'dueSoon'|'upcoming'} Priority level
 */
function calculatePriority(dueDate) {
  if (!dueDate) return 'upcoming';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffInMs = due - now;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInDays < 0) return 'overdue';
  if (diffInDays <= 3) return 'dueSoon';
  return 'upcoming';
}

/**
 * Transform assignment to unified task format
 * @param {Object} assignment - Assignment document
 * @param {Object} course - Course document
 * @param {string} status - Submission status
 * @returns {Object} Unified task object
 */
function transformAssignmentToTask(assignment, course, status = 'not_started') {
  const priority = calculatePriority(assignment.dueDate);
  
  return {
    _id: assignment._id,
    type: 'assignment',
    title: assignment.title,
    description: assignment.description || '',
    courseId: course._id,
    courseName: course.title,
    courseSlug: course._id, // Using ID as slug for navigation
    dueDate: assignment.dueDate,
    createdAt: assignment.createdAt,
    priority,
    status,
    assignmentType: assignment.type,
    attachments: assignment.attachments || [],
  };
}

/**
 * Transform form to unified task format
 * @param {Object} form - Form document
 * @param {Object} course - Course document
 * @returns {Object} Unified task object
 */
function transformFormToTask(form, course) {
  const priority = 'upcoming'; // Forms typically don't have due dates
  
  return {
    _id: form._id,
    type: 'form',
    title: form.title,
    description: form.description || '',
    courseId: course._id,
    courseName: course.title,
    courseSlug: course._id, // Using ID as slug for navigation
    dueDate: null,
    createdAt: form.createdAt,
    priority,
    status: 'not_started',
    questionCount: form.questions?.length || 0,
    isActive: form.isActive,
  };
}

/**
 * Sort tasks by priority and due date
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted tasks
 */
function sortTasks(tasks) {
  const priorityOrder = { overdue: 0, dueSoon: 1, upcoming: 2 };
  
  return tasks.sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Items without due dates go last
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    
    // If both have no due date, sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * GET /api/students/todo
 * Fetch all pending assignments and forms for the authenticated student
 */
export async function GET(request) {
  try {
    console.log('📋 TODO API: Fetching student to-do list...');
    
    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ TODO API: Unauthorized - No valid token');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const studentId = payload.userId;
    console.log('✅ TODO API: Authenticated student:', studentId);
    
    // Connect to database
    await connectMongoDB();
    console.log('✅ TODO API: Database connected');
    
    // Get all courses where student is enrolled
    const enrolledCourses = await Course.find({
      enrolledUsers: studentId,
      isArchived: { $ne: true } // Exclude archived courses
    }).select('_id title');
    
    console.log('📚 TODO API: Found', enrolledCourses.length, 'enrolled courses');
    
    if (enrolledCourses.length === 0) {
      console.log('ℹ️ TODO API: Student not enrolled in any courses');
      return NextResponse.json({
        success: true,
        tasks: [],
        counts: {
          overdue: 0,
          dueSoon: 0,
          upcoming: 0,
          total: 0
        }
      }, { status: 200 });
    }
    
    const courseIds = enrolledCourses.map(course => course._id);
    const courseMap = new Map(enrolledCourses.map(course => [course._id.toString(), course]));
    
    // Fetch all assignments from enrolled courses
    console.log('📝 TODO API: Fetching assignments...');
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      type: { $in: ['assignment', 'quiz'] } // Exclude materials and topics
    }).populate('attachments');
    
    console.log('📝 TODO API: Found', assignments.length, 'assignments');
    
    // Fetch all submissions for this student
    console.log('📤 TODO API: Fetching student submissions...');
    const submissions = await Submission.find({
      studentId,
      assignmentId: { $in: assignments.map(a => a._id) }
    });
    
    console.log('📤 TODO API: Found', submissions.length, 'submissions');
    
    // Create a map of assignment submissions
    const submissionMap = new Map(
      submissions.map(sub => [sub.assignmentId.toString(), sub])
    );
    
    // Filter pending assignments (not submitted or in draft)
    const pendingAssignments = assignments.filter(assignment => {
      const submission = submissionMap.get(assignment._id.toString());
      return !submission || submission.status === 'draft';
    });
    
    console.log('📝 TODO API: Found', pendingAssignments.length, 'pending assignments');
    
    // Fetch all active forms from enrolled courses
    console.log('📋 TODO API: Fetching forms...');
    const forms = await Form.find({
      courseId: { $in: courseIds },
      isActive: true
    });
    
    console.log('📋 TODO API: Found', forms.length, 'active forms');
    
    // Filter pending forms (not completed by student)
    const pendingForms = forms.filter(form => {
      const studentResponse = form.responses?.find(
        response => response.studentId?.toString() === studentId
      );
      return !studentResponse || !studentResponse.isComplete;
    });
    
    console.log('📋 TODO API: Found', pendingForms.length, 'pending forms');
    
    // Transform assignments to unified task format
    const assignmentTasks = pendingAssignments.map(assignment => {
      const course = courseMap.get(assignment.courseId.toString());
      const submission = submissionMap.get(assignment._id.toString());
      const status = submission ? 'draft' : 'not_started';
      return transformAssignmentToTask(assignment, course, status);
    });
    
    // Transform forms to unified task format
    const formTasks = pendingForms.map(form => {
      const course = courseMap.get(form.courseId.toString());
      return transformFormToTask(form, course);
    });
    
    // Combine and sort all tasks
    const allTasks = [...assignmentTasks, ...formTasks];
    const sortedTasks = sortTasks(allTasks);
    
    // Calculate counts by priority
    const counts = {
      overdue: sortedTasks.filter(t => t.priority === 'overdue').length,
      dueSoon: sortedTasks.filter(t => t.priority === 'dueSoon').length,
      upcoming: sortedTasks.filter(t => t.priority === 'upcoming').length,
      total: sortedTasks.length
    };
    
    console.log('✅ TODO API: Returning', counts.total, 'tasks');
    console.log('📊 TODO API: Counts:', counts);
    
    return NextResponse.json({
      success: true,
      tasks: sortedTasks,
      counts
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ TODO API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
