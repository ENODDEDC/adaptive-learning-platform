import mongoose, { Schema } from 'mongoose';

const courseSchema = new Schema({
  subject: {
    type: String,
    required: true,
  },
  section: {
    type: String,
  },
  teacherName: {
    type: String,
    required: true,
  },
  coverColor: {
    type: String,
    default: '#60a5fa',
  },
  uniqueKey: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enrolledUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  coTeachers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  instructors: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  invitationToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  invitationEnabled: {
    type: Boolean,
    default: false,
  },
  schedules: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  }],
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;