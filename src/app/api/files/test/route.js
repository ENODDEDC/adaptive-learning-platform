import { NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET(request) {
  try {
    console.log('🔍 Testing Backblaze B2 connection and listing files...');
    
    // Create a client to list files
    const client = new S3Client({
      endpoint: process.env.B2_ENDPOINT,
      region: 'us-east-005',
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      MaxKeys: 20, // Limit to 20 files for testing
    });

    const response = await client.send(command);
    
    const files = response.Contents?.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/files/${encodeURIComponent(file.Key)}`
    })) || [];

    return NextResponse.json({
      message: 'Backblaze B2 connection successful',
      bucket: process.env.B2_BUCKET_NAME,
      fileCount: files.length,
      files: files
    });

  } catch (error) {
    console.error('❌ Error testing Backblaze B2:', error);
    return NextResponse.json({
      message: 'Failed to connect to Backblaze B2',
      error: error.message,
      details: {
        code: error.code,
        name: error.name,
        statusCode: error.statusCode
      }
    }, { status: 500 });
  }
}