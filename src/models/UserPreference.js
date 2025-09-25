import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  layoutPreferences: {
    cardSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'featured'],
      default: 'medium'
    },
    gridColumns: {
      type: String,
      enum: ['2', '3', '4', '5', 'auto'],
      default: 'auto'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    animationSpeed: {
      type: String,
      enum: ['slow', 'normal', 'fast', 'none'],
      default: 'normal'
    }
  },
  interactionPatterns: {
    preferredViewMode: {
      type: String,
      enum: ['grid', 'list', 'masonry', 'compact'],
      default: 'grid'
    },
    frequentActions: [{
      action: String,
      count: Number,
      lastUsed: Date
    }],
    avoidedActions: [{
      action: String,
      count: Number,
      lastAvoided: Date
    }],
    timeBasedPreferences: {
      morning: {
        layout: String,
        features: [String]
      },
      afternoon: {
        layout: String,
        features: [String]
      },
      evening: {
        layout: String,
        features: [String]
      }
    }
  },
  learningMetrics: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    layoutChanges: {
      type: Number,
      default: 0
    },
    manualOverrides: {
      type: Number,
      default: 0
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    learningProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  adaptiveSettings: {
    autoAdjustLayout: {
      type: Boolean,
      default: true
    },
    learningRate: {
      type: Number,
      default: 0.1,
      min: 0.01,
      max: 1.0
    },
    confidenceThreshold: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    adaptationHistory: [{
      timestamp: Date,
      trigger: String,
      oldSettings: mongoose.Schema.Types.Mixed,
      newSettings: mongoose.Schema.Types.Mixed,
      confidence: Number,
      userFeedback: {
        type: String,
        enum: ['positive', 'negative', 'neutral', null]
      }
    }]
  },
  featureUsage: {
    searchFrequency: {
      type: Number,
      default: 0
    },
    filterUsage: {
      type: Number,
      default: 0
    },
    sortUsage: {
      type: Number,
      default: 0
    },
    previewUsage: {
      type: Number,
      default: 0
    },
    dragDropUsage: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
userPreferenceSchema.index({ userId: 1 });
userPreferenceSchema.index({ 'learningMetrics.satisfactionScore': -1 });
userPreferenceSchema.index({ 'adaptiveSettings.adaptationHistory.timestamp': -1 });

// Static methods for preference analysis
userPreferenceSchema.statics.analyzeUserBehavior = function(userId, interactions) {
  return this.findOne({ userId }).then(preferences => {
    if (!preferences) {
      return this.create({ userId });
    }

    // Analyze interaction patterns
    const analysis = {
      preferredCardSize: 'medium',
      preferredLayout: 'grid',
      frequentlyUsedFeatures: [],
      timeBasedPatterns: {},
      satisfactionIndicators: {}
    };

    // Analyze card size preferences based on interactions
    const cardSizeInteractions = interactions.filter(i =>
      i.type === 'card_hover' || i.type === 'course_click'
    );

    if (cardSizeInteractions.length > 0) {
      // Determine preferred card size based on interaction duration
      const avgDuration = cardSizeInteractions.reduce((sum, i) =>
        sum + (i.metadata.hoverDuration || 0), 0) / cardSizeInteractions.length;

      if (avgDuration > 5000) analysis.preferredCardSize = 'large';
      else if (avgDuration > 2000) analysis.preferredCardSize = 'medium';
      else analysis.preferredCardSize = 'small';
    }

    // Analyze feature usage
    const featureUsage = {
      search: interactions.filter(i => i.type === 'search').length,
      filter: interactions.filter(i => i.type === 'filter').length,
      sort: interactions.filter(i => i.type === 'sort').length,
      preview: interactions.filter(i => i.type === 'preview').length
    };

    analysis.frequentlyUsedFeatures = Object.entries(featureUsage)
      .filter(([_, count]) => count > 0)
      .map(([feature, _]) => feature);

    return { preferences, analysis };
  });
};

// Instance methods for preference updates
userPreferenceSchema.methods.updateFromInteraction = function(interaction) {
  this.learningMetrics.totalInteractions += 1;

  // Update feature usage
  if (interaction.type === 'search') {
    this.featureUsage.searchFrequency += 1;
  } else if (interaction.type === 'filter') {
    this.featureUsage.filterUsage += 1;
  } else if (interaction.type === 'sort') {
    this.featureUsage.sortUsage += 1;
  } else if (interaction.type === 'preview') {
    this.featureUsage.previewUsage += 1;
  } else if (interaction.type === 'drag_drop') {
    this.featureUsage.dragDropUsage += 1;
  }

  // Update interaction patterns
  const existingAction = this.interactionPatterns.frequentActions.find(
    a => a.action === interaction.type
  );

  if (existingAction) {
    existingAction.count += 1;
    existingAction.lastUsed = new Date();
  } else {
    this.interactionPatterns.frequentActions.push({
      action: interaction.type,
      count: 1,
      lastUsed: new Date()
    });
  }

  return this.save();
};

userPreferenceSchema.methods.applyLayoutRecommendation = function(recommendation, confidence) {
  const oldSettings = { ...this.layoutPreferences };

  // Apply recommendation with confidence weighting
  if (recommendation.cardSize && confidence > this.adaptiveSettings.confidenceThreshold) {
    this.layoutPreferences.cardSize = recommendation.cardSize;
    this.learningMetrics.layoutChanges += 1;
  }

  if (recommendation.compactMode !== undefined && confidence > this.adaptiveSettings.confidenceThreshold) {
    this.layoutPreferences.compactMode = recommendation.compactMode;
    this.learningMetrics.layoutChanges += 1;
  }

  // Record the adaptation
  this.adaptiveSettings.adaptationHistory.push({
    timestamp: new Date(),
    trigger: 'behavior_analysis',
    oldSettings,
    newSettings: { ...this.layoutPreferences },
    confidence
  });

  return this.save();
};

export default mongoose.models.UserPreference || mongoose.model('UserPreference', userPreferenceSchema);