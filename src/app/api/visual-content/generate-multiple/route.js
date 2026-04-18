import { NextResponse } from 'next/server';
import visualContentService from '@/services/visualContentService';

function coerceDocxText(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.text === 'string') return raw.text;
    if (typeof raw.rawText === 'string') return raw.rawText;
  }
  try {
    return String(raw);
  } catch {
    return '';
  }
}

export async function POST(request) {
  console.log('🎨 =================================');
  console.log('🎨 MULTIPLE VISUAL CONTENT API ENDPOINT CALLED');
  console.log('🎨 =================================');
  
  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    const docxText = coerceDocxText(body?.docxText);
    
    console.log('📝 Request data received:');
    console.log('  - Text length:', docxText?.length);
    console.log('  - Text preview:', docxText?.substring(0, 100) + '...');

    if (!docxText) {
      console.error('❌ VALIDATION ERROR: No text provided in request');
      return NextResponse.json(
        { error: 'Document text content is required' },
        { status: 400 }
      );
    }

    console.log('🎨 Calling visualContentService.generateMultipleVisuals...');
    console.log('🎨 About to call generateMultipleVisuals with params:', { 
      textLength: docxText.length
    });
    
    const result = await visualContentService.generateMultipleVisuals(docxText);
    
    console.log('✅ Multiple visual content generation completed successfully!');
    console.log('📊 Generated visuals:', Object.keys(result.visuals || {}));
    console.log('📊 Concepts extracted:', result.concepts?.mainTopic);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN MULTIPLE VISUAL CONTENT GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    let errorMessage = 'Failed to generate visual content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for visual learning materials')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for visual learning materials. Visual Learning works best with lessons, tutorials, study materials, and academic content.';
      statusCode = 400;
      
      return NextResponse.json(
        { 
          error: errorMessage,
          isEducational: false,
          type: 'NON_EDUCATIONAL_CONTENT',
          suggestions: [
            'Try with lesson plans or study materials',
            'Use educational articles or tutorials', 
            'Upload course content or learning guides',
            'Use research papers or academic content'
          ]
        },
        { status: statusCode }
      );
    } else if (error.message.includes('not available')) {
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
        type: 'MULTIPLE_VISUAL_CONTENT_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}
