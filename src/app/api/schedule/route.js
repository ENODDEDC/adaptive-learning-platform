import connectMongoDB from '@/config/mongoConfig';
import ScheduledCourse from '@/models/ScheduledCourse';
import Course from '@/models/Course'; // To populate course details
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    console.log(`Fetching scheduled courses for userId: ${userId}`);

    await connectMongoDB();
    console.log('MongoDB connected. Querying for scheduled courses...');
    const scheduledCourses = await ScheduledCourse.find({ userId }).populate('courseId', 'subject section');
    console.log(`Found ${scheduledCourses.length} scheduled courses.`);
    return NextResponse.json({ scheduledCourses });
  } catch (error) {
    console.error('Get Scheduled Courses Error:', error.message, error.stack);
    return NextResponse.json({ message: 'Failed to fetch scheduled courses', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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

    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.courseId = courseId;
      await existingSchedule.save();
      return NextResponse.json({ message: 'Schedule updated', scheduledCourse: existingSchedule }, { status: 200 });
    } else {
      // Create new schedule entry
      const newScheduledCourse = await ScheduledCourse.create({
        userId,
        day,
        timeSlot,
        courseId,
      });
      return NextResponse.json({ message: 'Course scheduled', scheduledCourse: newScheduledCourse }, { status: 201 });
    }
  } catch (error) {
    console.error('Schedule Course Error:', error.message, error.stack);
    return NextResponse.json({ message: 'Failed to schedule course', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
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

    return NextResponse.json({ message: 'Schedule entry deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete Scheduled Course Error:', error.message, error.stack);
    return NextResponse.json({ message: 'Failed to delete schedule entry', error: error.message }, { status: 500 });
  }
}