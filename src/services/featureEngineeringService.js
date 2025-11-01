/**
 * Feature Engineering Service
 * Converts raw behavior data into FSLSM dimension features for ML classification
 * 
 * Based on Felder-Silverman Learning Style Model (1988)
 * Each feature maps to one of the 4 FSLSM dimensions:
 * - Active vs. Reflective
 * - Sensing vs. Intuitive  
 * - Visual vs. Verbal
 * - Sequential vs. Global
 */

import LearningBehavior from '@/models/LearningBehavior';

class FeatureEngineeringService {
  /**
   * Calculate all features for a user
   * @param {string} userId - User ID
   * @returns {Object} Feature vector with all FSLSM dimension features
   */
  async calculateFeatures(userId) {
    // Get all behavior data for user
    const behaviors = await LearningBehavior.find({ userId }).sort({ timestamp: -1 });
    
    if (!behaviors || behaviors.length === 0) {
      return this.getDefaultFeatures();
    }

    // Aggregate all behavior data
    const aggregated = this.aggregateBehaviors(behaviors);
    
    // Calculate features for each FSLSM dimension
    const features = {
      // Active vs Reflective features
      ...this.calculateActiveReflectiveFeatures(aggregated),
      
      // Sensing vs Intuitive features
      ...this.calculateSensingIntuitiveFeatures(aggregated),
      
      // Visual vs Verbal features
      ...this.calculateVisualVerbalFeatures(aggregated),
      
      // Sequential vs Global features
      ...this.calculateSequentialGlobalFeatures(aggregated),
      
      // Metadata
      totalInteractions: aggregated.totalInteractions,
      totalLearningTime: aggregated.totalLearningTime,
      dataQuality: this.assessDataQuality(aggregated)
    };

    return features;
  }

  /**
   * Aggregate behavior data across all sessions
   */
  aggregateBehaviors(behaviors) {
    const aggregated = {
      modeUsage: {
        aiNarrator: { count: 0, totalTime: 0 },
        visualLearning: { count: 0, totalTime: 0 },
        sequentialLearning: { count: 0, totalTime: 0 },
        globalLearning: { count: 0, totalTime: 0 },
        sensingLearning: { count: 0, totalTime: 0 },
        intuitiveLearning: { count: 0, totalTime: 0 },
        activeLearning: { count: 0, totalTime: 0 },
        reflectiveLearning: { count: 0, totalTime: 0 }
      },
      aiAssistantUsage: {
        askMode: { count: 0, totalTime: 0 },
        researchMode: { count: 0, totalTime: 0 },
        textToDocsMode: { count: 0, totalTime: 0 },
        totalInteractions: 0,
        averagePromptLength: 0,
        totalPromptLength: 0
      },
      activityEngagement: {
        quizzesCompleted: 0,
        practiceQuestionsAttempted: 0,
        discussionParticipation: 0,
        reflectionJournalEntries: 0,
        visualDiagramsViewed: 0,
        handsOnLabsCompleted: 0,
        conceptExplorationsCount: 0,
        sequentialStepsCompleted: 0
      },
      totalInteractions: 0,
      totalLearningTime: 0,
      sessionCount: behaviors.length
    };

    // Aggregate across all behaviors
    behaviors.forEach(behavior => {
      // Aggregate mode usage
      Object.keys(aggregated.modeUsage).forEach(mode => {
        aggregated.modeUsage[mode].count += behavior.modeUsage[mode]?.count || 0;
        aggregated.modeUsage[mode].totalTime += behavior.modeUsage[mode]?.totalTime || 0;
      });

      // Aggregate AI Assistant usage
      if (behavior.aiAssistantUsage) {
        aggregated.aiAssistantUsage.askMode.count += behavior.aiAssistantUsage.askMode?.count || 0;
        aggregated.aiAssistantUsage.researchMode.count += behavior.aiAssistantUsage.researchMode?.count || 0;
        aggregated.aiAssistantUsage.textToDocsMode.count += behavior.aiAssistantUsage.textToDocsMode?.count || 0;
        aggregated.aiAssistantUsage.totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
        aggregated.aiAssistantUsage.totalPromptLength += behavior.aiAssistantUsage.totalPromptLength || 0;
      }

      // Aggregate activity engagement
      Object.keys(aggregated.activityEngagement).forEach(activity => {
        aggregated.activityEngagement[activity] += behavior.activityEngagement[activity] || 0;
      });
    });
    
    // Calculate average prompt length
    if (aggregated.aiAssistantUsage.totalInteractions > 0) {
      aggregated.aiAssistantUsage.averagePromptLength = 
        aggregated.aiAssistantUsage.totalPromptLength / aggregated.aiAssistantUsage.totalInteractions;
    }

    // Calculate totals
    Object.values(aggregated.modeUsage).forEach(mode => {
      aggregated.totalInteractions += mode.count;
      aggregated.totalLearningTime += mode.totalTime;
    });

    return aggregated;
  }

  /**
   * Calculate Active vs Reflective dimension features
   * Active learners: prefer doing, group work, experimentation
   * Reflective learners: prefer thinking, individual work, observation
   */
  calculateActiveReflectiveFeatures(aggregated) {
    const totalTime = aggregated.totalLearningTime || 1; // Avoid division by zero
    const totalActivities = aggregated.totalInteractions || 1;
    const aiTotal = aggregated.aiAssistantUsage.totalInteractions || 1;

    return {
      // Primary indicators
      activeLearningUsageRatio: aggregated.modeUsage.activeLearning.totalTime / totalTime,
      reflectiveLearningUsageRatio: aggregated.modeUsage.reflectiveLearning.totalTime / totalTime,
      
      // Activity-based indicators
      discussionParticipationRate: aggregated.activityEngagement.discussionParticipation / totalActivities,
      reflectionJournalFrequency: aggregated.activityEngagement.reflectionJournalEntries / aggregated.sessionCount,
      
      // Behavioral patterns
      groupActivityPreference: aggregated.activityEngagement.discussionParticipation / 
        (aggregated.activityEngagement.discussionParticipation + aggregated.activityEngagement.reflectionJournalEntries + 1),
      
      immediateApplicationRate: aggregated.activityEngagement.practiceQuestionsAttempted / totalActivities,
      
      // AI Assistant indicators (Ask mode = Active, Research mode = Reflective)
      aiAskModeRatio: aggregated.aiAssistantUsage.askMode.count / aiTotal,
      aiResearchModeRatio: aggregated.aiAssistantUsage.researchMode.count / aiTotal
    };
  }

  /**
   * Calculate Sensing vs Intuitive dimension features
   * Sensing learners: prefer concrete, practical, facts
   * Intuitive learners: prefer abstract, innovative, theories
   */
  calculateSensingIntuitiveFeatures(aggregated) {
    const totalTime = aggregated.totalLearningTime || 1;
    const totalActivities = aggregated.totalInteractions || 1;
    const aiTotal = aggregated.aiAssistantUsage.totalInteractions || 1;

    return {
      // Primary indicators
      sensingLearningUsageRatio: aggregated.modeUsage.sensingLearning.totalTime / totalTime,
      intuitiveLearningUsageRatio: aggregated.modeUsage.intuitiveLearning.totalTime / totalTime,
      
      // Activity-based indicators
      practicalLabCompletionRate: aggregated.activityEngagement.handsOnLabsCompleted / totalActivities,
      abstractPatternExplorationRate: aggregated.activityEngagement.conceptExplorationsCount / totalActivities,
      
      // Behavioral patterns
      concreteVsAbstractPreference: (aggregated.modeUsage.sensingLearning.totalTime + 1) / 
        (aggregated.modeUsage.intuitiveLearning.totalTime + 1),
      
      experimentationFrequency: aggregated.activityEngagement.handsOnLabsCompleted / aggregated.sessionCount,
      
      // AI Assistant indicators (Text to Docs = Sensing, Research = Intuitive)
      aiTextToDocsRatio: aggregated.aiAssistantUsage.textToDocsMode.count / aiTotal
    };
  }

  /**
   * Calculate Visual vs Verbal dimension features
   * Visual learners: prefer pictures, diagrams, charts
   * Verbal learners: prefer written and spoken words
   */
  calculateVisualVerbalFeatures(aggregated) {
    const totalTime = aggregated.totalLearningTime || 1;
    const totalActivities = aggregated.totalInteractions || 1;

    return {
      // Primary indicators
      visualLearningUsageRatio: aggregated.modeUsage.visualLearning.totalTime / totalTime,
      aiNarratorUsageRatio: aggregated.modeUsage.aiNarrator.totalTime / totalTime,
      
      // Activity-based indicators
      diagramViewFrequency: aggregated.activityEngagement.visualDiagramsViewed / totalActivities,
      audioNarrationUsage: aggregated.modeUsage.aiNarrator.count / totalActivities,
      
      // Behavioral patterns
      visualVsVerbalPreference: (aggregated.modeUsage.visualLearning.totalTime + 1) / 
        (aggregated.modeUsage.aiNarrator.totalTime + 1),
      
      visualAidEngagement: aggregated.activityEngagement.visualDiagramsViewed / aggregated.sessionCount
    };
  }

  /**
   * Calculate Sequential vs Global dimension features
   * Sequential learners: prefer step-by-step, linear progression
   * Global learners: prefer big picture, holistic understanding
   */
  calculateSequentialGlobalFeatures(aggregated) {
    const totalTime = aggregated.totalLearningTime || 1;
    const totalActivities = aggregated.totalInteractions || 1;

    return {
      // Primary indicators
      sequentialLearningUsageRatio: aggregated.modeUsage.sequentialLearning.totalTime / totalTime,
      globalLearningUsageRatio: aggregated.modeUsage.globalLearning.totalTime / totalTime,
      
      // Activity-based indicators
      stepByStepCompletionRate: aggregated.activityEngagement.sequentialStepsCompleted / totalActivities,
      overviewFirstBehavior: aggregated.modeUsage.globalLearning.count / totalActivities,
      
      // Behavioral patterns
      sequentialVsGlobalPreference: (aggregated.modeUsage.sequentialLearning.totalTime + 1) / 
        (aggregated.modeUsage.globalLearning.totalTime + 1),
      
      linearProgressionRate: aggregated.activityEngagement.sequentialStepsCompleted / aggregated.sessionCount
    };
  }

  /**
   * Assess data quality for ML readiness
   */
  assessDataQuality(aggregated) {
    const minInteractions = 10;
    const minTime = 30000; // 30 seconds (lowered for testing)
    const minSessions = 1; // 1 session is enough (lowered for testing)

    const hasEnoughInteractions = aggregated.totalInteractions >= minInteractions;
    const hasEnoughTime = aggregated.totalLearningTime >= minTime;
    const hasEnoughSessions = aggregated.sessionCount >= minSessions;

    // Calculate completeness score (0-100)
    const interactionScore = Math.min(100, (aggregated.totalInteractions / 20) * 100);
    const timeScore = Math.min(100, (aggregated.totalLearningTime / 300000) * 100); // 5 minutes
    const sessionScore = Math.min(100, (aggregated.sessionCount / 5) * 100);
    
    const completeness = (interactionScore + timeScore + sessionScore) / 3;

    return {
      sufficientForML: hasEnoughInteractions && hasEnoughTime && hasEnoughSessions,
      completeness: Math.round(completeness),
      interactionCount: aggregated.totalInteractions,
      totalTime: aggregated.totalLearningTime,
      sessionCount: aggregated.sessionCount
    };
  }

  /**
   * Get default features for users with no data
   */
  getDefaultFeatures() {
    return {
      // Active vs Reflective
      activeLearningUsageRatio: 0,
      reflectiveLearningUsageRatio: 0,
      discussionParticipationRate: 0,
      reflectionJournalFrequency: 0,
      groupActivityPreference: 0.5,
      immediateApplicationRate: 0,
      
      // Sensing vs Intuitive
      sensingLearningUsageRatio: 0,
      intuitiveLearningUsageRatio: 0,
      practicalLabCompletionRate: 0,
      abstractPatternExplorationRate: 0,
      concreteVsAbstractPreference: 1,
      experimentationFrequency: 0,
      
      // Visual vs Verbal
      visualLearningUsageRatio: 0,
      aiNarratorUsageRatio: 0,
      diagramViewFrequency: 0,
      audioNarrationUsage: 0,
      visualVsVerbalPreference: 1,
      visualAidEngagement: 0,
      
      // Sequential vs Global
      sequentialLearningUsageRatio: 0,
      globalLearningUsageRatio: 0,
      stepByStepCompletionRate: 0,
      overviewFirstBehavior: 0,
      sequentialVsGlobalPreference: 1,
      linearProgressionRate: 0,
      
      // Metadata
      totalInteractions: 0,
      totalLearningTime: 0,
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
   * Normalize features to 0-1 range for ML
   */
  normalizeFeatures(features) {
    const normalized = { ...features };
    
    // Features that are already ratios (0-1) don't need normalization
    // Features that are counts or preferences need normalization
    
    // Normalize preference ratios (can be > 1)
    const preferenceKeys = [
      'groupActivityPreference',
      'concreteVsAbstractPreference',
      'visualVsVerbalPreference',
      'sequentialVsGlobalPreference'
    ];
    
    preferenceKeys.forEach(key => {
      if (normalized[key] > 1) {
        normalized[key] = 1 / (1 + Math.log(normalized[key]));
      }
    });

    return normalized;
  }

  /**
   * Get feature vector as array (for ML model input)
   */
  getFeatureVector(features) {
    const normalized = this.normalizeFeatures(features);
    
    return [
      // Active vs Reflective (8 features - added AI Assistant)
      normalized.activeLearningUsageRatio,
      normalized.reflectiveLearningUsageRatio,
      normalized.discussionParticipationRate,
      normalized.reflectionJournalFrequency,
      normalized.groupActivityPreference,
      normalized.immediateApplicationRate,
      normalized.aiAskModeRatio || 0,
      normalized.aiResearchModeRatio || 0,
      
      // Sensing vs Intuitive (7 features - added AI Assistant)
      normalized.sensingLearningUsageRatio,
      normalized.intuitiveLearningUsageRatio,
      normalized.practicalLabCompletionRate,
      normalized.abstractPatternExplorationRate,
      normalized.concreteVsAbstractPreference,
      normalized.experimentationFrequency,
      normalized.aiTextToDocsRatio || 0,
      
      // Visual vs Verbal (6 features)
      normalized.visualLearningUsageRatio,
      normalized.aiNarratorUsageRatio,
      normalized.diagramViewFrequency,
      normalized.audioNarrationUsage,
      normalized.visualVsVerbalPreference,
      normalized.visualAidEngagement,
      
      // Sequential vs Global (6 features)
      normalized.sequentialLearningUsageRatio,
      normalized.globalLearningUsageRatio,
      normalized.stepByStepCompletionRate,
      normalized.overviewFirstBehavior,
      normalized.sequentialVsGlobalPreference,
      normalized.linearProgressionRate
    ];
  }

  /**
   * Get feature names (for ML model)
   */
  getFeatureNames() {
    return [
      // Active vs Reflective (8 features)
      'activeLearningUsageRatio',
      'reflectiveLearningUsageRatio',
      'discussionParticipationRate',
      'reflectionJournalFrequency',
      'groupActivityPreference',
      'immediateApplicationRate',
      'aiAskModeRatio',
      'aiResearchModeRatio',
      // Sensing vs Intuitive (7 features)
      'sensingLearningUsageRatio',
      'intuitiveLearningUsageRatio',
      'practicalLabCompletionRate',
      'abstractPatternExplorationRate',
      'concreteVsAbstractPreference',
      'experimentationFrequency',
      'aiTextToDocsRatio',
      // Visual vs Verbal (6 features)
      'visualLearningUsageRatio',
      'aiNarratorUsageRatio',
      'diagramViewFrequency',
      'audioNarrationUsage',
      'visualVsVerbalPreference',
      'visualAidEngagement',
      // Sequential vs Global (6 features)
      'sequentialLearningUsageRatio',
      'globalLearningUsageRatio',
      'stepByStepCompletionRate',
      'overviewFirstBehavior',
      'sequentialVsGlobalPreference',
      'linearProgressionRate'
    ];
  }

  /**
   * Convert features to ML service format
   * Maps our feature names to the ML service's expected names
   */
  convertToMLFormat(features, aggregated) {
    const normalized = this.normalizeFeatures(features);
    
    return {
      // Active vs Reflective
      activeModeRatio: normalized.activeLearningUsageRatio,
      questionsGenerated: aggregated.activityEngagement.practiceQuestionsAttempted,
      debatesParticipated: aggregated.activityEngagement.discussionParticipation,
      
      reflectiveModeRatio: normalized.reflectiveLearningUsageRatio,
      reflectionsWritten: aggregated.activityEngagement.reflectionJournalEntries,
      journalEntries: aggregated.activityEngagement.reflectionJournalEntries,
      
      // Sensing vs Intuitive
      sensingModeRatio: normalized.sensingLearningUsageRatio,
      simulationsCompleted: aggregated.activityEngagement.handsOnLabsCompleted,
      challengesCompleted: aggregated.activityEngagement.practiceQuestionsAttempted,
      
      intuitiveModeRatio: normalized.intuitiveLearningUsageRatio,
      conceptsExplored: aggregated.activityEngagement.conceptExplorationsCount,
      patternsDiscovered: aggregated.activityEngagement.conceptExplorationsCount,
      
      // Visual vs Verbal
      visualModeRatio: normalized.visualLearningUsageRatio,
      diagramsViewed: aggregated.activityEngagement.visualDiagramsViewed,
      wireframesExplored: aggregated.activityEngagement.visualDiagramsViewed,
      
      verbalModeRatio: normalized.aiNarratorUsageRatio,
      textRead: aggregated.modeUsage.aiNarrator.count,
      summariesCreated: Math.floor(aggregated.activityEngagement.reflectionJournalEntries / 2),
      
      // Sequential vs Global
      sequentialModeRatio: normalized.sequentialLearningUsageRatio,
      stepsCompleted: aggregated.activityEngagement.sequentialStepsCompleted,
      linearNavigation: aggregated.activityEngagement.sequentialStepsCompleted,
      
      globalModeRatio: normalized.globalLearningUsageRatio,
      overviewsViewed: aggregated.modeUsage.globalLearning.count,
      navigationJumps: aggregated.modeUsage.globalLearning.count
    };
  }
}

// Export singleton instance
const featureEngineeringService = new FeatureEngineeringService();
export default featureEngineeringService;
