import { GoogleGenerativeAI } from '@google/generative-ai';

class SensingLearningService {
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
        console.log('🔬 Sensing Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Sensing Learning Service:', error);
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

      // Generate both interactive simulations and practical challenges
      const [simulations, challenges] = await Promise.all([
        this.generateInteractiveSimulations(docxText),
        this.generatePracticalChallenges(docxText)
      ]);

      return {
        success: true,
        simulations,
        challenges,
        analysis
      };
    } catch (error) {
      console.error('Error generating hands-on content:', error);
      throw new Error('Failed to generate hands-on learning content');
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

    const prompt = `
    You are creating INTERACTIVE SIMULATIONS for sensing learners who need hands-on, concrete experiences.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

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
              "value": "sample value",
              "description": "What this data represents"
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

    Focus on creating CONCRETE, MANIPULATABLE simulations that sensing learners can interact with directly.
    Base everything on FACTUAL content from the document.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Simulations Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const simulations = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed simulations:', simulations.simulations?.length || 0);
        return simulations.simulations || [];
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackSimulations(docxText);
    } catch (error) {
      console.error('❌ Error generating simulations:', error);
      return this.getIntelligentFallbackSimulations(docxText);
    }
  }

  /**
   * Generate practical challenges for hands-on learning
   */
  async generatePracticalChallenges(docxText) {
    this.initializeModels();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    You are creating PRACTICAL CHALLENGES for sensing learners who learn by doing.

    Document Content:
    ${docxText.substring(0, 3000)}${docxText.length > 3000 ? '...' : ''}

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

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 AI Challenges Response:', text.substring(0, 500) + '...');

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const challenges = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed challenges:', challenges.challenges?.length || 0);
        return challenges.challenges || [];
      }

      // Fallback if JSON parsing fails
      console.log('⚠️ JSON parsing failed, using intelligent fallback');
      return this.getIntelligentFallbackChallenges(docxText);
    } catch (error) {
      console.error('❌ Error generating challenges:', error);
      return this.getIntelligentFallbackChallenges(docxText);
    }
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
            description: "Representative value from document content"
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
            unit: "click"
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
            description: "Output of the calculation"
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