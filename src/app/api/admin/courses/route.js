import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
const verifyAdminToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      return decoded.id;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export async function GET(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

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
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json({ message: 'Course created successfully', course: newCourse }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, subject, section, teacherName, coverColor, uniqueKey } = await req.json();

  if (!id || !subject || !teacherName || !uniqueKey) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    course.subject = subject;
    course.section = section;
    course.teacherName = teacherName;
    course.coverColor = coverColor;
    course.uniqueKey = uniqueKey;
    await course.save();

    return NextResponse.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}