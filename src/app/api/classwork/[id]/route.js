import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;
    
    // Check if the request contains FormData (file upload) or JSON
    const contentType = request.headers.get('content-type');
    let title, description, dueDate, type, attachmentFiles, existingAttachments;

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      const formData = await request.formData();
      title = formData.get('title');
      description = formData.get('description');
      dueDate = formData.get('dueDate');
      type = formData.get('type');
      attachmentFiles = formData.getAll('attachments');
      existingAttachments = formData.get('existingAttachments');
    } else {
      // Handle JSON data
      const data = await request.json();
      title = data.title;
      description = data.description;
      dueDate = data.dueDate;
      type = data.type;
      existingAttachments = data.attachments;
    }

    const classwork = await Assignment.findById(id);
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can update classwork' }, { status: 403 });
    }

    let attachmentIds = [];

    // Handle existing attachments
    if (existingAttachments) {
      try {
        const existingAttachmentsArray = JSON.parse(existingAttachments);
        attachmentIds = existingAttachmentsArray.map(att => att._id || att);
      } catch (e) {
        // If parsing fails, treat as array of IDs
        attachmentIds = Array.isArray(existingAttachments) ? existingAttachments : [];
      }
    }

    // Handle new file uploads
    if (attachmentFiles && attachmentFiles.length > 0) {
      const Content = (await import('@/models/Content')).default;
      const backblazeService = (await import('@/services/backblazeService')).default;

      console.log('📤 Uploading', attachmentFiles.length, 'files to Backblaze B2...');

      for (const file of attachmentFiles) {
        console.log('📁 Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        
        // Upload to Backblaze B2
        const uploadResult = await backblazeService.uploadFile(
          fileBuffer,
          file.name,
          file.type,
          `classwork/${classwork.courseId}`
        );

        console.log('✅ File uploaded to Backblaze:', uploadResult.url);

        const newContent = new Content({
          courseId: classwork.courseId,
          title: uploadResult.originalName || file.name,
          originalName: file.name,
          filename: uploadResult.fileName,
          filePath: uploadResult.url,
          contentType: 'material',
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: userId,
          cloudStorage: {
            provider: 'backblaze-b2',
            key: uploadResult.key,
            url: uploadResult.url,
            bucket: process.env.B2_BUCKET_NAME,
            metadata: {},
          },
        });
        
        await newContent.save();
        console.log('💾 Content record saved:', newContent._id);
        
        attachmentIds.push(newContent._id);
        
        // Trigger thumbnail generation asynchronously for supported file types
        if (file.type === 'application/pdf' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          
          console.log('🖼️ Triggering thumbnail generation for:', newContent._id);
          
          // Fire and forget - don't wait for thumbnail
          const generateThumbnail = async () => {
            try {
              let endpoint;
              if (file.type === 'application/pdf') {
                endpoint = '/api/pdf-thumbnail';
              } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                endpoint = '/api/docx-thumbnail';
              } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                endpoint = '/api/pptx-thumbnail';
              }
              
              const baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : (process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
              
              await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  fileKey: uploadResult.key, 
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
      }
      
      console.log('✅ All files uploaded successfully');
    }

    const updatedClasswork = await Assignment.findByIdAndUpdate(
      id,
      {
        title,
        description,
        dueDate: dueDate || null,
        type,
        attachments: attachmentIds
      },
      { new: true }
    ).populate('attachments');

    return NextResponse.json({ message: 'Classwork updated', classwork: updatedClasswork }, { status: 200 });
  } catch (error) {
    console.error('Update Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    // Try to find the item as an assignment first
    let classwork = await Assignment.findById(id);
    let isForm = false;

    // If not found as assignment, try to find as form
    if (!classwork) {
      const { Form } = await import('@/models/Form');
      classwork = await Form.findById(id);
      isForm = true;
    }

    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if user has permission to delete (course creator or co-teacher)
    const isCreator = course.createdBy.toString() === userId;
    const isCoTeacher = course.instructors?.some(instructor => instructor.toString() === userId);
    
    if (!isCreator && !isCoTeacher) {
        return NextResponse.json({ message: 'Forbidden: Only course creator or co-teachers can delete classwork' }, { status: 403 });
    }

    console.log('🗑️ Deleting classwork:', {
      classworkId: id,
      title: classwork.title,
      isForm,
      attachments: classwork.attachments?.length || 0
    });

    // Delete associated files from cloud storage before deleting the classwork
    if (classwork.attachments && classwork.attachments.length > 0) {
      console.log('🔍 Found attachments to delete:', classwork.attachments.length);
      
      try {
        const Content = (await import('@/models/Content')).default;
        
        // Get all attachment content records
        const attachmentContents = await Content.find({
          _id: { $in: classwork.attachments }
        });
        
        console.log('📎 Processing', attachmentContents.length, 'attachment files for deletion');
        
        for (const content of attachmentContents) {
          try {
            console.log('🗑️ Deleting attachment:', {
              contentId: content._id,
              title: content.title,
              filePath: content.filePath
            });

            // Delete from cloud storage if it's a cloud-stored file
            if (content.filePath && !content.filePath.startsWith('/uploads/')) {
              // This looks like a cloud storage key, try to delete from Backblaze
              console.log('🔍 Attempting to delete from cloud storage:', content.filePath);
              console.log('🔍 Content cloudStorage metadata:', content.cloudStorage);
              
              // Import backblaze service
              const backblazeService = (await import('@/services/backblazeService')).default;
              
              // Extract the file key from the path - try multiple methods
              let fileKey = content.filePath;
              
              // Method 1: Check if cloudStorage metadata has the key
              if (content.cloudStorage && content.cloudStorage.key) {
                fileKey = content.cloudStorage.key;
                console.log('🔑 Using cloudStorage key:', fileKey);
              }
              // Method 2: Extract from API URL
              else if (fileKey.startsWith('/api/files/')) {
                fileKey = decodeURIComponent(fileKey.replace('/api/files/', ''));
                console.log('🔑 Extracted from API URL:', fileKey);
              }
              // Method 3: Check if it's a direct Backblaze URL
              else if (fileKey.includes('backblazeb2.com') || fileKey.includes('b2-api.backblazeb2.com')) {
                // Extract key from full Backblaze URL
                const urlParts = fileKey.split('/');
                fileKey = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
                console.log('🔑 Extracted from Backblaze URL:', fileKey);
              }
              
              console.log('🔑 Final cloud storage file key:', fileKey);
              
              try {
                await backblazeService.deleteFile(fileKey);
                console.log('✅ Attachment deleted from cloud storage successfully');
              } catch (deleteError) {
                console.error('❌ Failed to delete from cloud storage:', deleteError);
                console.error('❌ File key that failed:', fileKey);
                console.error('❌ Original filePath:', content.filePath);
                // Continue with other files even if one fails
              }
              
            } else if (content.filePath && content.filePath.startsWith('/uploads/')) {
              // This is a local file, delete from local storage
              console.log('🔍 Attempting to delete local file:', content.filePath);
              
              const fs = await import('fs/promises');
              const path = await import('path');
              const localPath = path.join(process.cwd(), 'public', content.filePath);
              
              try {
                await fs.unlink(localPath);
                console.log('✅ Local attachment file deleted');
              } catch (fileError) {
                console.warn('⚠️ Local file deletion failed (file may not exist):', fileError.message);
              }
            }

            // Delete the content record from database
            await Content.findByIdAndDelete(content._id);
            console.log('✅ Attachment content record deleted from database');
            
          } catch (attachmentError) {
            console.error('❌ Failed to delete attachment:', content._id, attachmentError);
            // Continue with other attachments even if one fails
          }
        }
        
      } catch (attachmentCleanupError) {
        console.error('❌ Attachment cleanup failed:', attachmentCleanupError);
        // Continue with classwork deletion even if attachment cleanup fails
        console.log('⚠️ Continuing with classwork deletion despite attachment cleanup error');
      }
    }

    // Delete the appropriate model
    if (isForm) {
      const { Form } = await import('@/models/Form');
      await Form.findByIdAndDelete(id);
      console.log('✅ Form deleted from database');
    } else {
      await Assignment.findByIdAndDelete(id);
      console.log('✅ Assignment deleted from database');
    }

    return NextResponse.json({ 
      message: 'Classwork and associated files deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Delete Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
