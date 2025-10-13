import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_registered',
      'user_login',
      'user_logout',
      'course_created',
      'course_updated',
      'course_deleted',
      'course_enrolled',
      'course_completed',
      'assignment_submitted',
      'assignment_graded',
      'form_created',
      'form_submitted',
      'profile_updated',
      'password_changed',
      'admin_action'
    ]
  },
  targetType: {
    type: String,
    enum: ['course', 'user', 'assignment', 'form', 'system'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['user', 'course', 'assignment', 'form', 'system', 'admin'],
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ category: 1, createdAt: -1 });

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();

    // Keep only last 1000 activities to prevent database bloat
    const count = await this.countDocuments();
    if (count > 1000) {
      const oldestActivities = await this.find({})
        .sort({ createdAt: 1 })
        .limit(count - 1000);

      const idsToDelete = oldestActivities.map(activity => activity._id);
      await this.deleteMany({ _id: { $in: idsToDelete } });
    }

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(limit = 10) {
  try {
    const activities = await this.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

// Static method to get activities by category
activitySchema.statics.getActivitiesByCategory = async function(category, limit = 20) {
  try {
    const activities = await this.find({ category })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities;
  } catch (error) {
    console.error('Error fetching activities by category:', error);
    throw error;
  }
};

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

export default Activity;