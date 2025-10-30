/**
 * Rule-Based Labeling Service
 * Provides learning style classification for users without sufficient ML data
 * Uses heuristic rules based on FSLSM research
 * 
 * This serves as:
 * 1. Cold start solution for new users
 * 2. Fallback when ML service is unavailable
 * 3. Baseline for ML model comparison
 */

import featureEngineeringService from './featureEngineeringService';

class RuleBasedLabelingService {
  /**
   * Classify user's learning style using rule-based approach
   * @param {string} userId - User ID
   * @returns {Object} FSLSM dimension scores and confidence
   */
  async classifyLearningStyle(userId) {
    // Get features from behavior data
    const features = await featureEngineeringService.calculateFeatures(userId);
    
    // Check if we have any data
    if (features.totalInteractions === 0) {
      return this.getDefaultClassification();
    }

    // Calculate FSLSM dimension scores using rules
    const dimensions = {
      activeReflective: this.calculateActiveReflectiveScore(features),
      sensingIntuitive: this.calculateSensingIntuitiveScore(features),
      visualVerbal: this.calculateVisualVerbalScore(features),
      sequentialGlobal: this.calculateSequentialGlobalScore(features)
    };

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(features);

    return {
      dimensions,
      confidence,
      method: 'rule-based',
      dataQuality: features.dataQuality
    };
  }

  /**
   * Calculate Active vs Reflective score (-11 to +11)
   * Positive = Active, Negative = Reflective
   */
  calculateActiveReflectiveScore(features) {
    let score = 0;
    
    // Rule 1: Mode usage ratio (weight: 40%)
    const modeRatio = features.activeLearningUsageRatio - features.reflectiveLearningUsageRatio;
    score += modeRatio * 11 * 0.4;
    
    // Rule 2: Discussion vs Reflection (weight: 30%)
    const activityRatio = features.discussionParticipationRate - features.reflectionJournalFrequency;
    score += activityRatio * 11 * 0.3;
    
    // Rule 3: Group vs Individual preference (weight: 20%)
    const groupPreference = (features.groupActivityPreference - 0.5) * 2; // Normalize to -1 to 1
    score += groupPreference * 11 * 0.2;
    
    // Rule 4: Immediate application (weight: 10%)
    const applicationRate = features.immediateApplicationRate;
    score += (applicationRate - 0.5) * 11 * 0.1;
    
    // Clamp to -11 to +11 range
    return Math.max(-11, Math.min(11, Math.round(score)));
  }

  /**
   * Calculate Sensing vs Intuitive score (-11 to +11)
   * Positive = Sensing, Negative = Intuitive
   */
  calculateSensingIntuitiveScore(features) {
    let score = 0;
    
    // Rule 1: Mode usage ratio (weight: 40%)
    const modeRatio = features.sensingLearningUsageRatio - features.intuitiveLearningUsageRatio;
    score += modeRatio * 11 * 0.4;
    
    // Rule 2: Practical vs Abstract activities (weight: 30%)
    const activityRatio = features.practicalLabCompletionRate - features.abstractPatternExplorationRate;
    score += activityRatio * 11 * 0.3;
    
    // Rule 3: Concrete vs Abstract preference (weight: 20%)
    const preferenceScore = Math.log(features.concreteVsAbstractPreference);
    score += preferenceScore * 11 * 0.2;
    
    // Rule 4: Experimentation frequency (weight: 10%)
    const experimentRate = features.experimentationFrequency;
    score += (experimentRate - 0.5) * 11 * 0.1;
    
    return Math.max(-11, Math.min(11, Math.round(score)));
  }

  /**
   * Calculate Visual vs Verbal score (-11 to +11)
   * Positive = Visual, Negative = Verbal
   */
  calculateVisualVerbalScore(features) {
    let score = 0;
    
    // Rule 1: Mode usage ratio (weight: 50%)
    const modeRatio = features.visualLearningUsageRatio - features.aiNarratorUsageRatio;
    score += modeRatio * 11 * 0.5;
    
    // Rule 2: Diagram vs Audio usage (weight: 30%)
    const mediaRatio = features.diagramViewFrequency - features.audioNarrationUsage;
    score += mediaRatio * 11 * 0.3;
    
    // Rule 3: Visual vs Verbal preference (weight: 20%)
    const preferenceScore = Math.log(features.visualVsVerbalPreference);
    score += preferenceScore * 11 * 0.2;
    
    return Math.max(-11, Math.min(11, Math.round(score)));
  }

  /**
   * Calculate Sequential vs Global score (-11 to +11)
   * Positive = Sequential, Negative = Global
   */
  calculateSequentialGlobalScore(features) {
    let score = 0;
    
    // Rule 1: Mode usage ratio (weight: 40%)
    const modeRatio = features.sequentialLearningUsageRatio - features.globalLearningUsageRatio;
    score += modeRatio * 11 * 0.4;
    
    // Rule 2: Step-by-step vs Overview behavior (weight: 30%)
    const behaviorRatio = features.stepByStepCompletionRate - features.overviewFirstBehavior;
    score += behaviorRatio * 11 * 0.3;
    
    // Rule 3: Sequential vs Global preference (weight: 20%)
    const preferenceScore = Math.log(features.sequentialVsGlobalPreference);
    score += preferenceScore * 11 * 0.2;
    
    // Rule 4: Linear progression rate (weight: 10%)
    const progressionRate = features.linearProgressionRate;
    score += (progressionRate - 0.5) * 11 * 0.1;
    
    return Math.max(-11, Math.min(11, Math.round(score)));
  }

  /**
   * Calculate confidence scores based on data quality
   */
  calculateConfidence(features) {
    const baseConfidence = features.dataQuality.completeness / 100;
    
    // Adjust confidence based on specific feature availability
    const activeReflectiveConfidence = this.calculateDimensionConfidence(
      features.activeLearningUsageRatio,
      features.reflectiveLearningUsageRatio,
      features.discussionParticipationRate,
      features.reflectionJournalFrequency,
      baseConfidence
    );
    
    const sensingIntuitiveConfidence = this.calculateDimensionConfidence(
      features.sensingLearningUsageRatio,
      features.intuitiveLearningUsageRatio,
      features.practicalLabCompletionRate,
      features.abstractPatternExplorationRate,
      baseConfidence
    );
    
    const visualVerbalConfidence = this.calculateDimensionConfidence(
      features.visualLearningUsageRatio,
      features.aiNarratorUsageRatio,
      features.diagramViewFrequency,
      features.audioNarrationUsage,
      baseConfidence
    );
    
    const sequentialGlobalConfidence = this.calculateDimensionConfidence(
      features.sequentialLearningUsageRatio,
      features.globalLearningUsageRatio,
      features.stepByStepCompletionRate,
      features.overviewFirstBehavior,
      baseConfidence
    );
    
    return {
      activeReflective: activeReflectiveConfidence,
      sensingIntuitive: sensingIntuitiveConfidence,
      visualVerbal: visualVerbalConfidence,
      sequentialGlobal: sequentialGlobalConfidence
    };
  }

  /**
   * Calculate confidence for a specific dimension
   */
  calculateDimensionConfidence(feature1, feature2, feature3, feature4, baseConfidence) {
    // Count how many features have meaningful values (> 0)
    const meaningfulFeatures = [feature1, feature2, feature3, feature4].filter(f => f > 0).length;
    
    // Confidence increases with more meaningful features
    const featureConfidence = meaningfulFeatures / 4;
    
    // Combine base confidence with feature-specific confidence
    const confidence = (baseConfidence * 0.6) + (featureConfidence * 0.4);
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Get default classification for users with no data
   */
  getDefaultClassification() {
    return {
      dimensions: {
        activeReflective: 0,  // Balanced
        sensingIntuitive: 0,  // Balanced
        visualVerbal: 0,      // Balanced
        sequentialGlobal: 0   // Balanced
      },
      confidence: {
        activeReflective: 0,
        sensingIntuitive: 0,
        visualVerbal: 0,
        sequentialGlobal: 0
      },
      method: 'default',
      dataQuality: {
        sufficientForML: false,
        completeness: 0,
        interactionCount: 0,
        totalTime: 0,
        sessionCount: 0
      }
    };
  }

  /**
   * Generate mode recommendations based on classification
   */
  generateRecommendations(classification) {
    const { dimensions, confidence } = classification;
    const recommendations = [];
    
    // Active vs Reflective
    if (Math.abs(dimensions.activeReflective) >= 3) {
      if (dimensions.activeReflective > 0) {
        recommendations.push({
          mode: 'Active Learning Hub',
          priority: 1,
          reason: 'You learn best through hands-on activities and group discussions',
          confidence: confidence.activeReflective,
          dimension: 'Active'
        });
      } else {
        recommendations.push({
          mode: 'Reflective Learning',
          priority: 1,
          reason: 'You prefer individual contemplation and deep analysis',
          confidence: confidence.activeReflective,
          dimension: 'Reflective'
        });
      }
    }
    
    // Sensing vs Intuitive
    if (Math.abs(dimensions.sensingIntuitive) >= 3) {
      if (dimensions.sensingIntuitive > 0) {
        recommendations.push({
          mode: 'Hands-On Lab',
          priority: 2,
          reason: 'You prefer practical, concrete examples and real-world applications',
          confidence: confidence.sensingIntuitive,
          dimension: 'Sensing'
        });
      } else {
        recommendations.push({
          mode: 'Concept Constellation',
          priority: 2,
          reason: 'You enjoy exploring abstract patterns and theoretical frameworks',
          confidence: confidence.sensingIntuitive,
          dimension: 'Intuitive'
        });
      }
    }
    
    // Visual vs Verbal
    if (Math.abs(dimensions.visualVerbal) >= 3) {
      if (dimensions.visualVerbal > 0) {
        recommendations.push({
          mode: 'Visual Learning',
          priority: 3,
          reason: 'You learn best with diagrams, charts, and visual representations',
          confidence: confidence.visualVerbal,
          dimension: 'Visual'
        });
      } else {
        recommendations.push({
          mode: 'AI Narrator',
          priority: 3,
          reason: 'You prefer written and spoken explanations',
          confidence: confidence.visualVerbal,
          dimension: 'Verbal'
        });
      }
    }
    
    // Sequential vs Global
    if (Math.abs(dimensions.sequentialGlobal) >= 3) {
      if (dimensions.sequentialGlobal > 0) {
        recommendations.push({
          mode: 'Sequential Learning',
          priority: 4,
          reason: 'You prefer step-by-step, logical progression',
          confidence: confidence.sequentialGlobal,
          dimension: 'Sequential'
        });
      } else {
        recommendations.push({
          mode: 'Global Learning',
          priority: 4,
          reason: 'You prefer seeing the big picture and overall context first',
          confidence: confidence.sequentialGlobal,
          dimension: 'Global'
        });
      }
    }
    
    // If no strong preferences, recommend balanced modes
    if (recommendations.length === 0) {
      recommendations.push(
        {
          mode: 'AI Narrator',
          priority: 1,
          reason: 'Great starting point for understanding any content',
          confidence: 0.5,
          dimension: 'Balanced'
        },
        {
          mode: 'Visual Learning',
          priority: 2,
          reason: 'Visual aids enhance comprehension for most learners',
          confidence: 0.5,
          dimension: 'Balanced'
        },
        {
          mode: 'Active Learning Hub',
          priority: 3,
          reason: 'Interactive engagement helps retention',
          confidence: 0.5,
          dimension: 'Balanced'
        }
      );
    }
    
    // Sort by priority and return top 3
    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }

  /**
   * Interpret FSLSM score to human-readable preference
   */
  interpretScore(score) {
    const absScore = Math.abs(score);
    
    if (absScore <= 1) return 'Balanced';
    if (absScore <= 3) return 'Mild preference';
    if (absScore <= 5) return 'Moderate preference';
    if (absScore <= 7) return 'Strong preference';
    return 'Very strong preference';
  }
}

// Export singleton instance
const ruleBasedLabelingService = new RuleBasedLabelingService();
export default ruleBasedLabelingService;
