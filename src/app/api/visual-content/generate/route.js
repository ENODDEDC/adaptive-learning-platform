import { NextResponse } from 'next/server';
import visualContentService from '@/services/visualContentService';

export async function POST(request) {
  console.log('🎨 =================================');
  console.log('🎨 VISUAL CONTENT API ENDPOINT CALLED');
  console.log('🎨 =================================');
  
  try {
    console.log('📥 Parsing request body...');
    const { docxText, contentType = 'diagram' } = await request.json();
    
    console.log('📝 Request data received:');
    console.log('  - Text length:', docxText?.length);
    console.log('  - Content type:', contentType);
    console.log('  - Text preview:', docxText?.substring(0, 100) + '...');

    if (!docxText) {
      console.error('❌ VALIDATION ERROR: No text provided in request');
      return NextResponse.json(
        { error: 'Document text content is required' },
        { status: 400 }
      );
    }

    console.log('🎨 Calling visualContentService.generateVisualContent...');
    console.log('🎨 About to call generateVisualContent with params:', { 
      textLength: docxText.length, 
      contentType 
    });
    
    const visualContent = await visualContentService.generateVisualContent(docxText, contentType);
    
    console.log('✅ Visual content generation completed successfully!');
    console.log('📊 Visual content data length:', visualContent?.imageData?.length);
    console.log('📊 MIME type:', visualContent?.mimeType);

    const response = {
      success: true,
      visualContent
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN VISUAL CONTENT GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    let errorMessage = 'Failed to generate visual content';
    let statusCode = 500;

    if (error.message.includes('not available')) {
      errorMessage = 'Visual content service is temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('quota')) {
      errorMessage = 'Visual content generation quota exceeded';
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Visual content service configuration error';
      statusCode = 500;
    }

    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'VISUAL_CONTENT_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}
