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


    let response = { success: true };

    // Build query for user's own notes
    let userNotesQuery = {
      userId: payload.userId,
      isArchived: false
    };

    if (contentId && contentId !== 'null') { // Check for 'null' string as well
      userNotesQuery.contentId = contentId;
    } else {
      userNotesQuery.contentId = null; // Explicitly query for notes without contentId
    }

    if (courseId && courseId !== 'null') { // Check for 'null' string as well
      userNotesQuery.courseId = courseId;
    } else {
      userNotesQuery.courseId = null; // Explicitly query for notes without courseId
    }

    const notes = await Note.find(userNotesQuery).sort({ createdAt: -1 });
    response.notes = notes;

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
    const { contentId, courseId, title, content, position, type = 'floating', style, category, tags, priority, contextualText, contextualId, size } = body;

    // Validate required fields (position is still essential)
    if (!position) {
      return NextResponse.json({
        error: 'position is required'
      }, { status: 400 });
    }

    // Validate position
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      return NextResponse.json({ 
        error: 'Position x and y must be numbers' 
      }, { status: 400 });
    }

    const noteData = {
      userId: payload.userId,
      title,
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

    // Conditionally add contentId and courseId if they are not null/undefined
    if (contentId && contentId !== 'null') {
      noteData.contentId = contentId;
    }
    if (courseId && courseId !== 'null') {
      noteData.courseId = courseId;
    }

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