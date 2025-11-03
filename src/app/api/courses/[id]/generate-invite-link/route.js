import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can generate invitation links
    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ 
        message: 'Forbidden: Only course creator can generate invitation links' 
      }, { status: 403 });
    }

    // Generate unique token if doesn't exist or regenerate
    const invitationToken = crypto.randomBytes(32).toString('hex');
    course.invitationToken = invitationToken;
    course.invitationEnabled = true;
    await course.save();

    // Construct the invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/courses/join/${invitationToken}`;

    return NextResponse.json({
      message: 'Invitation link generated successfully',
      invitationUrl,
      invitationToken
    }, { status: 200 });
  } catch (error) {
    console.error('Generate Invitation Link Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can disable invitation links
    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ 
        message: 'Forbidden: Only course creator can disable invitation links' 
      }, { status: 403 });
    }

    course.invitationEnabled = false;
    await course.save();

    return NextResponse.json({
      message: 'Invitation link disabled successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Disable Invitation Link Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
