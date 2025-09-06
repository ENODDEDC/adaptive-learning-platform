import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request) {
  try {
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

    return NextResponse.json({ message: 'Course created', course: newCourse }, { status: 201 });
  } catch (error) {
    console.error('Create Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const courses = await Course.find({
      $or: [
        { createdBy: userId },
        { enrolledUsers: userId }
      ]
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get Courses Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}