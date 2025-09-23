import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import Note from '@/models/Note';
import { verifyToken } from '@/utils/auth';
import mongoose from 'mongoose';

// PUT /api/notes/[id] - Update a note
export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, position, style, category, tags, priority, isShared, visibility, size } = body;

    // Find the note and verify access (allow editing of shared notes)
    const note = await Note.findOne({
      _id: id,
      $or: [
        { userId: payload.userId }, // Own notes
        { isShared: true, visibility: { $in: ['course', 'public'] } } // Shared notes
      ]
    });
    if (!note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
    }

    // Update fields if provided
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (position !== undefined) {
      // Validate position
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        return NextResponse.json({ 
          error: 'Position x and y must be numbers' 
        }, { status: 400 });
      }
      updateData.position = position;
    }
    if (size !== undefined) updateData.size = size;
    if (style !== undefined) updateData.style = { ...note.style, ...style };
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (priority !== undefined) updateData.priority = priority;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (visibility !== undefined) updateData.visibility = visibility;

    // Update the note
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastEditedBy: payload.userId // Track who last edited the note
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      note: updatedNote.toJSON(),
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ 
      error: 'Failed to update note',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Find and delete the note (verify ownership)
    const deletedNote = await Note.findOneAndDelete({ 
      _id: id, 
      userId: payload.userId 
    });

    if (!deletedNote) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ 
      error: 'Failed to delete note',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/notes/[id] - Get a specific note
export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Find the note and verify access
    const note = await Note.findOne({
      _id: id,
      $or: [
        { userId: payload.userId },
        { isShared: true, visibility: { $in: ['course', 'public'] } }
      ]
    }).populate('userId', 'name email').populate('lastEditedBy', 'name email');

    if (!note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      note: note.toJSON()
    });

  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch note',
      details: error.message 
    }, { status: 500 });
  }
}