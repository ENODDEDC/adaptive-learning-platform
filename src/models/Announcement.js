import mongoose, { Schema } from 'mongoose';

const announcementSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

announcementSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'onItem',
  justOne: false,
  match: { onModel: 'Announcement' }
});

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement;