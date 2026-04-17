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
    const normalized = normalizeText(content).slice(0, gateMaxChars());

    if (!normalized || normalized.length < 20) {
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
      method: 'cerebras-llama',
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
