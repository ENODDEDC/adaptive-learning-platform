import { NextResponse } from 'next/server';
import intuitiveLearningService from '@/services/intuitiveLearningService';

export async function POST(request) {
  console.log('🔮 =================================');
  console.log('🔮 INTUITIVE LEARNING API ENDPOINT CALLED');
  console.log('🔮 =================================');

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

    console.log('🔮 Calling intuitiveLearningService.generateConceptConstellation...');
    console.log('🔮 About to call generateConceptConstellation with params:', {
      textLength: docxText.length,
      textPreview: docxText.substring(0, 150) + '...'
    });

    const result = await intuitiveLearningService.generateConceptConstellation(docxText);

    console.log('✅ Intuitive learning content generated successfully!');
    console.log('📊 Generated concept clusters:', result.conceptUniverse?.conceptClusters?.length || 0);
    console.log('📊 Generated insight moments:', result.insightPatterns?.insightMoments?.length || 0);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN INTUITIVE LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate intuitive learning content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for conceptual pattern discovery')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for conceptual pattern discovery. Concept Constellation works best with lessons, tutorials, study materials, and academic content.';
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
      errorMessage = 'Intuitive learning service is temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('quota')) {
      errorMessage = 'Intuitive learning generation quota exceeded';
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Intuitive learning service configuration error';
      statusCode = 500;
    }

    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'INTUITIVE_LEARNING_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}