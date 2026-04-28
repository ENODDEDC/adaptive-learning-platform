import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Get student's enrolled courses
export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    // Find all courses where user is enrolled
    const courses = await PublicCourse.find({
      enrolledStudents: payload.userId,
      isArchived: false,
    })
      .populate('createdBy', 'name surname profilePicture')
      .select('title description coverImage coverColor category level instructorName totalModules totalItems totalDuration studentProgress createdAt')
      .sort({ 'studentProgress.lastAccessedAt': -1 })
      .lean();

    // Format response with progress
    const formattedCourses = courses.map(course => {
      const progress = course.studentProgress?.find(
        p => p.userId.toString() === payload.userId
      );

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        coverImage: course.coverImage,
        coverColor: course.coverColor,
        category: course.category,
        level: course.level,
        instructorName: course.instructorName,
        instructorProfilePicture: course.createdBy?.profilePicture || null,
        totalModules: course.totalModules || 0,
        totalItems: course.totalItems || 0,
        totalDuration: course.totalDuration || 0,
        progress: {
          completionPercentage: progress?.completionPercentage || 0,
          completedItems: progress?.completedItems?.length || 0,
          lastAccessedAt: progress?.lastAccessedAt,
          certificateIssued: progress?.certificateIssued || false,
          enrolledAt: progress?.enrolledAt,
        },
      };
    });

    return NextResponse.json({ 
      success: true,
      courses: formattedCourses 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch courses',
      error: error.message 
    }, { status: 500 });
  }
}
