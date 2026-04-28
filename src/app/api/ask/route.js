import { NextResponse } from 'next/server';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const TAVILY_API_URL = 'https://api.tavily.com/search';
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

const RESEARCH_SYSTEM_PROMPT = `You are a research assistant with access to real-time web search results.
Use the provided search results to give an accurate, up-to-date, well-structured answer.
Cite sources when referencing specific facts using [1], [2], etc.
Format your response clearly with numbered points where appropriate.
Do not write long run-on paragraphs — use line breaks between points.`;

export async function POST(request) {
  try {
    const { query, conversationHistory, mode } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Research mode — fetch real web results via Tavily first
    if (mode === 'Research') {
      const tavilyKey = process.env.TAVILY_API_KEY;

      if (!tavilyKey) {
        return NextResponse.json({
          response: 'Research mode requires a Tavily API key. Add TAVILY_API_KEY to your environment variables. Get a free key at tavily.com (1,000 free searches/month).'
        });
      }

      let searchContext = '';
      try {
        const tavilyRes = await fetch(TAVILY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: 'basic',
            max_results: 5,
            include_answer: true
          })
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          const results = tavilyData.results || [];
          searchContext = results.map((r, i) =>
            `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`
          ).join('\n\n');

          if (tavilyData.answer) {
            searchContext = `Quick Answer: ${tavilyData.answer}\n\nDetailed Sources:\n${searchContext}`;
          }
        }
      } catch (err) {
        console.error('Tavily search error:', err);
      }

      const messages = [
        { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
        {
          role: 'user',
          content: searchContext
            ? `Research query: "${query}"\n\nWeb search results:\n${searchContext}\n\nProvide a comprehensive answer based on these results.`
            : query
        }
      ];

      const res = await fetch(CEREBRAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: 1024, temperature: 0.5 })
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: 'AI request failed', details: err }, { status: 500 });
      }

      const data = await res.json();
      return NextResponse.json({ response: data.choices?.[0]?.message?.content || '' });
    }

    // Ask mode — platform-aware assistant
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-4).forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
    }

    messages.push({ role: 'user', content: query });

    const res = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 1024, temperature: 0.7 })
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'AI request failed', details: err }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ response: data.choices?.[0]?.message?.content || '' });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json({ error: 'Failed to generate AI response', details: error.message }, { status: 500 });
  }
}
