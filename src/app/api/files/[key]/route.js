import { NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
  try {
    console.log('🔍 File access API called with params:', params);
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Verify authentication
    const payload = await verifyToken();
    if (!payload) {
      console.error('❌ File access failed: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Authentication successful for user:', payload?.userId);

    const { key } = params;
    console.log('🔑 File key received:', key);
    
    if (!key) {
      return NextResponse.json({ message: 'File key is required' }, { status: 400 });
    }

    // Decode the file key (in case it was URL encoded)
    const decodedKey = decodeURIComponent(key);
    console.log('🔓 Decoded file key:', decodedKey);

    // Serve file content directly through our API
    console.log('📁 Getting file data from Backblaze B2...');
    console.log('🔍 Attempting to fetch file with key:', decodedKey);
    console.log('🔍 Backblaze service available:', !!backblazeService);
    
    const fileData = await backblazeService.getFileData(decodedKey);
    console.log('✅ File data retrieved successfully');
    console.log('🔍 File data details:', {
      hasBody: !!fileData.Body,
      contentType: fileData.ContentType,
      contentLength: fileData.ContentLength
    });
    
    // Get file info to set proper headers
    const fileName = decodedKey.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Use the content type from Backblaze or determine from file extension
    let contentType = fileData.ContentType || 'application/octet-stream';
    if (!fileData.ContentType) {
      if (fileExtension === 'pdf') contentType = 'application/pdf';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') contentType = 'image/jpeg';
      else if (fileExtension === 'png') contentType = 'image/png';
      else if (fileExtension === 'txt') contentType = 'text/plain';
      else if (fileExtension === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    console.log('📄 Serving file:', { fileName, contentType, contentLength: fileData.ContentLength });
    
    return new NextResponse(fileData.Body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
        ...(fileData.ContentLength && { 'Content-Length': fileData.ContentLength.toString() }),
      },
    });

  } catch (error) {
    console.error('❌ Error accessing file:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({
      message: 'Failed to access file',
      error: error.message,
    }, { status: 500 });
  }
}