import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Health Check API
 * Tests if Google Gemini AI is available and working
 * Returns: { available: true/false, error: string }
 */
export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;

    // Check if API key exists
    if (!apiKey) {
      return NextResponse.json({
        available: false,
        error: 'Google API key not configured'
      });
    }

    // Try to initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Send a minimal test request
    const result = await model.generateContent('Test');
    const response = await result.response;
    const text = response.text();

    // If we got here, AI is working
    console.log('✅ AI Health Check: Gemini AI is available');
    return NextResponse.json({
      available: true,
      error: null
    });

  } catch (error) {
    console.error('❌ AI Health Check Failed:', error.message);
    
    // Determine error type
    let errorMessage = 'AI service temporarily unavailable';
    
    if (error.message.includes('API key not valid')) {
      errorMessage = 'Invalid API key';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network connection error';
    }

    return NextResponse.json({
      available: false,
      error: errorMessage
    });
  }
}
