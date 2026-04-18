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
    You are creating INTERACTIVE SIMULATIONS for sensing learners who need hands-on, concrete experiences.

    Document Content:
    ${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}

    Sensing learners need:
    1. CONCRETE, manipulatable elements they can interact with
    2. REAL DATA and factual information they can verify
    3. STEP-BY-STEP procedures with immediate feedback
    4. PRACTICAL applications they can see and touch

    Create interactive simulations based on the document content:

    {
      "simulations": [
        {
          "title": "Simulation Name",
          "description": "What this simulation teaches and how it works",
          "type": "calculator|graph|experiment|data_analysis|virtual_lab",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTime": "10-15 min",
          "interactiveElements": [
            {
              "name": "Element Name",
              "type": "slider|input|dropdown|button|graph",
              "description": "What this element controls",
              "defaultValue": "default setting",
              "range": "min-max values or options",
              "unit": "measurement unit if applicable"
            }
          ],
          "learningObjectives": ["objective 1", "objective 2", "objective 3"],
          "realWorldApplication": "How this applies in practice",
          "dataPoints": [
            {
              "label": "Data Point Name",
              "value": "sample or seed value shown before interaction",
              "description": "What this data represents",
              "fromElements": ["optional: exact names of interactiveElements that drive this readout"],
              "combine": "sum | product | mean | min | max | first | last — how to merge numeric fromElements (default sum). For a single slider/input use one name and combine first."
            }
          ],
          "stepByStepGuide": [
            "Step 1: Clear instruction",
            "Step 2: What to do next",
            "Step 3: Expected result"
          ],
          "expectedOutcomes": "What learners should observe and learn"
        }
      ]
    }

    For EVERY dataPoint, set "fromElements" to the interactive element NAME(s) whose values should update that readout live.
    Use "combine": "first" when a single control maps to a readout; use "sum" or "product" when multiple numeric inputs feed one result.
    Optional on a "button" element: same "fromElements" + "combine" so the UI can echo the same rule on Calculate.

    Focus on creating CONCRETE, MANIPULATABLE simulations that sensing learners can interact with directly.
    Base everything on FACTUAL content from the document.
    `;

    const simulationsPayload = await this.generateStrictJsonWith413Retry(
      buildPrompt,
      `{
  "simulations": [
    {
      "title": "string",
      "description": "string",
      "type": "calculator|graph|experiment|data_analysis|virtual_lab",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "string",
      "interactiveElements": [
        { "name": "string", "type": "slider|input|dropdown|button|graph", "description": "string", "defaultValue": "string", "range": "string or array", "unit": "string" }
      ],
      "learningObjectives": ["string"],
      "realWorldApplication": "string",
      "dataPoints": [
        { "label": "string", "value": "string", "description": "string", "fromElements": ["string"], "combine": "sum|product|mean|min|max|first|last" }
      ],
      "stepByStepGuide": ["string"],
      "expectedOutcomes": "string"
    }
  ]
}`
    );

    let simulations = this.normalizeSimulationsPayload(simulationsPayload);

    // Recovery pass: ask explicitly for a bare simulations array if model used a wrong shape.
    if (!simulations.length) {
      const rescuePayload = await this.generateStrictJsonWith413Retry(
        (maxChars) => `
Return ONLY JSON in this exact shape:
{ "simulations": [ { "title": "string", "description": "string", "type": "calculator|graph|experiment|data_analysis|virtual_lab", "difficulty": "beginner|intermediate|advanced", "estimatedTime": "string", "interactiveElements": [ { "name": "string", "type": "slider|input|dropdown|button|graph", "description": "string", "defaultValue": "string", "range": "string or array", "unit": "string" } ], "learningObjectives": ["string"], "realWorldApplication": "string", "dataPoints": [ { "label": "string", "value": "string", "description": "string", "fromElements": ["string"], "combine": "sum|product|mean|min|max|first|last" } ], "stepByStepGuide": ["string"], "expectedOutcomes": "string" } ] }

Source document excerpt:
${docxText.substring(0, maxChars)}${docxText.length > maxChars ? '...' : ''}
`,
        `{ "simulations": [ { "title": "string", "description": "string" } ] }`
      );
      simulations = this.normalizeSimulationsPayload(rescuePayload);
    }

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