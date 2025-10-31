import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { sendEmail } from '@/utils/sendEmail';
import { render } from '@react-email/render';
import CourseInvitationEmail from '@/emails/CourseInvitationEmail';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = payload.userId;
    const currentUser = await User.findById(currentUserId);

    await connectMongoDB();
    const { email, role } = await request.json();
    const { id } = params;

    if (!email || !role) {
      return NextResponse.json({ message: 'Email and role are required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden: Only the course creator can invite people' }, { status: 403 });
    }

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (invitee) {
      const isEnrolled = course.enrolledUsers.includes(invitee._id);
      const isCoTeacher = course.coTeachers.includes(invitee._id);
      if (isEnrolled || isCoTeacher) {
        return NextResponse.json({ message: 'User is already in this course' }, { status: 409 });
      }
    }

    const existingInvitation = await Invitation.findOne({ courseId: id, inviteeEmail: email.toLowerCase(), status: 'pending' });
    if (existingInvitation) {
      return NextResponse.json({ message: 'An invitation has already been sent to this email address.' }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/courses/accept-invitation?token=${token}`;

    const emailHtml = await render(<CourseInvitationEmail courseName={course.subject} inviterName={`${currentUser.name} ${currentUser.surname}`} acceptUrl={acceptUrl} />);

    await sendEmail({
      to: email,
      subject: `You're invited to join ${course.subject}`,
      html: emailHtml,
    });

    const invitation = new Invitation({
      courseId: id,
      invitedBy: currentUserId,
      inviteeEmail: email.toLowerCase(),
      role,
      token,
      expiresAt,
    });
    await invitation.save();

    return NextResponse.json({ message: `Invitation sent to ${email}` }, { status: 200 });
  } catch (error) {
    console.error('Invite User to Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}