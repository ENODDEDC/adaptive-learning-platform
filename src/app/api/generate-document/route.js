import { NextResponse } from 'next/server';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = 'llama3.1-8b';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const isSimple = /simple|basic|brief|short|quick|easy|beginner/i.test(prompt);
    const isDetailed = /detailed|comprehensive|thorough|complete|in-depth|advanced/i.test(prompt);

    let lengthGuidance;
    if (isSimple) {
      lengthGuidance = 'Keep it concise and easy to understand (400-600 words).';
    } else if (isDetailed) {
      lengthGuidance = 'Provide comprehensive coverage (800-1200 words).';
    } else {
      lengthGuidance = 'Provide balanced coverage (500-800 words).';
    }

    const systemPrompt = `You are a professional document writer. Create well-organized, clearly structured documents. ${lengthGuidance}

STRICT RULES:
- Start with the document title using # (e.g., # What is Bitcoin?)
- Use ## for section headings (e.g., ## History of Bitcoin)
- Do NOT include generic structural labels like "Main Content", "Conclusion", "Introduction" as standalone headings
- Integrate introduction and conclusion naturally as paragraphs without labeling them
- Use numbered lists (1. 2. 3.) or bullet points (- ) where appropriate
- Do not include file format indicators or markdown code blocks
- Write the actual content directly, no meta-commentary like "Here is your document"`;

    const userPrompt = `Write a document about: "${prompt}"`;

    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Cerebras API error:', err);
      return NextResponse.json({ error: 'AI request failed', details: err }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Clean up
    content = content
      .replace(/^(```markdown|```)\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/^Here's.*?document.*?:\n?/im, '')
      .replace(/^Here is.*?document.*?:\n?/im, '')
      // Remove generic structural labels
      .replace(/^#{1,3}\s*(Main Content|Introduction|Conclusion|Overview)\s*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: 'Failed to generate document content' }, { status: 500 });
  }
}
