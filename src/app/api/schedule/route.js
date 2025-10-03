import connectMongoDB from '@/config/mongoConfig';
import ScheduledCourse from '@/models/ScheduledCourse';
import Course from '@/models/Course'; // To populate course details
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { withPerformanceMonitoring } from '@/utils/performanceMonitor';
import { withRateLimiting } from '@/utils/rateLimiter';

// Simple in-memory cache for schedule data
const scheduleCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache TTL for schedule data

// Helper function to get cached data
function getCachedSchedule(cacheKey) {
  const cached = scheduleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    scheduleCache.delete(cacheKey);
  }
  return null;
}

// Helper function to set cached data
function setCachedSchedule(cacheKey, data) {
  scheduleCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// Wrap with performance monitoring and rate limiting
const monitoredGET = withPerformanceMonitoring(async (request) => {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  // Check cache first
  const cacheKey = `schedule:${userId}`;
  const cachedData = getCachedSchedule(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  await connectMongoDB();

  // Optimize query with lean() for better performance
  const scheduledCourses = await ScheduledCourse.find({ userId })
    .populate('courseId', 'subject section')
    .lean();

  const responseData = { scheduledCourses };

  // Cache the result
  setCachedSchedule(cacheKey, responseData);

  return NextResponse.json(responseData);
});

export async function GET(request) {
  const rateLimitedGET = withRateLimiting(monitoredGET, '/api/schedule');
  return rateLimitedGET(request);
}

// Wrap with performance monitoring and rate limiting
const monitoredPOST = withPerformanceMonitoring(async (request) => {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  await connectMongoDB();
  const { day, timeSlot, courseId } = await request.json();

  // Basic validation
  if (!day || !timeSlot || !courseId) {
    return NextResponse.json({ message: 'Missing required fields: day, timeSlot, or courseId' }, { status: 400 });
  }

  // Check if a course already exists for this slot
  const existingSchedule = await ScheduledCourse.findOne({ userId, day, timeSlot });

  let result;
  if (existingSchedule) {
    // Update existing schedule
    existingSchedule.courseId = courseId;
    result = await existingSchedule.save();
    return NextResponse.json({ message: 'Schedule updated', scheduledCourse: result }, { status: 200 });
  } else {
    // Create new schedule entry
    result = await ScheduledCourse.create({
      userId,
      day,
      timeSlot,
      courseId,
    });
    return NextResponse.json({ message: 'Course scheduled', scheduledCourse: result }, { status: 201 });
  }

  // Clear cache after successful update
  const cacheKey = `schedule:${userId}`;
  scheduleCache.delete(cacheKey);
});

export async function POST(request) {
  const rateLimitedPOST = withRateLimiting(monitoredPOST, '/api/schedule');
  return rateLimitedPOST(request);
}

// Wrap with performance monitoring and rate limiting
const monitoredDELETE = withPerformanceMonitoring(async (request) => {
  const payload = await verifyToken();
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = payload.userId;

  await connectMongoDB();
  const { day, timeSlot } = await request.json();

  const deletedSchedule = await ScheduledCourse.findOneAndDelete({ userId, day, timeSlot });

  if (!deletedSchedule) {
    return NextResponse.json({ message: 'Schedule entry not found' }, { status: 404 });
  }

  // Clear cache after successful deletion
  const cacheKey = `schedule:${userId}`;
  scheduleCache.delete(cacheKey);

  return NextResponse.json({ message: 'Schedule entry deleted' }, { status: 200 });
});

export async function DELETE(request) {
  const rateLimitedDELETE = withRateLimiting(monitoredDELETE, '/api/schedule');
  return rateLimitedDELETE(request);
}