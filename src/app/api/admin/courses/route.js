import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { verifyAdminToken } from '@/utils/auth';
import ActivityLogger from '@/utils/activityLogger';

export async function GET(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  try {
    const courses = await Course.find({})
      .populate('createdBy', 'name email role') // Populate creator details
      .lean(); // Use .lean() for plain JavaScript objects

    // Add enrolledUsersCount to each course
    const coursesWithCounts = courses.map(course => ({
      ...course,
      enrolledUsersCount: course.enrolledUsers ? course.enrolledUsers.length : 0,
    }));

    return NextResponse.json(coursesWithCounts);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  const { subject, section, teacherName, coverColor, uniqueKey } = await req.json();

  if (!subject || !teacherName || !uniqueKey) {
    return NextResponse.json({ message: 'Subject, teacher name, and unique key are required' }, { status: 400 });
  }

  try {
    const newCourse = await Course.create({
      subject,
      section,
      teacherName,
      coverColor,
      uniqueKey,
      createdBy: adminId,
    });

    // Log the course creation activity
    try {
      await ActivityLogger.logCourseCreated(adminId, newCourse);
    } catch (activityError) {
      console.error('Error logging course creation activity:', activityError);
      // Don't fail the course creation if activity logging fails
    }

    return NextResponse.json({ message: 'Course created successfully', course: newCourse }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  const { id, subject, section, teacherName, coverColor, uniqueKey } = await req.json();

  if (!id || !subject || !teacherName || !uniqueKey) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const oldData = {
      subject: course.subject,
      section: course.section,
      teacherName: course.teacherName,
      coverColor: course.coverColor,
      uniqueKey: course.uniqueKey
    };

    course.subject = subject;
    course.section = section;
    course.teacherName = teacherName;
    course.coverColor = coverColor;
    course.uniqueKey = uniqueKey;
    await course.save();

    // Log the course update activity
    try {
      await ActivityLogger.logCourseUpdated(adminId, id, course.subject, oldData, {
        subject, section, teacherName, coverColor, uniqueKey
      });
    } catch (activityError) {
      console.error('Error logging course update activity:', activityError);
      // Don't fail the course update if activity logging fails
    }

    return NextResponse.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Log the course deletion activity
    try {
      await ActivityLogger.logCourseDeleted(adminId, id, course.subject);
    } catch (activityError) {
      console.error('Error logging course deletion activity:', activityError);
      // Don't fail the course deletion if activity logging fails
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}