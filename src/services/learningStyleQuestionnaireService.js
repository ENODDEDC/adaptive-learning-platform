/**
 * Learning Style Questionnaire Service
 * Implements simplified ILS (Index of Learning Styles) questionnaire
 * Provides ground truth labels for learning style classification
 * 
 * Based on Felder-Silverman ILS questionnaire
 * Original: 44 questions (11 per dimension)
 * Simplified: 20 questions (5 per dimension) for better UX
 */

class LearningStyleQuestionnaireService {
  /**
   * Get questionnaire questions
   * Each question has two options (a/b) representing opposite preferences
   */
  getQuestions() {
    return [
      // Active vs Reflective (5 questions)
      {
        id: 1,
        dimension: 'activeReflective',
        question: 'I understand something better after I',
        options: {
          a: { text: 'try it out', value: 1, preference: 'active' },
          b: { text: 'think it through', value: -1, preference: 'reflective' }
        }
      },
      {
        id: 2,
        dimension: 'activeReflective',
        question: 'When I am learning something new, it helps me to',
        options: {
          a: { text: 'talk about it', value: 1, preference: 'active' },
          b: { text: 'think about it', value: -1, preference: 'reflective' }
        }
      },
      {
        id: 3,
        dimension: 'activeReflective',
        question: 'I prefer to study',
        options: {
          a: { text: 'in a study group', value: 1, preference: 'active' },
          b: { text: 'alone', value: -1, preference: 'reflective' }
        }
      },
      {
        id: 4,
        dimension: 'activeReflective',
        question: 'I am more likely to be considered',
        options: {
          a: { text: 'outgoing', value: 1, preference: 'active' },
          b: { text: 'reserved', value: -1, preference: 'reflective' }
        }
      },
      {
        id: 5,
        dimension: 'activeReflective',
        question: 'I prefer courses that emphasize',
        options: {
          a: { text: 'concrete material (facts, data)', value: 1, preference: 'active' },
          b: { text: 'abstract material (concepts, theories)', value: -1, preference: 'reflective' }
        }
      },

      // Sensing vs Intuitive (5 questions)
      {
        id: 6,
        dimension: 'sensingIntuitive',
        question: 'I would rather be considered',
        options: {
          a: { text: 'realistic', value: 1, preference: 'sensing' },
          b: { text: 'innovative', value: -1, preference: 'intuitive' }
        }
      },
      {
        id: 7,
        dimension: 'sensingIntuitive',
        question: 'When I think about what I did yesterday, I am most likely to get',
        options: {
          a: { text: 'a picture', value: 1, preference: 'sensing' },
          b: { text: 'ideas', value: -1, preference: 'intuitive' }
        }
      },
      {
        id: 8,
        dimension: 'sensingIntuitive',
        question: 'I prefer to get new information in',
        options: {
          a: { text: 'pictures, diagrams, graphs, or maps', value: 1, preference: 'sensing' },
          b: { text: 'written directions or verbal information', value: -1, preference: 'intuitive' }
        }
      },
      {
        id: 9,
        dimension: 'sensingIntuitive',
        question: 'I find it easier',
        options: {
          a: { text: 'to learn facts', value: 1, preference: 'sensing' },
          b: { text: 'to learn concepts', value: -1, preference: 'intuitive' }
        }
      },
      {
        id: 10,
        dimension: 'sensingIntuitive',
        question: 'In reading nonfiction, I prefer',
        options: {
          a: { text: 'something that teaches me new facts or tells me how to do something', value: 1, preference: 'sensing' },
          b: { text: 'something that gives me new ideas to think about', value: -1, preference: 'intuitive' }
        }
      },

      // Visual vs Verbal (5 questions)
      {
        id: 11,
        dimension: 'visualVerbal',
        question: 'When I see a diagram or sketch in class, I am most likely to remember',
        options: {
          a: { text: 'the picture', value: 1, preference: 'visual' },
          b: { text: 'what the instructor said about it', value: -1, preference: 'verbal' }
        }
      },
      {
        id: 12,
        dimension: 'visualVerbal',
        question: 'I prefer to get new information in',
        options: {
          a: { text: 'pictures, diagrams, graphs, or maps', value: 1, preference: 'visual' },
          b: { text: 'written directions or verbal information', value: -1, preference: 'verbal' }
        }
      },
      {
        id: 13,
        dimension: 'visualVerbal',
        question: 'When I get directions to a new place, I prefer',
        options: {
          a: { text: 'a map', value: 1, preference: 'visual' },
          b: { text: 'written instructions', value: -1, preference: 'verbal' }
        }
      },
      {
        id: 14,
        dimension: 'visualVerbal',
        question: 'I remember best',
        options: {
          a: { text: 'what I see', value: 1, preference: 'visual' },
          b: { text: 'what I hear', value: -1, preference: 'verbal' }
        }
      },
      {
        id: 15,
        dimension: 'visualVerbal',
        question: 'When I am learning something new, it helps me to',
        options: {
          a: { text: 'see pictures or diagrams', value: 1, preference: 'visual' },
          b: { text: 'hear someone explain it', value: -1, preference: 'verbal' }
        }
      },

      // Sequential vs Global (5 questions)
      {
        id: 16,
        dimension: 'sequentialGlobal',
        question: 'When I solve math problems',
        options: {
          a: { text: 'I usually work my way to the solutions one step at a time', value: 1, preference: 'sequential' },
          b: { text: 'I often just see the solutions but then have to struggle to figure out the steps', value: -1, preference: 'global' }
        }
      },
      {
        id: 17,
        dimension: 'sequentialGlobal',
        question: 'In a book with lots of pictures and charts, I am likely to',
        options: {
          a: { text: 'look over the pictures and charts carefully', value: 1, preference: 'sequential' },
          b: { text: 'focus on the written text', value: -1, preference: 'global' }
        }
      },
      {
        id: 18,
        dimension: 'sequentialGlobal',
        question: 'When I start a homework problem, I am more likely to',
        options: {
          a: { text: 'start working on the solution immediately', value: 1, preference: 'sequential' },
          b: { text: 'try to fully understand the problem first', value: -1, preference: 'global' }
        }
      },
      {
        id: 19,
        dimension: 'sequentialGlobal',
        question: 'I prefer the idea of',
        options: {
          a: { text: 'certainty', value: 1, preference: 'sequential' },
          b: { text: 'theory', value: -1, preference: 'global' }
        }
      },
      {
        id: 20,
        dimension: 'sequentialGlobal',
        question: 'When I am reading for enjoyment, I prefer writers to',
        options: {
          a: { text: 'clearly say what they mean', value: 1, preference: 'sequential' },
          b: { text: 'say things in creative, interesting ways', value: -1, preference: 'global' }
        }
      }
    ];
  }

  /**
   * Calculate FSLSM scores from questionnaire responses
   * @param {Object} responses - User responses { questionId: 'a' or 'b' }
   * @returns {Object} FSLSM dimension scores
   */
  calculateScores(responses) {
    const questions = this.getQuestions();
    
    const scores = {
      activeReflective: 0,
      sensingIntuitive: 0,
      visualVerbal: 0,
      sequentialGlobal: 0
    };

    // Calculate raw scores
    questions.forEach(question => {
      const response = responses[question.id];
      if (response && question.options[response]) {
        scores[question.dimension] += question.options[response].value;
      }
    });

    // Scale to -11 to +11 range (multiply by 11/5 since we have 5 questions per dimension)
    Object.keys(scores).forEach(dimension => {
      scores[dimension] = Math.round(scores[dimension] * (11 / 5));
      // Clamp to -11 to +11
      scores[dimension] = Math.max(-11, Math.min(11, scores[dimension]));
    });

    return scores;
  }

  /**
   * Get interpretation of scores
   */
  interpretScores(scores) {
    const interpretations = {};
    
    Object.entries(scores).forEach(([dimension, score]) => {
      const absScore = Math.abs(score);
      let strength, preference;
      
      if (absScore <= 1) {
        strength = 'Balanced';
        preference = 'balanced';
      } else if (absScore <= 3) {
        strength = 'Mild';
        preference = score > 0 ? dimension.split(/(?=[A-Z])/)[0] : dimension.split(/(?=[A-Z])/)[1];
      } else if (absScore <= 5) {
        strength = 'Moderate';
        preference = score > 0 ? dimension.split(/(?=[A-Z])/)[0] : dimension.split(/(?=[A-Z])/)[1];
      } else if (absScore <= 7) {
        strength = 'Strong';
        preference = score > 0 ? dimension.split(/(?=[A-Z])/)[0] : dimension.split(/(?=[A-Z])/)[1];
      } else {
        strength = 'Very Strong';
        preference = score > 0 ? dimension.split(/(?=[A-Z])/)[0] : dimension.split(/(?=[A-Z])/)[1];
      }
      
      interpretations[dimension] = {
        score,
        strength,
        preference: preference.toLowerCase()
      };
    });
    
    return interpretations;
  }

  /**
   * Get recommended modes based on questionnaire scores
   */
  getRecommendations(scores) {
    const recommendations = [];
    
    // Active vs Reflective
    if (Math.abs(scores.activeReflective) >= 3) {
      if (scores.activeReflective > 0) {
        recommendations.push({
          mode: 'Active Learning Hub',
          reason: 'You learn best through hands-on activities and group discussions',
          dimension: 'Active',
          score: scores.activeReflective
        });
      } else {
        recommendations.push({
          mode: 'Reflective Learning',
          reason: 'You prefer individual contemplation and deep analysis',
          dimension: 'Reflective',
          score: Math.abs(scores.activeReflective)
        });
      }
    }
    
    // Sensing vs Intuitive
    if (Math.abs(scores.sensingIntuitive) >= 3) {
      if (scores.sensingIntuitive > 0) {
        recommendations.push({
          mode: 'Hands-On Lab',
          reason: 'You prefer practical, concrete examples and real-world applications',
          dimension: 'Sensing',
          score: scores.sensingIntuitive
        });
      } else {
        recommendations.push({
          mode: 'Concept Constellation',
          reason: 'You enjoy exploring abstract patterns and theoretical frameworks',
          dimension: 'Intuitive',
          score: Math.abs(scores.sensingIntuitive)
        });
      }
    }
    
    // Visual vs Verbal
    if (Math.abs(scores.visualVerbal) >= 3) {
      if (scores.visualVerbal > 0) {
        recommendations.push({
          mode: 'Visual Learning',
          reason: 'You learn best with diagrams, charts, and visual representations',
          dimension: 'Visual',
          score: scores.visualVerbal
        });
      } else {
        recommendations.push({
          mode: 'AI Narrator',
          reason: 'You prefer written and spoken explanations',
          dimension: 'Verbal',
          score: Math.abs(scores.visualVerbal)
        });
      }
    }
    
    // Sequential vs Global
    if (Math.abs(scores.sequentialGlobal) >= 3) {
      if (scores.sequentialGlobal > 0) {
        recommendations.push({
          mode: 'Sequential Learning',
          reason: 'You prefer step-by-step, logical progression',
          dimension: 'Sequential',
          score: scores.sequentialGlobal
        });
      } else {
        recommendations.push({
          mode: 'Global Learning',
          reason: 'You prefer seeing the big picture and overall context first',
          dimension: 'Global',
          score: Math.abs(scores.sequentialGlobal)
        });
      }
    }
    
    // If no strong preferences, recommend balanced modes
    if (recommendations.length === 0) {
      recommendations.push(
        {
          mode: 'AI Narrator',
          reason: 'Great starting point for understanding any content',
          dimension: 'Balanced',
          score: 0
        },
        {
          mode: 'Visual Learning',
          reason: 'Visual aids enhance comprehension for most learners',
          dimension: 'Balanced',
          score: 0
        }
      );
    }
    
    // Sort by score (strongest preferences first)
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  }
}

// Export singleton instance
const learningStyleQuestionnaireService = new LearningStyleQuestionnaireService();
export default learningStyleQuestionnaireService;
