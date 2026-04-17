import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Learnability classifier only — fixed model (not learning-mode generation). */
const GATE_MODEL = 'llama-3.1-8b-instant';

function gateModel() {
  return GATE_MODEL;
}

function gateMaxChars() {
  const n = parseInt(process.env.GROQ_GATE_MAX_CHARS || '8000', 10);
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
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GROQ_API_KEY not configured',
          method: 'groq-llama',
          unavailableReason: 'Server missing GROQ_API_KEY environment variable.'
        },
        { status: 503 }
      );
    }

    const { content } = await request.json();
    const normalized = normalizeText(content).slice(0, gateMaxChars());

    if (!normalized || normalized.length < 20) {
      return NextResponse.json({
        success: true,
        isEducational: false,
        confidence: 0,
        method: 'groq-llama',
        topLabel: 'Empty or unusable content',
        rejectionReason: 'Document text is empty or too short to analyze.',
        evidence: []
      });
    }

    const systemPrompt = [
      'You are a strict content classifier for an adaptive learning platform.',
      'The platform has 8 learning modes (AI Narrator, Visual Learning, Sequential, Global, Sensing/Hands-On, Intuitive/Theory, Active, Reflective) that transform any substantive informational content into study material.',
      'Decide whether the given document text is SUITABLE for these learning modes.',
      '',
      'ACCEPT (isEducational = true) any document that contains substantive informational content, including:',
      '- Lessons, tutorials, lecture notes, textbook chapters',
      '- Articles, research papers, reports, case studies',
      '- Technical documentation, manuals, how-to guides',
      '- Weekly progress reports, project write-ups, reflections about a topic',
      '- News or opinion articles with real information',
      '- Any document explaining, describing, or analyzing a topic',
      '',
      'REJECT (isEducational = false) only if the document is clearly unusable for learning, such as:',
      '- Advertisements, marketing flyers, promotional coupons',
      '- Receipts, invoices, billing statements, order confirmations',
      '- Restaurant menus, price lists',
      '- Blank forms with only labels/fields, no explanation',
      '- Navigation menus, link lists, site maps',
      '- Random binary noise, garbled/scanned text, gibberish',
      '- Pure lorem ipsum filler text',
      '',
      'Reply with a single JSON object only (no markdown fences, no text before or after).',
      'Schema:',
      '{ "isEducational": <true|false>, "confidence": <0-1 number>, "category": "<short label>", "reasoning": "<one sentence>", "evidence": ["<snippet1>", "<snippet2>"] }',
      'Use at most 2 evidence strings; each should be a short quote from the document when possible.'
    ].join('\n');

    const userPrompt = `Document excerpt to classify:\n\n"""\n${normalized}\n"""`;

    const model = gateModel();
    // Do not use response_format json_object — Groq returns 400 json_validate_failed for several models.
    const requestBody = {
      model,
      temperature: 0,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    let groqRes;
    for (let attempt = 0; attempt < 3; attempt++) {
      groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (groqRes.status === 429 && attempt < 2) {
        const body429 = await groqRes.text();
        const wait =
          groqRetryDelayMs(body429) ?? Math.min(1500 * 2 ** attempt, 20000);
        await sleep(wait);
        continue;
      }
      break;
    }

    if (!groqRes.ok) {
      const detailText = await groqRes.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: 'Groq classification failed',
          details: detailText,
          method: 'groq-llama',
          unavailableReason: `Groq API error (HTTP ${groqRes.status})`
        },
        { status: 503 }
      );
    }

    const groqJson = await groqRes.json();
    const rawContent = groqJson?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(rawContent);

    if (!parsed || typeof parsed.isEducational !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Groq returned unparseable response',
          details: rawContent,
          method: 'groq-llama',
          unavailableReason: 'Model did not return valid JSON.'
        },
        { status: 502 }
      );
    }

    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

    const evidenceArr = Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter(e => typeof e === 'string' && e.trim().length >= 10)
          .slice(0, 2)
          .map(text => ({ text: text.slice(0, 220), score: confidence }))
      : [];

    return NextResponse.json({
      success: true,
      isEducational: parsed.isEducational,
      confidence,
      margin: confidence,
      method: 'groq-llama',
      model,
      topLabel: parsed.category || (parsed.isEducational ? 'Learnable content' : 'Non-learnable content'),
      reasoning: parsed.reasoning || null,
      rejectionReason: parsed.isEducational ? null : (parsed.reasoning || 'Classified as non-learnable content.'),
      evidence: evidenceArr,
      decision: {
        meetsReadability: true,
        meetsConfidence: confidence >= 0.6,
        meetsMargin: true,
        hasEvidence: evidenceArr.length > 0,
        chunksUsed: 1
      }
    });
  } catch (error) {
    const details = error?.message ?? String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Educational gate failed',
        details,
        method: 'groq-llama',
        unavailableReason: details
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  const hasKey = !!process.env.GROQ_API_KEY;
  return NextResponse.json({
    success: true,
    method: 'groq-llama',
    model: gateModel(),
    status: hasKey ? 'ready' : 'missing-key',
    unavailableReason: hasKey ? null : 'GROQ_API_KEY not configured'
  });
}
