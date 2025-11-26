import { NextRequest, NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { verifyToken } from '@/utils/auth';
import connectMongoDB from '@/config/mongoConfig';
import Content from '@/models/Content';

// Async thumbnail generation - don't wait for it
async function generateThumbnailAsync(contentId, fileKey, mimeType) {
  try {
    let thumbnailEndpoint;
    
    if (mimeType === 'application/pdf') {
      thumbnailEndpoint = '/api/pdf-thumbnail';
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      thumbnailEndpoint = '/api/docx-thumbnail';
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      thumbnailEndpoint = '/api/pptx-thumbnail';
    } else {
      return; // No thumbnail generation for this file type
    }
    
    console.log(`🖼️ Triggering thumbnail generation for ${contentId} via ${thumbnailEndpoint}`);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${thumbnailEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, contentId })
    });
    
    if (response.ok) {
      console.log(`✅ Thumbnail generated successfully for ${contentId}`);
    } else {
      console.warn(`⚠️ Thumbnail generation failed for ${contentId}:`, await response.text());
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
  }
}

export async function POST(request) {
  try {
    console.log('🚀 Upload API called');

    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ Upload failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    const folder = formData.get('folder') || 'classwork';
    const courseId = formData.get('courseId');

    console.log('📁 Upload request:', {
      fileCount: files.length,
      folder,
      courseId,
      hasCourseId: !!courseId,
      courseIdType: typeof courseId,
      userId: payload.userId
    });

    if (!files || files.length === 0) {
      console.error('❌ No files provided');
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    // Connect to MongoDB to save Content records
    await connectMongoDB();

    const uploadResults = [];

    for (const file of files) {
      if (file instanceof File) {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Backblaze B2
        const result = await backblazeService.uploadFile(
          buffer,
          file.name,
          file.type,
          folder
        );

        // Create a Content record in MongoDB only if courseId is provided
        let contentRecord = null;
        console.log('🔍 Checking if should create Content record:', {
          hasCourseId: !!courseId,
          courseId,
          courseIdValue: courseId
        });
        
        if (courseId) {
          try {
            const contentData = {
              courseId,
              title: result.originalName || result.fileName || file.name,
              description: '',
              filename: result.fileName || file.name,
              originalName: result.originalName || file.name,
              filePath: result.url,
              contentType: 'material',
              fileSize: result.size || file.size,
              mimeType: result.mimeType || file.type,
              uploadedBy: payload.userId,
              cloudStorage: {
                provider: 'backblaze-b2',
                key: result.key,
                url: result.url,
                bucket: result.bucket,
                metadata: result.metadata || {},
              },
            };
            console.log('💾 Creating Content record with data:', contentData);
            
            contentRecord = await Content.create(contentData);
            console.log('✅ Content record created in MongoDB:', contentRecord._id);
            console.log('✅ Content record details:', {
              id: contentRecord._id,
              cloudStorageKey: contentRecord.cloudStorage?.key,
              cloudStorageUrl: contentRecord.cloudStorage?.url,
              filePath: contentRecord.filePath
            });

            // Trigger thumbnail generation asynchronously (don't wait for it)
            if (contentRecord._id && result.key) {
              const thumbnailPromise = generateThumbnailAsync(contentRecord._id.toString(), result.key, file.type);
              thumbnailPromise.catch(err => console.error('Thumbnail generation failed:', err));
            }
          } catch (dbError) {
            console.error('⚠️ Failed to create Content record:', dbError);
            console.error('⚠️ Error details:', {
              message: dbError.message,
              code: dbError.code,
              name: dbError.name
            });
            // Continue with the upload even if DB save fails
          }
        } else {
          console.warn('⚠️ No courseId provided, skipping Content record creation');
        }

        uploadResults.push({
          ...result,
          _id: contentRecord?._id, // Include MongoDB ID if content was saved
          uploadedAt: new Date().toISOString(),
          uploadedBy: payload.userId,
        });
        
        console.log('📦 Upload result for file:', {
          fileName: result.fileName,
          hasContentId: !!contentRecord?._id,
          contentId: contentRecord?._id,
          key: result.key,
          url: result.url
        });
      }
    }

    console.log('✅ All files uploaded successfully. Total:', uploadResults.length);
    console.log('📦 Upload results summary:', uploadResults.map(r => ({
      fileName: r.fileName,
      hasId: !!r._id,
      id: r._id,
      key: r.key
    })));

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadResults,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    });
    return NextResponse.json({
      message: 'Failed to upload files',
      error: error.message,
      details: error.stack,
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { fileKey } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ message: 'File key is required' }, { status: 400 });
    }

    await backblazeService.deleteFile(fileKey);

    return NextResponse.json({
      message: 'File deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      message: 'Failed to delete file',
      error: error.message,
    }, { status: 500 });
  }
}