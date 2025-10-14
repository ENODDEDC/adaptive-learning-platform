import mongoose, { Schema } from 'mongoose';

const submissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Content'
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    workSessionTime: {
      type: Number,
      default: 0, // Time in minutes spent working on this assignment
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // Completion percentage
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    gradedAt: {
      type: Date,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to update timestamps and handle status changes
submissionSchema.pre('save', function(next) {
  this.lastModified = new Date();

  // Set submittedAt when status changes to 'submitted'
  if (this.status === 'submitted' && this.submittedAt === null) {
    this.submittedAt = new Date();
  }

  // Reset submittedAt if status changes back to 'draft'
  if (this.status === 'draft') {
    this.submittedAt = null;
  }

  next();
});

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;