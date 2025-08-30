import connectMongoDB from '@/config/mongoConfig';
import Submission from '@/models/Submission';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/services/authService';

export async function PUT(request, { params }) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = params;
    const { grade, feedback } = await request.json();

    if (grade === undefined || grade === null) {
      return NextResponse.json({ message: 'Grade is required for updating submission' }, { status: 400 });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Verify user is creator or co-teacher of the course to grade
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found for this submission' }, { status: 404 });
    }
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found for this assignment' }, { status: 404 });
    }

    const isCreator = course.createdBy.toString() === currentUserId;
    const isCoTeacher = course.coTeachers.some(coTeacherId => coTeacherId.toString() === currentUserId);

    if (!isCreator && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden: Only course creator or co-teacher can grade submissions' }, { status: 403 });
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      { grade, feedback, gradedBy: currentUserId, gradedAt: new Date() },
      { new: true }
    );

    return NextResponse.json({ message: 'Submission graded successfully', submission: updatedSubmission }, { status: 200 });
  } catch (error) {
    console.error('Grade Submission Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = params;

    const submission = await Submission.findById(id)
      .populate('assignmentId', 'title type courseId')
      .populate('studentId', 'name email');

    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Authorization: Student can view their own submission, creator/co-teacher can view any submission for their course
    const assignment = await Assignment.findById(submission.assignmentId._id);
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found for this submission' }, { status: 404 });
    }
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found for this assignment' }, { status: 404 });
    }

    const isCreator = course.createdBy.toString() === currentUserId;
    const isCoTeacher = course.coTeachers.some(coTeacherId => coTeacherId.toString() === currentUserId);
    const isStudent = submission.studentId._id.toString() === currentUserId;

    if (!isCreator && !isCoTeacher && !isStudent) {
      return NextResponse.json({ message: 'Forbidden: Not authorized to view this submission' }, { status: 403 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error('Get Submission by ID Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = params;

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Authorization: Only creator or co-teacher can delete
    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found for this submission' }, { status: 404 });
    }
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found for this assignment' }, { status: 404 });
    }

    const isCreator = course.createdBy.toString() === currentUserId;
    const isCoTeacher = course.coTeachers.some(coTeacherId => coTeacherId.toString() === currentUserId);

    if (!isCreator && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden: Only course creator or co-teacher can delete submissions' }, { status: 403 });
    }

    await Submission.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Submission deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Submission Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
