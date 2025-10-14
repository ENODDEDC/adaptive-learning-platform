import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  try {
    // Verify admin token
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get course with populated member data
    const course = await Course.findById(courseId)
      .populate('enrolledUsers', 'name email role')
      .populate('coTeachers', 'name email role')
      .populate('instructors', 'name email role')
      .populate('createdBy', 'name email role');

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Format members data for frontend
    const members = {
      enrolledUsers: course.enrolledUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'student',
        type: 'enrolled'
      })),
      coTeachers: course.coTeachers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'teacher',
        type: 'coTeacher'
      })),
      instructors: course.instructors.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'instructor',
        type: 'instructor'
      })),
      creator: course.createdBy ? {
        id: course.createdBy._id,
        name: course.createdBy.name,
        email: course.createdBy.email,
        role: course.createdBy.role || 'admin',
        type: 'creator'
      } : null
    };

    return NextResponse.json({
      course: {
        id: course._id,
        subject: course.subject,
        section: course.section
      },
      members,
      summary: {
        totalEnrolled: members.enrolledUsers.length,
        totalCoTeachers: members.coTeachers.length,
        totalInstructors: members.instructors.length,
        totalMembers: members.enrolledUsers.length + members.coTeachers.length + members.instructors.length
      }
    });
  } catch (error) {
    console.error('Error fetching course members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course members' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Verify admin token
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { courseId, userId, action, newRole } = await request.json();

    if (!courseId || !userId || !action) {
      return NextResponse.json({ error: 'Course ID, User ID, and action are required' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let message = '';
    let updatedCourse;

    switch (action) {
      case 'remove':
        // Remove user from all member arrays
        course.enrolledUsers = course.enrolledUsers.filter(id => id.toString() !== userId);
        course.coTeachers = course.coTeachers.filter(id => id.toString() !== userId);
        course.instructors = course.instructors.filter(id => id.toString() !== userId);
        message = 'User removed from course';
        break;

      case 'changeRole':
        if (!newRole) {
          return NextResponse.json({ error: 'New role is required for role change' }, { status: 400 });
        }

        // Remove from all arrays first
        course.enrolledUsers = course.enrolledUsers.filter(id => id.toString() !== userId);
        course.coTeachers = course.coTeachers.filter(id => id.toString() !== userId);
        course.instructors = course.instructors.filter(id => id.toString() !== userId);

        // Add to appropriate array based on new role
        switch (newRole) {
          case 'student':
            course.enrolledUsers.push(userId);
            break;
          case 'coTeacher':
            course.coTeachers.push(userId);
            break;
          case 'instructor':
            course.instructors.push(userId);
            break;
          default:
            return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
        }
        message = `User role changed to ${newRole}`;
        break;

      case 'addToCourse':
        if (!newRole) {
          return NextResponse.json({ error: 'Role is required when adding user to course' }, { status: 400 });
        }

        // Check if user is already in the course
        const isAlreadyEnrolled = course.enrolledUsers.includes(userId);
        const isAlreadyCoTeacher = course.coTeachers.includes(userId);
        const isAlreadyInstructor = course.instructors.includes(userId);

        if (isAlreadyEnrolled || isAlreadyCoTeacher || isAlreadyInstructor) {
          return NextResponse.json({ error: 'User is already a member of this course' }, { status: 400 });
        }

        // Add to appropriate array
        switch (newRole) {
          case 'student':
            course.enrolledUsers.push(userId);
            break;
          case 'coTeacher':
            course.coTeachers.push(userId);
            break;
          case 'instructor':
            course.instructors.push(userId);
            break;
          default:
            return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
        }
        message = `User added to course as ${newRole}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }

    updatedCourse = await course.save();

    return NextResponse.json({
      success: true,
      message,
      course: {
        id: updatedCourse._id,
        subject: updatedCourse.subject,
        enrolledUsersCount: updatedCourse.enrolledUsers.length,
        coTeachersCount: updatedCourse.coTeachers.length,
        instructorsCount: updatedCourse.instructors.length
      }
    });
  } catch (error) {
    console.error('Error updating course members:', error);
    return NextResponse.json(
      { error: 'Failed to update course members' },
      { status: 500 }
    );
  }
}