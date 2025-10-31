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

    await connectMongoDB();
    const { id } = params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found' }, { status: 404 });
    }

    const course = await Course.findById(invitation.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== currentUserId) {
      return NextResponse.json({ message: 'Forbidden: Only the course creator can resend invitations' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ message: 'This invitation is no longer pending' }, { status: 400 });
    }

    const currentUser = await User.findById(currentUserId);

    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/courses/accept-invitation?token=${invitation.token}`;

    const emailHtml = await render(<CourseInvitationEmail courseName={course.subject} inviterName={`${currentUser.name} ${currentUser.surname}`} acceptUrl={acceptUrl} />);

    await sendEmail({
      to: invitation.inviteeEmail,
      subject: `You're invited to join ${course.subject}`,
      html: emailHtml,
    });

    await invitation.save();

    return NextResponse.json({ message: `Invitation resent to ${invitation.inviteeEmail}` }, { status: 200 });
  } catch (error) {
    console.error('Resend Invitation Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}