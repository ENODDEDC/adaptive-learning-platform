import connectMongoDB from '@/config/mongoConfig';
import Submission from '@/models/Submission';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = await params;
    const { grade, feedback, status, progress, workSessionTime, content, attachments } = await request.json();

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Check if user is the student who owns this submission
    const isStudent = submission.studentId.toString() === currentUserId;

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

    // If updating grade/feedback, must be creator or co-teacher
    if (grade !== undefined || feedback !== undefined) {
      if (!isCreator && !isCoTeacher) {
        return NextResponse.json({ message: 'Forbidden: Only course creator or co-teacher can grade submissions' }, { status: 403 });
      }
    }

    // If updating status/progress/workSessionTime, must be the student who owns the submission
    if ((status !== undefined || progress !== undefined || workSessionTime !== undefined || content !== undefined || attachments !== undefined) && !isStudent) {
      return NextResponse.json({ message: 'Forbidden: Students can only update their own submissions' }, { status: 403 });
    }

    // Prepare update object
    const updateData = {};
    if (grade !== undefined) updateData.grade = grade;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (workSessionTime !== undefined) updateData.workSessionTime = workSessionTime;
    if (content !== undefined) updateData.content = content;
    if (attachments !== undefined) updateData.attachments = attachments;

    // Add grading metadata if grading
    if (grade !== undefined) {
      updateData.gradedBy = currentUserId;
      updateData.gradedAt = new Date();
    }

    console.log('🔄 Updating submission:', id, 'with data:', updateData);

    try {
      const updatedSubmission = await Submission.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedSubmission) {
        console.error('❌ Submission not found after update:', id);
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
      }

      console.log('✅ Submission updated successfully:', updatedSubmission._id, 'new status:', updatedSubmission.status);
      return NextResponse.json({ message: 'Submission updated successfully', submission: updatedSubmission }, { status: 200 });
    } catch (updateError) {
      console.error('❌ Failed to update submission:', updateError);
      console.error('❌ Update error details:', {
        message: updateError.message,
        code: updateError.code,
        name: updateError.name
      });
      return NextResponse.json({
        message: 'Failed to update submission',
        error: updateError.message,
        details: updateError.code || 'UNKNOWN_ERROR'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Update Submission Error:', error);
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
    const { id } = await params;

    const submission = await Submission.findById(id)
      .populate('assignmentId', 'title type courseId description')
      .populate('studentId', 'name email profilePicture')
      .populate('attachments')
      .populate('gradedBy', 'name email');

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

    // Add course info to the response for instructor check on frontend
    const submissionWithCourse = {
      ...submission.toObject(),
      assignmentId: {
        ...submission.assignmentId.toObject(),
        courseId: {
          _id: course._id,
          createdBy: course.createdBy,
          coTeachers: course.coTeachers
        }
      }
    };

    return NextResponse.json({ submission: submissionWithCourse }, { status: 200 });
  } catch (error) {
    console.error('Get Submission by ID Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = await params;

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Authorization: Creator/co-teacher can delete any submission, students can delete their own
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
    const isStudent = submission.studentId.toString() === currentUserId;

    if (!isCreator && !isCoTeacher && !isStudent) {
      return NextResponse.json({ message: 'Forbidden: Only course creator, co-teacher, or the student who owns the submission can delete it' }, { status: 403 });
    }

    console.log('🔄 Deleting submission:', id);
    try {
      const deletedSubmission = await Submission.findByIdAndDelete(id);
      if (!deletedSubmission) {
        console.error('❌ Submission not found for deletion:', id);
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
      }

      console.log('✅ Submission deleted successfully:', id);
      return NextResponse.json({ message: 'Submission deleted successfully' }, { status: 200 });
    } catch (deleteError) {
      console.error('❌ Failed to delete submission:', deleteError);
      console.error('❌ Delete error details:', {
        message: deleteError.message,
        code: deleteError.code,
        name: deleteError.name
      });
      return NextResponse.json({
        message: 'Failed to delete submission',
        error: deleteError.message,
        details: deleteError.code || 'UNKNOWN_ERROR'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Delete Submission Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
