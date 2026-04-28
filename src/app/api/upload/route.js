import { NextRequest, NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { verifyToken } from '@/utils/auth';
import connectMongoDB from '@/config/mongoConfig';
import Content from '@/models/Content';

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
        // Block video file uploads — videos must use the Video Link feature
        const videoMimeTypes = [
          'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
          'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/3gpp', 'video/wmv'
        ];
        const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv', 'wmv', 'flv', '3gp', 'mpeg', 'mpg'];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (videoMimeTypes.includes(file.type) || videoExtensions.includes(fileExt)) {
          return NextResponse.json({
            message: `Video files cannot be uploaded directly. Please use the Video Link feature to add videos via URL. File rejected: ${file.name}`
          }, { status: 400 });
        }

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