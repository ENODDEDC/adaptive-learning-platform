import { NextResponse } from 'next/server';
import activeLearningService from '@/services/activeLearningService';

export async function POST(request) {
  console.log('🎯 =================================');
  console.log('🎯 ACTIVE LEARNING API ENDPOINT CALLED');
  console.log('🎯 =================================');

  try {
    console.log('📥 Parsing request body...');
    const { content, fileName } = await request.json();

    console.log('📝 Request data received:');
    console.log('  - Content length:', content?.length);
    console.log('  - File name:', fileName);
    console.log('  - Content preview:', content?.substring(0, 100) + '...');

    if (!content) {
      console.error('❌ VALIDATION ERROR: No content provided in request');
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Calling activeLearningService.generateInteractiveContent...');
    console.log('🎯 About to call generateInteractiveContent with params:', {
      contentLength: content.length,
      fileName: fileName
    });

    const result = await activeLearningService.generateInteractiveContent(content, fileName);

    console.log('✅ Active learning content generated successfully!');
    console.log('📊 Generated challenges:', result.interactiveContent?.challenges?.length || 0);
    console.log('📊 Generated puzzles:', result.interactiveContent?.puzzles?.length || 0);
    console.log('📊 Generated scenarios:', result.interactiveContent?.scenarios?.length || 0);
    console.log('📊 Generated debate topics:', result.debateContent?.topics?.length || 0);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN ACTIVE LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}