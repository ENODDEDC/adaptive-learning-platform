import connectMongoDB from '@/config/mongoConfig';
import PublicCourse from '@/models/PublicCourse';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

// GET - List teacher's public courses
export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Build query
    const query = {
      createdBy: payload.userId,
    };

    if (!includeArchived) {
      query.isArchived = false;
    }

    // Fetch courses
    const courses = await PublicCourse.find(query)
      .populate('createdBy', 'name surname profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    // Format response with stats
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      coverImage: course.coverImage,
      coverColor: course.coverColor,
      category: course.category,
      level: course.level,
      instructorName: course.instructorName,
      isPublished: course.isPublished,
      isArchived: course.isArchived,
      totalModules: course.modules?.length || 0,
      totalItems: course.totalItems || 0,
      totalDuration: course.totalDuration || 0,
      enrolledCount: course.enrolledStudents?.length || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    return NextResponse.json({ 
      success: true,
      courses: formattedCourses 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch courses',
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Create new public course
export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    // Get user info
    const user = await User.findById(payload.userId).select('name surname');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, category, level, coverColor } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json({ 
        success: false,
        message: 'Title and description are required' 
      }, { status: 400 });
    }

    // Create course
    const newCourse = new PublicCourse({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Other',
      level: level || 'Beginner',
      coverColor: coverColor || '#60a5fa',
      createdBy: payload.userId,
      instructorName: `${user.name} ${user.surname}`,
      modules: [],
      enrolledStudents: [],
      studentProgress: [],
      isPublished: false,
      isArchived: false,
      totalDuration: 0,
      totalItems: 0,
    });

    await newCourse.save();

    return NextResponse.json({ 
      success: true,
      message: 'Course created successfully',
      course: {
        _id: newCourse._id,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category,
        level: newCourse.level,
        coverColor: newCourse.coverColor,
        instructorName: newCourse.instructorName,
        isPublished: newCourse.isPublished,
        createdAt: newCourse.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating public course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to create course',
      error: error.message 
    }, { status: 500 });
  }
}
