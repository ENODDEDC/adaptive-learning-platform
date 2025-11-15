import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  // Reference to the content/document this note belongs to
  contentId: {
    type: String,
    required: true,
    index: true
  },
  
  // Reference to the course (optional for global notes)
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false,
    index: true,
    default: null
  },
  
  // User who created the note
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type of note
  type: {
    type: String,
    enum: ['floating', 'sticky', 'highlight', 'margin', 'drawing'],
    default: 'floating',
    required: true
  },
  
  // Note content
  content: {
    type: String,
    required: true,
    maxlength: 2000 // Limit note size
  },

  // Contextual information for notes linked to text selections
  contextualText: {
    type: String,
    trim: true,
  },

  contextualId: {
    type: String,
    trim: true,
  },
  
  // Position on the document/screen
  position: {
    x: {
      type: Number,
      required: true,
      min: 0
    },
    y: {
      type: Number,
      required: true,
      min: 0
    },
    // For multi-page documents (PDF, PowerPoint)
    page: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  
  size: {
    width: { type: Number, default: 250 },
    height: { type: Number, default: 180 }
  },

  // Note styling and properties
  style: {
    // Background color
    backgroundColor: {
      type: String,
      default: '#fef3c7' // yellow-100 equivalent
    },
    // Border color
    borderColor: {
      type: String,
      default: '#fcd34d' // yellow-300 equivalent
    },
    // Text color
    textColor: {
      type: String,
      default: '#374151' // gray-700 equivalent
    },
    // Font size
    fontSize: {
      type: String,
      default: 'text-sm'
    }
  },
  
  // Sharing and collaboration
  isShared: {
    type: Boolean,
    default: false
  },
  
  // For shared notes, who can see them
  visibility: {
    type: String,
    enum: ['private', 'course', 'public'],
    default: 'private'
  },
  
  // Note category for organization
  category: {
    type: String,
    maxlength: 50,
    default: 'general'
  },
  
  // Tags for better organization
  tags: [{
    type: String,
    maxlength: 30
  }],
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Whether the note is archived
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // For collaborative notes - last editor
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version tracking for collaborative editing
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'notes'
});

// Compound indexes for efficient queries
noteSchema.index({ contentId: 1, userId: 1 });
noteSchema.index({ courseId: 1, userId: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ courseId: 1, isShared: 1, visibility: 1 });
noteSchema.index({ tags: 1 });

// Instance methods
noteSchema.methods.toJSON = function() {
  const note = this.toObject();
  note.id = note._id;
  delete note._id;
  delete note.__v;
  return note;
};

// Static methods
noteSchema.statics.findByContentAndUser = function(contentId, userId) {
  return this.find({ 
    contentId, 
    userId, 
    isArchived: false 
  }).sort({ createdAt: -1 });
};

noteSchema.statics.findSharedNotes = function(courseId, contentId) {
  return this.find({
    courseId,
    contentId,
    isShared: true,
    visibility: { $in: ['course', 'public'] },
    isArchived: false
  })
  .populate('userId', 'name email')
  .populate('lastEditedBy', 'name email')
  .sort({ createdAt: -1 });
};

noteSchema.statics.findByCategory = function(userId, category) {
  return this.find({
    userId,
    category,
    isArchived: false
  }).sort({ createdAt: -1 });
};

noteSchema.statics.searchNotes = function(userId, searchTerm) {
  return this.find({
    userId,
    isArchived: false,
    $or: [
      { content: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  }).sort({ createdAt: -1 });
};

// Pre-save middleware
noteSchema.pre('save', function(next) {
  // Update version on content change
  if (this.isModified('content') && !this.isNew) {
    this.version += 1;
  }
  
  // Set lastEditedBy if content changed (this will be set by the API)
  // The API will set lastEditedBy to the current user when updating shared notes
  
  next();
});

// Export model
const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export default Note;