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
    const { userId, role } = await request.json(); // role can be 'student' or 'coTeacher'

    if (!userId || !role) {
      return NextResponse.json({ message: 'User ID and role are required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can add people
    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden: Only course creator can manage people' }, { status: 403 });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return NextResponse.json({ message: 'User to add not found' }, { status: 404 });
    }

    if (role === 'student') {
      if (course.enrolledUsers.includes(userId)) {
        return NextResponse.json({ message: 'User already enrolled' }, { status: 409 });
      }
      course.enrolledUsers.push(userId);
    } else if (role === 'coTeacher') {
      if (course.coTeachers.includes(userId)) {
        return NextResponse.json({ message: 'User is already a co-teacher' }, { status: 409 });
      }
      course.coTeachers.push(userId);
    } else {
      return NextResponse.json({ message: 'Invalid role specified. Must be \'student\' or \'coTeacher\'.' }, { status: 400 });
    }

    await course.save();

    return NextResponse.json({ message: `User added as ${role} successfully`, course }, { status: 200 });
  } catch (error) {
    console.error('Add Person to Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    const course = await Course.findById(id)
      .populate('enrolledUsers', 'name email')
      .populate('coTeachers', 'name email');

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Verify user has access to the course (enrolled, creator, or co-teacher)
    const isCreator = course.createdBy.toString() === currentUserId;
    const isEnrolled = course.enrolledUsers.some(user => user._id.toString() === currentUserId);
    const isCoTeacher = course.coTeachers.some(user => user._id.toString() === currentUserId);

    if (!isCreator && !isEnrolled && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden: User not authorized to view this course\'s people' }, { status: 403 });
    }

    return NextResponse.json({ enrolledUsers: course.enrolledUsers, coTeachers: course.coTeachers }, { status: 200 });
  } catch (error) {
    console.error('Get Course People Error:', error);
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
    const { userId, role } = await request.json(); // role can be 'student' or 'coTeacher'

    if (!userId || !role) {
      return NextResponse.json({ message: 'User ID and role are required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Allow self-removal (leaving course) or creator removing others
    const isSelfRemoval = currentUserId === userId;
    const isCreator = course.createdBy.toString() === currentUserId;

    if (!isSelfRemoval && !isCreator) {
      return NextResponse.json({ message: 'Forbidden: You can only remove yourself or be the course creator' }, { status: 403 });
    }

    // Course creator cannot leave their own course, only delete it
    if (isSelfRemoval && isCreator) {
      return NextResponse.json({ message: 'Forbidden: Course creator cannot leave their own course. Use delete instead.' }, { status: 403 });
    }

    if (role === 'student') {
      course.enrolledUsers = course.enrolledUsers.filter(id => id.toString() !== userId);
    } else if (role === 'coTeacher') {
      course.coTeachers = course.coTeachers.filter(id => id.toString() !== userId);
    } else {
      return NextResponse.json({ message: 'Invalid role specified. Must be \'student\' or \'coTeacher\'.' }, { status: 400 });
    }

    await course.save();

    return NextResponse.json({ message: `User removed as ${role} successfully`, course }, { status: 200 });
  } catch (error) {
    console.error('Remove Person from Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
