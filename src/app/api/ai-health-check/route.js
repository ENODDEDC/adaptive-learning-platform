import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Health Check API
 * Tests if Google Gemini AI is available and working
 * Returns: { available: true/false, error: string }
 */
export async function GET() {
  const groqConfigured = !!process.env.GROQ_API_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey && groqConfigured) {
    console.log('✅ AI Health Check: Groq configured (Gemini not used for learning modes)');
    return NextResponse.json({
      available: true,
      gemini: false,
      groqConfigured: true,
      error: null
    });
  }

  if (!apiKey) {
    return NextResponse.json({
      available: false,
      gemini: false,
      groqConfigured: false,
      error: 'No AI provider configured (set GOOGLE_API_KEY and/or GROQ_API_KEY)'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const result = await model.generateContent('Test');
    const response = await result.response;
    response.text();

    console.log('✅ AI Health Check: Gemini AI is available');
    return NextResponse.json({
      available: true,
      gemini: true,
      groqConfigured,
      error: null
    });
  } catch (error) {
    console.error('❌ AI Health Check Failed:', error.message);

    let errorMessage = 'AI service temporarily unavailable';

    if (error.message.includes('API key not valid')) {
      errorMessage = 'Invalid API key';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network connection error';
    }

    if (groqConfigured) {
      console.log('⚠️ Gemini check failed but Groq is configured — treating AI as available');
      return NextResponse.json({
        available: true,
        gemini: false,
        groqConfigured: true,
        error: null,
        geminiWarning: errorMessage
      });
    }

    return NextResponse.json({
      available: false,
      gemini: false,
      groqConfigured: false,
      error: errorMessage
    });
  }
}
