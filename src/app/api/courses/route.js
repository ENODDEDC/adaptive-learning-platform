import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { withPerformanceMonitoring } from '@/utils/performanceMonitor';
import { withRateLimiting } from '@/utils/rateLimiter';

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

// Wrap with performance monitoring and rate limiting
const monitoredPOST = withPerformanceMonitoring(async (request) => {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  await connectMongoDB();
  const { subject, section, teacherName, coverColor } = await request.json();

  const uniqueKey = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newCourse = await Course.create({
    subject,
    section,
    teacherName,
    coverColor,
    uniqueKey,
    createdBy: userId,
  });

  // Clear cache after successful creation
  const cacheKey = `courses:${userId}`;
  coursesCache.delete(cacheKey);

  return NextResponse.json({ message: 'Course created', course: newCourse }, { status: 201 });
});

export async function POST(request) {
  const rateLimitedPOST = withRateLimiting(monitoredPOST, '/api/courses');
  return rateLimitedPOST(request);
}

// Wrap with performance monitoring and rate limiting
const monitoredGET = withPerformanceMonitoring(async (request) => {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  // Check cache first
  const cacheKey = `courses:${userId}`;
  const cachedData = getCachedCourses(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  await connectMongoDB();

  // Optimize query with lean() for better performance
  const courses = await Course.find({
    $or: [
      { createdBy: userId },
      { enrolledUsers: userId }
    ]
  }).lean();

  // Get student count and module count for each course
  const coursesWithStats = await Promise.all(courses.map(async (course) => {
    // Count enrolled students (including the creator)
    const studentCount = (course.enrolledUsers?.length || 0) + 1; // +1 for the creator
    
    // Count modules (content files) for this course
    const moduleCount = await Content.countDocuments({ 
      courseId: course._id,
      isActive: true 
    });

    return {
      ...course,
      studentCount,
      moduleCount
    };
  }));

  const responseData = { courses: coursesWithStats };

  // Cache the result
  setCachedCourses(cacheKey, responseData);

  return NextResponse.json(responseData);
});

export async function GET(request) {
  const rateLimitedGET = withRateLimiting(monitoredGET, '/api/courses');
  return rateLimitedGET(request);
}