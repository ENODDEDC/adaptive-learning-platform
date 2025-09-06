import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Course from '@/models/Course';
import { verifyToken } from '@/utils/auth';

export async function GET(req) {
  await connectMongoDB();
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = payload;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name surname photoURL')
      .populate('course', 'subject section')
      .sort({ createdAt: -1 });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = payload;

    const { notificationIds } = await req.json();

    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}