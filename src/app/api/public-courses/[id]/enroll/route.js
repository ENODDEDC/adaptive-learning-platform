import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// POST - Enroll in a public course
export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id);
    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if course is published
    if (!course.isPublished) {
      return NextResponse.json({ 
        success: false,
        message: 'This course is not available for enrollment' 
      }, { status: 400 });
    }

    // Check if already enrolled
    const isEnrolled = course.enrolledStudents.some(
      studentId => studentId.toString() === payload.userId
    );

    if (isEnrolled) {
      return NextResponse.json({ 
        success: false,
        message: 'You are already enrolled in this course' 
      }, { status: 400 });
    }

    // Check if user is the creator
    if (course.createdBy.toString() === payload.userId) {
      return NextResponse.json({ 
        success: false,
        message: 'You cannot enroll in your own course' 
      }, { status: 400 });
    }

    // Enroll student
    course.enrolledStudents.push(payload.userId);

    // Initialize progress tracking
    course.studentProgress.push({
      userId: payload.userId,
      completedItems: [],
      lastAccessedItem: null,
      lastAccessedAt: new Date(),
      completionPercentage: 0,
      certificateIssued: false,
      enrolledAt: new Date(),
    });

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Successfully enrolled in course',
      courseId: course._id,
    }, { status: 200 });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to enroll in course',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Unenroll from a public course
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id);
    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if enrolled
    const isEnrolled = course.enrolledStudents.some(
      studentId => studentId.toString() === payload.userId
    );

    if (!isEnrolled) {
      return NextResponse.json({ 
        success: false,
        message: 'You are not enrolled in this course' 
      }, { status: 400 });
    }

    // Remove from enrolled students
    course.enrolledStudents = course.enrolledStudents.filter(
      studentId => studentId.toString() !== payload.userId
    );

    // Remove progress tracking
    course.studentProgress = course.studentProgress.filter(
      progress => progress.userId.toString() !== payload.userId
    );

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Successfully unenrolled from course' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error unenrolling from course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to unenroll from course',
      error: error.message 
    }, { status: 500 });
  }
}
