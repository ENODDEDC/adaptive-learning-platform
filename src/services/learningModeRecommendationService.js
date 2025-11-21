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
   * Analyze document content and recommend EXACTLY 4 learning modes (one per FSLSM dimension)
   */
  async getRecommendedModes(docxContent, fileName = '') {
    await this.initialize();

    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
Analyze this document content and recommend EXACTLY 4 learning modes based on FSLSM (Felder-Silverman Learning Style Model) dimensions.

Document: "${fileName}"
Content: "${docxContent.substring(0, 2000)}..."

FSLSM 4 Dimensions - Choose ONE mode from EACH dimension:

1. VISUAL/VERBAL Dimension:
   - "Visual Learning" (diagrams, charts, visual content)
   - "AI Narrator" (audio explanations, verbal content)

2. ACTIVE/REFLECTIVE Dimension:
   - "Active Learning Hub" (hands-on activities, immediate practice)
   - "Reflective Learning" (observation, contemplation, analysis)

3. SENSING/INTUITIVE Dimension:
   - "Hands-On Lab" (concrete, practical, real-world examples)
   - "Concept Constellation" (abstract, theoretical, patterns)

4. SEQUENTIAL/GLOBAL Dimension:
   - "Sequential Learning" (step-by-step, linear progression)
   - "Global Learning" (big picture, holistic overview)

Instructions:
- Recommend EXACTLY 4 modes (one from each dimension pair)
- Base recommendations on document content type and learning objectives
- Return ONLY a JSON array with exactly 4 objects

Example response:
[
  {"mode": "Visual Learning", "reason": "Document has data and processes that benefit from diagrams"},
  {"mode": "Active Learning Hub", "reason": "Content requires hands-on practice and immediate application"},
  {"mode": "Hands-On Lab", "reason": "Technical content needs concrete examples and practical exercises"},
  {"mode": "Sequential Learning", "reason": "Step-by-step procedures require structured linear approach"}
]

Response (JSON only, exactly 4 modes):`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // Convert database names to button display names
        const convertedRecs = recommendations.map(rec => ({
          mode: this.convertToButtonName(rec.mode),
          reason: rec.reason
        }));
        
        // Ensure exactly 4 recommendations
        if (convertedRecs.length === 4) {
          console.log('🎯 AI Recommendations (4 FSLSM dimensions):', convertedRecs);
          return convertedRecs;
        } else {
          console.warn(`⚠️ AI returned ${recommendations.length} recommendations instead of 4, using fallback`);
          return this.getFallbackRecommendations(docxContent, fileName);
        }
      }

      // Fallback if JSON parsing fails
      return this.getFallbackRecommendations(docxContent, fileName);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(docxContent, fileName);
    }
  }

  /**
   * Convert database mode names to button display names
   */
  convertToButtonName(databaseName) {
    const nameMap = {
      'Active Learning Hub': 'Practice',
      'Reflective Learning': 'Reflect',
      'Hands-On Lab': 'Hands-On',
      'Concept Constellation': 'Theory',
      'Sequential Learning': 'Step-by-Step',
      'Global Learning': 'Big Picture',
      'Visual Learning': 'Visual Learning',
      'AI Narrator': 'AI Narrator'
    };
    return nameMap[databaseName] || databaseName;
  }

  /**
   * Intelligent fallback recommendations - ALWAYS returns exactly 4 modes (one per FSLSM dimension)
   */
  async getFallbackRecommendations(content, fileName) {
    // Ultimate fallback - EXACTLY 4 recommendations covering all 4 FSLSM dimensions
    // Return button display names for direct matching
    return [
      { "mode": "Visual Learning", "reason": "Visual aids enhance comprehension for most content types" },
      { "mode": "Practice", "reason": "Interactive engagement improves retention and understanding" },
      { "mode": "Hands-On", "reason": "Practical examples help solidify learning concepts" },
      { "mode": "Step-by-Step", "reason": "Structured step-by-step approach supports systematic learning" }
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