import { NextRequest, NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { verifyToken } from '@/utils/auth';

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

    console.log('📁 Upload request:', {
      fileCount: files.length,
      folder,
      userId: payload.userId
    });

    if (!files || files.length === 0) {
      console.error('❌ No files provided');
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

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

        uploadResults.push({
          ...result,
          uploadedAt: new Date().toISOString(),
          uploadedBy: payload.userId,
        });
      }
    }

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