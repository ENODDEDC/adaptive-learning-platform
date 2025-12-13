import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { withPerformanceMonitoring } from '@/utils/performanceMonitor';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { getClientIP } from '@/utils/inputValidator';

// Simple in-memory cache for courses data
const coursesCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL for courses data

// Helper function to get cached data
function getCachedCourses(cacheKey) {
  const cached = coursesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    coursesCache.delete(cacheKey);
  }
  return null;
}

// Helper function to set cached data
function setCachedCourses(cacheKey, data) {
  coursesCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// Wrap with performance monitoring
const monitoredPOST = withPerformanceMonitoring(async (request) => {
  // Check rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, 'api');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  await connectMongoDB();
  const { subject, section, teacherName, coverColor, schedules } = await request.json();

  // Get user info from database if teacherName not provided
  let finalTeacherName = teacherName;
  if (!finalTeacherName) {
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).select('name surname');
    if (user) {
      finalTeacherName = `${user.name} ${user.surname}`;
    }
  }

  const uniqueKey = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newCourse = await Course.create({
    subject,
    section,
    teacherName: finalTeacherName,
    coverColor: coverColor || '#60a5fa',
    uniqueKey,
    createdBy: userId,
    schedules: schedules || [],
  });

  // Clear cache after successful creation
  const cacheKey = `courses:${userId}`;
  coursesCache.delete(cacheKey);

  return NextResponse.json({ message: 'Course created', course: newCourse }, { status: 201 });
});

export async function POST(request) {
  return monitoredPOST(request);
}

// Wrap with performance monitoring
const monitoredGET = withPerformanceMonitoring(async (request) => {
  // Check rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, 'api');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  // Check cache first (TEMPORARILY DISABLED FOR DEBUGGING)
  const cacheKey = `courses:${userId}`;
  // const cachedData = getCachedCourses(cacheKey);
  // if (cachedData) {
  //   return NextResponse.json(cachedData);
  // }
  console.log('🔄 Fetching fresh courses data (cache disabled for debugging)');

  await connectMongoDB();

  // Optimize query with lean() for better performance and populate creator info
  console.log('🔍 Fetching courses for user:', userId);
  
  const courses = await Course.find({
    $or: [
      { createdBy: userId },
      { enrolledUsers: userId }
    ],
    isArchived: { $ne: true } // Exclude archived courses
  })
  .populate('createdBy', 'name surname profilePicture') // Populate creator with profile picture
  .lean();
  
  console.log('📊 Found', courses.length, 'courses');
  console.log('🔍 First course createdBy:', courses[0]?.createdBy);

  // Get student count, module count, and assignment count for each course
  const coursesWithStats = await Promise.all(courses.map(async (course) => {
    // Count enrolled students
    const studentCount = course.enrolledUsers?.length || 0;
    
    // Get assignment and material counts from Assignment model
    const Assignment = (await import('@/models/Assignment')).default;
    
    // Count materials (type: 'material')
    const moduleCount = await Assignment.countDocuments({
      courseId: course._id,
      type: 'material'
    });

    // Count assignments (type: 'assignment')
    const assignmentCount = await Assignment.countDocuments({
      courseId: course._id,
      type: 'assignment'
    });

    const result = {
      ...course,
      studentCount,
      moduleCount,
      assignmentCount,
      // Add instructor profile picture from createdBy
      instructorProfilePicture: course.createdBy?.profilePicture || null
    };
    
    // Debug logging
    console.log('📚 Course:', course.subject);
    console.log('👤 Created by:', course.createdBy);
    console.log('🖼️ Profile picture:', course.createdBy?.profilePicture);
    console.log('✅ Result instructorProfilePicture:', result.instructorProfilePicture);
    
    return result;
  }));

  const responseData = { courses: coursesWithStats };

  // Cache the result
  setCachedCourses(cacheKey, responseData);

  return NextResponse.json(responseData);
});

export async function GET(request) {
  return monitoredGET(request);
}