import { NextResponse } from 'next/server';
import aiTutorService from '@/services/aiTutorService';

export async function POST(request) {
  console.log('🔊 =================================');
  console.log('🔊 AUDIO API ENDPOINT CALLED');
  console.log('🔊 =================================');
  
  try {
    console.log('📥 Parsing request body...');
    const { text, voiceName = 'Kore' } = await request.json();
    
    console.log('📝 Request data received:');
    console.log('  - Text length:', text?.length);
    console.log('  - Voice name:', voiceName);
    console.log('  - Text preview:', text?.substring(0, 100) + '...');

    if (!text) {
      console.error('❌ VALIDATION ERROR: No text provided in request');
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Calling aiTutorService.generateAudio...');
    console.log('🤖 About to call generateAudio with params:', { textLength: text.length, voiceName });
    
    const audioData = await aiTutorService.generateAudio(text, voiceName);
    
    console.log('✅ Audio generation completed successfully!');
    console.log('📊 Audio data length:', audioData?.length);
    console.log('📊 Audio data type:', typeof audioData);

    const response = {
      success: true,
      audioData
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ CRITICAL ERROR in audio generation API');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error cause:', error.cause);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Check if it's the browser TTS fallback signal
    if (error.message === 'FALLBACK_TO_BROWSER_TTS') {
      console.log('🔄 Detected fallback signal, sending to client...');
      return NextResponse.json(
        { 
          error: 'FALLBACK_TO_BROWSER_TTS',
          details: 'Google TTS not available, use browser TTS',
          fallback: true
        },
        { status: 500 }
      );
    }
    
    console.error('📤 Sending error response to client...');
    return NextResponse.json(
      { 
        error: 'Failed to generate audio',
        details: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}