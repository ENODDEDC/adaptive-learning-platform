import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - Browse published public courses (for students)
export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';

    // Build query - only published, non-archived courses
    const query = {
      isPublished: true,
      isArchived: false,
    };

    // Exclude courses created by this user
    query.createdBy = { $ne: payload.userId };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructorName: { $regex: search, $options: 'i' } },
      ];
    }

    // Add category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Add level filter
    if (level && level !== 'All') {
      query.level = level;
    }

    // Fetch courses
    const courses = await PublicCourse.find(query)
      .populate('createdBy', 'name surname profilePicture')
      .select('title description coverImage coverColor category level instructorName totalModules totalItems totalDuration enrolledStudents createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Format response with enrollment status
    const formattedCourses = courses.map(course => {
      const isEnrolled = course.enrolledStudents?.some(
        studentId => studentId.toString() === payload.userId
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
        enrolledCount: course.enrolledStudents?.length || 0,
        isEnrolled,
        createdAt: course.createdAt,
      };
    });

    return NextResponse.json({ 
      success: true,
      courses: formattedCourses 
    }, { status: 200 });

  } catch (error) {
    console.error('Error browsing public courses:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch courses',
      error: error.message 
    }, { status: 500 });
  }
}
