import { GoogleGenerativeAI } from '@google/generative-ai';

class IntuitiveLearningService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-flash-lite-latest"
        });
        console.log('🔮 Intuitive Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Intuitive Learning Service:', error);
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
      console.log('🔮 Intuitive Learning: Using same AI analysis logic as other learning features...');
      
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
You are an AI content analyzer. Your task is to determine if the given document content is educational/learning material that would be suitable for conceptual pattern discovery and intuitive learning.

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

Analyze the following document content and determine if it's educational material suitable for conceptual pattern discovery:

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a JSON object containing:
{
  "isEducational": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "contentType": "Brief description of what type of content this is"
}

Be strict in your analysis - only classify content as educational if it genuinely contains learning material that students could benefit from conceptual pattern discovery.`;

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

      console.log('🔮 Intuitive Learning AI Analysis Result:', {
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
   * Generate concept constellation content from document text (with educational analysis)
   */
  async generateConceptConstellation(docxText) {
    this.initializeModels();

    if (!this.model) {
      throw new Error('Intuitive learning model not available');
    }

    try {
      // First, analyze if content is educational
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for conceptual pattern discovery. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for concept constellation generation');

      // Generate both concept universe and insight patterns
      const [conceptUniverse, insightPatterns] = await Promise.all([
        this.generateConceptUniverse(docxText),
        this.generateInsightPatterns(docxText)
      ]);

      return {
        success: true,
        conceptUniverse,
        insightPatterns,
        analysis
      };
    } catch (error) {
      console.error('Error generating concept constellation:', error);
      throw new Error('Failed to generate conceptual pattern discovery content');
    }
  }

  /**
   * Generate concept universe for intuitive exploration
   */
  async generateConceptUniverse(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    You are creating a CONCEPT UNIVERSE for intuitive learners who think in patterns, abstractions, and big-picture connections.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Intuitive learners need:
    1. ABSTRACT concepts and theoretical frameworks
    2. HIDDEN patterns and non-obvious connections
    3. BIG PICTURE understanding and overarching themes
    4. FUTURE possibilities and innovative applications
    5. CREATIVE insights and "aha!" moments

    Create a concept universe based on the document content:

    {
      "conceptClusters": [
        {
          "name": "Cluster Name",
          "theme": "Overarching abstract theme",
          "description": "What this cluster represents conceptually",
          "abstractionLevel": "high|medium|low",
          "concepts": [
            {
              "name": "Concept Name",
              "description": "Abstract description of the concept",
              "type": "theory|principle|framework|pattern|paradigm",
              "abstractionLevel": "high|medium|low",
              "connections": ["concept it connects to", "another connection"],
              "implications": ["future possibility 1", "innovative application 2"],
              "position": {"x": 0.5, "y": 0.3, "z": 0.7},
              "size": 0.8,
              "color": "#6366f1",
              "energy": 0.9
            }
          ],
          "emergentProperties": ["property that emerges from this cluster"],
          "futureDirections": ["where this cluster might lead"],
          "crossClusterConnections": ["other cluster it relates to"]
        }
      ],
      "hiddenPatterns": [
        {
          "name": "Pattern Name",
          "description": "Non-obvious pattern discovered in the content",
          "type": "recurring_theme|underlying_structure|implicit_relationship|emergent_property",
          "strength": 0.8,
          "conceptsInvolved": ["concept 1", "concept 2", "concept 3"],
          "insight": "The deeper insight this pattern reveals",
          "implications": ["what this pattern suggests about the future"]
        }
      ],
      "theoreticalFrameworks": [
        {
          "name": "Framework Name",
          "description": "Overarching theoretical structure",
          "scope": "local|domain|universal",
          "concepts": ["concepts it organizes"],
          "principles": ["underlying principles"],
          "applications": ["where this framework applies"],
          "limitations": ["where it breaks down"],
          "extensions": ["how it could be extended"]
        }
      ],
      "innovationOpportunities": [
        {
          "name": "Opportunity Name",
          "description": "Creative possibility emerging from concept combinations",
          "conceptCombination": ["concept 1", "concept 2"],
          "novelty": 0.9,
          "feasibility": 0.7,
          "impact": 0.8,
          "timeline": "near|medium|far future",
          "requirements": ["what would be needed to realize this"]
        }
      ]
    }

    Focus on ABSTRACT thinking, PATTERN recognition, and BIG PICTURE connections.
    Create content that inspires "aha!" moments and creative insights.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Concept Universe Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const conceptUniverse = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed concept universe');
        return conceptUniverse;
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackConceptUniverse(docxText);
    } catch (error) {
      console.error('❌ Error generating concept universe:', error);
      return this.getIntelligentFallbackConceptUniverse(docxText);
    }
  }

  /**
   * Generate insight patterns for pattern discovery
   */
  async generateInsightPatterns(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    You are creating INSIGHT PATTERNS for intuitive learners who excel at seeing hidden connections and abstract relationships.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Intuitive learners need:
    1. DEEP insights that aren't immediately obvious
    2. CREATIVE connections between disparate ideas
    3. FUTURE implications and possibilities
    4. ABSTRACT relationships and patterns

    Create insight patterns based on the document content:

    {
      "insightMoments": [
        {
          "title": "Insight Title",
          "description": "The key insight or realization",
          "type": "connection|pattern|implication|possibility|paradox",
          "depth": "surface|medium|deep|profound",
          "conceptsConnected": ["concept 1", "concept 2", "concept 3"],
          "reasoning": "Why this insight is significant",
          "implications": ["what this means for understanding", "future possibilities"],
          "analogies": ["similar patterns in other domains"],
          "questions": ["thought-provoking questions this raises"],
          "explorationPaths": ["directions for further investigation"]
        }
      ],
      "conceptualBridges": [
        {
          "name": "Bridge Name",
          "description": "Connection between seemingly unrelated concepts",
          "fromConcept": "Starting concept",
          "toConcept": "Connected concept",
          "bridgeType": "analogy|causation|correlation|transformation|emergence",
          "strength": 0.8,
          "novelty": 0.9,
          "explanation": "How these concepts are actually related",
          "examples": ["concrete examples of this connection"],
          "implications": ["what this connection reveals"]
        }
      ],
      "emergentThemes": [
        {
          "name": "Theme Name",
          "description": "Overarching theme that emerges from multiple concepts",
          "concepts": ["contributing concepts"],
          "abstractionLevel": "high|medium|low",
          "universality": "document-specific|domain-wide|universal",
          "manifestations": ["how this theme appears in different contexts"],
          "evolution": "how this theme might develop over time",
          "crossDomainApplications": ["where else this theme might apply"]
        }
      ],
      "futureScenarios": [
        {
          "name": "Scenario Name",
          "description": "Possible future development based on current concepts",
          "basedOnConcepts": ["foundational concepts"],
          "timeline": "1-5 years|5-10 years|10+ years",
          "probability": 0.7,
          "impact": 0.8,
          "requirements": ["what needs to happen for this scenario"],
          "indicators": ["early signs this scenario is developing"],
          "implications": ["what this would mean for the field"]
        }
      ],
      "paradoxes": [
        {
          "name": "Paradox Name",
          "description": "Apparent contradiction that reveals deeper truth",
          "contradiction": "What seems contradictory",
          "resolution": "How the paradox resolves at a higher level",
          "insights": ["what this paradox teaches us"],
          "examples": ["instances of this paradox"],
          "implications": ["how this changes our understanding"]
        }
      ]
    }

    Focus on CREATIVE insights, ABSTRACT connections, and FUTURE possibilities.
    Generate content that sparks curiosity and "aha!" moments.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Insight Patterns Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insightPatterns = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed insight patterns');
        return insightPatterns;
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackInsightPatterns(docxText);
    } catch (error) {
      console.error('❌ Error generating insight patterns:', error);
      return this.getIntelligentFallbackInsightPatterns(docxText);
    }
  }

  /**
   * Intelligent fallback for concept universe
   */
  getIntelligentFallbackConceptUniverse(docxText) {
    console.log('🔄 Creating intelligent fallback concept universe');

    return {
      conceptClusters: [
        {
          name: "Core Theoretical Framework",
          theme: "Foundational concepts and principles",
          description: "The fundamental theoretical structure underlying the document content",
          abstractionLevel: "high",
          concepts: [
            {
              name: "Primary Concept",
              description: "The main theoretical concept explored in the document",
              type: "theory",
              abstractionLevel: "high",
              connections: ["Secondary Concept", "Applied Principle"],
              implications: ["Future research directions", "Practical applications"],
              position: { x: 0.5, y: 0.5, z: 0.5 },
              size: 1.0,
              color: "#6366f1",
              energy: 0.9
            },
            {
              name: "Secondary Concept",
              description: "Supporting theoretical framework that complements the primary concept",
              type: "framework",
              abstractionLevel: "medium",
              connections: ["Primary Concept", "Practical Application"],
              implications: ["Enhanced understanding", "Cross-domain applications"],
              position: { x: 0.3, y: 0.7, z: 0.4 },
              size: 0.8,
              color: "#8b5cf6",
              energy: 0.7
            },
            {
              name: "Applied Principle",
              description: "Practical manifestation of the theoretical concepts",
              type: "principle",
              abstractionLevel: "medium",
              connections: ["Primary Concept", "Real-world Implementation"],
              implications: ["Immediate applications", "Validation opportunities"],
              position: { x: 0.7, y: 0.3, z: 0.6 },
              size: 0.7,
              color: "#06b6d4",
              energy: 0.8
            }
          ],
          emergentProperties: ["Synergistic understanding", "Holistic perspective"],
          futureDirections: ["Advanced theoretical development", "Interdisciplinary integration"],
          crossClusterConnections: ["Implementation Strategies", "Innovation Opportunities"]
        },
        {
          name: "Implementation Strategies",
          theme: "Practical application and methodology",
          description: "How theoretical concepts translate into practical implementation",
          abstractionLevel: "medium",
          concepts: [
            {
              name: "Methodological Approach",
              description: "Systematic approach to applying the concepts",
              type: "pattern",
              abstractionLevel: "medium",
              connections: ["Applied Principle", "Practical Outcomes"],
              implications: ["Scalable solutions", "Measurable results"],
              position: { x: 0.2, y: 0.4, z: 0.8 },
              size: 0.6,
              color: "#10b981",
              energy: 0.6
            },
            {
              name: "Practical Outcomes",
              description: "Observable results and measurable impacts",
              type: "paradigm",
              abstractionLevel: "low",
              connections: ["Methodological Approach", "Future Innovations"],
              implications: ["Validation of theory", "Continuous improvement"],
              position: { x: 0.8, y: 0.6, z: 0.2 },
              size: 0.5,
              color: "#f59e0b",
              energy: 0.5
            }
          ],
          emergentProperties: ["Systematic effectiveness", "Adaptive methodology"],
          futureDirections: ["Optimization strategies", "Scalability solutions"],
          crossClusterConnections: ["Core Theoretical Framework", "Innovation Opportunities"]
        }
      ],
      hiddenPatterns: [
        {
          name: "Recursive Enhancement Pattern",
          description: "The document reveals a pattern where concepts build upon themselves in increasingly sophisticated ways",
          type: "recurring_theme",
          strength: 0.8,
          conceptsInvolved: ["Primary Concept", "Applied Principle", "Methodological Approach"],
          insight: "Understanding deepens through iterative application and reflection",
          implications: ["Continuous learning cycles", "Exponential knowledge growth"]
        },
        {
          name: "Cross-Domain Applicability",
          description: "Concepts show potential for application across multiple domains and contexts",
          type: "emergent_property",
          strength: 0.7,
          conceptsInvolved: ["Secondary Concept", "Practical Outcomes"],
          insight: "Universal principles transcend specific implementation contexts",
          implications: ["Broader impact potential", "Interdisciplinary opportunities"]
        }
      ],
      theoreticalFrameworks: [
        {
          name: "Integrated Learning Framework",
          description: "A comprehensive approach to understanding and applying the document's concepts",
          scope: "domain",
          concepts: ["Primary Concept", "Secondary Concept", "Applied Principle"],
          principles: ["Systematic understanding", "Practical application", "Continuous improvement"],
          applications: ["Educational contexts", "Professional development", "Research initiatives"],
          limitations: ["Context-specific constraints", "Resource requirements"],
          extensions: ["Advanced applications", "Cross-domain integration"]
        }
      ],
      innovationOpportunities: [
        {
          name: "Conceptual Synthesis Innovation",
          description: "Opportunity to create novel solutions by combining theoretical and practical elements",
          conceptCombination: ["Primary Concept", "Methodological Approach"],
          novelty: 0.8,
          feasibility: 0.7,
          impact: 0.9,
          timeline: "medium future",
          requirements: ["Advanced understanding", "Implementation resources", "Collaborative effort"]
        },
        {
          name: "Cross-Domain Application",
          description: "Potential to apply concepts in entirely new domains and contexts",
          conceptCombination: ["Secondary Concept", "Practical Outcomes"],
          novelty: 0.9,
          feasibility: 0.6,
          impact: 0.8,
          timeline: "far future",
          requirements: ["Domain expertise", "Adaptation strategies", "Validation methods"]
        }
      ]
    };
  }

  /**
   * Intelligent fallback for insight patterns
   */
  getIntelligentFallbackInsightPatterns(docxText) {
    console.log('🔄 Creating intelligent fallback insight patterns');

    return {
      insightMoments: [
        {
          title: "Conceptual Integration Insight",
          description: "The realization that seemingly separate concepts are actually interconnected parts of a larger system",
          type: "connection",
          depth: "deep",
          conceptsConnected: ["Primary Concept", "Secondary Concept", "Applied Principle"],
          reasoning: "Understanding the systemic nature reveals deeper patterns and possibilities",
          implications: ["Holistic understanding", "Enhanced problem-solving capabilities"],
          analogies: ["Ecosystem interdependence", "Neural network connectivity"],
          questions: ["How do these connections manifest in other contexts?", "What other systems exhibit similar patterns?"],
          explorationPaths: ["Cross-domain pattern analysis", "System dynamics investigation"]
        },
        {
          title: "Future Possibility Recognition",
          description: "Seeing potential applications and developments that aren't immediately obvious",
          type: "possibility",
          depth: "profound",
          conceptsConnected: ["Methodological Approach", "Practical Outcomes"],
          reasoning: "Current trends and patterns suggest emerging opportunities for innovation",
          implications: ["Proactive development strategies", "Competitive advantages"],
          analogies: ["Technological evolution patterns", "Natural selection processes"],
          questions: ["What conditions would accelerate these developments?", "How can we prepare for these possibilities?"],
          explorationPaths: ["Trend analysis", "Scenario planning", "Innovation strategy development"]
        }
      ],
      conceptualBridges: [
        {
          name: "Theory-Practice Bridge",
          description: "The connection between abstract theoretical concepts and concrete practical applications",
          fromConcept: "Primary Concept",
          toConcept: "Practical Outcomes",
          bridgeType: "transformation",
          strength: 0.9,
          novelty: 0.7,
          explanation: "Abstract principles become concrete through systematic application and adaptation",
          examples: ["Scientific theories leading to technologies", "Philosophical ideas influencing policies"],
          implications: ["Validates theoretical understanding", "Enables practical innovation"]
        },
        {
          name: "Cross-Contextual Application Bridge",
          description: "How concepts from one domain can be applied in entirely different contexts",
          fromConcept: "Methodological Approach",
          toConcept: "Secondary Concept",
          bridgeType: "analogy",
          strength: 0.8,
          novelty: 0.9,
          explanation: "Similar patterns and principles operate across different domains and scales",
          examples: ["Biological processes inspiring algorithms", "Social dynamics informing organizational design"],
          implications: ["Expands application possibilities", "Reveals universal principles"]
        }
      ],
      emergentThemes: [
        {
          name: "Adaptive Intelligence",
          description: "The theme of systems and approaches that learn and improve over time",
          concepts: ["Primary Concept", "Methodological Approach", "Practical Outcomes"],
          abstractionLevel: "high",
          universality: "universal",
          manifestations: ["Self-improving systems", "Evolutionary processes", "Learning organizations"],
          evolution: "Increasing sophistication and autonomy over time",
          crossDomainApplications: ["Artificial intelligence", "Organizational development", "Educational systems"]
        },
        {
          name: "Systemic Integration",
          description: "The recurring theme of parts working together to create emergent properties",
          concepts: ["Secondary Concept", "Applied Principle"],
          abstractionLevel: "high",
          universality: "domain-wide",
          manifestations: ["Holistic approaches", "Interdisciplinary collaboration", "Systems thinking"],
          evolution: "Growing recognition of interconnectedness and complexity",
          crossDomainApplications: ["Complex systems science", "Ecological thinking", "Integrated design"]
        }
      ],
      futureScenarios: [
        {
          name: "Advanced Integration Scenario",
          description: "A future where the concepts become fully integrated into standard practice and thinking",
          basedOnConcepts: ["Primary Concept", "Methodological Approach"],
          timeline: "5-10 years",
          probability: 0.8,
          impact: 0.9,
          requirements: ["Widespread adoption", "Educational integration", "Technological support"],
          indicators: ["Increasing implementation", "Academic curriculum inclusion", "Industry standards development"],
          implications: ["Transformed practices", "Enhanced capabilities", "New opportunities"]
        },
        {
          name: "Cross-Domain Revolution Scenario",
          description: "A future where these concepts revolutionize multiple fields simultaneously",
          basedOnConcepts: ["Secondary Concept", "Applied Principle"],
          timeline: "10+ years",
          probability: 0.6,
          impact: 1.0,
          requirements: ["Paradigm shifts", "Interdisciplinary collaboration", "Breakthrough innovations"],
          indicators: ["Cross-field adoption", "Hybrid disciplines emergence", "Fundamental rethinking"],
          implications: ["Paradigmatic changes", "New fields of study", "Societal transformation"]
        }
      ],
      paradoxes: [
        {
          name: "Simplicity-Complexity Paradox",
          description: "The apparent contradiction between simple principles and complex applications",
          contradiction: "Simple concepts lead to complex implementations",
          resolution: "Simplicity at one level enables complexity at another level",
          insights: ["Hierarchical organization of complexity", "Emergent properties from simple rules"],
          examples: ["Simple mathematical rules creating complex patterns", "Basic principles enabling sophisticated systems"],
          implications: ["Focus on fundamental principles", "Embrace emergent complexity"]
        },
        {
          name: "Stability-Change Paradox",
          description: "The tension between maintaining stability and enabling continuous change",
          contradiction: "Systems need both stability and adaptability",
          resolution: "Dynamic stability through controlled change and adaptive mechanisms",
          insights: ["Balance between structure and flexibility", "Evolution through stable foundations"],
          examples: ["Living systems maintaining identity while changing", "Organizations preserving culture while innovating"],
          implications: ["Design for adaptive stability", "Manage change systematically"]
        }
      ]
    };
  }
}

export default new IntuitiveLearningService();