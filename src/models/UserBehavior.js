import mongoose from 'mongoose';

const userBehaviorSchema = new mongoose.Schema({
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
  interactionType: {
    type: String,
    required: true,
    enum: ['course_click', 'navigation', 'feature_usage', 'view_mode_change', 'search', 'filter_used', 'drag_drop', 'action_performed']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    screenSize: String,
    platform: String,
    timezone: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
userBehaviorSchema.index({ userId: 1, timestamp: -1 });
userBehaviorSchema.index({ userId: 1, interactionType: 1, timestamp: -1 });
userBehaviorSchema.index({ sessionId: 1, timestamp: -1 });

// TTL index to automatically delete old behavior data (90 days)
userBehaviorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);

export default UserBehavior;