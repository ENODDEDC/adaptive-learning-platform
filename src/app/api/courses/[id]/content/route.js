import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/config/mongoConfig';
import Content from '@/models/Content';
import Course from '@/models/Course';
import { getUserIdFromToken, getUserFromToken } from '@/services/authService';
import { validateFileSize, formatFileSize } from '@/config/uploadLimits';

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

    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      console.error('❌ File size validation failed:', sizeValidation.error);
      return NextResponse.json({
        error: sizeValidation.error,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        limit: sizeValidation.limit,
      }, { status: 413 }); // 413 Payload Too Large
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

    // Get user info from token for authentication
    const user = await getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = user.userId;
    const userRole = user.role;

    // Connect to database
    await connectDB();
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is admin, course creator, enrolled, or co-teacher
    const isAdmin = userRole === 'admin' || userRole === 'super admin';
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.includes(userId);
    const isCoTeacher = course.coTeachers?.includes(userId);
    const hasAccess = isAdmin || isCreator || isEnrolled || isCoTeacher;

    console.log('🔍 Content GET Access check:', {
      userId,
      userRole,
      courseId,
      isAdmin,
      isCreator,
      isEnrolled,
      isCoTeacher,
      hasAccess
    });

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
      _id: item._id, // Include both for compatibility
      courseId: item.courseId,
      title: item.title,
      description: item.description,
      filename: item.filename,
      originalName: item.originalName,
      filePath: item.filePath,
      fileUrl: item.filePath, // Add fileUrl alias for compatibility
      contentType: item.contentType,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      createdAt: item.createdAt, // Add createdAt for compatibility
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

export async function DELETE(request, context) {
  console.log('\n=== DELETE CONTENT API CALLED ===');
  console.log('Context received:', context);
  
  try {
    // Step 1: Parse params - Next.js 15 style
    console.log('Step 1: Parsing params...');
    let courseId, contentId;
    
    try {
      // Handle both params patterns (Next.js 14 vs 15)
      const params = context.params;
      if (params instanceof Promise) {
        const resolvedParams = await params;
        courseId = resolvedParams.id;
      } else {
        courseId = params.id;
      }
      console.log('✅ Course ID from params:', courseId);
    } catch (paramError) {
      console.error('❌ Error parsing params:', paramError);
      return NextResponse.json({ error: 'Invalid route parameters', details: paramError.message }, { status: 400 });
    }
    
    // Step 2: Parse query params
    console.log('Step 2: Parsing query params...');
    try {
      const { searchParams } = new URL(request.url);
      contentId = searchParams.get('contentId');
      console.log('✅ Content ID from query:', contentId);
    } catch (urlError) {
      console.error('❌ Error parsing URL:', urlError);
      return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
    }

    if (!contentId) {
      console.error('❌ Content ID missing');
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    // Step 3: Get user authentication
    console.log('Step 3: Authenticating user...');
    let userId, userRole;
    try {
      const user = await getUserFromToken(request);
      if (!user || !user.userId) {
        console.error('❌ No user from token');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      userId = user.userId;
      userRole = user.role;
      console.log('✅ User authenticated:', { userId, role: userRole });
    } catch (authError) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Step 4: Connect to database
    console.log('Step 4: Connecting to database...');
    try {
      await connectDB();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Step 5: Find the content item
    console.log('Step 5: Finding content...');
    let content;
    try {
      content = await Content.findById(contentId);
      if (!content) {
        console.error('❌ Content not found:', contentId);
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      console.log('✅ Content found:', {
        id: content._id,
        title: content.title,
        uploadedBy: content.uploadedBy
      });
    } catch (findError) {
      console.error('❌ Error finding content:', findError);
      return NextResponse.json({ error: 'Failed to find content' }, { status: 500 });
    }
    
    // Step 6: Verify user has access to this course
    console.log('Step 6: Verifying course access...');
    let course;
    try {
      course = await Course.findById(courseId);
      if (!course) {
        console.error('❌ Course not found:', courseId);
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      console.log('✅ Course found:', course.subject);
    } catch (courseError) {
      console.error('❌ Error finding course:', courseError);
      return NextResponse.json({ error: 'Failed to find course' }, { status: 500 });
    }
    
    // Step 7: Check permissions
    console.log('Step 7: Checking permissions...');
    const isAdmin = userRole === 'admin';
    const isCreator = course.createdBy.toString() === userId;
    const isUploader = content.uploadedBy && content.uploadedBy.toString() === userId;
    const isCoTeacher = course.coTeachers?.includes(userId);
    const hasAccess = isAdmin || isCreator || isUploader || isCoTeacher;
    
    console.log('🔒 Access check:', {
      isAdmin,
      isCreator,
      isUploader,
      isCoTeacher,
      hasAccess
    });
    
    if (!hasAccess) {
      console.error('❌ Access denied');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('🗑️ Step 8: Deleting content:', {
      contentId,
      title: content.title,
      filePath: content.filePath,
      filename: content.filename,
      cloudStorage: content.cloudStorage
    });

    // Delete from cloud storage if it's a cloud-stored file
    console.log('Step 9: Handling file deletion...');
    try {
      // Check if this content has cloud storage metadata (Backblaze B2)
      if (content.cloudStorage && content.cloudStorage.provider === 'backblaze-b2') {
        console.log('🔍 Attempting to delete from Backblaze B2:', content.cloudStorage.key);
        
        try {
          const backblazeService = (await import('@/services/backblazeService')).default;
          await backblazeService.deleteFile(content.cloudStorage.key);
          console.log('✅ File deleted from Backblaze B2');
        } catch (b2Error) {
          console.error('❌ Backblaze B2 deletion failed:', b2Error);
          console.error('❌ Error details:', b2Error.message);
          // Continue with database deletion even if cloud deletion fails
        }
      }
      // Check if this content has a cloud storage key (legacy - using filePath)
      else if (content.filePath && !content.filePath.startsWith('/uploads/') && !content.filePath.startsWith('http')) {
        // This looks like a cloud storage key, try to delete from Backblaze
        console.log('🔍 Attempting to delete from cloud storage (legacy):', content.filePath);
        
        try {
          const backblazeService = (await import('@/services/backblazeService')).default;
          
          // Extract the file key from the path
          let fileKey = content.filePath;
          if (fileKey.startsWith('/api/files/')) {
            fileKey = decodeURIComponent(fileKey.replace('/api/files/', ''));
          }
          
          console.log('🔑 Cloud storage file key:', fileKey);
          await backblazeService.deleteFile(fileKey);
          console.log('✅ File deleted from cloud storage');
        } catch (cloudError) {
          console.error('❌ Cloud storage deletion failed:', cloudError);
          console.error('❌ Error details:', cloudError.message);
          // Continue with database deletion
        }
      } 
      // Local file deletion
      else if (content.filePath && content.filePath.startsWith('/uploads/')) {
        // This is a local file, delete from local storage
        console.log('🔍 Attempting to delete local file:', content.filePath);
        
        try {
          const fs = await import('fs/promises');
          const localPath = path.join(process.cwd(), 'public', content.filePath);
          
          console.log('📂 Local file path:', localPath);
          await fs.unlink(localPath);
          console.log('✅ Local file deleted');
        } catch (fileError) {
          console.warn('⚠️ Local file deletion failed (file may not exist):', fileError.message);
          // Continue with database deletion
        }
      } else {
        console.log('ℹ️ No file to delete from storage (filePath:', content.filePath, ')');
      }
      
    } catch (storageError) {
      console.error('❌ Storage deletion failed:', storageError);
      console.error('❌ Storage error details:', storageError.message);
      console.error('❌ Stack trace:', storageError.stack);
      // Continue with database deletion even if cloud storage deletion fails
      console.log('⚠️ Continuing with database deletion despite storage error');
    }

    // Delete from database (hard delete, not soft delete)
    console.log('Step 10: Deleting content from database...');
    try {
      await Content.findByIdAndDelete(contentId);
      console.log('✅ Content deleted from database successfully');
    } catch (deleteError) {
      console.error('❌ Database deletion error:', deleteError);
      throw deleteError;
    }
    
    console.log('✅✅✅ DELETE OPERATION COMPLETED SUCCESSFULLY \n');
    return NextResponse.json({
      success: true,
      message: 'Content and associated files deleted successfully'
    });

  } catch (error) {
    console.error('\n❌❌❌ FATAL ERROR IN DELETE OPERATION');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    console.error('=== END DELETE CONTENT API ===\n');
    
    return NextResponse.json(
      { 
        error: 'Failed to delete content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}