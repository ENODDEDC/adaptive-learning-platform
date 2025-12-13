import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  console.log('🎯 =================================');
  console.log('🎯 ACTIVE LEARNING DEBATE API CALLED');
  console.log('🎯 =================================');

  try {
    console.log('📥 Parsing request body...');
    const { topic, userResponse, history, content } = await request.json();

    console.log('📝 Request data received:');
    console.log('  - Topic:', topic?.title);
    console.log('  - User response length:', userResponse?.length);
    console.log('  - History entries:', history?.length || 0);
    console.log('  - Content length:', content?.length);

    if (!topic || !userResponse) {
      console.error('❌ VALIDATION ERROR: Topic and user response are required');
      return NextResponse.json(
        { success: false, error: 'Topic and user response are required' },
        { status: 400 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Create context from conversation history
    const conversationContext = history.map(entry => 
      `${entry.type === 'user' ? 'Student' : 'AI Facilitator'}: ${entry.content}`
    ).join('\n');

    // Truncate content if too long
    const maxContentLength = 2000;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + "..."
      : content;

    const prompt = `You are an expert AI debate facilitator and educational discussion leader. You're facilitating a learning discussion about: "${topic.title}"

Topic Description: ${topic.description}

Document Context: "${truncatedContent}"

Previous Conversation:
${conversationContext}

Latest Student Response: "${userResponse}"

As an AI facilitator, your role is to:
1. ENGAGE actively with the student's ideas
2. ASK thought-provoking follow-up questions
3. CHALLENGE assumptions constructively
4. PROVIDE alternative perspectives
5. ENCOURAGE deeper thinking
6. CONNECT ideas to real-world applications
7. MAINTAIN an encouraging but intellectually rigorous tone

Guidelines for your response:
- Keep responses conversational and engaging (2-4 sentences)
- Ask 1-2 specific follow-up questions
- Acknowledge good points while pushing for deeper analysis
- Introduce new angles or counterarguments when appropriate
- Use Socratic questioning techniques
- Stay focused on the learning objectives
- Be encouraging but intellectually challenging
- Reference the document content when relevant

Respond as the AI Facilitator in a natural, engaging way that promotes active learning and critical thinking.`;

    console.log('🎯 Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text().trim();

    console.log('🎯 Received response from Gemini');
    console.log('📝 AI response length:', aiResponse.length);

    console.log('📤 Sending successful response to client');
    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN DEBATE RESPONSE GENERATION');
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