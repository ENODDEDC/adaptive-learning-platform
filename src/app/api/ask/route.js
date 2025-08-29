import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { query, conversationHistory } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context-aware prompt with conversation history
    let contextualPrompt = '';
    
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4); // Last 4 messages for context
      const historyText = recentHistory
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');
      
      contextualPrompt = `Previous conversation context:\n${historyText}\n\nCurrent question: ${query}`;
    } else {
      contextualPrompt = query;
    }

    const result = await model.generateContent(contextualPrompt);

    const response = await result.response;
    let text = response.text();
    // Remove markdown asterisks
    text = text.replace(/\*\*/g, '');
    text = text.replace(/\*/g, '');

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}