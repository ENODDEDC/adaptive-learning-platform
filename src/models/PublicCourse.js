import mongoose, { Schema } from 'mongoose';

const publicCourseSchema = new Schema({
  // Basic course info
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
    default: null,
  },
  coverColor: {
    type: String,
    default: '#60a5fa',
  },
  category: {
    type: String,
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Personal Development', 'Other'],
    default: 'Other',
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  
  // Course creator
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  instructorName: {
    type: String,
    required: true,
  },
  
  // Course structure - Modules with mixed content (videos + files)
  modules: [{
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
    },
    
    // Items can be videos or files
    items: [{
      type: {
        type: String,
        enum: ['video', 'file'],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      order: {
        type: Number,
        required: true,
      },
      
      // Video-specific fields
      videoUrl: {
        type: String,
        default: null,
      },
      videoDuration: {
        type: Number, // in seconds
        default: 0,
      },
      videoThumbnail: {
        type: String,
        default: null,
      },
      
      // File-specific fields
      fileUrl: {
        type: String,
        default: null,
      },
      fileName: {
        type: String,
        default: null,
      },
      fileType: {
        type: String, // pdf, docx, pptx, etc.
        default: null,
      },
      fileSize: {
        type: Number, // in bytes
        default: 0,
      },
      
      // Common fields
      isPreview: {
        type: Boolean,
        default: false, // Free preview content
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  }],
  
  // Enrolled students
  enrolledStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Student progress tracking
  studentProgress: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedItems: [{
      type: String, // Item IDs that are completed
    }],
    lastAccessedItem: {
      type: String, // Last item ID accessed
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
      default: null,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  }],
  
  // Course status
  isPublished: {
    type: Boolean,
    default: false, // Draft until published
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  
  // Stats
  totalDuration: {
    type: Number, // Total video duration in seconds
    default: 0,
  },
  totalItems: {
    type: Number, // Total videos + files
    default: 0,
  },
  
}, { timestamps: true });

// Indexes for performance
publicCourseSchema.index({ createdBy: 1 });
publicCourseSchema.index({ isPublished: 1, isArchived: 1 });
publicCourseSchema.index({ 'enrolledStudents': 1 });
publicCourseSchema.index({ 'studentProgress.userId': 1 });

// Method to calculate total items
publicCourseSchema.methods.calculateTotalItems = function() {
  let total = 0;
  this.modules.forEach(module => {
    total += module.items.length;
  });
  return total;
};

// Method to calculate total duration
publicCourseSchema.methods.calculateTotalDuration = function() {
  let total = 0;
  this.modules.forEach(module => {
    module.items.forEach(item => {
      if (item.type === 'video' && item.videoDuration) {
        total += item.videoDuration;
      }
    });
  });
  return total;
};

// Method to get student progress
publicCourseSchema.methods.getStudentProgress = function(userId) {
  return this.studentProgress.find(p => p.userId.toString() === userId.toString());
};

// Method to update student progress
publicCourseSchema.methods.updateStudentProgress = function(userId, completedItemId) {
  let progress = this.studentProgress.find(p => p.userId.toString() === userId.toString());
  
  if (!progress) {
    // Create new progress entry
    progress = {
      userId,
      completedItems: [completedItemId],
      lastAccessedItem: completedItemId,
      lastAccessedAt: new Date(),
      completionPercentage: 0,
      certificateIssued: false,
      enrolledAt: new Date(),
    };
    this.studentProgress.push(progress);
  } else {
    // Update existing progress
    if (!progress.completedItems.includes(completedItemId)) {
      progress.completedItems.push(completedItemId);
    }
    progress.lastAccessedItem = completedItemId;
    progress.lastAccessedAt = new Date();
  }
  
  // Calculate completion percentage
  const totalItems = this.calculateTotalItems();
  if (totalItems > 0) {
    progress.completionPercentage = Math.round((progress.completedItems.length / totalItems) * 100);
  }
  
  // Check if course is completed
  if (progress.completionPercentage === 100 && !progress.completedAt) {
    progress.completedAt = new Date();
  }
  
  return progress;
};

const PublicCourse = mongoose.models.PublicCourse || mongoose.model('PublicCourse', publicCourseSchema);

export default PublicCourse;
