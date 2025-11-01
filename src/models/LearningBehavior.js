import mongoose from 'mongoose';

const learningBehaviorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Learning Mode Usage - tracks time spent in each of the 8 AI learning modes
  modeUsage: {
    aiNarrator: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 }, // milliseconds
      lastUsed: { type: Date }
    },
    visualLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    sequentialLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    globalLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    sensingLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    intuitiveLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    activeLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    reflectiveLearning: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    }
  },
  
  // AI Assistant Usage - tracks interactions with AI Assistant on home page
  aiAssistantUsage: {
    askMode: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    researchMode: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    textToDocsMode: {
      count: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    totalInteractions: { type: Number, default: 0 },
    averagePromptLength: { type: Number, default: 0 },
    totalPromptLength: { type: Number, default: 0 }
  },
  
  // Content Interaction Patterns
  contentInteractions: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    contentType: {
      type: String,
      enum: ['document', 'video', 'audio', 'material']
    },
    viewDuration: { type: Number, default: 0 }, // milliseconds
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    replayCount: { type: Number, default: 0 },
    scrollDepth: { type: Number, default: 0, min: 0, max: 100 },
    pauseCount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Activity Engagement - tracks interaction with learning activities
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
  
  // Learning Pace and Patterns
  learningPace: {
    averageSessionDuration: { type: Number, default: 0 }, // milliseconds
    preferredTimeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'unknown'],
      default: 'unknown'
    },
    breakFrequency: { type: Number, default: 0 },
    contentConsumptionSpeed: {
      type: String,
      enum: ['slow', 'moderate', 'fast', 'unknown'],
      default: 'unknown'
    }
  },
  
  // Calculated Features for ML (computed from raw data)
  features: {
    // Active vs Reflective dimension
    activeScore: { type: Number, default: 0, min: 0, max: 1 },
    reflectiveScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Sensing vs Intuitive dimension
    sensingScore: { type: Number, default: 0, min: 0, max: 1 },
    intuitiveScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Visual vs Verbal dimension
    visualScore: { type: Number, default: 0, min: 0, max: 1 },
    verbalScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Sequential vs Global dimension
    sequentialScore: { type: Number, default: 0, min: 0, max: 1 },
    globalScore: { type: Number, default: 0, min: 0, max: 1 }
  },
  
  // Metadata
  deviceInfo: {
    userAgent: String,
    screenSize: String,
    platform: String,
    timezone: String
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
learningBehaviorSchema.index({ userId: 1, timestamp: -1 });
learningBehaviorSchema.index({ userId: 1, sessionId: 1 });
learningBehaviorSchema.index({ sessionId: 1, timestamp: -1 });

// TTL index to automatically delete old behavior data after 90 days
learningBehaviorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get user's total interactions (includes both learning modes and AI Assistant)
learningBehaviorSchema.statics.getTotalInteractions = async function(userId) {
  const behaviors = await this.find({ userId });
  
  let totalInteractions = 0;
  behaviors.forEach(behavior => {
    // Count 8 learning mode interactions
    Object.values(behavior.modeUsage).forEach(mode => {
      totalInteractions += mode.count;
    });
    
    // Count AI Assistant interactions
    if (behavior.aiAssistantUsage) {
      totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
    }
  });
  
  return totalInteractions;
};

// Static method to check if user has sufficient data for ML classification
learningBehaviorSchema.statics.hasSufficientData = async function(userId) {
  const totalInteractions = await this.getTotalInteractions(userId);
  const MIN_INTERACTIONS = 10; // Minimum interactions needed for ML
  
  return totalInteractions >= MIN_INTERACTIONS;
};

// Instance method to calculate total learning time
learningBehaviorSchema.methods.getTotalLearningTime = function() {
  let total = 0;
  Object.values(this.modeUsage).forEach(mode => {
    total += mode.totalTime;
  });
  return total;
};

const LearningBehavior = mongoose.models.LearningBehavior || mongoose.model('LearningBehavior', learningBehaviorSchema);

export default LearningBehavior;
