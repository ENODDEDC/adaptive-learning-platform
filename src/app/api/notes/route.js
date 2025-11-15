import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all notes for a user (global or filtered by course/content)
export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const contentId = searchParams.get('contentId');

    // Build query - always filter by userId
    const query = {
      userId: decoded.userId,
      isArchived: false
    };

    // If courseId is provided and not 'general', filter by it
    if (courseId && courseId !== 'general') {
      query.courseId = courseId;
    }

    // If contentId is provided and not 'all', filter by it
    if (contentId && contentId !== 'all') {
      query.contentId = contentId;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { content, position, size, courseId, contentId, type = 'floating' } = body;

    console.log('Creating note with data:', { content, position, size, courseId, contentId, type, userId: decoded.userId });

    // Validate required fields
    if (!position) {
      return NextResponse.json(
        { error: 'Missing position field' },
        { status: 400 }
      );
    }

    // Prepare courseId - convert to ObjectId or null
    let parsedCourseId = null;
    if (courseId && courseId !== 'general') {
      try {
        parsedCourseId = new mongoose.Types.ObjectId(courseId);
      } catch (e) {
        console.log('Invalid courseId, setting to null:', courseId);
        parsedCourseId = null;
      }
    }

    const note = await Note.create({
      userId: decoded.userId,
      courseId: parsedCourseId,
      contentId: contentId || 'global',
      content: content || ' ',
      position,
      size: size || { width: 280, height: 200 },
      type,
      lastEditedBy: decoded.userId
    });

    console.log('Note created successfully:', note);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
