import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Course from '@/models/Course';
import { verifyToken } from '@/utils/auth'; // Assuming you have a utility for token verification

export async function GET(req) {
  await connectMongoDB();
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await Notification.find({ recipient: decoded.userId })
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
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await req.json();

    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: decoded.userId },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}