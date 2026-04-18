import { GroqGenAI as GoogleGenerativeAI } from '@/lib/groqGenAI';

class SensingLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.CEREBRAS_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "llama3.1-8b"
        });
        console.log('🔬 Sensing Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Sensing Learning Service:', error);
      }
    }
  }

  parseJsonFromModelResponse(text) {
    if (!text) throw new Error('Empty model response');
    const cleaned = text
      .replace(/```json/gi, '```')
      .replace(/```/g, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    const candidates = [];
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
    }
    candidates.push(cleaned);

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        // try next candidate
      }
    }
    throw new Error('Failed to parse JSON from model response');
  }

  async generateStrictJson(prompt, schemaDescription) {
    this.initializeModels();
    if (!this.model) throw new Error('Sensing learning model not available');

    const firstResult = await this.model.generateContent(prompt);
    const firstResponse = await firstResult.response;
    const firstText = firstResponse.text();

    try {
      return this.parseJsonFromModelResponse(firstText);
    } catch {
      const repairPrompt = `
Return ONLY valid JSON (no markdown, no comments) that matches this schema:
${schemaDescription}

Content to repair:
${String(firstText || '').slice(0, 5000)}
`;
      const repairResult = await this.model.generateContent(repairPrompt);
      const repairResponse = await repairResult.response;
      return this.parseJsonFromModelResponse(repairResponse.text());
    }
  }

  async generateStrictJsonWith413Retry(buildPrompt, schemaDescription) {
    const excerptLimits = [2200, 1600, 1200, 800, 500];
    let lastError = null;
    for (const limit of excerptLimits) {
      try {
        return await this.generateStrictJson(buildPrompt(limit), schemaDescription);
      } catch (error) {
        const message = String(error?.message || '');
        const is413 = /HTTP 413|Request Entity Too Large|request_too_large/i.test(message);
        if (!is413) throw error;
        lastError = error;
      }
    }
    throw lastError || new Error('AI request too large after retries');
  }

  normalizeSimulationsPayload(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.simulations)) return payload.simulations;
    if (Array.isArray(payload.interactiveSimulations)) return payload.interactiveSimulations;
    if (Array.isArray(payload.labs)) return payload.labs;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  normalizeChallengesPayload(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.challenges)) return payload.challenges;
    if (Array.isArray(payload.practicalChallenges)) return payload.practicalChallenges;
    if (Array.isArray(payload.tasks)) return payload.tasks;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  static LAB_PATTERNS = new Set(['slider_readout', 'dual_input_calculate', 'dropdown_readout']);

  coerceNumber(value, fallback = 0) {
    const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : fallback;
  }

  parseSliderBoundsFromRange(range) {
    const s = String(range ?? '');
    const parts = s.split(/[-–]/).map((p) => parseFloat(String(p).trim()));
    if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
      return { min: parts[0], max: parts[1] };
    }
    return { min: 0, max: 100 };
  }

  /**
   * Normalize one simulation to a fixed labPattern the UI can render reliably.
   */
  normalizeSimulation(sim) {
    if (!sim || typeof sim !== 'object') return null;
    const pattern = String(sim.labPattern || '').trim();
    if (SensingLearningService.LAB_PATTERNS.has(pattern)) {
      return this.normalizeFixedPatternSim(pattern, sim);
    }
    return this.legacySimulationToFixedPattern(sim);
  }

  normalizeFixedPatternSim(pattern, sim) {
    const base = {
      labPattern: pattern,
      title: String(sim.title || 'Interactive lab').slice(0, 200),
      description: String(sim.description || '').slice(0, 2000),
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(String(sim.difficulty))
        ? sim.difficulty
        : 'beginner',
      estimatedTime: String(sim.estimatedTime || '10–15 min').slice(0, 40),
      learningObjectives: Array.isArray(sim.learningObjectives)
        ? sim.learningObjectives.map((x) => String(x)).filter(Boolean).slice(0, 8)
        : [],
      stepByStepGuide: Array.isArray(sim.stepByStepGuide)
        ? sim.stepByStepGuide.map((x) => String(x)).filter(Boolean).slice(0, 12)
        : [],
      expectedOutcomes: String(sim.expectedOutcomes || '').slice(0, 1500),
      realWorldApplication: String(sim.realWorldApplication || '').slice(0, 1500)
    };

    if (pattern === 'slider_readout') {
      let min = this.coerceNumber(sim.sliderMin, 0);
      let max = this.coerceNumber(sim.sliderMax, 100);
      if (min > max) [min, max] = [max, min];
      if (min === max) max = min + 1;
      let def = this.coerceNumber(sim.sliderDefault, min);
      def = Math.min(max, Math.max(min, def));
      return {
        ...base,
        sliderLabel: String(sim.sliderLabel || 'Value').slice(0, 120),
        sliderMin: min,
        sliderMax: max,
        sliderDefault: def,
        sliderStep: Math.max(0.0001, this.coerceNumber(sim.sliderStep, (max - min) / 100 || 1)),
        sliderUnit: String(sim.sliderUnit || '').slice(0, 24),
        readoutLabel: String(sim.readoutLabel || 'Current value').slice(0, 120),
        readoutDescription: String(sim.readoutDescription || '').slice(0, 500)
      };
    }

    if (pattern === 'dual_input_calculate') {
      const combineRaw = String(sim.combine || 'sum').toLowerCase();
      const combine = ['sum', 'product', 'mean'].includes(combineRaw) ? combineRaw : 'sum';
      return {
        ...base,
        inputALabel: String(sim.inputALabel || 'Input A').slice(0, 120),
        inputBLabel: String(sim.inputBLabel || 'Input B').slice(0, 120),
        inputADefault: this.coerceNumber(sim.inputADefault, 0),
        inputBDefault: this.coerceNumber(sim.inputBDefault, 0),
        combine,
        readoutLabel: String(sim.readoutLabel || 'Result').slice(0, 120),
        readoutDescription: String(sim.readoutDescription || '').slice(0, 500)
      };
    }

    if (pattern === 'dropdown_readout') {
      let options = Array.isArray(sim.options) ? sim.options.map((x) => String(x).trim()).filter(Boolean) : [];
      if (options.length < 2) options = ['Option A', 'Option B'];
      let descriptions = Array.isArray(sim.optionDescriptions)
        ? sim.optionDescriptions.map((x) => String(x)).slice(0, options.length)
        : [];
      while (descriptions.length < options.length) {
        descriptions.push(`About: ${options[descriptions.length]}`);
      }
      let defaultOption = String(sim.defaultOption || options[0]);
      if (!options.includes(defaultOption)) defaultOption = options[0];
      return {
        ...base,
        dropdownLabel: String(sim.dropdownLabel || 'Choose').slice(0, 120),
        options,
        optionDescriptions: descriptions.slice(0, options.length),
        defaultOption,
        readoutTitle: String(sim.readoutTitle || 'Selection').slice(0, 120)
      };
    }

    return null;
  }

  legacySimulationToFixedPattern(sim) {
    const elements = Array.isArray(sim.interactiveElements) ? sim.interactiveElements : [];
    const dropdown = elements.find((e) => e.type === 'dropdown');
    const sliders = elements.filter((e) => e.type === 'slider');
    const numericLike = elements.filter((e) => e.type === 'slider' || e.type === 'input');

    if (dropdown) {
      const opts = Array.isArray(dropdown.range)
        ? dropdown.range.map((x) => String(x).trim()).filter(Boolean)
        : String(dropdown.range || '')
            .split(/[,|]/)
            .map((s) => s.trim())
            .filter(Boolean);
      return this.normalizeFixedPatternSim('dropdown_readout', {
        ...sim,
        dropdownLabel: dropdown.name || 'Choose',
        options: opts.length >= 2 ? opts : ['A', 'B'],
        optionDescriptions: (opts.length >= 2 ? opts : ['A', 'B']).map(
          (_, i) => String(dropdown.description || sim.description || `Item ${i + 1}`)
        ),
        defaultOption: String(dropdown.defaultValue || opts[0] || 'A')
      });
    }

    if (numericLike.length >= 2) {
      const a = numericLike[0];
      const b = numericLike[1];
      const dp0 = Array.isArray(sim.dataPoints) ? sim.dataPoints[0] : null;
      const combine = String(dp0?.combine || 'sum').toLowerCase();
      return this.normalizeFixedPatternSim('dual_input_calculate', {
        ...sim,
        inputALabel: a.name || 'Input A',
        inputBLabel: b.name || 'Input B',
        inputADefault: this.coerceNumber(a.defaultValue, 0),
        inputBDefault: this.coerceNumber(b.defaultValue, 0),
        combine: ['sum', 'product', 'mean'].includes(combine) ? combine : 'sum',
        readoutLabel: dp0?.label || 'Result',
        readoutDescription: dp0?.description || ''
      });
    }

    const el = sliders[0] || numericLike[0];
    if (el) {
      const { min, max } = this.parseSliderBoundsFromRange(el.range);
      const dp0 = Array.isArray(sim.dataPoints) ? sim.dataPoints[0] : null;
      return this.normalizeFixedPatternSim('slider_readout', {
        ...sim,
        sliderLabel: el.name || 'Value',
        sliderMin: min,
        sliderMax: max,
        sliderDefault: this.coerceNumber(el.defaultValue, min),
        sliderUnit: el.unit || '',
        readoutLabel: dp0?.label || 'Readout',
        readoutDescription: dp0?.description || el.description || ''
      });
    }

    return this.normalizeFixedPatternSim('slider_readout', {
      ...sim,
      sliderLabel: 'Explore',
      sliderMin: 0,
      sliderMax: 10,
      sliderDefault: 0,
      readoutLabel: 'Value',
      readoutDescription: sim.description || ''
    });
  }

  /**
   * Analyze if content is educational using the SAME logic as other learning features
   */
  async analyzeContentForEducation(docxText) {
    if (!docxText || docxText.trim().length < 50) {
      return { 
        isEducational: false, 
        reasoning: 'Content too short to analyze',
        confidence: 0,
        contentType: 'Insufficient content'
      };
    }
    // Client already passes the educational gate (Groq-backed) before calling
    // this endpoint; skip the redundant LLM re-check.
    return {
      isEducational: true,
      confidence: 1,
      reasoning: 'Educational gate already verified at client layer',
      contentType: 'Verified learnable content'
    };
    /* eslint-disable no-unreachable */

    try {
      console.log('🔬 Sensing Learning: Using same AI analysis logic as other learning features...');
      
      this.initializeModels();
      
      if (!this.genAI) {
        throw new Error('Google AI service not available');
      }

      // Truncate content if too long (same as other features)
      const maxLength = 4000;
      const truncatedContent = docxText.length > maxLength 
        ? docxText.substring(0, maxLength) + "..."
        : docxText;

      const prompt = `
You are an AI content analyzer. Your task is to determine if the given document content is educational/learning material that would be suitable for hands-on learning and experimentation.

Educational content includes:
- Lessons, tutorials, or instructional materials
- Academic subjects (math, science, history, literature, etc.)
- Study materials, textbooks, or course content
- Explanatory content that teaches concepts
- Research papers or academic articles
- Training materials or how-to guides
- Educational exercises or examples

Non-educational content includes:
- Administrative announcements or memos
- Schedules, calendars, or event listings
- Policy documents or procedures
- Forms, applications, or certificates
- Personal letters or informal communications
- News updates or notifications
- Business documents (invoices, receipts, etc.)
- Meeting minutes or agendas

Analyze the following document content and determine if it's educational material suitable for hands-on learning:

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a JSON object containing:
{
  "isEducational": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "contentType": "Brief description of what type of content this is"
}

Be strict in your analysis - only classify content as educational if it genuinely contains learning material that students could benefit from hands-on learning assistance.`;

      const model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text().trim();
      
      // Parse the AI response (same logic as other features)
      let analysisResult;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          analysisResult = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
        
        // Fallback analysis if AI response is malformed
        const content_lower = docxText.toLowerCase();
        const hasEducationalTerms = /\b(learn|study|understand|concept|theory|lesson|tutorial|chapter|example|exercise|definition|explanation)\b/i.test(content_lower);
        const hasAdminTerms = /\b(announcement|memo|schedule|meeting|policy|form|application|notice|reminder)\b/i.test(content_lower);
        
        const fallbackResult = hasEducationalTerms && !hasAdminTerms;
        
        return {
          isEducational: fallbackResult,
          confidence: 0.3,
          reasoning: 'Fallback analysis due to AI response parsing failure',
          contentType: 'Unknown - analyzed with basic heuristics'
        };
      }

      console.log('🔬 Sensing Learning AI Analysis Result:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      return {
        isEducational: analysisResult.isEducational || false,
        confidence: analysisResult.confidence || 0.5,
        reasoning: analysisResult.reasoning || 'Analysis completed',
        contentType: analysisResult.contentType || 'Unknown'
      };

    } catch (error) {
      console.error('❌ Error in AI content analysis:', error);
      
      // Fallback analysis if AI fails
      const content_lower = docxText.toLowerCase();
      const hasEducationalTerms = /\b(learn|study|understand|concept|theory|lesson|tutorial|chapter|example|exercise|definition|explanation)\b/i.test(content_lower);
      const hasAdminTerms = /\b(announcement|memo|schedule|meeting|policy|form|application|notice|reminder)\b/i.test(content_lower);
      
      const fallbackResult = hasEducationalTerms && !hasAdminTerms;
      
      return {
        isEducational: fallbackResult,
        confidence: 0.3,
        reasoning: 'Fallback analysis due to AI service unavailability',
        contentType: 'Unknown - analyzed with basic heuristics'
      };
    }
  }

  /**
   * Generate hands-on learning content from document text (with educational analysis)
   */
  async generateHandsOnContent(docxText) {
    this.initializeModels();

    if (!this.model) {
      throw new Error('Sensing learning model not available');
    }

    try {
      // First, analyze if content is educational
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for hands-on learning. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for hands-on learning generation');

      const simulations = await this.generateInteractiveSimulations(docxText);
      const challenges = await this.generatePracticalChallenges(docxText);

      return {
        success: true,
        simulations,
        challenges,
        analysis
      };
    } catch (error) {
      console.error('Error generating hands-on content:', error);
      const wrapped = new Error(
        `Failed to generate hands-on learning content: ${error?.message || error}`
      );
      wrapped.cause = error;
      throw wrapped;
    }
  }

  /**
   * Generate interactive simulations for hands-on learning
   */
  async generateInteractiveSimulations(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const buildPrompt = (maxChars) => `
    You are creating INTERACTIVE LABS for sensing learners. The UI only supports THREE fixed patterns.
    You MUST set "labPattern" on every simulation to exactly one of:
    - "slider_readout" — one numeric slider and one live numeric readout tied to that slider
    - "dual_input_calculate" — two numeric inputs and one readout = sum OR product OR mean of the two
    - "dropdown_readout" — a dropdown of string options and a text readout that explains the selected option

    Document Content:
    ${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}

    Return JSON with exactly 3 simulations when the document allows; use each labPattern at least once (order flexible).
    All copy, numbers, ranges, and option text must come from the document's ideas (no generic placeholders like "Option 1").

    Schema examples (each object must match ONE pattern only):

    slider_readout:
    { "labPattern":"slider_readout", "title":"...", "description":"...", "difficulty":"beginner|intermediate|advanced",
      "estimatedTime":"10-15 min", "sliderLabel":"...", "sliderMin":0, "sliderMax":100, "sliderDefault":10,
      "sliderStep":1, "sliderUnit":"", "readoutLabel":"...", "readoutDescription":"...",
      "learningObjectives":["..."], "realWorldApplication":"...", "stepByStepGuide":["..."], "expectedOutcomes":"..." }

    dual_input_calculate:
    { "labPattern":"dual_input_calculate", "title":"...", "description":"...", "difficulty":"...",
      "estimatedTime":"...", "inputALabel":"...", "inputBLabel":"...", "inputADefault":1, "inputBDefault":2,
      "combine":"sum|product|mean", "readoutLabel":"...", "readoutDescription":"...",
      "learningObjectives":["..."], "realWorldApplication":"...", "stepByStepGuide":["..."], "expectedOutcomes":"..." }

    dropdown_readout:
    { "labPattern":"dropdown_readout", "title":"...", "description":"...", "difficulty":"...",
      "estimatedTime":"...", "dropdownLabel":"...", "options":["...","..."],
      "optionDescriptions":["...","..."] (same length as options), "defaultOption": must equal options[0] or another option value,
      "readoutTitle":"...", "learningObjectives":["..."], "realWorldApplication":"...", "stepByStepGuide":["..."], "expectedOutcomes":"..." }

    Do NOT include interactiveElements, dataPoints, buttons, graphs, or any other controls.
    `;

    const schemaDescription = `{
  "simulations": [
    {
      "labPattern": "slider_readout",
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "string",
      "sliderLabel": "string",
      "sliderMin": 0,
      "sliderMax": 100,
      "sliderDefault": 0,
      "sliderStep": 1,
      "sliderUnit": "string",
      "readoutLabel": "string",
      "readoutDescription": "string",
      "learningObjectives": ["string"],
      "realWorldApplication": "string",
      "stepByStepGuide": ["string"],
      "expectedOutcomes": "string"
    },
    {
      "labPattern": "dual_input_calculate",
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "string",
      "inputALabel": "string",
      "inputBLabel": "string",
      "inputADefault": 0,
      "inputBDefault": 0,
      "combine": "sum|product|mean",
      "readoutLabel": "string",
      "readoutDescription": "string",
      "learningObjectives": ["string"],
      "realWorldApplication": "string",
      "stepByStepGuide": ["string"],
      "expectedOutcomes": "string"
    },
    {
      "labPattern": "dropdown_readout",
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "string",
      "dropdownLabel": "string",
      "options": ["string"],
      "optionDescriptions": ["string"],
      "defaultOption": "string",
      "readoutTitle": "string",
      "learningObjectives": ["string"],
      "realWorldApplication": "string",
      "stepByStepGuide": ["string"],
      "expectedOutcomes": "string"
    }
  ]
}`;

    const simulationsPayload = await this.generateStrictJsonWith413Retry(buildPrompt, schemaDescription);

    let rawList = this.normalizeSimulationsPayload(simulationsPayload);

    // Recovery pass: fixed patterns only
    if (!rawList.length) {
      const rescuePayload = await this.generateStrictJsonWith413Retry(
        (maxChars) => `
Return ONLY JSON: { "simulations": [ ... ] }
Each item MUST have "labPattern" exactly "slider_readout" OR "dual_input_calculate" OR "dropdown_readout" and all fields for that pattern from the schema.
No interactiveElements or dataPoints.

Document excerpt:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}
`,
        schemaDescription
      );
      rawList = this.normalizeSimulationsPayload(rescuePayload);
    }

    const simulations = rawList.map((s) => this.normalizeSimulation(s)).filter(Boolean);
    if (!simulations.length) throw new Error('AI returned no interactive simulations');
    return simulations;
  }

  /**
   * Generate practical challenges for hands-on learning
   */
  async generatePracticalChallenges(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const buildPrompt = (maxChars) => `
    You are creating PRACTICAL CHALLENGES for sensing learners who learn by doing.

    Document Content:
    ${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}

    Sensing learners need:
    1. HANDS-ON tasks they can complete
    2. CONCRETE problems with clear solutions
    3. STEP-BY-STEP procedures to follow
    4. IMMEDIATE feedback on their progress

    Create practical challenges based on the document content:

    {
      "challenges": [
        {
          "title": "Challenge Name",
          "description": "What this challenge teaches through hands-on practice",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTime": "15-20 min",
          "category": "calculation|analysis|experiment|problem_solving|data_collection",
          "materials": ["material 1", "material 2", "material 3"],
          "procedure": [
            {
              "step": 1,
              "instruction": "Clear, actionable instruction",
              "expectedResult": "What should happen",
              "tips": "Helpful hints for success"
            }
          ],
          "checkpoints": [
            {
              "checkpoint": "Milestone name",
              "criteria": "How to verify completion",
              "troubleshooting": "What to do if stuck"
            }
          ],
          "successMetrics": [
            "Concrete measure of success 1",
            "Concrete measure of success 2"
          ],
          "realWorldConnection": "How this applies in practice",
          "extensionActivities": ["Additional challenge 1", "Additional challenge 2"],
          "resources": ["Tool or resource 1", "Tool or resource 2"]
        }
      ]
    }

    Focus on creating ACTIONABLE challenges that sensing learners can complete with clear, measurable outcomes.
    Base everything on PRACTICAL applications from the document.
    `;

    const challengesPayload = await this.generateStrictJsonWith413Retry(
      buildPrompt,
      `{
  "challenges": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "string",
      "category": "calculation|analysis|experiment|problem_solving|data_collection",
      "materials": ["string"],
      "procedure": [
        { "step": 1, "instruction": "string", "expectedResult": "string", "tips": "string" }
      ],
      "checkpoints": [
        { "checkpoint": "string", "criteria": "string", "troubleshooting": "string" }
      ],
      "successMetrics": ["string"],
      "realWorldConnection": "string",
      "extensionActivities": ["string"],
      "resources": ["string"]
    }
  ]
}`
    );

    let challenges = this.normalizeChallengesPayload(challengesPayload);

    if (!challenges.length) {
      const rescuePayload = await this.generateStrictJsonWith413Retry(
        (maxChars) => `
Return ONLY JSON in this exact shape:
{ "challenges": [ { "title": "string", "description": "string", "difficulty": "beginner|intermediate|advanced", "estimatedTime": "string", "category": "calculation|analysis|experiment|problem_solving|data_collection", "materials": ["string"], "procedure": [ { "step": 1, "instruction": "string", "expectedResult": "string", "tips": "string" } ], "checkpoints": [ { "checkpoint": "string", "criteria": "string", "troubleshooting": "string" } ], "successMetrics": ["string"], "realWorldConnection": "string", "extensionActivities": ["string"], "resources": ["string"] } ] }

Source document excerpt:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}
`,
        `{ "challenges": [ { "title": "string", "description": "string" } ] }`
      );
      challenges = this.normalizeChallengesPayload(rescuePayload);
    }

    if (!challenges.length) throw new Error('AI returned no practical challenges');
    return challenges;
  }

  /**
   * Intelligent fallback for simulations
   */
  getIntelligentFallbackSimulations(docxText) {
    console.log('🔄 Creating intelligent fallback simulations');

    return [
      {
        title: "Interactive Data Explorer",
        description: "Explore and manipulate data from the document content",
        type: "data_analysis",
        difficulty: "beginner",
        estimatedTime: "10-15 min",
        interactiveElements: [
          {
            name: "Data Filter",
            type: "dropdown",
            description: "Filter data by different criteria",
            defaultValue: "All Data",
            range: ["All Data", "Category 1", "Category 2", "Category 3"],
            unit: "categories"
          },
          {
            name: "Value Adjuster",
            type: "slider",
            description: "Adjust values to see impact",
            defaultValue: "50",
            range: "0-100",
            unit: "percentage"
          }
        ],
        learningObjectives: [
          "Understand data relationships",
          "Practice data manipulation",
          "Observe cause-effect patterns"
        ],
        realWorldApplication: "Data analysis skills apply to research, business, and decision-making",
        dataPoints: [
          {
            label: "Sample Data Point",
            value: "100",
            description: "Representative value from document content",
            fromElements: ["Value Adjuster"],
            combine: "first"
          }
        ],
        stepByStepGuide: [
          "Step 1: Select data category from dropdown",
          "Step 2: Adjust the value slider",
          "Step 3: Observe changes in the visualization"
        ],
        expectedOutcomes: "Learners will understand how data relationships work through direct manipulation"
      },
      {
        title: "Concept Calculator",
        description: "Interactive calculator based on formulas and concepts from the document",
        type: "calculator",
        difficulty: "intermediate",
        estimatedTime: "15-20 min",
        interactiveElements: [
          {
            name: "Input Variable 1",
            type: "input",
            description: "Enter the first value",
            defaultValue: "10",
            range: "positive numbers",
            unit: "units"
          },
          {
            name: "Input Variable 2",
            type: "input",
            description: "Enter the second value",
            defaultValue: "5",
            range: "positive numbers",
            unit: "units"
          },
          {
            name: "Calculate Button",
            type: "button",
            description: "Perform the calculation",
            defaultValue: "Calculate",
            range: "action",
            unit: "click",
            fromElements: ["Input Variable 1", "Input Variable 2"],
            combine: "sum"
          }
        ],
        learningObjectives: [
          "Apply mathematical concepts",
          "Practice formula usage",
          "Verify calculations manually"
        ],
        realWorldApplication: "Mathematical skills are essential for problem-solving in many fields",
        dataPoints: [
          {
            label: "Result",
            value: "calculated value",
            description: "Output of the calculation",
            fromElements: ["Input Variable 1", "Input Variable 2"],
            combine: "sum"
          }
        ],
        stepByStepGuide: [
          "Step 1: Enter values in the input fields",
          "Step 2: Click the calculate button",
          "Step 3: Review the result and explanation"
        ],
        expectedOutcomes: "Learners will gain confidence in applying mathematical concepts through practice"
      }
    ];
  }

  /**
   * Intelligent fallback for challenges
   */
  getIntelligentFallbackChallenges(docxText) {
    console.log('🔄 Creating intelligent fallback challenges');

    return [
      {
        title: "Document Analysis Challenge",
        description: "Hands-on analysis of key concepts and data from the document",
        difficulty: "beginner",
        estimatedTime: "15-20 min",
        category: "analysis",
        materials: ["Document content", "Analysis worksheet", "Calculator"],
        procedure: [
          {
            step: 1,
            instruction: "Identify the main concepts in the document",
            expectedResult: "List of 3-5 key concepts",
            tips: "Look for repeated terms and emphasized points"
          },
          {
            step: 2,
            instruction: "Find numerical data or examples in the content",
            expectedResult: "Collection of relevant data points",
            tips: "Focus on concrete facts and figures"
          },
          {
            step: 3,
            instruction: "Create a summary of practical applications",
            expectedResult: "Real-world use cases identified",
            tips: "Think about how this applies to everyday situations"
          }
        ],
        checkpoints: [
          {
            checkpoint: "Concept Identification Complete",
            criteria: "At least 3 main concepts identified",
            troubleshooting: "Re-read the document focusing on headings and key terms"
          },
          {
            checkpoint: "Data Collection Complete",
            criteria: "Relevant numerical or factual data found",
            troubleshooting: "Look for examples, case studies, or specific details"
          }
        ],
        successMetrics: [
          "Successfully identified key concepts",
          "Found concrete data or examples",
          "Connected content to real-world applications"
        ],
        realWorldConnection: "Document analysis skills are essential for research and professional work",
        extensionActivities: [
          "Compare findings with other sources",
          "Create a presentation of key insights"
        ],
        resources: ["Document text", "Note-taking tools", "Research materials"]
      },
      {
        title: "Practical Application Challenge",
        description: "Apply document concepts to solve a real-world problem",
        difficulty: "intermediate",
        estimatedTime: "20-25 min",
        category: "problem_solving",
        materials: ["Document concepts", "Problem scenario", "Solution framework"],
        procedure: [
          {
            step: 1,
            instruction: "Review the main concepts from the document",
            expectedResult: "Clear understanding of key principles",
            tips: "Focus on actionable concepts that can be applied"
          },
          {
            step: 2,
            instruction: "Analyze the given problem scenario",
            expectedResult: "Understanding of the problem requirements",
            tips: "Break down the problem into smaller components"
          },
          {
            step: 3,
            instruction: "Apply document concepts to solve the problem",
            expectedResult: "Practical solution using learned concepts",
            tips: "Use step-by-step approach and verify each step"
          }
        ],
        checkpoints: [
          {
            checkpoint: "Concept Review Complete",
            criteria: "Key concepts understood and ready to apply",
            troubleshooting: "Review document sections that explain the concepts"
          },
          {
            checkpoint: "Problem Analysis Complete",
            criteria: "Problem requirements clearly identified",
            troubleshooting: "Break the problem into smaller, manageable parts"
          }
        ],
        successMetrics: [
          "Successfully applied document concepts",
          "Developed a practical solution",
          "Verified solution effectiveness"
        ],
        realWorldConnection: "Problem-solving skills using learned concepts are valuable in any field",
        extensionActivities: [
          "Try variations of the problem",
          "Develop additional solution approaches"
        ],
        resources: ["Document concepts", "Problem-solving frameworks", "Verification tools"]
      }
    ];
  }
}

export default new SensingLearningService();