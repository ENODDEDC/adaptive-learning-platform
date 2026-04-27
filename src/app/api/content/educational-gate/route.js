import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const OPENAI_COMPAT_CHAT_URL = process.env.OPENAI_COMPAT_CHAT_URL || 'https://api.cerebras.ai/v1/chat/completions';

/** Learnability classifier only — fixed model (not learning-mode generation). */
const GATE_MODEL = 'llama3.1-8b';

function gateModel() {
  return GATE_MODEL;
}

function gateMaxChars() {
  const n = parseInt(process.env.CEREBRAS_GATE_MAX_CHARS || process.env.GROQ_GATE_MAX_CHARS || '8000', 10);
  if (!Number.isFinite(n) || n < 1500) return 8000;
  return Math.min(n, 12000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function groqRetryDelayMs(body) {
  if (!body || typeof body !== 'string') return null;
  const m = body.match(/try again in\s+([\d.]+)\s*ms/i);
  if (!m) return null;
  const ms = Number(m[1]);
  return Number.isFinite(ms) ? Math.min(Math.ceil(ms) + 200, 60000) : null;
}

function normalizeText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/[^\x20-\x7E\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSimpleSample(text, maxChars) {
  if (!text) return { sampledText: '', chunksUsed: 0 };
  if (text.length <= maxChars) return { sampledText: text, chunksUsed: 1 };

  const sectionSize = Math.max(500, Math.floor(maxChars / 3));
  const totalLen = text.length;

  const start = text.slice(0, sectionSize);
  const middleStart = Math.max(0, Math.floor((totalLen - sectionSize) / 2));
  const middle = text.slice(middleStart, middleStart + sectionSize);
  const end = text.slice(Math.max(0, totalLen - sectionSize));

  const sections = [
    `[START]\n${start}`,
    `[MIDDLE]\n${middle}`,
    `[END]\n${end}`
  ];

  return { 
    sampledText: sections.join('\n\n'), 
    chunksUsed: 3 
  };
}

function extractJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'CEREBRAS_API_KEY not configured',
          method: 'cerebras-llama',
          unavailableReason: 'Server missing CEREBRAS_API_KEY environment variable.'
        },
        { status: 503 }
      );
    }

    const { content } = await request.json();
    const normalized = normalizeText(content);
    const { sampledText, chunksUsed } = buildSimpleSample(normalized, gateMaxChars());

    if (!sampledText || sampledText.length < 20) {
      return NextResponse.json({
        success: true,
        isEducational: false,
        confidence: 0,
        method: 'cerebras-llama',
        topLabel: 'Empty or unusable content',
        rejectionReason: 'Document text is empty or too short to analyze.',
        evidence: []
      });
    }

    const systemPrompt = [
      'You are an intelligent content analyzer for an educational platform.',
      'Your task is to determine if the given document contains content that students could learn from.',
      '',
      'Analyze the document and decide: Can a student gain knowledge, understanding, or skills from this content?',
      '',
      'Consider the document as educational if it:',
      '- Teaches concepts, ideas, or skills',
      '- Provides information that expands knowledge',
      '- Explains processes, theories, or methods',
      '- Contains analysis, research, or insights',
      '- Offers instructional or informational value',
      '',
      'Consider it non-educational if it:',
      '- Is purely administrative (forms, schedules, invoices)',
      '- Contains only procedural information without learning value',
      '- Is primarily promotional or marketing material',
      '- Lacks substantive informational content',
      '',
      'Use your intelligence to make this judgment - focus on the overall learning potential rather than specific keywords.',
      '',
      'Respond with only a JSON object:',
      '{ "isEducational": <true|false>, "confidence": <0-1>, "reasoning": "<brief explanation>" }'
    ].join('\n');

    const userPrompt = `Please analyze this document content and determine if it has educational value:\n\n"""\n${sampledText}\n"""`;

    const model = gateModel();
    const requestBody = {
      model,
      temperature: 0.1, // Slightly higher for more nuanced analysis
      max_tokens: 200, // Reduced since we simplified the response
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    let gateRes;
    for (let attempt = 0; attempt < 3; attempt++) {
      gateRes = await fetch(OPENAI_COMPAT_CHAT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (gateRes.status === 429 && attempt < 2) {
        const body429 = await gateRes.text();
        const wait =
          groqRetryDelayMs(body429) ?? Math.min(1500 * 2 ** attempt, 20000);
        await sleep(wait);
        continue;
      }
      break;
    }

    if (!gateRes.ok) {
      const detailText = await gateRes.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: 'Educational classification failed',
          details: detailText,
          method: 'cerebras-llama',
          unavailableReason: `Provider API error (HTTP ${gateRes.status})`
        },
        { status: 503 }
      );
    }

    const gateJson = await gateRes.json();
    const rawContent = gateJson?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(rawContent);

    if (!parsed || typeof parsed.isEducational !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider returned unparseable response',
          details: rawContent,
          method: 'cerebras-llama',
          unavailableReason: 'Model did not return valid JSON.'
        },
        { status: 502 }
      );
    }

    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

    return NextResponse.json({
      success: true,
      isEducational: parsed.isEducational,
      confidence,
      margin: confidence,
      method: 'cerebras-llama',
      model,
      topLabel: parsed.isEducational ? 'Educational content' : 'Non-educational content',
      reasoning: parsed.reasoning || null,
      rejectionReason: parsed.isEducational ? null : (parsed.reasoning || 'Content lacks educational value.'),
      evidence: [], // Simplified - no evidence extraction needed
      decision: {
        meetsReadability: true,
        meetsConfidence: confidence >= 0.5,
        meetsMargin: true,
        hasEvidence: true,
        chunksUsed
      }
    });
  } catch (error) {
    const details = error?.message ?? String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Educational gate failed',
        details,
        method: 'cerebras-llama',
        unavailableReason: details
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  const hasKey = !!process.env.CEREBRAS_API_KEY;
  return NextResponse.json({
    success: true,
    method: 'cerebras-llama',
    model: gateModel(),
    status: hasKey ? 'ready' : 'missing-key',
    unavailableReason: hasKey ? null : 'CEREBRAS_API_KEY not configured'
  });
}
