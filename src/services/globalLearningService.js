import { GroqGenAI as GoogleGenerativeAI } from '@/lib/groqGenAI';

class GlobalLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  normalizeText(text = '') {
    return text
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  getMeaningfulParagraphs(docxText) {
    return this.normalizeText(docxText)
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line =>
        line.length > 35 &&
        !/^\d+$/.test(line) &&
        !/^page\s+\d+/i.test(line)
      );
  }

  getMeaningfulSentences(docxText, limit = 8) {
    return this.normalizeText(docxText)
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 40)
      .slice(0, limit);
  }

  extractTopKeywords(docxText, limit = 6) {
    const stopWords = new Set([
      'about', 'after', 'again', 'against', 'between', 'could', 'their', 'there',
      'these', 'those', 'which', 'while', 'where', 'when', 'with', 'from', 'into',
      'through', 'during', 'before', 'under', 'above', 'below', 'because', 'being',
      'have', 'has', 'had', 'were', 'was', 'been', 'this', 'that', 'they', 'them',
      'then', 'than', 'also', 'such', 'each', 'some', 'many', 'more', 'most', 'very',
      'much', 'your', 'yours', 'student', 'students', 'document', 'content', 'review'
    ]);

    const counts = new Map();
    const words = this.normalizeText(docxText)
      .toLowerCase()
      .match(/[a-z][a-z-]{3,}/g) || [];

    for (const word of words) {
      if (stopWords.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word.replace(/-/g, ' '));
  }

  buildSourceQuestion(docxText) {
    const firstSentence = this.getMeaningfulSentences(docxText, 1)[0];
    if (!firstSentence) {
      return 'What are the main ideas, relationships, and applications in this material?';
    }
    const shortened = firstSentence.replace(/[.?!]+$/, '').slice(0, 110);
    return `How does this material connect around: ${shortened}?`;
  }

  parseJsonFromModelResponse(text) {
    if (!text) {
      throw new Error('Empty model response');
    }

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

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GROQ_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-flash-lite-latest"
        });
        console.log('🌍 Global Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Global Learning Service:', error);
      }
    }
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
    // this endpoint; skip the redundant LLM re-check to save TPM and avoid
    // false negatives from the second pass.
    return {
      isEducational: true,
      confidence: 1,
      reasoning: 'Educational gate already verified at client layer',
      contentType: 'Verified learnable content'
    };
    /* eslint-disable no-unreachable */

    try {
      console.log('🌍 Global Learning: Using same AI analysis logic as other learning features...');
      
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
You are an AI content analyzer. Your task is to determine if the given document content is educational/learning material that would be suitable for global learning.

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

Analyze the following document content and determine if it's educational material suitable for global learning:

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a JSON object containing:
{
  "isEducational": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "contentType": "Brief description of what type of content this is"
}

Be strict in your analysis - only classify content as educational if it genuinely contains learning material that students could benefit from global learning assistance.`;

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

      console.log('🌍 Global Learning AI Analysis Result:', {
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
   * Generate global learning content from document text (with educational analysis)
   */
  async generateGlobalContent(docxText) {
    this.initializeModels();

    if (!this.model) {
      throw new Error('Global learning model not available');
    }

    try {
      // First, analyze if content is educational
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for global learning. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for global learning generation');

      const bigPicture = await this.generateBigPictureOverview(docxText);
      const interconnections = await this.generateInterconnections(docxText);

      return {
        success: true,
        bigPicture,
        interconnections,
        analysis
      };
    } catch (error) {
      console.error('Error generating global content:', error);
      const wrapped = new Error(
        `Failed to generate global learning content: ${error?.message || error}`
      );
      wrapped.cause = error;
      throw wrapped;
    }
  }

  /**
   * Generate big picture overview for global learners
   */
  async generateBigPictureOverview(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    You are creating actual study material from the source document for a global learner.

    SOURCE DOCUMENT CONTENT:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Important rules:
    1. Base every section on the actual source content above.
    2. Do NOT explain what global learners are.
    3. Do NOT give generic advice about learning styles unless it is tied to this document.
    4. Summarize, organize, and connect the PDF's real topics, ideas, processes, and applications.
    5. If a detail is missing from the source, do not invent it.
    6. Write like a study guide for this specific PDF, not like a description of pedagogy.

    Create a comprehensive big picture overview with these sections:

    {
      "overallPurpose": {
        "title": "Why This Matters",
        "description": "The fundamental purpose and importance of this topic",
        "realWorldSignificance": "Why this is relevant in the broader world",
        "keyQuestion": "The main question this document addresses"
      },
      "bigPictureContext": {
        "title": "The Bigger Picture",
        "description": "How this fits into larger systems, fields, or contexts",
        "broaderField": "What larger field or domain this belongs to",
        "historicalContext": "Brief historical or evolutionary context",
        "futureImplications": "Where this is heading or its future importance"
      },
      "systemicView": {
        "title": "How Everything Connects",
        "description": "The interconnected nature of the concepts",
        "mainComponents": ["component 1", "component 2", "component 3"],
        "relationships": "How the main components work together",
        "emergentProperties": "What emerges when everything works together"
      },
      "practicalRelevance": {
        "title": "Real-World Applications",
        "description": "Where and how this applies in practice",
        "industries": ["industry 1", "industry 2"],
        "dailyLife": "How this affects everyday life",
        "globalImpact": "Broader societal or global implications"
      },
      "learningStrategy": {
        "title": "How To Approach This PDF",
        "description": "How to study this specific document from big picture to details",
        "startingPoint": "Where to begin for maximum understanding of this source",
        "keyInsights": ["insight 1 from the source", "insight 2 from the source", "insight 3 from the source"],
        "mentalModel": "The best high-level framework for understanding this specific source"
      }
    }

    Focus on helping the learner see the complete picture of THIS PDF and understand how its ideas fit together.
    Return ONLY valid JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Big Picture Response:', text.substring(0, 500) + '...');

      const bigPicture = this.parseJsonFromModelResponse(text);
      console.log('✅ Successfully parsed big picture overview');
      return bigPicture;

      // Fallback if JSON parsing fails
    } catch (error) {
      console.error('❌ Error generating big picture overview:', error);
      return this.getIntelligentFallbackBigPicture(docxText);
    }
  }

  /**
   * Generate interconnections mapping for global learners
   */
  async generateInterconnections(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    You are creating actual study material from the source document for a global learner.

    SOURCE DOCUMENT CONTENT:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Important rules:
    1. Base the map on the actual source content above.
    2. Do NOT explain what global learners are.
    3. Do NOT write generic statements about holistic learning.
    4. Show the real relationships, dependencies, themes, and cause-effect chains found in the document.
    5. If the source is limited, keep the output modest and grounded.
    6. Write like a concept map for this specific PDF.

    Create a comprehensive interconnections map:

    {
      "conceptNetwork": {
        "centralTheme": "The main unifying theme",
        "coreNodes": [
          {
            "name": "Core Concept 1",
            "description": "What this concept represents",
            "connections": ["connects to concept 2", "influences concept 3"],
            "importance": "Why this is a key node in the network"
          }
        ],
        "emergentPatterns": ["pattern 1", "pattern 2", "pattern 3"]
      },
      "systemDynamics": {
        "feedbackLoops": [
          {
            "name": "Feedback Loop 1",
            "description": "How A affects B which affects A",
            "type": "reinforcing|balancing",
            "impact": "What this loop creates or maintains"
          }
        ],
        "causeEffectChains": [
          {
            "trigger": "Initial cause",
            "chain": ["effect 1", "effect 2", "final outcome"],
            "significance": "Why this chain matters"
          }
        ]
      },
      "crossDomainConnections": {
        "relatedFields": ["field 1", "field 2", "field 3"],
        "analogies": [
          {
            "comparison": "This is like...",
            "explanation": "How the analogy helps understanding",
            "limitations": "Where the analogy breaks down"
          }
        ],
        "applications": ["application 1", "application 2"]
      },
      "holisticInsights": {
        "keyRealizations": ["insight 1", "insight 2", "insight 3"],
        "paradoxes": ["paradox 1", "paradox 2"],
        "unifyingPrinciples": ["principle 1", "principle 2"],
        "systemicImplications": "What this means for the whole system"
      }
    }

    Focus on helping the learner see the web of connections inside THIS PDF.
    Return ONLY valid JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Interconnections Response:', text.substring(0, 500) + '...');

      const interconnections = this.parseJsonFromModelResponse(text);
      console.log('✅ Successfully parsed interconnections map');
      return interconnections;

    } catch (error) {
      console.error('❌ Error generating interconnections:', error);
      return this.getIntelligentFallbackInterconnections(docxText);
    }
  }

  /**
   * Intelligent fallback for big picture overview
   */
  getIntelligentFallbackBigPicture(docxText) {
    console.log('🔄 Creating intelligent fallback big picture overview');

    const paragraphs = this.getMeaningfulParagraphs(docxText);
    const sentences = this.getMeaningfulSentences(docxText, 6);
    const keywords = this.extractTopKeywords(docxText, 5);
    const summary = sentences[0] || paragraphs[0] || 'This material introduces a set of connected ideas from the source document.';
    const context = sentences[1] || paragraphs[1] || summary;
    const application = sentences[2] || paragraphs[2] || 'The material can be applied by connecting its main ideas to examples, uses, and outcomes shown in the source.';
    const components = keywords.length > 0 ? keywords.map(keyword => keyword.replace(/\b\w/g, c => c.toUpperCase())) : ['Main Idea', 'Supporting Ideas', 'Applications'];
    const insights = sentences.slice(0, 3).map(sentence => sentence.replace(/[.]+$/, ''));

    return {
      overallPurpose: {
        title: "Why This Matters",
        description: summary,
        realWorldSignificance: application,
        keyQuestion: this.buildSourceQuestion(docxText)
      },
      bigPictureContext: {
        title: "The Bigger Picture",
        description: context,
        broaderField: components.slice(0, 2).join(' and ') || 'Core subject concepts from the source material',
        historicalContext: paragraphs[0] || summary,
        futureImplications: paragraphs[1] || application
      },
      systemicView: {
        title: "How Everything Connects",
        description: 'The source material becomes easier to understand when its major ideas are grouped and connected.',
        mainComponents: components.slice(0, 3),
        relationships: paragraphs[1] || 'The main ideas support one another and form a broader explanation when viewed together.',
        emergentProperties: paragraphs[2] || 'Looking at the material as one system reveals the larger meaning behind the details.'
      },
      practicalRelevance: {
        title: "Real-World Applications",
        description: application,
        industries: components.slice(0, 2),
        dailyLife: sentences[3] || application,
        globalImpact: sentences[4] || 'The document shows how understanding the whole topic helps learners connect ideas more effectively.'
      },
      learningStrategy: {
        title: "How To Approach This PDF",
        description: "Start with the main message of the source, then connect each supporting idea back to that whole picture.",
        startingPoint: summary,
        keyInsights: insights.length > 0 ? insights : ['Identify the main topic first', 'Connect supporting ideas', 'Review details after the whole picture is clear'],
        mentalModel: `Think of this PDF as a connected map built around ${components[0] || 'the main topic'}.`
      }
    };
  }

  /**
   * Intelligent fallback for interconnections
   */
  getIntelligentFallbackInterconnections(docxText) {
    console.log('🔄 Creating intelligent fallback interconnections map');

    const paragraphs = this.getMeaningfulParagraphs(docxText);
    const sentences = this.getMeaningfulSentences(docxText, 7);
    const keywords = this.extractTopKeywords(docxText, 6);
    const coreNodes = (keywords.length > 0 ? keywords : ['main topic', 'supporting ideas', 'applications']).slice(0, 3);

    return {
      conceptNetwork: {
        centralTheme: paragraphs[0] || sentences[0] || 'Connected ideas from the source document',
        coreNodes: coreNodes.map((node, index) => ({
          name: node.replace(/\b\w/g, c => c.toUpperCase()),
          description: sentences[index] || paragraphs[index] || `This idea appears as an important part of the source material.`,
          connections: coreNodes.filter((_, innerIndex) => innerIndex !== index).map(other => `connects to ${other}`),
          importance: `This helps explain the overall structure of the source material.`
        })),
        emergentPatterns: coreNodes
      },
      systemDynamics: {
        feedbackLoops: [
          {
            name: "Source Idea Reinforcement",
            description: sentences[1] || 'Understanding one major idea helps clarify the others in the document.',
            type: "reinforcing",
            impact: paragraphs[1] || 'This makes the full material easier to understand as a connected whole.'
          }
        ],
        causeEffectChains: [
          {
            trigger: coreNodes[0] ? coreNodes[0].replace(/\b\w/g, c => c.toUpperCase()) : 'Main topic',
            chain: coreNodes.slice(1).map(node => node.replace(/\b\w/g, c => c.toUpperCase())),
            significance: sentences[2] || 'This shows how the document moves from central ideas to related details and applications.'
          }
        ]
      },
      crossDomainConnections: {
        relatedFields: coreNodes.slice(0, 3).map(node => node.replace(/\b\w/g, c => c.toUpperCase())),
        analogies: [
          {
            comparison: `This PDF works like a map centered on ${coreNodes[0] || 'the main topic'}.`,
            explanation: 'The learner understands the details better after seeing how the major ideas connect.',
            limitations: 'Some fine details still need close reading from the original material.'
          }
        ],
        applications: sentences.slice(3, 5).map(sentence => sentence.replace(/[.]+$/, '')) || ['Apply the source ideas by connecting them back to the main topic']
      },
      holisticInsights: {
        keyRealizations: sentences.slice(0, 3).map(sentence => sentence.replace(/[.]+$/, '')),
        paradoxes: ['The document has many parts, but they point back to one overall message', 'Details are clearer after the whole picture is understood'],
        unifyingPrinciples: coreNodes.slice(0, 3).map(node => node.replace(/\b\w/g, c => c.toUpperCase())),
        systemicImplications: paragraphs[2] || 'Seeing the whole structure helps the learner understand how the original material is organized and why the parts matter.'
      }
    };
  }
}

export default new GlobalLearningService();
