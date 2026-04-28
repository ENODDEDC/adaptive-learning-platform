import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Get certificate (only if course is 100% complete)
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    // Find course
    const course = await PublicCourse.findById(id)
      .populate('createdBy', 'name surname')
      .lean();

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
        message: 'You must be enrolled to get a certificate' 
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

    // Check if course is 100% complete
    if (progress.completionPercentage < 100) {
      return NextResponse.json({ 
        success: false,
        message: 'You must complete 100% of the course to get a certificate',
        completionPercentage: progress.completionPercentage
      }, { status: 400 });
    }

    // Issue certificate if not already issued
    if (!progress.certificateIssued) {
      progress.certificateIssued = true;
      progress.certificateIssuedAt = new Date();
      
      // Update the course document
      await PublicCourse.updateOne(
        { 
          _id: id,
          'studentProgress.userId': payload.userId 
        },
        {
          $set: {
            'studentProgress.$.certificateIssued': true,
            'studentProgress.$.certificateIssuedAt': new Date()
          }
        }
      );
    }

    // Get user info from payload
    const User = (await import('@/models/User')).default;
    const user = await User.findById(payload.userId).select('name surname').lean();

    // Return certificate data
    return NextResponse.json({ 
      success: true,
      certificate: {
        studentName: user ? `${user.name} ${user.surname}` : 'Student',
        courseName: course.title,
        instructorName: course.instructorName,
        completionDate: progress.completedAt || progress.certificateIssuedAt || new Date(),
        certificateId: `${id}-${payload.userId}`.substring(0, 16).toUpperCase(),
        courseCategory: course.category,
        courseDuration: course.totalDuration,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error getting certificate:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to get certificate',
      error: error.message 
    }, { status: 500 });
  }
}
