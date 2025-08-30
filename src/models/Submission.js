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
    submissionContent: {
      type: String, // Can be text, or a URL to a file
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: { // Embedding grade directly for simplicity, can be a ref to a Grade model
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'missing', 'late'],
      default: 'submitted',
    },
  },
  { timestamps: true }
);

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;