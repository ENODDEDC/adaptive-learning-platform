import { GoogleGenerativeAI } from '@google/generative-ai';

class LearningModeRecommendationService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  async initialize() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-flash-lite-latest"
        });
        console.log('🎯 Learning Mode Recommendation Service initialized');
      } catch (error) {
        console.error('Failed to initialize Learning Mode Recommendation Service:', error);
        throw error;
      }
    }
  }

  /**
   * Analyze document content and recommend 2-3 best learning modes
   */
  async getRecommendedModes(docxContent, fileName = '') {
    await this.initialize();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
Analyze this document content and recommend the 2-3 BEST learning modes for a student based on the content type and complexity.

Document: "${fileName}"
Content: "${docxContent.substring(0, 2000)}..."

Available Learning Modes:
1. AI Narrator - Audio narration with explanations (good for complex concepts, definitions)
2. Visual Learning - Creates diagrams, charts, wireframes (good for processes, data, relationships)
3. Sequential Learning - Step-by-step breakdown (good for procedures, tutorials, how-to guides)
4. Global Learning - Big picture overview (good for comprehensive topics, summaries)
5. Hands-On Lab - Practical exercises (good for technical, scientific, hands-on content)
6. Concept Constellation - Pattern discovery (good for theoretical, abstract concepts)
7. Active Learning Hub - Interactive activities (good for collaborative, discussion-based content)
8. Reflective Learning - Self-assessment (good for philosophical, analytical content)

Instructions:
- Recommend exactly 2-3 modes that would be MOST helpful for THIS specific document
- Consider content type, complexity, and learning objectives
- Prioritize modes that match the document's nature
- Return ONLY a JSON array with mode names and brief reasons

Example response:
[
  {"mode": "AI Narrator", "reason": "Complex financial concepts need audio explanation"},
  {"mode": "Visual Learning", "reason": "Data and processes benefit from visual diagrams"}
]

Response (JSON only):`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        console.log('🎯 AI Recommendations:', recommendations);
        return recommendations;
      }

      // Fallback recommendations
      return [
        { "mode": "AI Narrator", "reason": "Great for understanding complex concepts" },
        { "mode": "Visual Learning", "reason": "Helps visualize key information" }
      ];

    } catch (error) {
      console.error('Error getting recommendations:', error);

      // Smart fallback based on content analysis
      return this.getFallbackRecommendations(docxContent, fileName);
    }
  }

  /**
   * Intelligent fallback recommendations using AI content analysis
   */
  async getFallbackRecommendations(content, fileName) {
    // If we have content, try a simplified AI analysis
    if (content && content.length > 100) {
      try {
        await this.initialize();

        const simplifiedPrompt = `
Analyze this document content and recommend 2-3 learning modes based on content characteristics:

Content: "${content.substring(0, 1500)}..."

Available modes: AI Narrator, Visual Learning, Sequential Learning, Global Learning, Hands-On Lab, Concept Constellation, Active Learning Hub, Reflective Learning

Return JSON array with mode and reason:
[{"mode": "Mode Name", "reason": "Brief reason"}]
`;

        const result = await this.model.generateContent(simplifiedPrompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          console.log('🎯 Fallback AI recommendations:', recommendations);
          return recommendations;
        }
      } catch (error) {
        console.error('Fallback AI analysis failed:', error);
      }
    }

    // Ultimate fallback - content-agnostic recommendations
    return [
      { "mode": "AI Narrator", "reason": "Great starting point for understanding any document" },
      { "mode": "Visual Learning", "reason": "Visual aids enhance comprehension" }
    ];
  }

  /**
   * Get detailed tooltips for each learning mode
   */
  getTooltips() {
    return {
      "AI Narrator": {
        title: "AI Narrator",
        description: "AI-generated tutorial content, interactive quizzes, document summaries, and study tips in Taglish with optional audio narration",
        bestFor: "Comprehensive learning, quiz practice, audio learning, study guidance",
        icon: "🎧"
      },
      "Visual Learning": {
        title: "Visual Learning",
        description: "Create concept diagrams, infographics, mind maps, and flowcharts from your document content",
        bestFor: "Visual learners, complex processes, data relationships",
        icon: "📊"
      },
      "Sequential Learning": {
        title: "Sequential Learning",
        description: "Break content into step-by-step modules with concept flow mapping and structured progression",
        bestFor: "Systematic learning, procedures, building knowledge progressively",
        icon: "📋"
      },
      "Global Learning": {
        title: "Global Learning",
        description: "Get comprehensive overviews, context mapping, and big-picture understanding of topics",
        bestFor: "Understanding scope, connecting themes, holistic perspective",
        icon: "🌍"
      },
      "Hands-On Lab": {
        title: "Hands-On Lab",
        description: "Practice with real-world scenarios, interactive exercises, and practical applications",
        bestFor: "Applied learning, skill development, experiential practice",
        icon: "🔬"
      },
      "Concept Constellation": {
        title: "Concept Constellation",
        description: "Explore interconnected concept universes, discover hidden patterns, and find creative insights",
        bestFor: "Pattern recognition, creative thinking, theoretical exploration",
        icon: "🔮"
      },
      "Active Learning Hub": {
        title: "Active Learning Hub",
        description: "Engage in simulated discussions, collaborative exercises, and immediate application activities",
        bestFor: "Interactive engagement, group-style learning, hands-on practice",
        icon: "🎯"
      },
      "Reflective Learning": {
        title: "Reflective Learning",
        description: "Deep analysis, self-assessment activities, and contemplative learning experiences",
        bestFor: "Critical thinking, self-evaluation, philosophical reflection",
        icon: "🤔"
      }
    };
  }
}

export default new LearningModeRecommendationService();