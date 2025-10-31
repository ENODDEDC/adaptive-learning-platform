import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import Invitation from '@/models/Invitation';

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
      .populate('enrolledUsers', 'name email surname')
      .populate('coTeachers', 'name email surname')
      .populate('createdBy', 'name surname');

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const isCreator = course.createdBy ? course.createdBy._id.toString() === currentUserId : false;
    const isEnrolled = course.enrolledUsers.some(user => user._id.toString() === currentUserId);
    const isCoTeacher = course.coTeachers.some(user => user._id.toString() === currentUserId);

    if (!isCreator && !isEnrolled && !isCoTeacher) {
      return NextResponse.json({ message: 'Forbidden: You are not authorized to view this course\'s people' }, { status: 403 });
    }

    const pendingInvitations = await Invitation.find({ courseId: id, status: 'pending' });

    const people = {
      creator: course.createdBy,
      coTeachers: course.coTeachers,
      students: course.enrolledUsers,
      pending: pendingInvitations,
    };

    return NextResponse.json(people, { status: 200 });
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

    // Only the course creator can remove people
    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden: Only course creator can manage people' }, { status: 403 });
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
