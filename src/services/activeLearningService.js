import { GroqGenAI as GoogleGenerativeAI, resolveOpenAICompatApiKey } from '@/lib/groqGenAI';

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

  /** Strip fences and extract first top-level JSON object. */
  extractJsonObject(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  }

  parseInteractivePayload(rawText) {
    const jsonStr = this.extractJsonObject(rawText);
    if (!jsonStr) throw new Error('No JSON object found in model output');
    return JSON.parse(jsonStr);
  }

  validateActiveLearningShape(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid active learning payload');
    const et = obj.engagementTools;
    if (!et || typeof et !== 'object') throw new Error('Missing engagementTools');
    if (!Array.isArray(et.concepts) || et.concepts.length < 1) {
      throw new Error('engagementTools.concepts must be a non-empty array');
    }
    if (!Array.isArray(obj.collaborationTopics) || obj.collaborationTopics.length < 1) {
      throw new Error('collaborationTopics must be a non-empty array');
    }
    if (!Array.isArray(obj.applicationScenarios) || obj.applicationScenarios.length < 1) {
      throw new Error('applicationScenarios must be a non-empty array');
    }
    if (!Array.isArray(obj.integrationActivities) || obj.integrationActivities.length < 1) {
      throw new Error('integrationActivities must be a non-empty array');
    }
  }

  /**
   * Fill missing sections using the first model-produced concept (still from the same model run / document).
   * Avoids hard failure when the model returns valid JSON but omits a section or truncates arrays.
   */
  normalizeActiveLearningPayload(obj, truncatedContent) {
    if (!obj || typeof obj !== 'object') return;
    if (!obj.engagementTools || typeof obj.engagementTools !== 'object') {
      obj.engagementTools = { concepts: [], annotations: [], questions: [] };
    }
    const et = obj.engagementTools;
    if (!Array.isArray(et.concepts)) et.concepts = [];
    if (!Array.isArray(et.annotations)) et.annotations = [];
    if (!Array.isArray(et.questions)) et.questions = [];
    if (!Array.isArray(obj.collaborationTopics)) obj.collaborationTopics = [];
    if (!Array.isArray(obj.applicationScenarios)) obj.applicationScenarios = [];
    if (!Array.isArray(obj.integrationActivities)) obj.integrationActivities = [];

    const excerpt = String(truncatedContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 420);
    const c0 = et.concepts[0];
    if (!c0) return;

    if (obj.collaborationTopics.length === 0) {
      obj.collaborationTopics.push({
        title: `Discuss: ${c0.title || 'Core ideas'}`,
        description: c0.description || (excerpt ? `Ground in this excerpt: ${excerpt}` : 'Discussion grounded in the document.'),
        perspectives: ['View A', 'View B', 'View C'],
        socraticQuestions: [
          'Where does the document state this most clearly?',
          'What would change your conclusion?'
        ],
        learningObjectives: ['Interpret key claims', 'Compare viewpoints']
      });
    }
    if (obj.applicationScenarios.length === 0) {
      obj.applicationScenarios.push({
        title: `Apply: ${c0.title || 'Key material'}`,
        description: 'Choose a path consistent with the document’s emphasis and constraints.',
        situation: excerpt
          ? `Context from the document: ${excerpt}`
          : String(c0.description || c0.title || '').slice(0, 600),
        options: [
          'Favor the most cautious path the text supports',
          'Favor the fastest path the text supports',
          'Pause until preconditions in the text are satisfied'
        ],
        learningGoals: ['Transfer ideas to a concrete decision'],
        competencies: ['Judgment under uncertainty']
      });
    }
    if (obj.integrationActivities.length === 0) {
      obj.integrationActivities.push({
        title: `Synthesize: ${c0.title || 'Main themes'}`,
        description: 'Consolidate what you would teach a colleague in two minutes.',
        type: 'summary',
        instructions: [
          'List three claims the excerpt supports',
          'Note one risk or caveat the text implies',
          'State one follow-up task you would assign'
        ],
        outcomes: ['Clear verbal summary', 'Short actionable checklist']
      });
    }
  }

  async repairActiveLearningJson(brokenText, truncatedContent, fileName) {
    this.initializeModels();
    if (!this.model) throw new Error('Google AI service not available');

    const repairPrompt = `You fix malformed JSON. The text below was meant to be a single JSON object for an active-learning lesson grounded in a document.

Document file name: "${fileName}"
Document excerpt (ground all content in this):
${truncatedContent}

Required top-level keys and types:
- engagementTools: { concepts: array of {title, description, category, relationships}, annotations: array, questions: array }
- collaborationTopics: array of {title, description, perspectives, socraticQuestions, learningObjectives}
- applicationScenarios: array of {title, description, situation, options (array of strings), learningGoals, competencies}
- integrationActivities: array of {title, description, type, instructions, outcomes}

Return ONLY valid minified JSON. No markdown, no commentary.

Broken model output:
${String(brokenText).slice(0, 14000)}`;

    const result = await this.model.generateContent(repairPrompt);
    const response = await result.response;
    const text = response.text().trim();
    const parsed = this.parseInteractivePayload(text);
    this.normalizeActiveLearningPayload(parsed, truncatedContent);
    this.validateActiveLearningShape(parsed);
    return parsed;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI();
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

      if (!resolveOpenAICompatApiKey()) {
        throw new Error(
          'Server misconfiguration: set CEREBRAS_API_KEY (for api.cerebras.ai) or GROQ_API_KEY (for api.groq.com) to match OPENAI_COMPAT_CHAT_URL'
        );
      }

      this.initializeModels();
      
      if (!this.genAI) {
        throw new Error('Google AI service not available');
      }

      // Truncate content if too long (keep enough context to stay document-grounded)
      const maxLength = 10000;
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

CRITICAL: Every concept, discussion topic, application scenario, and integration activity MUST be clearly tied to specific ideas, terms, or situations from the Document Content above. Do not invent unrelated generic case studies.

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
}

Return ONLY that JSON object. No markdown fences, no text before or after.`;

      const runGeneration = async (userPrompt) => {
        const result = await this.model.generateContent(userPrompt);
        const response = await result.response;
        return response.text().trim();
      };

      console.log('🎯 Sending prompt to Gemini...');
      let aiResponse = await runGeneration(prompt);

      console.log('🎯 Received response from Gemini');
      console.log('📝 Raw AI response length:', aiResponse.length);

      let parsedContent;
      try {
        parsedContent = this.parseInteractivePayload(aiResponse);
        this.normalizeActiveLearningPayload(parsedContent, truncatedContent);
        this.validateActiveLearningShape(parsedContent);
      } catch (firstErr) {
        console.warn('Active learning: initial parse/validate failed', firstErr);
        try {
          parsedContent = await this.repairActiveLearningJson(aiResponse, truncatedContent, fileName);
          this.normalizeActiveLearningPayload(parsedContent, truncatedContent);
          this.validateActiveLearningShape(parsedContent);
        } catch (repairErr) {
          console.warn('Active learning: repair failed, retrying full generation', repairErr);
          const strictSuffix =
            '\n\nYour previous output was invalid JSON or failed validation. Respond again with ONLY one minified JSON object matching the schema exactly. No markdown.';
          aiResponse = await runGeneration(prompt + strictSuffix);
          try {
            parsedContent = this.parseInteractivePayload(aiResponse);
            this.normalizeActiveLearningPayload(parsedContent, truncatedContent);
            this.validateActiveLearningShape(parsedContent);
          } catch (finalErr) {
            console.error('Active learning: final parse failed', finalErr);
            throw new Error(
              'Could not produce valid active-learning JSON from the model. Try again or use a shorter document section.'
            );
          }
        }
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