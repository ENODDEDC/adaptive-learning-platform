import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  type: {
    type: String,
    enum: ['announcement', 'upload'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;