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
        fileName: String,
        fileUrl: String,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
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

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;