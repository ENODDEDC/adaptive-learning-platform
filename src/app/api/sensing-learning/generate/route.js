import { NextResponse } from 'next/server';
import sensingLearningService from '@/services/sensingLearningService';

export async function POST(request) {
  console.log('🔬 =================================');
  console.log('🔬 SENSING LEARNING API ENDPOINT CALLED');
  console.log('🔬 =================================');

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

    console.log('🔬 Calling sensingLearningService.generateHandsOnContent...');
    console.log('🔬 About to call generateHandsOnContent with params:', {
      textLength: docxText.length,
      textPreview: docxText.substring(0, 150) + '...'
    });

    const result = await sensingLearningService.generateHandsOnContent(docxText);

    console.log('✅ Sensing learning content generated successfully!');
    console.log('📊 Generated simulations:', result.simulations?.length || 0);
    console.log('📊 Generated challenges:', result.challenges?.length || 0);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN SENSING LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate sensing learning content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for hands-on learning')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for hands-on learning. Sensing Learning works best with lessons, tutorials, study materials, and academic content.';
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
      errorMessage = 'Sensing learning service is temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('quota')) {
      errorMessage = 'Sensing learning generation quota exceeded';
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Sensing learning service configuration error';
      statusCode = 500;
    }

    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'SENSING_LEARNING_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}