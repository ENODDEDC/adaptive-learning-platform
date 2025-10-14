import connectMongoDB from '@/config/mongoConfig';
import Submission from '@/models/Submission';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET all submissions for a specific assignment (for teachers)
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = await params; // assignmentId

    // Find the assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    // Verify user is instructor of the course
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const isCreator = course.createdBy.toString() === currentUserId;
    const isCoTeacher = course.coTeachers?.some(id => id.toString() === currentUserId);

    if (!isCreator && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden: Only instructors can view all submissions' }, { status: 403 });
    }

    // Get all students enrolled in the course
    const enrolledStudents = await User.find({ 
      _id: { $in: course.enrolledUsers } 
    }).select('_id name email profilePicture');

    // Get all submissions for this assignment
    const submissions = await Submission.find({ assignmentId: id })
      .populate('studentId', 'name email profilePicture')
      .populate('gradedBy', 'name')
      .populate('attachments')
      .sort({ submittedAt: -1 });

    // Create a map of submissions by student ID
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.studentId._id.toString()] = sub;
    });

    // Create a complete list with all students
    const allSubmissions = enrolledStudents.map(student => {
      const submission = submissionMap[student._id.toString()];
      if (submission) {
        return submission;
      } else {
        // Student hasn't submitted yet
        return {
          _id: null,
          assignmentId: id,
          studentId: {
            _id: student._id,
            name: student.name,
            email: student.email,
            profilePicture: student.profilePicture
          },
          status: 'not_submitted',
          submittedAt: null,
          grade: null
        };
      }
    });

    return NextResponse.json({ 
      submissions: allSubmissions,
      assignment: assignment 
    }, { status: 200 });
  } catch (error) {
    console.error('Get Assignment Submissions Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
