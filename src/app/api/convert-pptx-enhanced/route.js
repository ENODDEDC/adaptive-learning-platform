import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { EnhancedPPTXProcessor } from '@/utils/enhancedPptxProcessor';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  const processor = new EnhancedPPTXProcessor();

  try {
    // Check if file exists
    await fs.access(absolutePath);

    console.log('Starting enhanced PPTX processing for:', absolutePath);

    // Process PowerPoint with enhanced rendering
    const result = await processor.processPresentation(absolutePath);
    
    if (!result || !result.slides || result.slides.length === 0) {
      throw new Error('No slides found in PowerPoint file');
    }

    console.log(`Successfully processed ${result.slides.length} slides with enhanced rendering`);

    return NextResponse.json({
      slides: result.slides,
      metadata: result.metadata,
      success: true
    });

  } catch (error) {
    console.error('Error in enhanced PPTX processing:', error);
    
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}