import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  console.log('🎯 =================================');
  console.log('🎯 ACADEMIC DISCUSSION API CALLED');
  console.log('🎯 =================================');

  try {
    console.log('📥 Parsing request body...');
    const { userInput, history, content, phase, concepts } = await request.json();

    console.log('📝 Request data received:');
    console.log('  - User input length:', userInput?.length);
    console.log('  - History entries:', history?.length || 0);
    console.log('  - Content length:', content?.length);
    console.log('  - Learning phase:', phase);
    console.log('  - Concepts count:', concepts?.length || 0);

    if (!userInput) {
      console.error('❌ VALIDATION ERROR: User input is required');
      return NextResponse.json(
        { success: false, error: 'User input is required' },
        { status: 400 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Create context from conversation history
    const conversationContext = history?.map(entry => 
      `${entry.type === 'user' ? 'Student' : 'AI Academic Partner'}: ${entry.content}`
    ).join('\n') || '';

    // Create concepts context
    const conceptsContext = concepts?.map(concept => 
      `- ${concept.title}: ${concept.description}`
    ).join('\n') || '';

    // Truncate content if too long
    const maxContentLength = 2000;
    const truncatedContent = content?.length > maxContentLength 
      ? content.substring(0, maxContentLength) + "..."
      : content;

    const prompt = `You are an AI Academic Discussion Partner specializing in active learning methodologies based on the Felder-Silverman Learning Style Model.

CONTEXT:
Document Content: "${truncatedContent}"

Extracted Concepts:
${conceptsContext}

Learning Phase: ${phase}

Previous Academic Discussion:
${conversationContext}

Latest Student Input: "${userInput}"

ROLE: You are simulating the collaborative learning environment that active learners prefer. Your responses should:

1. ENGAGE ACADEMICALLY - Provide scholarly, thoughtful responses
2. CHALLENGE CONSTRUCTIVELY - Ask probing questions that deepen understanding
3. CONNECT CONCEPTS - Help link ideas to broader academic frameworks
4. ENCOURAGE APPLICATION - Push toward real-world implementation
5. MAINTAIN RIGOR - Keep discussions at professional/academic level

RESPONSE GUIDELINES:
- Keep responses conversational yet academically rigorous (2-4 sentences)
- Ask 1-2 specific follow-up questions that promote deeper thinking
- Reference the document content and extracted concepts when relevant
- Encourage hands-on application and experimentation
- Use Socratic questioning techniques
- Acknowledge good insights while pushing for deeper analysis
- Connect to research-based learning principles when appropriate
- Write in plain text without markdown formatting (no asterisks, bold, or italics)
- Use natural, engaging language that feels like a real academic conversation
- Be encouraging and supportive while maintaining intellectual rigor

ACTIVE LEARNING FOCUS:
- Encourage direct engagement with material
- Promote collaborative thinking (even in solo learning)
- Push for immediate application of concepts
- Support experiential learning approaches

Respond as an AI Academic Discussion Partner in a way that promotes active learning and critical thinking.`;

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
    console.error('❌ ERROR IN ACADEMIC DISCUSSION');
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