import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
    const { token } = params;

    const course = await Course.findOne({ 
      invitationToken: token,
      invitationEnabled: true 
    })
    .populate('createdBy', 'name surname email')
    .select('subject section teacherName coverColor createdBy enrolledUsers coTeachers');

    if (!course) {
      return NextResponse.json({ 
        message: 'Invalid or expired invitation link' 
      }, { status: 404 });
    }

    // Return course preview data
    return NextResponse.json({
      course: {
        id: course._id,
        subject: course.subject,
        section: course.section,
        teacherName: course.teacherName,
        coverColor: course.coverColor,
        instructor: course.createdBy ? {
          name: `${course.createdBy.name} ${course.createdBy.surname}`,
          email: course.createdBy.email
        } : null,
        studentCount: course.enrolledUsers.length,
        coTeacherCount: course.coTeachers.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Verify Invitation Token Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;

    await connectMongoDB();
    const { token } = params;

    const course = await Course.findOne({ 
      invitationToken: token,
      invitationEnabled: true 
    });

    if (!course) {
      return NextResponse.json({ 
        message: 'Invalid or expired invitation link' 
      }, { status: 404 });
    }

    // Check if user is already enrolled
    if (course.enrolledUsers.includes(currentUserId)) {
      return NextResponse.json({ 
        message: 'You are already enrolled in this course',
        courseId: course._id
      }, { status: 409 });
    }

    // Check if user is already a co-teacher
    if (course.coTeachers.includes(currentUserId)) {
      return NextResponse.json({ 
        message: 'You are already a co-teacher for this course',
        courseId: course._id
      }, { status: 409 });
    }

    // Check if user is the creator
    if (course.createdBy.toString() === currentUserId) {
      return NextResponse.json({ 
        message: 'You are the creator of this course',
        courseId: course._id
      }, { status: 409 });
    }

    // Add user to enrolled students
    course.enrolledUsers.push(currentUserId);
    await course.save();

    return NextResponse.json({
      message: 'Successfully joined the course',
      courseId: course._id
    }, { status: 200 });
  } catch (error) {
    console.error('Join Course via Invitation Link Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
