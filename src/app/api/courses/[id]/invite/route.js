import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = params;
    const { email, role } = await request.json(); // role can be 'student' or 'coTeacher'

    if (!email || !role) {
      return NextResponse.json({ message: 'Email and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can invite people
    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden: Only course creator can invite people' }, { status: 403 });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return NextResponse.json({
        message: 'User with this email address does not exist. They must register first before being invited.'
      }, { status: 404 });
    }

    // Check if user is already in the course
    if (role === 'student') {
      if (course.enrolledUsers.includes(userToInvite._id)) {
        return NextResponse.json({ message: 'User is already enrolled in this course' }, { status: 409 });
      }
      course.enrolledUsers.push(userToInvite._id);
    } else if (role === 'coTeacher') {
      if (course.coTeachers.includes(userToInvite._id)) {
        return NextResponse.json({ message: 'User is already a co-teacher for this course' }, { status: 409 });
      }
      course.coTeachers.push(userToInvite._id);
    } else {
      return NextResponse.json({ message: 'Invalid role specified. Must be \'student\' or \'coTeacher\'.' }, { status: 400 });
    }

    await course.save();

    return NextResponse.json({
      message: `${userToInvite.name} ${userToInvite.surname} has been successfully added as a ${role} to the course`,
      user: {
        _id: userToInvite._id,
        name: userToInvite.name,
        surname: userToInvite.surname,
        email: userToInvite.email
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Invite User to Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}