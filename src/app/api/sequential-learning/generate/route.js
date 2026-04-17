import { NextResponse } from 'next/server';
import sequentialLearningService from '@/services/sequentialLearningService';

export async function POST(request) {
  console.log('🎯 =================================');
  console.log('🎯 SEQUENTIAL LEARNING API ENDPOINT CALLED');
  console.log('🎯 =================================');

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

    console.log('🎯 Calling sequentialLearningService.generateSequentialContent...');
    console.log('🎯 About to call generateSequentialContent with params:', {
      textLength: docxText.length,
      textPreview: docxText.substring(0, 150) + '...'
    });

    const result = await sequentialLearningService.generateSequentialContent(docxText);

    console.log('✅ Sequential learning content generated successfully!');
    console.log('📊 Generated steps:', result.steps?.length || 0);
    console.log('📊 Generated concept flow stages:', result.conceptFlow?.length || 0);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN SEQUENTIAL LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate sequential learning content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for sequential learning')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for sequential learning. Sequential Learning works best with lessons, tutorials, study materials, and academic content.';
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
      errorMessage = 'Sequential learning service is temporarily unavailable';
      statusCode = 503;
    } else if (
      error.message.includes('quota') ||
      error.message.includes('rate_limit') ||
      error.message.includes('429')
    ) {
      errorMessage = 'Sequential learning generation rate-limited by provider. Wait a minute and retry.';
      statusCode = 429;
    } else if (
      error.message.includes('request_too_large') ||
      error.message.includes('Request Entity Too Large') ||
      error.message.includes('413')
    ) {
      errorMessage = 'Document too large for the generation model. Try a shorter document.';
      statusCode = 413;
    } else if (error.message.includes('API key') || error.message.includes('CEREBRAS_API_KEY') || error.message.includes('GROQ_API_KEY')) {
      errorMessage = 'Sequential learning service configuration error (missing CEREBRAS_API_KEY).';
      statusCode = 500;
    }

    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'SEQUENTIAL_LEARNING_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}