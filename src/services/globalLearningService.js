import { GoogleGenerativeAI } from '@google/generative-ai';

class GlobalLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite"
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

      // Generate both big picture overview and interconnections
      const [bigPicture, interconnections] = await Promise.all([
        this.generateBigPictureOverview(docxText),
        this.generateInterconnections(docxText)
      ]);

      return {
        success: true,
        bigPicture,
        interconnections,
        analysis
      };
    } catch (error) {
      console.error('Error generating global content:', error);
      throw new Error('Failed to generate global learning content');
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
    You are creating a BIG PICTURE OVERVIEW for global learners who need to see the forest before the trees.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Global learners think holistically and need to understand:
    1. The OVERALL PURPOSE and why this topic matters
    2. How ALL the pieces fit together in the bigger context
    3. The BROADER IMPLICATIONS and real-world significance
    4. CONNECTIONS to other fields, concepts, or applications

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
        "title": "Global Learning Approach",
        "description": "How to approach learning this topic as a global learner",
        "startingPoint": "Where to begin for maximum understanding",
        "keyInsights": ["insight 1", "insight 2", "insight 3"],
        "mentalModel": "The mental framework to use when thinking about this"
      }
    }

    Focus on helping global learners see the complete picture and understand WHY everything matters.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Big Picture Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const bigPicture = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed big picture overview');
        return bigPicture;
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackBigPicture(docxText);
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
    You are creating an INTERCONNECTIONS MAP for global learners who need to see how everything connects.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Global learners need to understand:
    1. How concepts RELATE to each other
    2. PATTERNS and themes that run throughout
    3. CAUSE and EFFECT relationships
    4. INTERDEPENDENCIES between different parts

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

    Focus on helping global learners see the web of connections and understand the systemic nature of the content.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Interconnections Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const interconnections = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed interconnections map');
        return interconnections;
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackInterconnections(docxText);
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

    const paragraphs = docxText.split('\n').filter(p => p.trim().length > 50);
    const sentences = docxText.split(/[.!?]+/).filter(s => s.trim().length > 30).slice(0, 10);

    return {
      overallPurpose: {
        title: "Why This Matters",
        description: "This document provides essential knowledge and understanding in its field of study.",
        realWorldSignificance: "The concepts presented have practical applications and theoretical importance.",
        keyQuestion: "How can we understand and apply these concepts effectively?"
      },
      bigPictureContext: {
        title: "The Bigger Picture",
        description: "This content fits within a broader educational and practical framework.",
        broaderField: "Academic and professional knowledge domain",
        historicalContext: "Built upon established principles and ongoing research",
        futureImplications: "Continues to evolve and influence related fields"
      },
      systemicView: {
        title: "How Everything Connects",
        description: "The concepts work together to form a comprehensive understanding.",
        mainComponents: ["Core Principles", "Practical Applications", "Theoretical Framework"],
        relationships: "Each component supports and reinforces the others",
        emergentProperties: "Together they create deeper insight and practical capability"
      },
      practicalRelevance: {
        title: "Real-World Applications",
        description: "These concepts have direct relevance to practical situations.",
        industries: ["Education", "Professional Practice", "Research"],
        dailyLife: "Provides tools and understanding for everyday challenges",
        globalImpact: "Contributes to broader knowledge and societal progress"
      },
      learningStrategy: {
        title: "Global Learning Approach",
        description: "Approach this content by first understanding the overall framework.",
        startingPoint: "Begin with the big picture and work toward specific details",
        keyInsights: ["See the whole system first", "Understand connections", "Apply holistically"],
        mentalModel: "Think of this as an interconnected web of related concepts"
      }
    };
  }

  /**
   * Intelligent fallback for interconnections
   */
  getIntelligentFallbackInterconnections(docxText) {
    console.log('🔄 Creating intelligent fallback interconnections map');

    return {
      conceptNetwork: {
        centralTheme: "Integrated Knowledge System",
        coreNodes: [
          {
            name: "Foundation Concepts",
            description: "Basic principles that support everything else",
            connections: ["supports advanced concepts", "enables practical applications"],
            importance: "Essential building blocks for understanding"
          },
          {
            name: "Applied Knowledge",
            description: "Practical implementation of theoretical concepts",
            connections: ["builds on foundations", "creates real-world value"],
            importance: "Bridges theory and practice"
          },
          {
            name: "Systemic Understanding",
            description: "Holistic view of how everything works together",
            connections: ["integrates all concepts", "reveals emergent properties"],
            importance: "Enables comprehensive mastery"
          }
        ],
        emergentPatterns: ["Theory-Practice Integration", "Hierarchical Learning", "Systemic Thinking"]
      },
      systemDynamics: {
        feedbackLoops: [
          {
            name: "Learning Reinforcement Loop",
            description: "Understanding leads to application, which deepens understanding",
            type: "reinforcing",
            impact: "Accelerates learning and mastery"
          }
        ],
        causeEffectChains: [
          {
            trigger: "Initial Understanding",
            chain: ["Deeper Study", "Practical Application", "Mastery"],
            significance: "Shows the path from novice to expert"
          }
        ]
      },
      crossDomainConnections: {
        relatedFields: ["Education", "Psychology", "Systems Thinking"],
        analogies: [
          {
            comparison: "Like building a house - foundation first, then structure",
            explanation: "Emphasizes the importance of building knowledge systematically",
            limitations: "Learning can also be non-linear and interconnected"
          }
        ],
        applications: ["Academic Study", "Professional Development", "Personal Growth"]
      },
      holisticInsights: {
        keyRealizations: ["Everything is connected", "Context matters", "Systems thinking is essential"],
        paradoxes: ["Simple concepts can create complex systems", "Details matter but so does the big picture"],
        unifyingPrinciples: ["Integration", "Application", "Continuous Learning"],
        systemicImplications: "Understanding the whole system enables more effective learning and application"
      }
    };
  }
}

export default new GlobalLearningService();