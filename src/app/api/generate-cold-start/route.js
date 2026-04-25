import { NextResponse } from 'next/server';
import { GroqGenAI } from '@/lib/groqGenAI';

const MODE_PROMPTS = {
  'Global Learning': `Give a big-picture overview. Format your response EXACTLY like this:

🌐 BIG PICTURE
[2-3 sentence summary of the whole topic]

🔑 KEY CONCEPTS
• [concept 1]: [brief explanation]
• [concept 2]: [brief explanation]
• [concept 3]: [brief explanation]

🔗 HOW THEY CONNECT
[1-2 sentences on how the concepts relate]

Keep it concise. Max 250 words.`,

  'Sequential Learning': `Break this into steps. Format EXACTLY like this:

📋 STEP-BY-STEP BREAKDOWN

Step 1: [title]
[brief explanation]

Step 2: [title]
[brief explanation]

Step 3: [title]
[brief explanation]

Step 4: [title]
[brief explanation]

Max 250 words.`,

  'Visual Learning': `Generate a Mermaid.js flowchart AND descriptions. Output EXACTLY in this format, nothing else:

DIAGRAM:
flowchart TD
    A[Main Topic] --> B[Concept 1]
    A --> C[Concept 2]
    B --> D[Detail 1]
    C --> E[Detail 2]

DESCRIPTIONS:
A: [one sentence what Main Topic means]
B: [one sentence what Concept 1 means]
C: [one sentence what Concept 2 means]
D: [one sentence what Detail 1 means]
E: [one sentence what Detail 2 means]

Rules: max 8 nodes, short node labels (max 4 words), descriptions max 15 words each.`,

  'Active Learning Hub': `Create practice challenges. Format EXACTLY like this:

🎯 PRACTICE CHALLENGES

❓ Question 1:
[short question]

❓ Question 2:
[short question]

❓ Question 3:
[short question]

💡 Quick Challenge:
[one hands-on mini task]

Max 250 words.`,

  'Reflective Learning': `Create reflection prompts. Format EXACTLY like this:

🤔 REFLECT & THINK DEEPER

💭 Prompt 1:
[deep reflection question]

💭 Prompt 2:
[deep reflection question]

💭 Prompt 3:
[connection to real life]

✍️ Journal Starter:
[sentence starter for journaling]

Max 250 words.`,
};

export async function POST(request) {
  try {
    const { content, mode, title } = await request.json();

    if (!content || !mode) {
      return NextResponse.json({ error: 'Missing content or mode' }, { status: 400 });
    }

    const prompt = MODE_PROMPTS[mode] || MODE_PROMPTS['Global Learning'];
    const truncatedContent = content.slice(0, 3000);

    const genAI = new GroqGenAI();
    const model = genAI.getGenerativeModel({ model: 'llama3.1-8b' });
    const result = await model.generateContent(
      `You are an adaptive learning assistant. Based on the following document content, ${prompt}\n\nDocument Title: ${title || 'Untitled'}\n\nContent:\n${truncatedContent}`
    );
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Cold start generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
