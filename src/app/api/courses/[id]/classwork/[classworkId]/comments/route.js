import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Comment from '@/models/Comment';
import Assignment from '@/models/Assignment'; // Classwork is stored as Assignment model
import User from '@/models/User';
import { getUserIdFromToken } from '@/services/authService';

export async function GET(request, { params }) {
  await connectMongoDB();
  try {
    const { id: courseId, classworkId } = params;
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const comments = await Comment.find({ onItem: classworkId, onModel: 'Assignment' })
      .populate('postedBy', 'name profilePicture')
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching classwork comments:', error);
    return NextResponse.json({ message: 'Error fetching comments', error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  await connectMongoDB();
  try {
    const { id: courseId, classworkId } = params;
    const { content } = await request.json();
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const classwork = await Assignment.findById(classworkId); // Assuming classwork items are stored in Assignment model
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    const newComment = new Comment({
      content,
      postedBy: user._id,
      onItem: classworkId,
      onModel: 'Assignment',
    });

    await newComment.save();

    return NextResponse.json({ message: 'Comment posted successfully', comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Error posting classwork comment:', error);
    return NextResponse.json({ message: 'Error posting comment', error: error.message }, { status: 500 });
  }
}