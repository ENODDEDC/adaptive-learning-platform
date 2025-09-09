import mongoose, { Schema } from 'mongoose';

const assignmentSchema = new Schema(
  {
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
    },
    dueDate: {
      type: Date,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'material', 'topic'],
      required: true,
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment', // Topics are self-referential to the Assignment model but filtered by type
    },
    attachments: [{
      type: Schema.Types.ObjectId,
      ref: 'Content'
    }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

assignmentSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'onItem',
  justOne: false,
  match: { onModel: 'Assignment' }
});

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

export default Assignment;