import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function PATCH(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    const { slug } = await params; // Await params in Next.js 15

    await connectMongoDB();
    
    const { isPrivate } = await request.json();

    console.log('🔒 PATCH visibility - Course ID:', slug, 'isPrivate:', isPrivate);

    const course = await Course.findById(slug);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if user is the course creator
    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Only course creator can update visibility' }, { status: 403 });
    }

    course.isPrivate = isPrivate;
    await course.save();

    console.log('🔒 Visibility updated successfully');

    return NextResponse.json({ message: 'Visibility updated successfully', course }, { status: 200 });
  } catch (error) {
    console.error('Error updating course visibility:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
}
