import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'checkboxes', 'short_answer', 'paragraph', 'dropdown', 'linear_scale', 'date', 'time', 'true_false']
  },
  title: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [String], // For multiple choice, checkboxes, dropdown
  correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null }, // Can be a string or an array of strings
  points: { type: Number, default: 1, min: 0 }, // Points assigned to this question
  // For linear scale
  scaleMin: { type: Number, default: 1 },
  scaleMax: { type: Number, default: 5 },
  scaleMinLabel: String,
  scaleMaxLabel: String
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: [questionSchema],
  type: { type: String, default: 'form' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  settings: {
    allowMultipleResponses: { type: Boolean, default: false },
    showProgress: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    confirmBeforeSubmit: { type: Boolean, default: true }
  },
  responses: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{
      questionId: String,
      answer: mongoose.Schema.Types.Mixed // Can be string, array, number, etc.
    }],
    submittedAt: { type: Date, default: Date.now },
    isComplete: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
formSchema.index({ courseId: 1, isActive: 1 });
formSchema.index({ createdBy: 1 });

export const Form = mongoose.models.Form || mongoose.model('Form', formSchema);