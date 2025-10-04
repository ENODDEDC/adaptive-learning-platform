import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/config/mongoConfig';
import Content from '@/models/Content';
import Course from '@/models/Course';
import { getUserIdFromToken } from '@/services/authService';

export async function POST(request, { params }) {
  console.log('Upload API called');
  
  try {
    const { id: courseId } = await params;
    console.log('Course ID:', courseId);
    
    // Get user ID from token for authentication
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Connect to database
    await connectDB();
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is course creator or enrolled
    const hasAccess = course.createdBy.toString() === userId || 
                     course.enrolledUsers.includes(userId) ||
                     course.coTeachers?.includes(userId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const formData = await request.formData();
    console.log('FormData received');
    
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');
    const contentType = formData.get('contentType');
    
    console.log('File:', file?.name, 'Size:', file?.size);
    console.log('Title:', title);
    console.log('Content Type:', contentType);
    
    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses', courseId);
    console.log('Upload directory:', uploadDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('Directory created successfully');
    } catch (dirError) {
      console.error('Directory creation error:', dirError);
      // Continue anyway, directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);
    
    console.log('Generated filename:', filename);
    console.log('Full file path:', filePath);

    // Write file to disk
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log('File written successfully');
    } catch (writeError) {
      console.error('File write error:', writeError);
      throw new Error(`Failed to write file: ${writeError.message}`);
    }

    // Check for duplicate titles and add counter if needed
    let finalTitle = title || originalName;
    let counter = 1;
    
    while (true) {
      try {
        // Try to create content record
        const contentRecord = new Content({
          courseId,
          title: finalTitle,
          description: description || '',
          filename,
          originalName,
          filePath: `/uploads/courses/${courseId}/${filename}`,
          contentType,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: userId
        });

        await contentRecord.save();
        console.log('Content record saved to database');
        
        return NextResponse.json({
          success: true,
          content: {
            id: contentRecord._id,
            courseId: contentRecord.courseId,
            title: contentRecord.title,
            description: contentRecord.description,
            filename: contentRecord.filename,
            originalName: contentRecord.originalName,
            filePath: contentRecord.filePath,
            contentType: contentRecord.contentType,
            fileSize: contentRecord.fileSize,
            mimeType: contentRecord.mimeType,
            uploadedAt: contentRecord.createdAt,
            uploadedBy: contentRecord.uploadedBy
          },
          message: 'File uploaded successfully'
        });
        
      } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate title error, try with counter
          counter++;
          finalTitle = `${title || originalName} (${counter})`;
          console.log(`Duplicate title found, trying with: ${finalTitle}`);
          continue;
        } else {
          throw saveError;
        }
      }
    }

  } catch (error) {
    console.error('Upload error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type'); // filter by type

    // Get user ID from token for authentication
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is course creator or enrolled
    const hasAccess = course.createdBy.toString() === userId || 
                     course.enrolledUsers.includes(userId) ||
                     course.coTeachers?.includes(userId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query
    const query = { courseId, isActive: true };
    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    // Fetch content from database
    const content = await Content.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedContent = content.map(item => ({
      id: item._id,
      courseId: item.courseId,
      title: item.title,
      description: item.description,
      filename: item.filename,
      originalName: item.originalName,
      filePath: item.filePath,
      contentType: item.contentType,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      uploadedAt: item.createdAt,
      uploadedBy: item.uploadedBy
    }));

    return NextResponse.json({
      success: true,
      content: formattedContent,
      total: formattedContent.length
    });

  } catch (error) {
    console.error('Fetch content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    // Get user ID from token for authentication
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Connect to database
    await connectDB();
    
    // Find the content item
    const content = await Content.findById(contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is course creator or content uploader
    const hasAccess = course.createdBy.toString() === userId || 
                     content.uploadedBy.toString() === userId ||
                     course.coTeachers?.includes(userId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('🗑️ Deleting content:', {
      contentId,
      title: content.title,
      filePath: content.filePath,
      filename: content.filename
    });

    // Delete from cloud storage if it's a cloud-stored file
    try {
      // Check if this content has a cloud storage key (Backblaze B2)
      // The filePath might be a local path or a cloud storage key
      if (content.filePath && !content.filePath.startsWith('/uploads/')) {
        // This looks like a cloud storage key, try to delete from Backblaze
        console.log('🔍 Attempting to delete from cloud storage:', content.filePath);
        
        // Import backblaze service
        const backblazeService = (await import('@/services/backblazeService')).default;
        
        // Extract the file key from the path
        let fileKey = content.filePath;
        if (fileKey.startsWith('/api/files/')) {
          fileKey = decodeURIComponent(fileKey.replace('/api/files/', ''));
        }
        
        console.log('🔑 Cloud storage file key:', fileKey);
        await backblazeService.deleteFile(fileKey);
        console.log('✅ File deleted from cloud storage');
        
      } else if (content.filePath && content.filePath.startsWith('/uploads/')) {
        // This is a local file, delete from local storage
        console.log('🔍 Attempting to delete local file:', content.filePath);
        
        const fs = await import('fs/promises');
        const localPath = path.join(process.cwd(), 'public', content.filePath);
        
        try {
          await fs.unlink(localPath);
          console.log('✅ Local file deleted');
        } catch (fileError) {
          console.warn('⚠️ Local file deletion failed (file may not exist):', fileError.message);
        }
      }
      
      // Also try to delete any converted PDF files if this was a PowerPoint
      if (content.mimeType && (content.mimeType.includes('powerpoint') || content.mimeType.includes('presentation'))) {
        console.log('🔍 Checking for converted PDF files to delete...');
        
        try {
          const backblazeService = (await import('@/services/backblazeService')).default;
          
          // Try to find and delete converted PDF files in temp/ppt-conversions/
          // These would have been created during PowerPoint conversion
          const convertedFilePattern = `temp/ppt-conversions/.*${content.filename.replace(/\.[^/.]+$/, "")}.*\.pdf`;
          console.log('🔍 Looking for converted files matching pattern:', convertedFilePattern);
          
          // Note: Backblaze B2 doesn't support listing files by pattern easily
          // For now, we'll just log this - in production you might want to track converted files
          console.log('ℹ️ Converted PDF cleanup would require additional tracking');
          
        } catch (conversionCleanupError) {
          console.warn('⚠️ Converted file cleanup failed:', conversionCleanupError.message);
        }
      }
      
    } catch (storageError) {
      console.error('❌ Cloud storage deletion failed:', storageError);
      // Continue with database deletion even if cloud storage deletion fails
      console.log('⚠️ Continuing with database deletion despite storage error');
    }

    // Delete from database (hard delete, not soft delete)
    await Content.findByIdAndDelete(contentId);
    console.log('✅ Content deleted from database');
    
    return NextResponse.json({
      success: true,
      message: 'Content and associated files deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete content error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}