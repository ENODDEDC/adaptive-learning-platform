import connectMongoDB from '@/config/mongoConfig';
import Announcement from '@/models/Announcement';
import Course from '@/models/Course';
import Notification from '@/models/Notification';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const { id: courseId } = await params;
    const { content } = await request.json();

    await connectMongoDB();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can post announcements
    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Forbidden: Only instructors can post announcements' }, { status: 403 });
    }

    const newAnnouncement = await Announcement.create({
      courseId,
      content,
      postedBy: userId,
    });

    // Create notifications for all enrolled users
    const notificationPromises = course.enrolledUsers.map(async (userId) => {
      return Notification.create({
        recipient: userId,
        sender: newAnnouncement.postedBy,
        course: courseId,
        type: 'announcement',
        message: `New announcement in ${course.subject}: "${content.substring(0, 50)}..."`,
        link: `/courses/${courseId}/announcements/${newAnnouncement._id}`,
      });
    });
    await Promise.all(notificationPromises);
 
     return NextResponse.json({ message: 'Announcement posted', announcement: newAnnouncement }, { status: 201 });
   } catch (error) {
     console.error('Create Announcement Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const { id: courseId } = await params;
    await connectMongoDB();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if the user is either the creator or enrolled in the course
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.includes(userId);

    if (!isCreator && !isEnrolled) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const announcements = await Announcement.find({ courseId })
      .populate('postedBy', 'name') // Populate postedBy with user's name
      .sort({ createdAt: -1 }); // Sort by most recent

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get Announcements Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}