import { GroqGenAI as GoogleGenerativeAI, resolveOpenAICompatApiKey } from '@/lib/groqGenAI';

/**
 * Reflective learning: slow, inward, document-grounded prompts and anchors.
 */
class ReflectiveLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  extractJsonObject(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  }

  parsePayload(rawText) {
    const jsonStr = this.extractJsonObject(rawText);
    if (!jsonStr) throw new Error('No JSON object found in model output');
    return JSON.parse(jsonStr);
  }

  initializeModels() {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI();
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    }
  }

  normalizePayload(obj, truncatedContent) {
    if (!obj || typeof obj !== 'object') return;
    if (!Array.isArray(obj.readAnchors)) obj.readAnchors = [];
    if (!obj.phaseCopy || typeof obj.phaseCopy !== 'object') obj.phaseCopy = {};

    const excerpt = String(truncatedContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 480);

    const ensurePhase = (key, defaults) => {
      if (!obj.phaseCopy[key] || typeof obj.phaseCopy[key] !== 'object') {
        obj.phaseCopy[key] = { ...defaults };
      }
      const p = obj.phaseCopy[key];
      for (const [k, v] of Object.entries(defaults)) {
        if (p[k] === undefined || p[k] === null) p[k] = v;
        if (Array.isArray(v) && !Array.isArray(p[k])) p[k] = [];
      }
    };

    ensurePhase('absorption', { prompts: [] });
    ensurePhase('analysis', { prompts: [], challenges: [] });
    ensurePhase('architecture', { bullets: [], prompt: '' });
    ensurePhase('mastery', { prompts: [], capsulePrompt: '' });

    const fillPrompts = (key, lines) => {
      const arr = obj.phaseCopy[key].prompts;
      if (!Array.isArray(arr) || arr.length === 0) {
        obj.phaseCopy[key].prompts = [...lines];
      }
    };

    fillPrompts('absorption', [
      'What in this passage still feels fuzzy—and what phrase would you underline?',
      'Where does the author lean on a definition or example you want to sit with longer?'
    ]);
    fillPrompts('analysis', [
      'What claim is doing the most work here, and what would weaken it?',
      'If you disagreed politely, what is the smallest piece of text you would point to?'
    ]);
    if (!Array.isArray(obj.phaseCopy.analysis.challenges) || obj.phaseCopy.analysis.challenges.length === 0) {
      obj.phaseCopy.analysis.challenges = [
        'Name one assumption the reader is invited to make.',
        'What is left unsaid that matters for how you read the next section?'
      ];
    }
    if (!Array.isArray(obj.phaseCopy.architecture.bullets) || obj.phaseCopy.architecture.bullets.length === 0) {
      obj.phaseCopy.architecture.bullets = [
        'Main claim in one line',
        'Evidence or example the text returns to',
        'Implication you would carry into another chapter'
      ];
    }
    if (!obj.phaseCopy.architecture.prompt) {
      obj.phaseCopy.architecture.prompt =
        'Write three sentences that connect the excerpt to the rest of the document in your own words.';
    }
    if (!Array.isArray(obj.phaseCopy.mastery.prompts) || obj.phaseCopy.mastery.prompts.length === 0) {
      obj.phaseCopy.mastery.prompts = [
        'Explain the core idea to someone who has not read the page—without new jargon.',
        'What is one question you would ask the author after reading this?'
      ];
    }
    if (!obj.phaseCopy.mastery.capsulePrompt) {
      obj.phaseCopy.mastery.capsulePrompt =
        'In one short paragraph: what changed in your understanding after this session?';
    }

    if (obj.readAnchors.length === 0 && excerpt) {
      obj.readAnchors.push({
        title: 'Opening anchor',
        excerpt: excerpt.slice(0, 320),
        prompt: 'Read slowly twice. What is the author asking you to accept before moving on?'
      });
    }
    if (obj.readAnchors.length === 1 && excerpt.length > 360) {
      obj.readAnchors.push({
        title: 'Second pass',
        excerpt: excerpt.slice(320, 640),
        prompt: 'What detail only appears on a second read?'
      });
    }
  }

  validateShape(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid payload');
    if (!Array.isArray(obj.readAnchors) || obj.readAnchors.length < 1) {
      throw new Error('readAnchors required');
    }
    for (const a of obj.readAnchors) {
      if (!a || typeof a.excerpt !== 'string' || !a.excerpt.trim()) throw new Error('Each anchor needs excerpt');
    }
    const pc = obj.phaseCopy;
    if (!pc.absorption?.prompts?.length) throw new Error('absorption prompts required');
    if (!pc.analysis?.prompts?.length) throw new Error('analysis prompts required');
    if (!pc.architecture?.bullets?.length) throw new Error('architecture bullets required');
    if (!pc.mastery?.prompts?.length) throw new Error('mastery prompts required');
  }

  async repairJson(brokenText, truncatedContent, fileName) {
    this.initializeModels();
    if (!this.model) throw new Error('AI not available');

    const repairPrompt = `Fix malformed JSON for reflective learning grounded in a document.

File: "${fileName}"
Excerpt:
${truncatedContent}

Return ONLY valid minified JSON with this shape:
{
  "readAnchors": [ { "title": "", "excerpt": "", "prompt": "" } ],
  "phaseCopy": {
    "absorption": { "prompts": [] },
    "analysis": { "prompts": [], "challenges": [] },
    "architecture": { "bullets": [], "prompt": "" },
    "mastery": { "prompts": [], "capsulePrompt": "" }
  }
}

Broken output:
${String(brokenText).slice(0, 12000)}`;

    const result = await this.model.generateContent(repairPrompt);
    const text = (await result.response).text().trim();
    const parsed = this.parsePayload(text);
    this.normalizePayload(parsed, truncatedContent);
    this.validateShape(parsed);
    return parsed;
  }

  async generateReflectiveContent(content, fileName) {
    if (!resolveOpenAICompatApiKey()) {
      throw new Error(
        'Server misconfiguration: set CEREBRAS_API_KEY (for api.cerebras.ai) or GROQ_API_KEY (for api.groq.com) to match OPENAI_COMPAT_CHAT_URL'
      );
    }
    this.initializeModels();
    if (!this.model) throw new Error('AI not available');

    const maxLength = 12000;
    const truncatedContent =
      content.length > maxLength ? `${content.substring(0, maxLength)}\n…[truncated]` : content;

    const prompt = `You design a quiet reflective study guide for ONE learner reading ONE document.

Document file name: "${fileName}"
Document text (ground every excerpt and question in this—prefer verbatim excerpts):
"""
${truncatedContent}
"""

Reflective learners prefer time alone with text, probing assumptions, ordering ideas, then capturing a personal synthesis. No role-play, no group hype, no unrelated case studies.

Return ONLY a single JSON object (no markdown fences) with:
{
  "readAnchors": [
    { "title": "short label tied to the document", "excerpt": "COPY 1–4 sentences VERBATIM from the document text above (must appear inside the triple-quoted block)", "prompt": "one calm question about that excerpt only" }
  ],
  "phaseCopy": {
    "absorption": { "prompts": [ "3–5 short prompts about slow reading of THIS document" ] },
    "analysis": {
      "prompts": [ "3–5 prompts that probe claims, definitions, or evidence in THIS document" ],
      "challenges": [ "2–4 gentle challenges to the reader's assumptions about THIS text" ]
    },
    "architecture": {
      "bullets": [ "4–7 short bullets: how YOU would outline this document for yourself" ],
      "prompt": "one instruction to write a tight personal outline referencing only ideas present in the document"
    },
    "mastery": {
      "prompts": [ "3–5 prompts for explaining/teaching the ideas back without adding new sources" ],
      "capsulePrompt": "one prompt for a closing paragraph in the learner's own voice"
    }
}

Rules:
- readAnchors: at least 2 items; excerpts must be exact substrings from the document block (copy/paste).
- Every question must be answerable using only the document (no outside research).
- Keep language plain and unhurried.`;

    const run = async (suffix = '') => {
      const result = await this.model.generateContent(prompt + suffix);
      return (await result.response).text().trim();
    };

    let aiResponse = await run();
    let parsed;
    try {
      parsed = this.parsePayload(aiResponse);
      this.normalizePayload(parsed, truncatedContent);
      this.validateShape(parsed);
    } catch (e1) {
      try {
        parsed = await this.repairJson(aiResponse, truncatedContent, fileName);
      } catch (e2) {
        const strict =
          '\n\nYour last answer was invalid. Output ONLY one minified JSON object matching the schema. readAnchors excerpts must be verbatim from the document.';
        aiResponse = await run(strict);
        parsed = this.parsePayload(aiResponse);
        this.normalizePayload(parsed, truncatedContent);
        this.validateShape(parsed);
      }
    }

    return parsed;
  }
}

const reflectiveLearningService = new ReflectiveLearningService();
export default reflectiveLearningService;
