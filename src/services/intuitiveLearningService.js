import { GroqGenAI as GoogleGenerativeAI } from '@/lib/groqGenAI';

class IntuitiveLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.CEREBRAS_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: 'llama3.1-8b'
        });
        console.log('🔮 Intuitive Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Intuitive Learning Service:', error);
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
    if (!this.model) throw new Error('Intuitive learning model not available');

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

  /**
   * Client runs educational gate before opening; skip duplicate LLM check.
   */
  async analyzeContentForEducation(_docxText) {
    return {
      isEducational: true,
      confidence: 1,
      reasoning: 'Educational gate already verified at client layer',
      contentType: 'Verified learnable content'
    };
  }

  unwrapConceptUniversePayload(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (Array.isArray(payload.conceptClusters)) return payload;
    if (payload.conceptUniverse && typeof payload.conceptUniverse === 'object') {
      return payload.conceptUniverse;
    }
    return null;
  }

  unwrapInsightPatternsPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (Array.isArray(payload.insightMoments)) return payload;
    if (payload.insightPatterns && typeof payload.insightPatterns === 'object') {
      return payload.insightPatterns;
    }
    return null;
  }

  clamp01(n, fallback = 0.5) {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.min(1, Math.max(0, x));
  }

  normalizeConceptUniverse(raw) {
    const data = this.unwrapConceptUniversePayload(raw);
    if (!data) return null;

    const conceptClusters = (Array.isArray(data.conceptClusters) ? data.conceptClusters : []).map((cluster) => ({
      name: String(cluster?.name || 'Cluster').slice(0, 200),
      theme: String(cluster?.theme || '').slice(0, 500),
      description: String(cluster?.description || '').slice(0, 2000),
      abstractionLevel: ['high', 'medium', 'low'].includes(String(cluster?.abstractionLevel))
        ? cluster.abstractionLevel
        : 'high',
      concepts: (Array.isArray(cluster?.concepts) ? cluster.concepts : []).map((c) => ({
        name: String(c?.name || 'Concept').slice(0, 200),
        description: String(c?.description || '').slice(0, 1500),
        type: String(c?.type || 'pattern').slice(0, 80),
        abstractionLevel: ['high', 'medium', 'low'].includes(String(c?.abstractionLevel))
          ? c.abstractionLevel
          : 'medium',
        connections: (Array.isArray(c?.connections) ? c.connections : []).map((x) => String(x)).filter(Boolean),
        implications: (Array.isArray(c?.implications) ? c.implications : []).map((x) => String(x)).filter(Boolean),
        position: {
          x: this.clamp01(c?.position?.x, 0.5),
          y: this.clamp01(c?.position?.y, 0.5),
          z: this.clamp01(c?.position?.z, 0.5)
        },
        size: this.clamp01(c?.size, 0.7),
        color: /^#[0-9a-fA-F]{6}$/.test(String(c?.color)) ? c.color : '#6366f1',
        energy: this.clamp01(c?.energy, 0.7)
      })),
      emergentProperties: (Array.isArray(cluster?.emergentProperties) ? cluster.emergentProperties : [])
        .map((x) => String(x))
        .filter(Boolean),
      futureDirections: (Array.isArray(cluster?.futureDirections) ? cluster.futureDirections : [])
        .map((x) => String(x))
        .filter(Boolean),
      crossClusterConnections: (Array.isArray(cluster?.crossClusterConnections)
        ? cluster.crossClusterConnections
        : []
      )
        .map((x) => String(x))
        .filter(Boolean)
    }));

    const hiddenPatterns = (Array.isArray(data.hiddenPatterns) ? data.hiddenPatterns : []).map((p) => ({
      name: String(p?.name || 'Pattern').slice(0, 200),
      description: String(p?.description || '').slice(0, 1500),
      type: String(p?.type || 'recurring_theme').slice(0, 80),
      strength: this.clamp01(p?.strength, 0.6),
      conceptsInvolved: (Array.isArray(p?.conceptsInvolved) ? p.conceptsInvolved : [])
        .map((x) => String(x))
        .filter(Boolean),
      insight: String(p?.insight || '').slice(0, 1000),
      implications: (Array.isArray(p?.implications) ? p.implications : []).map((x) => String(x)).filter(Boolean)
    }));

    const theoreticalFrameworks = (Array.isArray(data.theoreticalFrameworks) ? data.theoreticalFrameworks : []).map(
      (f) => ({
        name: String(f?.name || 'Framework').slice(0, 200),
        description: String(f?.description || '').slice(0, 2000),
        scope: String(f?.scope || 'domain').slice(0, 40),
        concepts: (Array.isArray(f?.concepts) ? f.concepts : []).map((x) => String(x)).filter(Boolean),
        principles: (Array.isArray(f?.principles) ? f.principles : []).map((x) => String(x)).filter(Boolean),
        applications: (Array.isArray(f?.applications) ? f.applications : []).map((x) => String(x)).filter(Boolean),
        limitations: (Array.isArray(f?.limitations) ? f.limitations : []).map((x) => String(x)).filter(Boolean),
        extensions: (Array.isArray(f?.extensions) ? f.extensions : []).map((x) => String(x)).filter(Boolean)
      })
    );

    const innovationOpportunities = (Array.isArray(data.innovationOpportunities) ? data.innovationOpportunities : []).map(
      (o) => ({
        name: String(o?.name || 'Opportunity').slice(0, 200),
        description: String(o?.description || '').slice(0, 2000),
        conceptCombination: (Array.isArray(o?.conceptCombination) ? o.conceptCombination : [])
          .map((x) => String(x))
          .filter(Boolean),
        novelty: this.clamp01(o?.novelty, 0.6),
        feasibility: this.clamp01(o?.feasibility, 0.6),
        impact: this.clamp01(o?.impact, 0.6),
        timeline: String(o?.timeline || 'medium future').slice(0, 40),
        requirements: (Array.isArray(o?.requirements) ? o.requirements : []).map((x) => String(x)).filter(Boolean)
      })
    );
        
        return {
      conceptClusters,
      hiddenPatterns,
      theoreticalFrameworks,
      innovationOpportunities
    };
  }

  normalizeInsightPatterns(raw) {
    const data = this.unwrapInsightPatternsPayload(raw);
    if (!data) return null;

    const insightMoments = (Array.isArray(data.insightMoments) ? data.insightMoments : []).map((m) => ({
      title: String(m?.title || 'Insight').slice(0, 200),
      description: String(m?.description || '').slice(0, 2000),
      type: String(m?.type || 'connection').slice(0, 80),
      depth: String(m?.depth || 'medium').slice(0, 40),
      conceptsConnected: (Array.isArray(m?.conceptsConnected) ? m.conceptsConnected : [])
        .map((x) => String(x))
        .filter(Boolean),
      reasoning: String(m?.reasoning || '').slice(0, 1500),
      implications: (Array.isArray(m?.implications) ? m.implications : []).map((x) => String(x)).filter(Boolean),
      analogies: (Array.isArray(m?.analogies) ? m.analogies : []).map((x) => String(x)).filter(Boolean),
      questions: (Array.isArray(m?.questions) ? m.questions : []).map((x) => String(x)).filter(Boolean),
      explorationPaths: (Array.isArray(m?.explorationPaths) ? m.explorationPaths : [])
        .map((x) => String(x))
        .filter(Boolean)
    }));

    const conceptualBridges = (Array.isArray(data.conceptualBridges) ? data.conceptualBridges : []).map((b) => ({
      name: String(b?.name || 'Bridge').slice(0, 200),
      description: String(b?.description || '').slice(0, 1500),
      fromConcept: String(b?.fromConcept || '').slice(0, 200),
      toConcept: String(b?.toConcept || '').slice(0, 200),
      bridgeType: String(b?.bridgeType || 'analogy').slice(0, 80),
      strength: this.clamp01(b?.strength, 0.7),
      novelty: this.clamp01(b?.novelty, 0.7),
      explanation: String(b?.explanation || '').slice(0, 2000),
      examples: (Array.isArray(b?.examples) ? b.examples : []).map((x) => String(x)).filter(Boolean),
      implications: (Array.isArray(b?.implications) ? b.implications : []).map((x) => String(x)).filter(Boolean)
    }));

    const emergentThemes = (Array.isArray(data.emergentThemes) ? data.emergentThemes : []).map((t) => ({
      name: String(t?.name || 'Theme').slice(0, 200),
      description: String(t?.description || '').slice(0, 2000),
      concepts: (Array.isArray(t?.concepts) ? t.concepts : []).map((x) => String(x)).filter(Boolean),
      abstractionLevel: String(t?.abstractionLevel || 'high').slice(0, 20),
      universality: String(t?.universality || 'document-specific').slice(0, 40),
      manifestations: (Array.isArray(t?.manifestations) ? t.manifestations : []).map((x) => String(x)).filter(Boolean),
      evolution: String(t?.evolution || '').slice(0, 1000),
      crossDomainApplications: (Array.isArray(t?.crossDomainApplications) ? t.crossDomainApplications : [])
        .map((x) => String(x))
        .filter(Boolean)
    }));

    const futureScenarios = (Array.isArray(data.futureScenarios) ? data.futureScenarios : []).map((s) => ({
      name: String(s?.name || 'Scenario').slice(0, 200),
      description: String(s?.description || '').slice(0, 2000),
      basedOnConcepts: (Array.isArray(s?.basedOnConcepts) ? s.basedOnConcepts : []).map((x) => String(x)).filter(Boolean),
      timeline: String(s?.timeline || '5-10 years').slice(0, 40),
      probability: this.clamp01(s?.probability, 0.6),
      impact: this.clamp01(s?.impact, 0.7),
      requirements: (Array.isArray(s?.requirements) ? s.requirements : []).map((x) => String(x)).filter(Boolean),
      indicators: (Array.isArray(s?.indicators) ? s.indicators : []).map((x) => String(x)).filter(Boolean),
      implications: (Array.isArray(s?.implications) ? s.implications : []).map((x) => String(x)).filter(Boolean)
    }));

    const paradoxes = (Array.isArray(data.paradoxes) ? data.paradoxes : []).map((p) => ({
      name: String(p?.name || 'Paradox').slice(0, 200),
      description: String(p?.description || '').slice(0, 1500),
      contradiction: String(p?.contradiction || '').slice(0, 1000),
      resolution: String(p?.resolution || '').slice(0, 1000),
      insights: (Array.isArray(p?.insights) ? p.insights : []).map((x) => String(x)).filter(Boolean),
      examples: (Array.isArray(p?.examples) ? p.examples : []).map((x) => String(x)).filter(Boolean),
      implications: (Array.isArray(p?.implications) ? p.implications : []).map((x) => String(x)).filter(Boolean)
    }));

      return {
      insightMoments,
      conceptualBridges,
      emergentThemes,
      futureScenarios,
      paradoxes
    };
  }

  conceptUniverseSchemaDescription() {
    return `Top-level JSON object with keys: conceptClusters, hiddenPatterns, theoreticalFrameworks, innovationOpportunities.
conceptClusters: array of { name, theme, description, abstractionLevel: "high"|"medium"|"low", concepts: array of { name, description, type, abstractionLevel, connections: string[], implications: string[], position: {x,y,z} numbers 0-1, size 0-1, color "#RRGGBB", energy 0-1 }, emergentProperties: string[], futureDirections: string[], crossClusterConnections: string[] }.
hiddenPatterns: array of { name, description, type, strength 0-1, conceptsInvolved: string[], insight, implications: string[] }.
theoreticalFrameworks: array of { name, description, scope, concepts: string[], principles: string[], applications: string[], limitations: string[], extensions: string[] }.
innovationOpportunities: array of { name, description, conceptCombination: string[], novelty, feasibility, impact (0-1), timeline, requirements: string[] }.`;
  }

  insightPatternsSchemaDescription() {
    return `Top-level JSON with: insightMoments, conceptualBridges, emergentThemes, futureScenarios, paradoxes (arrays may be empty except include at least 2 insightMoments, 2 conceptualBridges, 2 emergentThemes, 2 futureScenarios).
insightMoments: { title, description, type, depth, conceptsConnected: string[], reasoning, implications: string[], analogies: string[], questions: string[], explorationPaths: string[] }.
conceptualBridges: { name, description, fromConcept, toConcept, bridgeType, strength, novelty, explanation, examples: string[], implications: string[] }.
emergentThemes: { name, description, concepts: string[], abstractionLevel, universality, manifestations: string[], evolution, crossDomainApplications: string[] }.
futureScenarios: { name, description, basedOnConcepts: string[], timeline, probability, impact, requirements: string[], indicators: string[], implications: string[] }.
paradoxes: { name, description, contradiction, resolution, insights: string[], examples: string[], implications: string[] }.`;
  }

  async generateConceptUniverse(docxText) {
    this.initializeModels();
    if (!this.genAI) throw new Error('Intuitive learning service not available');

    const schema = this.conceptUniverseSchemaDescription();

    const buildPrompt = (maxChars) => `
You are building a CONCEPT CONSTELLATION for intuitive learners from the SOURCE DOCUMENT below.
Ground every cluster, concept name, pattern, framework, and opportunity in ideas that appear or are clearly implied in the text.
Do not invent unrelated domains. Use precise terminology from the document where possible.

SOURCE DOCUMENT:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '\n[...truncated...]' : ''}

Return ONLY valid JSON (no markdown) with this structure:
{
  "conceptClusters": [ ... at least 2 clusters, each with at least 3 concepts ... ],
  "hiddenPatterns": [ ... at least 2 ... ],
  "theoreticalFrameworks": [ ... at least 2 ... ],
  "innovationOpportunities": [ ... at least 2 ... ]
}

${schema}
`;

    let payload = await this.generateStrictJsonWith413Retry(buildPrompt, schema);

    let universe = this.normalizeConceptUniverse(payload);
    if (!universe?.conceptClusters?.length) {
      const rescue = (maxChars) => `
Return ONLY JSON. Keys: conceptClusters, hiddenPatterns, theoreticalFrameworks, innovationOpportunities.
Minimum: 2 clusters with 3+ concepts each; 2 hidden patterns; 2 frameworks; 2 innovation opportunities.
All content must reflect this document:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '\n[...truncated...]' : ''}
`;
      payload = await this.generateStrictJsonWith413Retry(rescue, schema);
      universe = this.normalizeConceptUniverse(payload);
    }

    if (!universe?.conceptClusters?.length) {
      throw new Error('AI returned no concept constellation (missing conceptClusters)');
    }

    return universe;
  }

  async generateInsightPatterns(docxText) {
    this.initializeModels();
    if (!this.genAI) throw new Error('Intuitive learning service not available');

    const schema = this.insightPatternsSchemaDescription();

    const buildPrompt = (maxChars) => `
You are surfacing INSIGHT PATTERNS for intuitive learners from the SOURCE DOCUMENT.
Every insight, bridge, theme, and scenario must trace to the document (paraphrase is fine; do not fabricate unrelated topics).

SOURCE DOCUMENT:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '\n[...truncated...]' : ''}

Return ONLY valid JSON (no markdown) with:
{
  "insightMoments": [ ... at least 2 ... ],
  "conceptualBridges": [ ... at least 2 ... ],
  "emergentThemes": [ ... at least 2 ... ],
  "futureScenarios": [ ... at least 2 ... ],
  "paradoxes": [ 0 or more ]
}

${schema}
`;

    let payload = await this.generateStrictJsonWith413Retry(buildPrompt, schema);

    let insights = this.normalizeInsightPatterns(payload);
    if (!insights?.insightMoments?.length) {
      const rescue = (maxChars) => `
Return ONLY JSON with keys insightMoments, conceptualBridges, emergentThemes, futureScenarios, paradoxes.
Include at least 2 items in each of the first four arrays. Tie everything to this document:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '\n[...truncated...]' : ''}
`;
      payload = await this.generateStrictJsonWith413Retry(rescue, schema);
      insights = this.normalizeInsightPatterns(payload);
    }

    if (!insights?.insightMoments?.length) {
      throw new Error('AI returned no insight patterns (missing insightMoments)');
    }

    return insights;
  }

  /**
   * Generate concept constellation + pattern discovery from document text.
   */
  async generateConceptConstellation(docxText) {
    this.initializeModels();

    if (!this.model) {
      throw new Error('Intuitive learning model not available');
    }

    try {
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for conceptual pattern discovery. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for concept constellation generation');

      const conceptUniverse = await this.generateConceptUniverse(docxText);
      const insightPatterns = await this.generateInsightPatterns(docxText);

      return {
        success: true,
        conceptUniverse,
        insightPatterns,
        analysis
      };
    } catch (error) {
      console.error('Error generating concept constellation:', error);
      const wrapped = new Error(
        `Failed to generate intuitive learning content: ${error?.message || error}`
      );
      wrapped.cause = error;
      throw wrapped;
    }
  }
}

export default new IntuitiveLearningService();
