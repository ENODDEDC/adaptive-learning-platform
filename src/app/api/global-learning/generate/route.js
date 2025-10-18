import { NextResponse } from 'next/server';
import globalLearningService from '@/services/globalLearningService';

export async function POST(request) {
  console.log('🌍 =================================');
  console.log('🌍 GLOBAL LEARNING API ENDPOINT CALLED');
  console.log('🌍 =================================');

  try {
    console.log('📥 Parsing request body...');
    const { docxText } = await request.json();

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

    console.log('🌍 Calling globalLearningService.generateGlobalContent...');
    console.log('🌍 About to call generateGlobalContent with params:', {
      textLength: docxText.length,
      textPreview: docxText.substring(0, 150) + '...'
    });

    const result = await globalLearningService.generateGlobalContent(docxText);

    console.log('✅ Global learning content generated successfully!');
    console.log('📊 Generated big picture sections:', Object.keys(result.bigPicture || {}).length);
    console.log('📊 Generated interconnections sections:', Object.keys(result.interconnections || {}).length);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN GLOBAL LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate global learning content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for global learning')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for global learning. Global Learning works best with lessons, tutorials, study materials, and academic content.';
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
      errorMessage = 'Global learning service is temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('quota')) {
      errorMessage = 'Global learning generation quota exceeded';
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Global learning service configuration error';
      statusCode = 500;
    }

    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'GLOBAL_LEARNING_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}