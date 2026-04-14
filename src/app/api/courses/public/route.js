import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    console.log('🔍 PUBLIC COURSES: Fetching for user:', userId, 'Search:', search);

    // Build query
    const query = {
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } },
        { isPrivate: null }
      ],
      isArchived: { $ne: true },
      createdBy: { $ne: userId },
      enrolledUsers: { $ne: userId }
    };

    // Add search filter if provided
    if (search) {
      query.$and = [
        {
          $or: [
            { subject: { $regex: search, $options: 'i' } },
            { teacherName: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Fetch all public courses that user is not enrolled in and didn't create
    const publicCourses = await Course.find(query)
    .populate('createdBy', 'name surname profilePicture')
    .select('subject section teacherName coverColor uniqueKey createdBy enrolledUsers schedules isPrivate')
    .limit(search ? 50 : 20) // More results when searching
    .sort({ createdAt: -1 })
    .lean();

    console.log('🔍 PUBLIC COURSES: Found', publicCourses.length, 'courses');
    if (publicCourses.length > 0) {
      console.log('🔍 PUBLIC COURSES: First course:', {
        subject: publicCourses[0].subject,
        isPrivate: publicCourses[0].isPrivate,
        createdBy: publicCourses[0].createdBy?._id
      });
    }

    const formattedCourses = publicCourses.map(course => ({
      _id: course._id,
      subject: course.subject,
      section: course.section,
      teacherName: course.teacherName,
      coverColor: course.coverColor,
      uniqueKey: course.uniqueKey,
      studentCount: course.enrolledUsers?.length || 0,
      instructorProfilePicture: course.createdBy?.profilePicture || null,
      schedules: course.schedules || []
    }));

    return NextResponse.json({ courses: formattedCourses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
}
