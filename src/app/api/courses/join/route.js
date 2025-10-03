import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request) {
  try {
    console.log('🔍 JOIN COURSE: API called');
    
    const payload = await verifyToken();
    if (!payload) {
      console.log('🔍 JOIN COURSE: Unauthorized - no valid token');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    console.log('🔍 JOIN COURSE: User ID:', userId);

    await connectMongoDB();
    const requestBody = await request.json();
    console.log('🔍 JOIN COURSE: Request body:', requestBody);
    
    const { courseKey } = requestBody;
    console.log('🔍 JOIN COURSE: Course key received:', courseKey);
    console.log('🔍 JOIN COURSE: Course key type:', typeof courseKey);
    console.log('🔍 JOIN COURSE: Course key length:', courseKey?.length);

    if (!courseKey || !courseKey.trim()) {
      console.log('🔍 JOIN COURSE: Invalid course key - empty or null');
      return NextResponse.json({ message: 'Course key is required' }, { status: 400 });
    }

    const trimmedKey = courseKey.trim().toUpperCase();
    console.log('🔍 JOIN COURSE: Searching for course with key:', trimmedKey);

    const course = await Course.findOne({ uniqueKey: trimmedKey });
    console.log('🔍 JOIN COURSE: Course found:', !!course);
    
    if (course) {
      console.log('🔍 JOIN COURSE: Course details:', {
        id: course._id,
        subject: course.subject,
        createdBy: course.createdBy,
        enrolledUsers: course.enrolledUsers?.length || 0
      });
    }

    if (!course) {
      console.log('🔍 JOIN COURSE: Course not found with key:', trimmedKey);
      // Let's also check what courses exist
      const allCourses = await Course.find({}, 'uniqueKey subject').limit(10);
      console.log('🔍 JOIN COURSE: Available courses:', allCourses.map(c => ({ key: c.uniqueKey, subject: c.subject })));
      return NextResponse.json({ message: 'Course not found. Please check the course key.' }, { status: 404 });
    }

    if (course.createdBy.toString() === userId) {
      console.log('🔍 JOIN COURSE: User is the creator of this course');
      return NextResponse.json({ message: 'You are the creator of this course' }, { status: 400 });
    }

    if (course.enrolledUsers.includes(userId)) {
      console.log('🔍 JOIN COURSE: User is already enrolled');
      return NextResponse.json({ message: 'You are already enrolled in this course' }, { status: 400 });
    }

    console.log('🔍 JOIN COURSE: Adding user to course');
    course.enrolledUsers.push(userId);
    await course.save();

    console.log('🔍 JOIN COURSE: Successfully joined course');
    return NextResponse.json({ 
      message: 'Successfully joined course', 
      course: {
        _id: course._id,
        subject: course.subject,
        section: course.section,
        teacherName: course.teacherName
      }
    }, { status: 200 });

  } catch (error) {
    console.error('🔍 JOIN COURSE: Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
}