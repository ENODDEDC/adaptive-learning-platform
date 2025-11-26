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
  thumbnailKey: {
    type: String, // Cloud storage key for the thumbnail
  },
  // PowerPoint specific fields
  slidesData: {
    type: [{
      slideNumber: { type: Number, required: true },
      imageUrl: { type: String, required: true },
      s3Key: { type: String },
      width: { type: Number },
      height: { type: Number },
      size: { type: Number },
      text: { type: String, default: '' }, // Extracted text content
      notes: { type: String, default: '' }, // Speaker notes
      hasImages: { type: Boolean, default: false }, // Whether slide contains images
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
  pdfPath: {
    type: String,
  },
  // Cloud storage metadata (for Backblaze B2, AWS S3, etc.)
  cloudStorage: {
    provider: {
      type: String,
      enum: ['local', 'backblaze-b2', 'aws-s3', 'firebase'],
      default: 'local',
    },
    key: {
      type: String, // The file key/path in cloud storage
    },
    url: {
      type: String, // The public URL to access the file
    },
    bucket: {
      type: String, // The bucket/container name
    },
    region: {
      type: String, // The storage region
    },
    metadata: {
      type: Schema.Types.Mixed, // Additional provider-specific metadata
    },
  },
}, {
  timestamps: true
});

// Index for efficient querying
contentSchema.index({ courseId: 1, contentType: 1 });
contentSchema.index({ courseId: 1, createdAt: -1 });

const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

export default Content;