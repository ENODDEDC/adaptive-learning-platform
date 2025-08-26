import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Smart prompt that adapts to user intent
    const createSmartPrompt = (userPrompt) => {
      // Detect user intent for length/complexity
      const isSimple = /simple|basic|brief|short|quick|easy|beginner/i.test(userPrompt);
      const isDetailed = /detailed|comprehensive|thorough|complete|in-depth|advanced/i.test(userPrompt);
      
      let lengthGuidance;
      if (isSimple) {
        lengthGuidance = "Keep it concise and easy to understand (400-600 words). Use simple language and clear explanations.";
      } else if (isDetailed) {
        lengthGuidance = "Provide comprehensive coverage (800-1200 words). Include detailed explanations and examples.";
      } else {
        lengthGuidance = "Provide balanced coverage (500-800 words). Match the complexity to the topic.";
      }

      return `
Create a well-organized document about: "${userPrompt}"

${lengthGuidance}

Document Structure:
- Title: Create a clear, descriptive title (DO NOT include words like "docx", "document", or file extensions)
- Introduction: Brief overview of the topic (2-3 paragraphs)
- Main Content: Organize into logical sections with clear headings
- Conclusion: Summary of key points

Guidelines:
- Write in a professional but accessible tone
- Use headings and subheadings to organize content
- Include relevant examples when helpful
- Keep paragraphs focused and well-structured
- Format properly for Word document compatibility
- Do not include any file format indicators in the content

Topic: ${userPrompt}
`;
    };

    const enhancedPrompt = createSmartPrompt(prompt);

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    let content = response.text();

    // Enhanced content cleanup
    const cleanContent = (text) => {
      return text
        // Remove common AI prefixes and file format indicators
        .replace(/^(markdown|```markdown|```|docx|\.docx)\s*/i, '')
        .replace(/```\s*$/i, '')
        .replace(/^Here's.*?document.*?:/i, '')
        .replace(/^I'll create.*?document.*?:/i, '')
        .replace(/^# Document\s*/i, '')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    content = cleanContent(content);

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document content' },
      { status: 500 }
    );
  }
}