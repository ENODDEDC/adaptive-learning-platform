import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Comment from '@/models/Comment';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import { getUserIdFromToken } from '@/services/authService';

export async function GET(request, { params }) {
  await connectMongoDB();
  try {
    const { id: courseId, announcementId } = params;
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const comments = await Comment.find({ onItem: announcementId, onModel: 'Announcement' })
      .populate('postedBy', 'name profilePicture')
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching announcement comments:', error);
    return NextResponse.json({ message: 'Error fetching comments', error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  await connectMongoDB();
  try {
    const { id: courseId, announcementId } = params;
    const { content } = await request.json();
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
    }

    const newComment = new Comment({
      content,
      postedBy: user._id,
      onItem: announcementId,
      onModel: 'Announcement',
    });

    await newComment.save();

    return NextResponse.json({ message: 'Comment posted successfully', comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Error posting announcement comment:', error);
    return NextResponse.json({ message: 'Error posting comment', error: error.message }, { status: 500 });
  }
}