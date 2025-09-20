import mongoose, { Schema } from 'mongoose';

const contentSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['document', 'video', 'audio', 'material'],
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  thumbnailUrl: {
    type: String,
  },
  // PowerPoint specific fields
  slidesData: {
    type: [{
      slideNumber: { type: Number, required: true },
      imageUrl: { type: String, required: true },
      s3Key: { type: String, required: true },
      width: { type: Number },
      height: { type: Number },
      size: { type: Number },
    }],
    default: [],
  },
  totalSlides: {
    type: Number,
    default: 0,
  },
  conversionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  conversionError: {
    type: String,
  },
  cacheKey: {
    type: String,
  },
}, {
  timestamps: true
});

// Index for efficient querying
contentSchema.index({ courseId: 1, contentType: 1 });
contentSchema.index({ courseId: 1, createdAt: -1 });

const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

export default Content;