import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { courseIds } = await request.json();

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: 'Invalid course IDs provided' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectMongoDB();

    // Verify user has access to these courses
    const courses = await Course.find({
      _id: { $in: courseIds },
      $or: [
        { createdBy: userId },
        { enrolledUsers: userId }
      ]
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'Unauthorized access to some courses' },
        { status: 403 }
      );
    }

    // Update the order of courses for the user
    // Note: This is a simplified implementation. In a real app, you might want to:
    // 1. Store user-specific course ordering in a separate collection
    // 2. Or add an order field to the course document
    // 3. Or maintain a user preferences document

    // For now, we'll update the course documents with a customOrder field
    // This is a basic implementation - you might want to enhance this based on your needs

    const updatePromises = courseIds.map((courseId, index) =>
      Course.findByIdAndUpdate(courseId, {
        customOrder: index,
        lastReorderedBy: userId,
        lastReorderDate: new Date()
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Course order updated successfully'
    });

  } catch (error) {
    console.error('Error reordering courses:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}