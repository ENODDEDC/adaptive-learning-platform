import mongoose, { Schema } from 'mongoose';

const scheduledCourseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  day: {
    type: String,
    required: true,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  },
  timeSlot: {
    type: String,
    required: true,
  },
}, { timestamps: true });

scheduledCourseSchema.index({ userId: 1, day: 1, timeSlot: 1 }, { unique: true });

const ScheduledCourse = mongoose.models.ScheduledCourse || mongoose.model('ScheduledCourse', scheduledCourseSchema);

export default ScheduledCourse;