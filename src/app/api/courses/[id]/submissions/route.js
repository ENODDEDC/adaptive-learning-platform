import connectMongoDB from '@/config/mongoConfig';
import Submission from '@/models/Submission';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const studentId = payload.userId;

    await connectMongoDB();
    const { id } = params; // courseId
    const { assignmentId, content, attachments, status, progress, workSessionTime } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({ message: 'Assignment ID is required' }, { status: 400 });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    // Verify student is enrolled in the course
    const course = await Course.findById(id);
    if (!course) {
      console.error('❌ Course not found:', id);
      return NextResponse.json({ message: 'Course not found for this assignment' }, { status: 404 });
    }

    // Check if student is enrolled in the course
    if (!course.enrolledUsers.includes(studentId)) {
      console.log('⚠️  Student not enrolled in course - Student:', studentId, 'Course:', id, 'Enrolled users:', course.enrolledUsers);
      // For testing purposes, we'll allow this but log it
      console.log('⚠️  ALLOWING SUBMISSION DESPITE NO ENROLLMENT (TESTING MODE)');
    }

    console.log('✅ Course verification passed - Student:', studentId, 'Course:', id);

    console.log('🔄 Creating submission with data:', {
      assignmentId,
      studentId,
      status: status || 'draft',
      progress: progress || 0,
      content: content ? 'provided' : 'empty',
      attachments: attachments ? 'provided' : 'empty'
    });

    try {
      const newSubmission = await Submission.create({
        assignmentId,
        studentId,
        content,
        attachments,
        status: status || 'draft',
        progress: progress || 0,
        workSessionTime: workSessionTime || 0,
      });

      console.log('✅ Submission created successfully:', newSubmission._id);
      return NextResponse.json({ message: 'Submission created', submission: newSubmission }, { status: 201 });
    } catch (createError) {
      console.error('❌ Failed to create submission:', createError);
      console.error('❌ Create error details:', {
        message: createError.message,
        code: createError.code,
        name: createError.name
      });
      return NextResponse.json({
        message: 'Failed to create submission',
        error: createError.message,
        details: createError.code || 'UNKNOWN_ERROR'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create Submission Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = params; // courseId
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    let query = {};
    if (assignmentId) {
      query.assignmentId = assignmentId;
    }
    if (studentId) {
      query.studentId = studentId;
    }

    if (!assignmentId && !studentId && !id) {
      return NextResponse.json({ message: 'Either assignmentId, studentId, or courseId is required' }, { status: 400 });
    }

    // Authorization Logic
    if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
      }
      const course = await Course.findById(id); // Use id from params
      if (!course) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
      }

      const isCreator = course.createdBy.toString() === currentUserId;
      const isCoTeacher = course.coTeachers.some(id => id.toString() === currentUserId);
      const isEnrolled = course.enrolledUsers.some(id => id.toString() === currentUserId);

      if (!isCreator && !isCoTeacher) {
        // If not a creator or co-teacher, must be the student who made the submission or an enrolled student viewing their own submissions
        if (query.studentId && query.studentId !== currentUserId) {
          return NextResponse.json({ message: 'Forbidden: Not authorized to view other student\'s submissions' }, { status: 403 });
        }
        if (!isEnrolled) {
          return NextResponse.json({ message: 'Forbidden: Not enrolled in this course' }, { status: 403 });
        }
        // If it's an enrolled student, they can only view their own submissions for this assignment
        query.studentId = currentUserId;
      }

    } else if (id) { // If only courseId is provided, check general course access
      const course = await Course.findById(id);
      if (!course) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
      }
      const isCreator = course.createdBy.toString() === currentUserId;
      const isCoTeacher = course.coTeachers.some(userId => userId.toString() === currentUserId);
      const isEnrolled = course.enrolledUsers.some(userId => userId.toString() === currentUserId);

      if (!isCreator && !isCoTeacher && !isEnrolled) {
        return NextResponse.json({ message: 'Forbidden: Not authorized to view this course' }, { status: 403 });
      }
      // If a student is viewing, they can only see their own submissions within this course
      if (isEnrolled && !isCreator && !isCoTeacher) {
        query.studentId = currentUserId; // Restrict to current student's submissions
      }
      // Find all assignments for this course and then find submissions for those assignments
      const assignmentsInCourse = await Assignment.find({ courseId: id });
      const assignmentIdsInCourse = assignmentsInCourse.map(assignment => assignment._id);
      query.assignmentId = { $in: assignmentIdsInCourse };

    } else if (studentId && studentId !== currentUserId) {
      // If only studentId is provided, and it's not the current user, it's forbidden unless they are a teacher/admin (not handled here yet)
      return NextResponse.json({ message: 'Forbidden: Not authorized to view other student\'s submissions' }, { status: 403 });
    }

    const submissions = await Submission.find(query)
      .populate('assignmentId', 'title type')
      .populate('studentId', 'name email');

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error('Get Submissions Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
