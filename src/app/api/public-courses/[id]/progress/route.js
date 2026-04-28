import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Get student's progress in a course
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id).lean();
    if (!course) {
      return NextResponse.json({ 
        success: false,
        message: 'Course not found' 
      }, { status: 404 });
    }

    // Check if enrolled
    const isEnrolled = course.enrolledStudents?.some(
      studentId => studentId.toString() === payload.userId
    );

    if (!isEnrolled) {
      return NextResponse.json({ 
        success: false,
        message: 'You are not enrolled in this course' 
      }, { status: 403 });
    }

    // Get student progress
    const progress = course.studentProgress?.find(
      p => p.userId.toString() === payload.userId
    );

    if (!progress) {
      return NextResponse.json({ 
        success: false,
        message: 'Progress not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      progress: {
        completedItems: progress.completedItems || [],
        lastAccessedItem: progress.lastAccessedItem,
        lastAccessedAt: progress.lastAccessedAt,
        completionPercentage: progress.completionPercentage || 0,
        certificateIssued: progress.certificateIssued || false,
        certificateIssuedAt: progress.certificateIssuedAt,
        enrolledAt: progress.enrolledAt,
        completedAt: progress.completedAt,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch progress',
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Mark item as complete
export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ 
        success: false,
        message: 'Item ID is required' 
      }, { status: 400 });
    }

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
      }, { status: 403 });
    }

    // Update progress using the model method
    const updatedProgress = course.updateStudentProgress(payload.userId, itemId);

    await course.save();

    return NextResponse.json({ 
      success: true,
      message: 'Progress updated',
      progress: {
        completedItems: updatedProgress.completedItems,
        completionPercentage: updatedProgress.completionPercentage,
        certificateIssued: updatedProgress.certificateIssued,
        completedAt: updatedProgress.completedAt,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to update progress',
      error: error.message 
    }, { status: 500 });
  }
}
