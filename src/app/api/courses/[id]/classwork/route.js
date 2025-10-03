import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = await params;
    const { title, description, dueDate, type, attachments } = await request.json();

    console.log('--- Classwork POST Request Data ---');
    console.log('Course ID:', id);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Due Date:', dueDate);
    console.log('Type:', type);
    console.log('Attachments:', attachments);

    if (!id || !title || !type) {
      console.error('Missing required fields: Course ID, title, or type.');
      return NextResponse.json({ message: 'Course ID, title, and type are required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Forbidden: Only course creator can add classwork' }, { status: 403 });
    }

    const attachmentIds = [];
    
    // Handle Backblaze B2 attachments
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // If it's already a saved Content document (has _id), just use it
        if (attachment._id) {
          attachmentIds.push(attachment._id);
          continue;
        }

        // If it's a new Backblaze upload, create a Content document
        if (attachment.url && attachment.key) {
          // Determine content type based on MIME type
          let contentType = 'material'; // default
          if (attachment.contentType) {
            if (attachment.contentType.startsWith('video/')) {
              contentType = 'video';
            } else if (attachment.contentType.startsWith('audio/')) {
              contentType = 'audio';
            } else if (attachment.contentType.startsWith('application/') || attachment.contentType.startsWith('text/')) {
              contentType = 'document';
            }
          }

          const newContent = new Content({
            courseId: id,
            title: attachment.fileName || attachment.originalName,
            originalName: attachment.originalName,
            filename: attachment.fileName,
            filePath: attachment.url, // Backblaze B2 URL
            contentType: contentType,
            fileSize: attachment.size,
            mimeType: attachment.contentType,
            uploadedBy: userId,
            // Store Backblaze-specific metadata
            cloudStorage: {
              provider: 'backblaze-b2',
              key: attachment.key,
              url: attachment.url,
              bucket: process.env.B2_BUCKET_NAME
            }
          });

          console.log('New Content object created for Backblaze file:', newContent);
          await newContent.save();
          console.log('Content saved, ID:', newContent._id);
          attachmentIds.push(newContent._id);
        }
      }
    }
    
    console.log('Attachment IDs:', attachmentIds);

    console.log('Creating new Assignment...');
    const newClasswork = await Assignment.create({
      courseId: id,
      title,
      description,
      dueDate: dueDate || null,
      postedBy: userId,
      type,
      attachments: attachmentIds,
    });
    console.log('Assignment created, ID:', newClasswork._id);

    const populatedClasswork = await Assignment.findById(newClasswork._id).populate('attachments');
    console.log('🔍 API: Created classwork successfully:', {
      id: populatedClasswork._id,
      title: populatedClasswork.title,
      type: populatedClasswork.type,
      createdAt: populatedClasswork.createdAt,
      attachmentsCount: populatedClasswork.attachments?.length || 0
    });
    return NextResponse.json(populatedClasswork, { status: 201 });
  } catch (error) {
    console.error('Create Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Verify user has access to the course (enrolled or creator/co-teacher)
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    const isEnrolled = course.enrolledUsers.some(id => id.toString() === userId);
    if (course.createdBy.toString() !== userId && !isEnrolled) {
      return NextResponse.json({ message: 'Forbidden: User not authorized to view this course\'s classwork' }, { status: 403 });
    }

    const classwork = await Assignment.find({ courseId: id })
      .populate('attachments') // Populate the attachments with full Content data
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    console.log('🔍 API: Found classwork items:', classwork.length);
    console.log('🔍 API: Classwork details:', classwork.map(item => ({
      id: item._id,
      title: item.title,
      type: item.type,
      createdAt: item.createdAt,
      dueDate: item.dueDate,
      attachmentsCount: item.attachments?.length || 0
    })));

    return NextResponse.json({ classwork }, { status: 200 });
  } catch (error) {
    console.error('Get Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
