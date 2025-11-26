import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { getUserFromToken } from '@/services/authService';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request, { params }) {
  console.log('🚀 Classwork POST API called');
  
  try {
    console.log('🔐 Verifying token...');
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ Token verification failed');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;
    console.log('✅ Token verified for user:', userId);

    console.log('🔗 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connected');

    console.log('📝 Parsing request data...');
    const { id } = await params;
    const requestData = await request.json();
    const { title, description, dueDate, type, attachments } = requestData;

    console.log('--- Classwork POST Request Data ---');
    console.log('Course ID:', id);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Due Date:', dueDate);
    console.log('Type:', type);
    console.log('Attachments:', attachments);
    console.log('Full request data:', requestData);

    if (!id || !title || !type) {
      console.error('❌ Missing required fields: Course ID, title, or type.');
      return NextResponse.json({ message: 'Course ID, title, and type are required' }, { status: 400 });
    }

    console.log('🔍 Finding course...');
    const course = await Course.findById(id);
    if (!course) {
      console.error('❌ Course not found:', id);
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    console.log('✅ Course found:', course.title);

    console.log('🔒 Checking permissions...');
    if (course.createdBy.toString() !== userId) {
      console.error('❌ Permission denied. Course creator:', course.createdBy.toString(), 'User:', userId);
      return NextResponse.json({ message: 'Forbidden: Only course creator can add classwork' }, { status: 403 });
    }
    console.log('✅ Permission granted');

    const attachmentIds = [];
    
    // Handle Backblaze B2 attachments
    if (attachments && attachments.length > 0) {
      console.log('📎 Processing', attachments.length, 'attachments...');
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        console.log(`📎 Processing attachment ${i + 1}:`, attachment);
        
        try {
          // If it's already a saved Content document (has _id), just use it
          if (attachment._id) {
            console.log('✅ Using existing content ID:', attachment._id);
            attachmentIds.push(attachment._id);
            continue;
          }

          // If it's a new Backblaze upload, create a Content document
          if (attachment.url && attachment.key) {
            console.log('🔄 Creating new Content document for Backblaze file...');
            
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
            console.log('📋 Determined content type:', contentType);

            const contentData = {
              courseId: id,
              title: attachment.fileName || attachment.originalName || 'Untitled',
              originalName: attachment.originalName || attachment.fileName || 'unknown',
              filename: attachment.fileName || attachment.originalName || 'unknown',
              filePath: attachment.url, // Backblaze B2 URL
              contentType: contentType,
              fileSize: attachment.size || 0,
              mimeType: attachment.contentType || 'application/octet-stream',
              uploadedBy: userId,
              // Store Backblaze-specific metadata
              cloudStorage: {
                provider: 'backblaze-b2',
                key: attachment.key,
                url: attachment.url,
                bucket: process.env.B2_BUCKET_NAME || 'INTELEVO'
              }
            };

            console.log('📄 Content data to save:', contentData);
            const newContent = new Content(contentData);
            
            console.log('💾 Saving content to database...');
            await newContent.save();
            console.log('✅ Content saved, ID:', newContent._id);
            attachmentIds.push(newContent._id);
            
            // Trigger thumbnail generation for supported file types
            if (attachment.contentType === 'application/pdf' || 
                attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                attachment.contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
              
              console.log('🖼️ Triggering thumbnail generation for:', newContent._id);
              
              // Fire and forget - don't wait for thumbnail
              const generateThumbnail = async () => {
                try {
                  let endpoint;
                  if (attachment.contentType === 'application/pdf') {
                    endpoint = '/api/pdf-thumbnail';
                  } else if (attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    endpoint = '/api/docx-thumbnail';
                  } else if (attachment.contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                    endpoint = '/api/pptx-thumbnail';
                  }
                  
                  const baseUrl = process.env.VERCEL_URL 
                    ? `https://${process.env.VERCEL_URL}` 
                    : (process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
                  
                  await fetch(`${baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      fileKey: attachment.key, 
                      contentId: newContent._id.toString() 
                    }),
                    signal: AbortSignal.timeout(30000)
                  });
                } catch (err) {
                  console.error('Thumbnail generation failed:', err.message);
                }
              };
              
              generateThumbnail().catch(err => console.error('Thumbnail error:', err));
            }
          } else {
            console.warn('⚠️ Attachment missing url or key:', attachment);
          }
        } catch (attachmentError) {
          console.error('❌ Error processing attachment:', attachmentError);
          throw new Error(`Failed to process attachment: ${attachmentError.message}`);
        }
      }
    } else {
      console.log('📎 No attachments to process');
    }
    
    console.log('📎 Final attachment IDs:', attachmentIds);

    console.log('📝 Creating new Assignment...');
    const assignmentData = {
      courseId: id,
      title,
      description: description || '',
      dueDate: dueDate || null,
      postedBy: userId,
      type,
      attachments: attachmentIds,
    };
    console.log('📋 Assignment data:', assignmentData);
    
    const newClasswork = await Assignment.create(assignmentData);
    console.log('✅ Assignment created, ID:', newClasswork._id);

    console.log('🔄 Populating assignment with attachments...');
    const populatedClasswork = await Assignment.findById(newClasswork._id).populate('attachments');
    console.log('✅ Assignment populated successfully');
    
    console.log('🎉 Classwork created successfully:', {
      id: populatedClasswork._id,
      title: populatedClasswork.title,
      type: populatedClasswork.type,
      createdAt: populatedClasswork.createdAt,
      attachmentsCount: populatedClasswork.attachments?.length || 0
    });
    
    return NextResponse.json(populatedClasswork, { status: 201 });
    
  } catch (error) {
    console.error('❌ Create Classwork Error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    return NextResponse.json({ 
      message: 'Internal server error', 
      details: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.userId;
    const userRole = user.role;

    await connectMongoDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Verify user has access to the course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if user is admin, course creator, enrolled, or co-teacher
    const isAdmin = userRole === 'admin' || userRole === 'super admin';
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.some(id => id.toString() === userId);
    const isCoTeacher = course.coTeachers?.includes(userId);
    const hasAccess = isAdmin || isCreator || isEnrolled || isCoTeacher;

    console.log('🔍 Classwork GET Access check:', {
      userId,
      userRole,
      courseId: id,
      isAdmin,
      isCreator,
      isEnrolled,
      isCoTeacher,
      hasAccess
    });

    if (!hasAccess) {
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

export async function DELETE(request, { params }) {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const classworkId = searchParams.get('classworkId');

    console.log('🗑️ DELETE Classwork API called');
    console.log('Course ID:', courseId);
    console.log('Classwork ID:', classworkId);

    if (!classworkId) {
      return NextResponse.json({ error: 'Classwork ID required' }, { status: 400 });
    }

    // Get user info from token for authentication
    const user = await getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.userId;
    const userRole = user.role;

    console.log('✅ User authenticated:', { userId, role: userRole });

    // Connect to database
    await connectMongoDB();
    
    // Find the classwork item
    const classwork = await Assignment.findById(classworkId);
    if (!classwork) {
      return NextResponse.json({ error: 'Classwork not found' }, { status: 404 });
    }
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is admin, course creator, classwork creator, or co-teacher
    const isAdmin = userRole === 'admin';
    const isCreator = course.createdBy.toString() === userId;
    const isPoster = classwork.postedBy.toString() === userId;
    const isCoTeacher = course.coTeachers?.includes(userId);
    const hasAccess = isAdmin || isCreator || isPoster || isCoTeacher;
    
    console.log('🔒 Access check:', {
      isAdmin,
      isCreator,
      isPoster,
      isCoTeacher,
      hasAccess
    });
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('🗑️ Deleting classwork:', {
      classworkId,
      title: classwork.title,
      type: classwork.type,
      attachmentsCount: classwork.attachments?.length || 0
    });

    // Delete associated attachments from Content collection
    if (classwork.attachments && classwork.attachments.length > 0) {
      console.log('🗑️ Deleting', classwork.attachments.length, 'associated attachments...');
      
      for (const attachmentId of classwork.attachments) {
        try {
          const content = await Content.findById(attachmentId);
          if (content) {
            // Delete from cloud storage if applicable
            if (content.cloudStorage && content.cloudStorage.provider === 'backblaze-b2') {
              console.log('🗑️ Deleting from Backblaze B2:', content.cloudStorage.key);
              try {
                const backblazeService = (await import('@/services/backblazeService')).default;
                await backblazeService.deleteFile(content.cloudStorage.key);
                console.log('✅ File deleted from Backblaze B2');
              } catch (b2Error) {
                console.error('⚠️ Backblaze B2 deletion failed:', b2Error.message);
              }
            } else if (content.filePath && content.filePath.startsWith('/uploads/')) {
              // Delete local file
              console.log('🗑️ Deleting local file:', content.filePath);
              try {
                const fsPromises = await import('fs/promises');
                const localPath = path.join(process.cwd(), 'public', content.filePath);
                await fsPromises.unlink(localPath);
                console.log('✅ Local file deleted');
              } catch (fileError) {
                console.warn('⚠️ Local file deletion failed:', fileError.message);
              }
            }
            
            // Delete Content document
            await Content.findByIdAndDelete(attachmentId);
            console.log('✅ Content document deleted:', attachmentId);
          }
        } catch (attachmentError) {
          console.error('⚠️ Error deleting attachment:', attachmentError);
          // Continue with other attachments even if one fails
        }
      }
    }

    // Delete the classwork/assignment document
    await Assignment.findByIdAndDelete(classworkId);
    console.log('✅ Classwork deleted from database');
    
    return NextResponse.json({
      success: true,
      message: 'Classwork and associated files deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete classwork error:', error);
    return NextResponse.json(
      { error: 'Failed to delete classwork' },
      { status: 500 }
    );
  }
}
