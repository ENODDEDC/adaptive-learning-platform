import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'Invitation token is required' }, { status: 400 });
    }

    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) {
      return NextResponse.json({ message: 'Invalid or expired invitation token' }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Invitation has expired' }, { status: 400 });
    }

    const course = await Course.findById(invitation.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const user = await User.findById(currentUserId);
    if (user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
        return NextResponse.json({ message: 'This invitation is for a different user.' }, { status: 403 });
    }

    if (invitation.role === 'student') {
      if (!course.enrolledUsers.includes(currentUserId)) {
        course.enrolledUsers.push(currentUserId);
      }
    } else if (invitation.role === 'coTeacher') {
      if (!course.coTeachers.includes(currentUserId)) {
        course.coTeachers.push(currentUserId);
      }
    }

    invitation.status = 'accepted';
    await invitation.save();
    await course.save();

    return NextResponse.json({ message: 'Invitation accepted successfully! Redirecting to course...' }, { status: 200 });
  } catch (error) {
    console.error('Accept Invitation Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}