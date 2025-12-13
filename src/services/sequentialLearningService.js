import { GoogleGenerativeAI } from '@google/generative-ai';

class SequentialLearningService {
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
        console.log('🎯 Sequential Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Sequential Learning Service:', error);
      }
    }
  }

  /**
   * Analyze if content is educational using the SAME logic as AI Narrator
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
      console.log('🎯 Sequential Learning: Using same AI analysis logic as AI Narrator...');
      
      // Use the same AI analysis logic as the AI Narrator API
      this.initializeModels();
      
      if (!this.genAI) {
        throw new Error('Google AI service not available');
      }

      // Truncate content if too long (same as AI Narrator)
      const maxLength = 4000;
      const truncatedContent = docxText.length > maxLength 
        ? docxText.substring(0, maxLength) + "..."
        : docxText;

      const prompt = `
You are an AI content analyzer. Your task is to determine if the given document content is educational/learning material that would be suitable for sequential learning.

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

Analyze the following document content and determine if it's educational material suitable for sequential learning:

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a JSON object containing:
{
  "isEducational": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "contentType": "Brief description of what type of content this is"
}

Be strict in your analysis - only classify content as educational if it genuinely contains learning material that students could benefit from sequential learning assistance.`;

      const model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text().trim();
      
      // Parse the AI response (same logic as AI Narrator API)
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
        
        // Fallback analysis if AI response is malformed (same as AI Narrator)
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

      console.log('🎯 Sequential Learning AI Analysis Result:', {
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
      
      // Fallback analysis if AI fails (same as AI Narrator)
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
   * Generate sequential learning content from document text (with educational analysis)
   */
  async generateSequentialContent(docxText) {
    this.initializeModels();

    if (!this.model) {
      throw new Error('Sequential learning model not available');
    }

    try {
      // First, analyze if content is educational
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for sequential learning. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for sequential learning generation');

      // Generate both steps and concept flow
      const [steps, conceptFlow] = await Promise.all([
        this.generateStepBreakdown(docxText),
        this.generateConceptFlow(docxText)
      ]);

      return {
        success: true,
        steps,
        conceptFlow,
        analysis
      };
    } catch (error) {
      console.error('Error generating sequential content:', error);
      throw new Error('Failed to generate sequential learning content');
    }
  }

  /**
   * Generate step-by-step breakdown of content
   */
  async generateStepBreakdown(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    // First, get document analysis for better context
    const documentAnalysis = await this.analyzeDocumentForConcepts(docxText);

    const prompt = `
    Based on this document analysis, create a detailed step-by-step breakdown:

    DOCUMENT ANALYSIS:
    ${JSON.stringify(documentAnalysis, null, 2)}

    Document Content (first 3000 chars):
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Create SPECIFIC steps based on this document's actual content. Each step should:
    1. Reference actual sections, topics, or concepts from the document
    2. Break down the document's logical progression
    3. Use concrete examples and content from the document
    4. Build sequentially on previous steps

    Structure each step as:
    {
      "title": "Specific section or concept from the document",
      "content": "Detailed explanation using actual content from the document, explain what this section covers and why it matters. Use HTML formatting.",
      "order": 1,
      "estimatedTime": "10-15 min",
      "keyTakeaways": ["actual takeaway 1", "actual takeaway 2"],
      "documentSection": "which part of the document this covers"
    }

    Create 3-6 steps that follow the document's actual structure and progression.
    Make it specific to this document's content, not generic.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Step Breakdown Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed steps:', steps.length, 'steps');
        return steps.map((step, index) => ({
          ...step,
          order: index + 1,
          id: `step_${index + 1}`
        }));
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackSteps(docxText, documentAnalysis);
    } catch (error) {
      console.error('❌ Error generating step breakdown:', error);
      return this.getIntelligentFallbackSteps(docxText, documentAnalysis);
    }
  }

  /**
   * Intelligent fallback that creates document-specific steps
   */
  getIntelligentFallbackSteps(docxText, analysis) {
    console.log('🔄 Creating intelligent fallback steps based on document analysis');

    // Extract meaningful content from the document
    const paragraphs = docxText.split('\n').filter(p => p.trim().length > 50);
    const sentences = docxText.split(/[.!?]+/).filter(s => s.trim().length > 40).slice(0, 15);

    // Create document-specific steps
    const steps = [
      {
        title: `Understanding ${analysis.mainTopic || 'The Main Topic'}`,
        content: `
          <p>This initial step focuses on grasping the core subject: <strong>${analysis.mainTopic || 'the document content'}</strong>.</p>
          <p><strong>Key Focus Areas:</strong></p>
          <ul>
            <li>Understanding the main purpose and objectives</li>
            <li>Identifying the target audience and context</li>
            <li>Recognizing the scope and boundaries of the topic</li>
          </ul>
          <p>This foundation is essential before moving to more detailed aspects.</p>
        `,
        order: 1,
        estimatedTime: "15-20 min",
        keyTakeaways: [
          `Core purpose of ${analysis.mainTopic || 'the topic'}`,
          "Main objectives and goals",
          "Target context and application"
        ],
        documentSection: "Introduction and Overview",
        id: "step_1"
      }
    ];

    // Add middle steps based on document structure
    if (paragraphs.length > 2) {
      const midStepCount = Math.min(3, Math.floor(paragraphs.length / 2));

      for (let i = 0; i < midStepCount; i++) {
        const paragraphIndex = Math.floor((i + 1) * paragraphs.length / (midStepCount + 1));
        const paragraph = paragraphs[paragraphIndex] || paragraphs[i] || "Content section";

        steps.push({
          title: `Exploring ${analysis.keySections?.[i] || `Section ${i + 2}`}`,
          content: `
            <p>This step examines <strong>${paragraph.substring(0, 60)}...</strong></p>
            <p><strong>Detailed Analysis:</strong></p>
            <ul>
              <li>Breaking down complex information into digestible parts</li>
              <li>Understanding relationships between different elements</li>
              <li>Identifying patterns and connections</li>
            </ul>
            <p>Building on previous concepts to develop deeper understanding.</p>
          `,
          order: i + 2,
          estimatedTime: "20-25 min",
          keyTakeaways: [
            `Key elements from ${analysis.keySections?.[i] || `section ${i + 2}`}`,
            "Important relationships and connections",
            "Critical insights and implications"
          ],
          documentSection: analysis.keySections?.[i] || `Section ${i + 2}`,
          id: `step_${i + 2}`
        });
      }
    }

    // Add final synthesis step
    steps.push({
      title: "Application and Integration",
      content: `
        <p>This final step brings together all concepts from <strong>${analysis.mainTopic || 'the document'}</strong>.</p>
        <p><strong>Synthesis and Application:</strong></p>
        <ul>
          <li>Integrating different concepts and ideas</li>
          <li>Understanding broader implications</li>
          <li>Applying knowledge to real-world scenarios</li>
        </ul>
        <p>Developing comprehensive understanding and practical application skills.</p>
      `,
      order: steps.length + 1,
      estimatedTime: "25-30 min",
      keyTakeaways: [
        "Integrated understanding of all concepts",
        "Practical applications and use cases",
        "Broader implications and connections"
      ],
      documentSection: "Conclusion and Application",
      id: `step_${steps.length + 1}`
    });

    console.log('✅ Created intelligent steps:', steps.length, 'steps');
    return steps;
  }

  /**
   * Generate concept flow mapping
   */
  async generateConceptFlow(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    // First, analyze the document to understand its structure and content
    const documentAnalysis = await this.analyzeDocumentForConcepts(docxText);

    const prompt = `
    Based on this document analysis, create a detailed concept progression flow that explains the document's content clearly:

    DOCUMENT ANALYSIS:
    ${JSON.stringify(documentAnalysis, null, 2)}

    Document Content (first 3000 chars):
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

    Create a concept flow where each stage EXPLAINS the document's actual content. Each stage should:
    1. Use specific concepts and topics that appear in the document
    2. Explain what the document teaches about each concept
    3. Show how concepts connect based on the document's content
    4. Make the content understandable without external research

    Structure each stage as:
    {
      "title": "Specific concept or topic from the document",
      "description": "Clear explanation of what this concept means in the context of this document, use examples from the document text",
      "prerequisites": ["concepts from previous stages this builds on"],
      "difficulty": "Beginner|Intermediate|Advanced|Expert",
      "keyPoints": ["what the document teaches about point 1", "what the document teaches about point 2", "what the document teaches about point 3"],
      "documentReferences": ["specific parts of the document this covers"],
      "learningOutcome": "What you'll know after reading this section"
    }

    Create 3-5 stages that explain the document's content progressively.
    Focus on TEACHING the document's content, not requiring external knowledge.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Concept Flow Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const conceptFlow = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed concept flow:', conceptFlow.length, 'stages');
        return conceptFlow;
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackConceptFlow(docxText, documentAnalysis);
    } catch (error) {
      console.error('❌ Error generating concept flow:', error);
      return this.getIntelligentFallbackConceptFlow(docxText, documentAnalysis);
    }
  }

  /**
   * Analyze document to extract specific concepts and structure
   */
  async analyzeDocumentForConcepts(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      return this.getBasicDocumentAnalysis(docxText);
    }

    const prompt = `
    Analyze this document and extract specific concepts, topics, and learning progression:

    Content:
    ${docxText.substring(0, 1500)}${docxText.length > 1500 ? '...' : ''}

    Return analysis in JSON format:
    {
      "mainTopic": "What is this document actually about?",
      "keySections": ["section 1", "section 2", "section 3"],
      "mainConcepts": ["concept 1", "concept 2", "concept 3"],
      "learningObjectives": ["objective 1", "objective 2"],
      "difficultyProgression": "How does complexity build throughout the document?",
      "practicalElements": ["hands-on parts", "examples", "applications"],
      "theoreticalElements": ["theory parts", "principles", "concepts"],
      "estimatedReadingTime": "total time to understand",
      "prerequisiteKnowledge": "what should readers know first"
    }

    Be specific and reference actual content from the document.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getBasicDocumentAnalysis(docxText);
    } catch (error) {
      console.error('Error analyzing document for concepts:', error);
      return this.getBasicDocumentAnalysis(docxText);
    }
  }

  /**
   * Get basic document analysis as fallback
   */
  getBasicDocumentAnalysis(docxText) {
    const paragraphs = docxText.split('\n').filter(p => p.trim().length > 20);
    const words = docxText.split(/\s+/).length;

    return {
      mainTopic: "Document Content Analysis",
      keySections: paragraphs.slice(0, 5).map((p, i) => `Section ${i + 1}`),
      mainConcepts: ["Core Topic", "Key Points", "Applications"],
      learningObjectives: ["Understand main concepts", "Apply knowledge", "Analyze implications"],
      difficultyProgression: "Progressive complexity",
      practicalElements: ["Examples", "Case studies"],
      theoreticalElements: ["Principles", "Theory"],
      estimatedReadingTime: `${Math.max(15, Math.min(90, Math.floor(words / 200)))} minutes`,
      prerequisiteKnowledge: "Basic understanding of the topic"
    };
  }

  /**
   * Intelligent fallback that creates document-specific concept flow
   */
  getIntelligentFallbackConceptFlow(docxText, analysis) {
    console.log('🔄 Creating intelligent fallback concept flow based on document analysis');

    // Extract meaningful content from the document
    const sentences = docxText.split(/[.!?]+/).filter(s => s.trim().length > 30).slice(0, 20);
    const paragraphs = docxText.split('\n').filter(p => p.trim().length > 50).slice(0, 10);

    // Create document-specific stages
    const conceptFlow = [
      {
        title: analysis.mainTopic || "Foundation Concepts",
        description: `Understanding the core topic: ${analysis.mainTopic || 'document content'}. This stage covers the essential background and context needed for the entire document.`,
        prerequisites: [],
        difficulty: "Beginner",
        estimatedTime: "15-20 min",
        keyPoints: [
          `Overview of ${analysis.mainTopic || 'the main topic'}`,
          "Background context and importance",
          "Basic terminology and definitions"
        ].filter(point => point.length > 10),
        documentReferences: ["Introduction", "Background section"]
      }
    ];

    // Add middle stages based on document structure
    if (analysis.keySections && analysis.keySections.length > 0) {
      analysis.keySections.slice(0, 2).forEach((section, index) => {
        conceptFlow.push({
          title: section,
          description: `Exploring ${section.toLowerCase()} in detail. This stage builds on foundation concepts and develops deeper understanding.`,
          prerequisites: conceptFlow.map(c => c.title),
          difficulty: index === 0 ? "Intermediate" : "Advanced",
          estimatedTime: "20-25 min",
          keyPoints: [
            `Detailed examination of ${section.toLowerCase()}`,
            "Key components and relationships",
            "Important connections to other sections"
          ],
          documentReferences: [section]
        });
      });
    }

    // Add final stage
    conceptFlow.push({
      title: "Application and Synthesis",
      description: `Bringing together all concepts from ${analysis.mainTopic || 'the document'} and understanding their practical implications and applications.`,
      prerequisites: conceptFlow.slice(0, -1).map(c => c.title),
      difficulty: "Advanced",
      estimatedTime: "25-30 min",
      keyPoints: [
        "Real-world applications",
        "Integration of concepts",
        "Future implications"
      ],
      documentReferences: ["Conclusion", "Applications", "Summary"]
    });

    console.log('✅ Created intelligent concept flow:', conceptFlow.length, 'stages');
    return conceptFlow;
  }

  /**
   * Fallback step breakdown when AI generation fails
   */
  getFallbackSteps(docxText) {
    // Simple fallback based on content length and structure
    const paragraphs = docxText.split('\n').filter(p => p.trim().length > 0);
    const chunkSize = Math.ceil(paragraphs.length / 4);

    const fallbackSteps = [
      {
        title: 'Introduction and Overview',
        content: `
          <p>This section introduces the main topic and provides essential background information.</p>
          <p>Key learning objectives:</p>
          <ul>
            <li>Understand the basic concepts</li>
            <li>Identify main themes and ideas</li>
            <li>Establish foundation knowledge</li>
          </ul>
        `,
        order: 1,
        estimatedTime: '10-15 min',
        id: 'step_1'
      },
      {
        title: 'Core Concepts and Details',
        content: `
          <p>Here we explore the fundamental concepts in greater detail.</p>
          <p>Focus areas:</p>
          <ul>
            <li>Detailed explanations of key ideas</li>
            <li>Important definitions and terminology</li>
            <li>Essential principles and theories</li>
          </ul>
        `,
        order: 2,
        estimatedTime: '15-20 min',
        id: 'step_2'
      },
      {
        title: 'Practical Applications',
        content: `
          <p>This section examines real-world applications and practical implementations.</p>
          <p>Learning goals:</p>
          <ul>
            <li>Real-world examples and case studies</li>
            <li>Practical implementation strategies</li>
            <li>Best practices and guidelines</li>
          </ul>
        `,
        order: 3,
        estimatedTime: '20-25 min',
        id: 'step_3'
      },
      {
        title: 'Analysis and Synthesis',
        content: `
          <p>Critical analysis and synthesis of the concepts and their implications.</p>
          <p>Analysis includes:</p>
          <ul>
            <li>Strengths and advantages</li>
            <li>Limitations and challenges</li>
            <li>Future implications and developments</li>
          </ul>
        `,
        order: 4,
        estimatedTime: '15-20 min',
        id: 'step_4'
      }
    ];

    return fallbackSteps;
  }

  /**
   * Fallback concept flow when AI generation fails
   */
  getFallbackConceptFlow(docxText) {
    const fallbackFlow = [
      {
        title: 'Foundation Concepts',
        description: 'Basic building blocks and fundamental principles that form the foundation of understanding.',
        prerequisites: [],
        difficulty: 'Beginner',
        estimatedTime: '15-20 min',
        keyPoints: ['Basic terminology', 'Core principles', 'Essential definitions']
      },
      {
        title: 'Core Mechanisms',
        description: 'Primary processes and systems that make the foundation concepts work together.',
        prerequisites: ['Foundation Concepts'],
        difficulty: 'Intermediate',
        estimatedTime: '25-30 min',
        keyPoints: ['Main processes', 'System interactions', 'Key relationships']
      },
      {
        title: 'Advanced Applications',
        description: 'Complex implementations and sophisticated use cases that build on core mechanisms.',
        prerequisites: ['Foundation Concepts', 'Core Mechanisms'],
        difficulty: 'Advanced',
        estimatedTime: '35-40 min',
        keyPoints: ['Complex scenarios', 'Advanced techniques', 'Sophisticated implementations']
      },
      {
        title: 'Strategic Implementation',
        description: 'High-level planning and strategic deployment in real-world scenarios.',
        prerequisites: ['Foundation Concepts', 'Core Mechanisms', 'Advanced Applications'],
        difficulty: 'Expert',
        estimatedTime: '45-50 min',
        keyPoints: ['Strategic planning', 'Real-world deployment', 'Advanced optimization']
      }
    ];

    return fallbackFlow;
  }

  /**
   * Analyze document structure for sequential learning
   */
  async analyzeDocumentStructure(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    Analyze this document and identify its logical structure for sequential learning:

    Document Content:
    ${docxText}

    Provide analysis in this JSON format:
    {
      "mainTopic": "Primary subject of the document",
      "contentType": "academic|technical|instructional|informational",
      "recommendedSteps": 4,
      "logicalBreakpoints": ["paragraph_1", "paragraph_2"],
      "difficultyProgression": "beginner_to_advanced|mixed|consistent",
      "estimatedTotalTime": "60-90 min",
      "prerequisiteKnowledge": "basic|intermediate|advanced|none"
    }

    Focus on identifying the natural learning progression within the content.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis
      return {
        mainTopic: "Document Analysis",
        contentType: "informational",
        recommendedSteps: 4,
        logicalBreakpoints: [],
        difficultyProgression: "beginner_to_advanced",
        estimatedTotalTime: "45-60 min",
        prerequisiteKnowledge: "basic"
      };
    } catch (error) {
      console.error('Error analyzing document structure:', error);
      return {
        mainTopic: "Document Analysis",
        contentType: "informational",
        recommendedSteps: 4,
        logicalBreakpoints: [],
        difficultyProgression: "beginner_to_advanced",
        estimatedTotalTime: "45-60 min",
        prerequisiteKnowledge: "basic"
      };
    }
  }
}

export default new SequentialLearningService();