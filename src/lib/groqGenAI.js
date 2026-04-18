/**
 * OpenAI-compatible drop-in replacement for the subset of the
 * @google/generative-ai SDK that the learning-mode services use.
 *
 * Supported surface:
 *   const genAI = new GroqGenAI(apiKey);
 *   const model = genAI.getGenerativeModel({ model: "..." });
 *   const result = await model.generateContent(prompt);
 *   const response = await result.response;
 *   const text = response.text();
 *
 * Learning-mode **content generation** defaults to `llama3.1-8b` on Cerebras.
 * Override with **CEREBRAS_CONTENT_MODEL** / **CEREBRAS_GENERATION_MODEL**
 * / **CEREBRAS_DEFAULT_MODEL** (or legacy GROQ_* vars).
 * The educational gate is fixed to **`llama-3.1-8b-instant`** in
 * `src/app/api/content/educational-gate/route.js`.
 */

const OPENAI_COMPAT_CHAT_URL = process.env.OPENAI_COMPAT_CHAT_URL || 'https://api.cerebras.ai/v1/chat/completions';
/** Default for learning modes after the gate passes. */
const DEFAULT_CONTENT_MODEL = 'llama3.1-8b';
const GROQ_MAX_ATTEMPTS = 3;

/**
 * Bearer token for OPENAI_COMPAT_CHAT_URL.
 * Default host is Cerebras — use CEREBRAS_API_KEY first so a stray/wrong GROQ_API_KEY does not break Cerebras calls.
 * If the URL is Groq, prefer GROQ_API_KEY first.
 */
export function resolveOpenAICompatApiKey(explicit) {
  const trimmed =
    explicit !== undefined && explicit !== null && String(explicit).trim()
      ? String(explicit).trim()
      : '';
  if (trimmed) return trimmed;

  const url = (process.env.OPENAI_COMPAT_CHAT_URL || '').toLowerCase();
  const cerebras = (process.env.CEREBRAS_API_KEY && String(process.env.CEREBRAS_API_KEY).trim()) || '';
  const groq = (process.env.GROQ_API_KEY && String(process.env.GROQ_API_KEY).trim()) || '';

  if (url.includes('groq.com')) {
    return groq || cerebras;
  }
  return cerebras || groq;
}

function isGroqModelId(model) {
  if (typeof model !== 'string') return false;
  const value = model.trim().toLowerCase();
  return (
    value.startsWith('groq/') ||
    value.startsWith('llama-') ||
    value.startsWith('meta-llama/') ||
    value.startsWith('openai/') ||
    value.startsWith('qwen/') ||
    value.startsWith('deepseek/')
  );
}

/** Model id for learning-mode content generation (not the educational gate). */
export function resolveGroqContentModel() {
  return (
    process.env.CEREBRAS_CONTENT_MODEL ||
    process.env.CEREBRAS_GENERATION_MODEL ||
    process.env.CEREBRAS_DEFAULT_MODEL ||
    process.env.GROQ_CONTENT_MODEL ||
    process.env.GROQ_GENERATION_MODEL ||
    process.env.GROQ_DEFAULT_MODEL ||
    DEFAULT_CONTENT_MODEL
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse "Please try again in 12345ms" from provider rate-limit bodies */
function groqRetryDelayMs(body) {
  if (!body || typeof body !== 'string') return null;
  const m = body.match(/try again in\s+([\d.]+)\s*ms/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.min(Math.ceil(n) + 200, 60000) : null;
}

/** Pull user text from @google/generative-ai style payloads (e.g. image prompts). */
function extractPromptFromGeminiInput(input) {
  if (!input || typeof input !== 'object') return '';
  if (typeof input.text === 'string') return input.text;
  const contents = input.contents;
  if (!Array.isArray(contents)) return '';
  const chunks = [];
  for (const block of contents) {
    const parts = block?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      if (typeof p?.text === 'string') chunks.push(p.text);
    }
  }
  return chunks.join('\n').trim();
}

async function groqGenerate({ apiKey, model, prompt, temperature = 0.2, maxTokens = 8192 }) {
  if (!apiKey) {
    throw new Error('Set CEREBRAS_API_KEY or GROQ_API_KEY (must match OPENAI_COMPAT_CHAT_URL host)');
  }

  let lastDetails = '';
  for (let attempt = 0; attempt < GROQ_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(OPENAI_COMPAT_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
          }
        ]
      })
    });

    if (res.status === 429 && attempt < GROQ_MAX_ATTEMPTS - 1) {
      lastDetails = await res.text().catch(() => '');
      const wait =
        groqRetryDelayMs(lastDetails) ?? Math.min(1500 * 2 ** attempt, 20000);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      const details = await res.text().catch(() => '');
      const err = new Error(`Provider API error (HTTP ${res.status}): ${details}`);
      err.status = res.status;
      throw err;
    }

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? '';
    return text;
  }

  const err = new Error(`Provider API error (HTTP 429): ${lastDetails}`);
  err.status = 429;
  throw err;
}

class GroqGenerativeModel {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_CONTENT_MODEL;
  }

  async generateContent(input) {
    // @google/generative-ai accepts either a string or an array of content parts.
    let prompt = '';
    if (typeof input === 'string') {
      prompt = input;
    } else if (Array.isArray(input)) {
      prompt = input
        .map(part => (typeof part === 'string' ? part : part?.text || ''))
        .filter(Boolean)
        .join('\n');
    } else if (input && typeof input === 'object') {
      prompt =
        extractPromptFromGeminiInput(input) ||
        (typeof input.text === 'string' ? input.text : '') ||
        JSON.stringify(input);
    }

    const text = await groqGenerate({
      apiKey: this.apiKey,
      model: this.model,
      prompt
    });

    const responseShim = {
      text: () => text
    };

    return {
      response: Promise.resolve(responseShim)
    };
  }
}

export class GroqGenAI {
  constructor(apiKey) {
    this.apiKey = resolveOpenAICompatApiKey(apiKey);
  }

  getGenerativeModel(config = {}) {
    const requestedModel = config?.model;
    const groqModel = isGroqModelId(requestedModel)
      ? requestedModel
      : resolveGroqContentModel();
    return new GroqGenerativeModel({ apiKey: this.apiKey, model: groqModel });
  }
}

export default GroqGenAI;
