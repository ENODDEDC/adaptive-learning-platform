import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Note from '@/models/Note';
import { verifyToken } from '@/utils/auth';

// GET /api/notes - Fetch notes for specific content
export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const courseId = searchParams.get('courseId');
    const includeShared = searchParams.get('includeShared') === 'true';
    const excludeContentId = searchParams.get('excludeContentId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    let response = { success: true };

    // Fetch user's own notes for specific content
    if (contentId) {
      let query = {
        contentId,
        userId: payload.userId,
        isArchived: false
      };

      if (courseId) {
        query.courseId = courseId;
      }

      const notes = await Note.find(query).sort({ createdAt: -1 });
      response.notes = notes;
    }

    // Fetch shared notes from other files in the course
    if (includeShared && courseId) {
      let sharedQuery = {
        courseId,
        isShared: true,
        visibility: { $in: ['course', 'public'] },
        isArchived: false
      };

      // Exclude notes from current content if specified
      if (excludeContentId) {
        sharedQuery.contentId = { $ne: excludeContentId };
      }

      const sharedNotes = await Note.find(sharedQuery)
        .populate('userId', 'name email')
        .populate('lastEditedBy', 'name email')
        .sort({ createdAt: -1 });

      response.sharedNotes = sharedNotes;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notes',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const body = await request.json();
    const { contentId, courseId, content, position, type = 'floating', style, category, tags, priority, contextualText, contextualId, size } = body;

    // Validate required fields
    if (!contentId || !content || !position) {
      return NextResponse.json({
        error: 'contentId, content, and position are required'
      }, { status: 400 });
    }

    // Validate position
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      return NextResponse.json({ 
        error: 'Position x and y must be numbers' 
      }, { status: 400 });
    }

    const noteData = {
      contentId,
      courseId,
      userId: payload.userId,
      content,
      position,
      size,
      type,
      contextualText,
      contextualId,
      ...(style && { style }),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(priority && { priority })
    };

    const note = new Note(noteData);
    await note.save();

    return NextResponse.json({
      success: true,
      note: note.toJSON(),
      message: 'Note created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ 
      error: 'Failed to create note',
      details: error.message 
    }, { status: 500 });
  }
}