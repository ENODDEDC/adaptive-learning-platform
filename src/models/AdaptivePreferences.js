import mongoose from 'mongoose';

const adaptivePreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  layoutPreferences: {
    cardSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'adaptive'],
      default: 'medium'
    },
    gridColumns: {
      type: String,
      enum: ['auto', '2', '3', '4'],
      default: 'auto'
    },
    sortOrder: {
      type: String,
      enum: ['custom', 'alphabetical', 'progress', 'recent', 'personalized'],
      default: 'custom'
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showThumbnails: {
      type: Boolean,
      default: true
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    sidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  interactionPatterns: {
    mostClickedCourses: [{
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      clickCount: {
        type: Number,
        default: 1
      },
      lastClicked: {
        type: Date,
        default: Date.now
      }
    }],
    favoriteActions: [String],
    timeSpentOnFeatures: {
      type: Map,
      of: Number,
      default: {}
    },
    navigationPatterns: [String],
    preferredViewModes: {
      type: Map,
      of: Number,
      default: {}
    },
    searchFrequency: {
      type: Number,
      default: 0
    },
    filterUsage: {
      type: Map,
      of: Number,
      default: {}
    },
    dragDropFrequency: {
      type: Number,
      default: 0
    }
  },
  adaptiveSettings: {
    learningRate: {
      type: Number,
      default: 0.1,
      min: 0.01,
      max: 1.0
    },
    minInteractions: {
      type: Number,
      default: 5,
      min: 1,
      max: 100
    },
    adaptationThreshold: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    resetInterval: {
      type: Number,
      default: 7 * 24 * 60 * 60 * 1000, // 7 days
      min: 60 * 60 * 1000, // 1 hour
      max: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  },
  lastAdaptation: {
    type: Date,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  syncStatus: {
    lastSync: {
      type: Date,
      default: Date.now
    },
    needsSync: {
      type: Boolean,
      default: false
    },
    conflictResolved: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
adaptivePreferencesSchema.index({ userId: 1 });
adaptivePreferencesSchema.index({ 'syncStatus.lastSync': -1 });
adaptivePreferencesSchema.index({ 'interactionPatterns.mostClickedCourses.courseId': 1 });

// Pre-save middleware to update sync status
adaptivePreferencesSchema.pre('save', function(next) {
  this.syncStatus.needsSync = true;
  this.syncStatus.lastSync = new Date();
  next();
});

const AdaptivePreferences = mongoose.model('AdaptivePreferences', adaptivePreferencesSchema);

export default AdaptivePreferences;