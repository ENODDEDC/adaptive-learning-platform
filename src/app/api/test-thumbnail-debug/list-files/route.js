import { NextResponse } from 'next/server';
import connectDB from '@/config/mongoConfig';
import Content from '@/models/Content';

export async function GET() {
  try {
    await connectDB();
    
    // Get the 20 most recent files
    const files = await Content.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id title originalName filename mimeType fileSize filePath thumbnailUrl thumbnailKey cloudStorage createdAt')
      .lean();
    
    return NextResponse.json({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
