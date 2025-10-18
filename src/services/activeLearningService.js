import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Active Learning Service
 * Handles API calls for active learning features including interactive challenges,
 * collaborative activities, and discussion facilitation
 */

class ActiveLearningService {
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
        console.log('🎯 Active Learning Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Active Learning Service:', error);
      }
    }
  }

  /**
   * Generate interactive content for active learners
   * @param {string} content - Document content
   * @param {string} fileName - Name of the file
   * @returns {Promise<Object>} Interactive content including challenges, puzzles, and scenarios
   */
  async generateInteractiveContent(content, fileName) {
    try {
      console.log('🎯 Active Learning Service: Starting content generation...');
      
      this.initializeModels();
      
      if (!this.genAI) {
        throw new Error('Google AI service not available');
      }

      // Truncate content if too long
      const maxLength = 4000;
      const truncatedContent = content.length > maxLength 
        ? content.substring(0, maxLength) + "..."
        : content;

      const prompt = `You are an educational researcher specializing in the Felder-Silverman Learning Style Model. Create evidence-based active learning content for students who exhibit active learning preferences.

RESEARCH FOUNDATION:
- Active learners engage directly with material (Felder & Silverman, 1988)
- Active learners prefer group communication and collaborative learning
- Active learners process information through experimentation and hands-on activities
- Active learners retain information better through immediate application and discussion

Document: "${fileName}"
Content: "${truncatedContent}"

Generate professional, research-based active learning content with these components:

1. ENGAGEMENT TOOLS - Direct Material Interaction:
   - Key concepts for hands-on extraction and processing
   - Interactive annotation opportunities
   - Concept relationship mapping activities
   - Question generation exercises

2. COLLABORATION SIMULATION - Academic Discussion:
   - Thought-provoking discussion starters
   - Multiple perspective exploration topics
   - Socratic questioning sequences
   - Academic discourse prompts

3. APPLICATION SCENARIOS - Immediate Practice:
   - Real-world professional situations requiring concept application
   - Problem-solving scenarios with multiple approaches
   - Case studies for hands-on analysis
   - Implementation planning exercises

4. INTEGRATION ACTIVITIES - Knowledge Synthesis:
   - Teaching preparation exercises
   - Executive summary creation tasks
   - Professional presentation planning
   - Competency validation checkpoints

Focus on:
- Academic rigor and professional presentation
- Evidence-based learning methodologies
- Measurable learning outcomes
- Research-supported active learning principles
- Professional development applications

Return ONLY a valid JSON object with this structure:
{
  "engagementTools": {
    "concepts": [
      {
        "title": "Key Concept Title",
        "description": "Concept explanation",
        "category": "Primary/Secondary/Supporting",
        "relationships": ["Related concept 1", "Related concept 2"]
      }
    ],
    "annotations": [
      {
        "type": "highlight",
        "prompt": "Identify and highlight key principles",
        "guidance": "Look for foundational concepts"
      }
    ],
    "questions": [
      {
        "prompt": "Generate a question about this concept",
        "type": "analytical/application/synthesis"
      }
    ]
  },
  "collaborationTopics": [
    {
      "title": "Academic Discussion Topic",
      "description": "Professional discussion prompt",
      "perspectives": ["Perspective A", "Perspective B", "Perspective C"],
      "socraticQuestions": ["Question 1", "Question 2"],
      "learningObjectives": ["Objective 1", "Objective 2"]
    }
  ],
  "applicationScenarios": [
    {
      "title": "Professional Application Scenario",
      "description": "Real-world context description",
      "situation": "Detailed scenario description",
      "options": ["Approach A", "Approach B", "Approach C"],
      "learningGoals": ["Goal 1", "Goal 2"],
      "competencies": ["Competency 1", "Competency 2"]
    }
  ],
  "integrationActivities": [
    {
      "title": "Knowledge Integration Activity",
      "description": "Synthesis and teaching preparation",
      "type": "summary/outline/questions/implementation",
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "outcomes": ["Expected outcome 1", "Expected outcome 2"]
    }
  ]
}`;

      console.log('🎯 Sending prompt to Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text().trim();
      
      console.log('🎯 Received response from Gemini');
      console.log('📝 Raw AI response length:', aiResponse.length);

      // Parse the JSON response
      let parsedContent;
      try {
        // Remove any markdown code blocks if present
        const cleanedContent = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw content:', aiResponse);
        
        // Return a fallback response with evidence-based structure
        parsedContent = {
          engagementTools: {
            concepts: [
              {
                title: "Primary Learning Concept",
                description: "Main educational principle from the document",
                category: "Primary",
                relationships: ["Supporting concept", "Application area"]
              },
              {
                title: "Supporting Framework",
                description: "Secondary concept that supports main learning",
                category: "Secondary", 
                relationships: ["Primary concept", "Practical application"]
              },
              {
                title: "Implementation Strategy",
                description: "Practical approach for applying concepts",
                category: "Supporting",
                relationships: ["Primary concept", "Real-world context"]
              }
            ],
            annotations: [
              {
                type: "highlight",
                prompt: "Identify and highlight key educational principles",
                guidance: "Look for foundational concepts that can be applied"
              },
              {
                type: "extract",
                prompt: "Extract actionable insights from the content",
                guidance: "Focus on practical applications and implementations"
              }
            ],
            questions: [
              {
                prompt: "What are the core principles presented in this document?",
                type: "analytical"
              },
              {
                prompt: "How could these concepts be applied in a professional setting?",
                type: "application"
              }
            ]
          },
          collaborationTopics: [
            {
              title: "Effectiveness and Implementation",
              description: "Analyze the practical application of document concepts",
              perspectives: ["Academic researcher", "Industry practitioner", "End user"],
              socraticQuestions: [
                "What evidence supports the effectiveness of these approaches?",
                "What challenges might arise in real-world implementation?"
              ],
              learningObjectives: ["Critical analysis", "Practical evaluation"]
            },
            {
              title: "Future Implications and Innovation",
              description: "Explore how these concepts might evolve and impact the field",
              perspectives: ["Innovation advocate", "Cautious implementer", "Skeptical analyst"],
              socraticQuestions: [
                "How might these concepts change in the next 5-10 years?",
                "What are the potential unintended consequences?"
              ],
              learningObjectives: ["Strategic thinking", "Innovation analysis"]
            }
          ],
          applicationScenarios: [
            {
              title: "Professional Implementation Challenge",
              description: "Apply document concepts to solve a workplace problem",
              situation: "You are tasked with implementing the concepts from this document in your organization. Consider the practical challenges and opportunities.",
              options: [
                "Develop a comprehensive implementation plan with stakeholder buy-in",
                "Start with a pilot program to test effectiveness",
                "Conduct training sessions to build organizational capacity",
                "Create measurement systems to track success"
              ],
              learningGoals: ["Strategic planning", "Change management"],
              competencies: ["Implementation planning", "Stakeholder engagement"]
            },
            {
              title: "Problem-Solving Application",
              description: "Use document principles to address a complex challenge",
              situation: "A situation has arisen that requires applying the principles from this document. How would you approach the problem systematically?",
              options: [
                "Analyze the problem using the document's framework",
                "Collaborate with experts to develop solutions",
                "Test multiple approaches based on the concepts",
                "Evaluate outcomes and iterate on the solution"
              ],
              learningGoals: ["Problem-solving", "Systems thinking"],
              competencies: ["Analytical thinking", "Solution development"]
            }
          ],
          integrationActivities: [
            {
              title: "Executive Summary Creation",
              description: "Synthesize key concepts into a professional summary",
              type: "summary",
              instructions: [
                "Identify the 3-5 most important concepts",
                "Explain their significance and relationships",
                "Provide recommendations for application"
              ],
              outcomes: ["Clear communication of complex ideas", "Professional documentation skills"]
            },
            {
              title: "Teaching Preparation Outline",
              description: "Prepare to explain concepts to others",
              type: "outline",
              instructions: [
                "Structure content in logical learning sequence",
                "Identify key examples and analogies",
                "Develop assessment questions"
              ],
              outcomes: ["Deep understanding through teaching preparation", "Knowledge organization skills"]
            },
            {
              title: "Implementation Planning Workshop",
              description: "Create actionable plans for applying concepts",
              type: "implementation",
              instructions: [
                "Define specific implementation goals",
                "Identify required resources and timeline",
                "Develop success metrics and evaluation methods"
              ],
              outcomes: ["Practical application skills", "Project planning competency"]
            }
          ]
        };
      }

      console.log('✅ Active learning content generated successfully');
      return parsedContent;

    } catch (error) {
      console.error('Error generating interactive content:', error);
      throw error;
    }
  }

  /**
   * Get AI response for debate/discussion
   * @param {Object} topic - Discussion topic object
   * @param {string} userResponse - User's response/argument
   * @param {Array} history - Conversation history
   * @param {string} content - Document content for context
   * @returns {Promise<string>} AI facilitator response
   */
  async getDebateResponse(topic, userResponse, history, content) {
    try {
      console.log('🎯 Active Learning Service: Getting debate response...');
      
      this.initializeModels();
      
      if (!this.genAI) {
        throw new Error('Google AI service not available');
      }

      // Create context from conversation history
      const conversationContext = history.map(entry => 
        `${entry.type === 'user' ? 'Student' : 'AI Facilitator'}: ${entry.content}`
      ).join('\n');

      // Truncate content if too long
      const maxContentLength = 2000;
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + "..."
        : content;

      const prompt = `You are an expert AI debate facilitator and educational discussion leader. You're facilitating a learning discussion about: "${topic.title}"

Topic Description: ${topic.description}

Document Context: "${truncatedContent}"

Previous Conversation:
${conversationContext}

Latest Student Response: "${userResponse}"

As an AI facilitator, your role is to:
1. ENGAGE actively with the student's ideas
2. ASK thought-provoking follow-up questions
3. CHALLENGE assumptions constructively
4. PROVIDE alternative perspectives
5. ENCOURAGE deeper thinking
6. CONNECT ideas to real-world applications
7. MAINTAIN an encouraging but intellectually rigorous tone

Guidelines for your response:
- Keep responses conversational and engaging (2-4 sentences)
- Ask 1-2 specific follow-up questions
- Acknowledge good points while pushing for deeper analysis
- Introduce new angles or counterarguments when appropriate
- Use Socratic questioning techniques
- Stay focused on the learning objectives
- Be encouraging but intellectually challenging
- Reference the document content when relevant

Respond as the AI Facilitator in a natural, engaging way that promotes active learning and critical thinking.`;

      console.log('🎯 Sending prompt to Gemini for debate response...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text().trim();

      console.log('✅ Debate response generated successfully');
      return aiResponse;

    } catch (error) {
      console.error('Error getting debate response:', error);
      throw error;
    }
  }

  /**
   * Submit challenge response and get feedback
   * @param {Object} challenge - Challenge object
   * @param {string} userResponse - User's solution/response
   * @param {string} content - Document content for context
   * @returns {Promise<Object>} Feedback and scoring
   */
  static async submitChallengeResponse(challenge, userResponse, content) {
    try {
      // This would be implemented when we add challenge submission functionality
      const response = await fetch('/api/active-learning/challenge-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge,
          userResponse,
          content
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting challenge response:', error);
      throw error;
    }
  }

  /**
   * Validate puzzle solution
   * @param {Object} puzzle - Puzzle object
   * @param {Array} userSolution - User's arrangement/solution
   * @param {string} content - Document content for context
   * @returns {Promise<Object>} Validation result and feedback
   */
  static async validatePuzzleSolution(puzzle, userSolution, content) {
    try {
      // This would be implemented when we add puzzle validation functionality
      const response = await fetch('/api/active-learning/puzzle-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzle,
          userSolution,
          content
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating puzzle solution:', error);
      throw error;
    }
  }

  /**
   * Get scenario outcome based on user choice
   * @param {Object} scenario - Scenario object
   * @param {string} userChoice - User's selected option
   * @param {string} content - Document content for context
   * @returns {Promise<Object>} Outcome and learning feedback
   */
  static async getScenarioOutcome(scenario, userChoice, content) {
    try {
      // This would be implemented when we add scenario outcome functionality
      const response = await fetch('/api/active-learning/scenario-outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          userChoice,
          content
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting scenario outcome:', error);
      throw error;
    }
  }

  /**
   * Save user progress and achievements
   * @param {Object} progressData - User progress data
   * @returns {Promise<Object>} Save confirmation
   */
  static async saveProgress(progressData) {
    try {
      // This would integrate with a backend database to save user progress
      const response = await fetch('/api/active-learning/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Get user's learning analytics and progress
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} User analytics data
   */
  static async getUserAnalytics(userId) {
    try {
      // This would retrieve user analytics from backend
      const response = await fetch(`/api/active-learning/analytics/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const activeLearningService = new ActiveLearningService();
export default activeLearningService;