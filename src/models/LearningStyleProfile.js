import mongoose from 'mongoose';

const learningStyleProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // FSLSM Dimension Scores (-11 to +11 scale, following original ILS)
  // Positive values indicate preference for first dimension
  // Negative values indicate preference for second dimension
  dimensions: {
    activeReflective: {
      type: Number,
      default: 0,
      min: -11,
      max: 11
      // +11 = Very Active, -11 = Very Reflective, 0 = Balanced
    },
    sensingIntuitive: {
      type: Number,
      default: 0,
      min: -11,
      max: 11
      // +11 = Very Sensing, -11 = Very Intuitive, 0 = Balanced
    },
    visualVerbal: {
      type: Number,
      default: 0,
      min: -11,
      max: 11
      // +11 = Very Visual, -11 = Very Verbal, 0 = Balanced
    },
    sequentialGlobal: {
      type: Number,
      default: 0,
      min: -11,
      max: 11
      // +11 = Very Sequential, -11 = Very Global, 0 = Balanced
    }
  },
  
  // Confidence scores for each dimension (0-1)
  confidence: {
    activeReflective: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    sensingIntuitive: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    visualVerbal: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    sequentialGlobal: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },
  
  // Recommended learning modes (ranked by priority)
  recommendedModes: [{
    mode: {
      type: String,
      enum: [
        'AI Narrator',
        'Visual Learning',
        'Sequential Learning',
        'Global Learning',
        'Hands-On Lab',
        'Concept Constellation',
        'Active Learning Hub',
        'Reflective Learning'
      ]
    },
    priority: {
      type: Number,
      min: 1,
      max: 8
    },
    reason: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  
  // Classification metadata
  classificationMethod: {
    type: String,
    enum: ['ml-prediction', 'rule-based', 'hybrid', 'manual', 'questionnaire'],
    default: 'rule-based'
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  lastPrediction: {
    type: Date,
    default: Date.now
  },
  predictionCount: {
    type: Number,
    default: 0
  },
  
  // User feedback on recommendations
  userFeedback: [{
    recommendedMode: String,
    accepted: Boolean,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Data quality indicators
  dataQuality: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    dataCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    sufficientForML: {
      type: Boolean,
      default: false
    },
    lastDataUpdate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Incremental Aggregated Stats (for scalability)
  // Maintains running totals to avoid re-fetching all historical data
  aggregatedStats: {
    modeUsage: {
      aiNarrator: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      visualLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      sequentialLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      globalLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      sensingLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      intuitiveLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      activeLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      reflectiveLearning: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      }
    },
    aiAssistantUsage: {
      askMode: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      researchMode: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      textToDocsMode: {
        count: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      totalInteractions: { type: Number, default: 0 },
      totalPromptLength: { type: Number, default: 0 }
    },
    activityEngagement: {
      quizzesCompleted: { type: Number, default: 0 },
      practiceQuestionsAttempted: { type: Number, default: 0 },
      discussionParticipation: { type: Number, default: 0 },
      reflectionJournalEntries: { type: Number, default: 0 },
      visualDiagramsViewed: { type: Number, default: 0 },
      handsOnLabsCompleted: { type: Number, default: 0 },
      conceptExplorationsCount: { type: Number, default: 0 },
      sequentialStepsCompleted: { type: Number, default: 0 }
    },
    lastAggregatedDate: {
      type: Date,
      default: Date.now
    },
    lastProcessedBehaviorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningBehavior'
    },
    totalInteractionsProcessed: {
      type: Number,
      default: 0
    }
  },
  
  // ML Confidence Score (real ML model confidence, not rule-based)
  mlConfidenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
learningStyleProfileSchema.index({ userId: 1 });
learningStyleProfileSchema.index({ lastPrediction: -1 });
learningStyleProfileSchema.index({ 'dataQuality.sufficientForML': 1 });

// Instance method to get dominant learning style
learningStyleProfileSchema.methods.getDominantStyle = function() {
  const { dimensions } = this;
  const styles = [];
  
  // Active vs Reflective
  if (Math.abs(dimensions.activeReflective) >= 3) {
    styles.push(dimensions.activeReflective > 0 ? 'Active' : 'Reflective');
  }
  
  // Sensing vs Intuitive
  if (Math.abs(dimensions.sensingIntuitive) >= 3) {
    styles.push(dimensions.sensingIntuitive > 0 ? 'Sensing' : 'Intuitive');
  }
  
  // Visual vs Verbal
  if (Math.abs(dimensions.visualVerbal) >= 3) {
    styles.push(dimensions.visualVerbal > 0 ? 'Visual' : 'Verbal');
  }
  
  // Sequential vs Global
  if (Math.abs(dimensions.sequentialGlobal) >= 3) {
    styles.push(dimensions.sequentialGlobal > 0 ? 'Sequential' : 'Global');
  }
  
  return styles.length > 0 ? styles.join('-') : 'Balanced';
};

// Instance method to check if profile needs update
learningStyleProfileSchema.methods.needsUpdate = function() {
  const daysSinceLastPrediction = (Date.now() - this.lastPrediction) / (1000 * 60 * 60 * 24);
  return daysSinceLastPrediction > 7; // Update weekly
};

// Static method to get or create profile
learningStyleProfileSchema.statics.getOrCreate = async function(userId) {
  let profile = await this.findOne({ userId });
  
  if (!profile) {
    profile = await this.create({ userId });
  }
  
  return profile;
};

// Instance method to get next classification threshold
learningStyleProfileSchema.methods.getNextThreshold = function() {
  const current = this.aggregatedStats?.totalInteractionsProcessed || 0;
  
  if (current < 50) return 50;
  if (current < 100) return 100;
  if (current < 200) return 200;
  return Math.ceil(current / 50) * 50 + 50; // Every 50 after 200
};

// Instance method to check if should classify at current interaction count
learningStyleProfileSchema.methods.shouldClassifyNow = function() {
  const total = this.aggregatedStats?.totalInteractionsProcessed || 0;
  
  // Classify at milestones: 50, 100, 200, then every 50
  if (total === 50 || total === 100 || total === 200) return true;
  if (total > 200 && total % 50 === 0) return true;
  
  return false;
};

// Instance method to get confidence level based on interactions
learningStyleProfileSchema.methods.getConfidenceLevel = function() {
  const total = this.aggregatedStats?.totalInteractionsProcessed || 0;
  
  if (total < 50) return { level: 'insufficient', percentage: Math.min(100, (total / 50) * 100), stage: 'building' };
  if (total < 100) return { level: 'preliminary', percentage: 65, stage: 'initial' };
  if (total < 200) return { level: 'moderate', percentage: 78, stage: 'refined' };
  return { level: 'high', percentage: 88, stage: 'stable' };
};

const LearningStyleProfile = mongoose.models.LearningStyleProfile || mongoose.model('LearningStyleProfile', learningStyleProfileSchema);

export default LearningStyleProfile;
