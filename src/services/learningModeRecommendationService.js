import { GroqGenAI as GoogleGenerativeAI } from '@/lib/groqGenAI';
import { databaseModeToButtonLabel } from '@/constants/learningModeLabels';

class LearningModeRecommendationService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  async initialize() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI();
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
    return databaseModeToButtonLabel(databaseName);
  }

  /**
   * Intelligent fallback recommendations - ALWAYS returns exactly 4 modes (one per FSLSM dimension)
   */
  async getFallbackRecommendations(content, fileName) {
    const raw = [
      { mode: 'Visual Learning', reason: 'Visual aids enhance comprehension for most content types' },
      { mode: 'Active Learning Hub', reason: 'Interactive engagement improves retention and understanding' },
      { mode: 'Hands-On Lab', reason: 'Practical examples help solidify learning concepts' },
      { mode: 'Sequential Learning', reason: 'Structured step-by-step approach supports systematic learning' }
    ];
    return raw.map((rec) => ({
      ...rec,
      mode: this.convertToButtonName(rec.mode)
    }));
  }

  /**
   * Get detailed tooltips for each learning mode
   */
  getTooltips() {
    return {
      "AI Narrator": {
        title: "Listen along",
        description: "AI-generated tutorial content, interactive quizzes, document summaries, and study tips in Taglish with optional audio narration",
        bestFor: "Comprehensive learning, quiz practice, audio learning, study guidance"
      },
      "Visual Learning": {
        title: "Diagrams",
        description: "Create concept diagrams, infographics, mind maps, and flowcharts from your document content",
        bestFor: "Visual learners, complex processes, data relationships"
      },
      "Sequential Learning": {
        title: "Step-by-step",
        description: "Break content into step-by-step modules with concept flow mapping and structured progression",
        bestFor: "Systematic learning, procedures, building knowledge progressively"
      },
      "Global Learning": {
        title: "Overview",
        description: "Get comprehensive overviews, context mapping, and big-picture understanding of topics",
        bestFor: "Understanding scope, connecting themes, holistic perspective"
      },
      "Hands-On Lab": {
        title: "Examples",
        description: "Practice with real-world scenarios, interactive exercises, and practical applications",
        bestFor: "Applied learning, skill development, experiential practice"
      },
      "Concept Constellation": {
        title: "Patterns",
        description: "Explore interconnected concept universes, discover hidden patterns, and find creative insights",
        bestFor: "Pattern recognition, creative thinking, theoretical exploration"
      },
      "Active Learning Hub": {
        title: "Practice",
        description: "Engage in simulated discussions, collaborative exercises, and immediate application activities",
        bestFor: "Interactive engagement, group-style learning, hands-on practice"
      },
      "Reflective Learning": {
        title: "Think deeper",
        description: "Deep analysis, self-assessment activities, and contemplative learning experiences",
        bestFor: "Critical thinking, self-evaluation, philosophical reflection"
      }
    };
  }
}

export default new LearningModeRecommendationService();