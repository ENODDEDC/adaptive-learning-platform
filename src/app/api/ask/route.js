import { NextResponse } from 'next/server';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = 'llama3.1-8b';

const SYSTEM_PROMPT = `You are an AI assistant for IntelEvo, an adaptive learning platform. Help students and instructors use the platform.

Platform features:
- Courses: Students join with a class code. Instructors create and manage courses.
- Feed Tab: Announcements, assignments, and forms from instructors. Students can comment.
- Activities Tab: All assignments, quizzes, materials, forms. Status badges: Not Started, In Progress, Submitted, Graded, Missed. Completed forms are hidden.
- Members Tab: All teachers and students in the course.
- My Grades Tab (students only): All submissions and grades for assignments and forms.
- Scores Tab (instructors only): Grade table for all students.
- Assignments: Students submit files, links, or text. Instructors grade and give feedback.
- Forms: Auto-graded quizzes (multiple choice, checkboxes, short answer).
- Materials: PDFs, DOCX, videos for reference.
- AI Assistant: Ask questions, research topics, generate documents.
- Smart Notes: Take notes while viewing course content.
- Learning Modes: Visual/Verbal, Active/Reflective, Sensing/Intuitive, Sequential/Global.

IMPORTANT FORMATTING RULES:
- Always put each numbered step on its own line
- Use "1. Step one" format with a newline after each step
- Keep responses concise and easy to read
- Do not write long run-on paragraphs`;

export async function POST(request) {
  try {
    const { query, conversationHistory, mode } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
    }

    messages.push({ role: 'user', content: query });

    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Cerebras API error:', err);
      return NextResponse.json({ error: 'AI request failed', details: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json({ error: 'Failed to generate AI response', details: error.message }, { status: 500 });
  }
}
