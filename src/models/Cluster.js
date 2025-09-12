import mongoose, { Schema } from 'mongoose';

const clusterSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  section: {
    type: String,
  },
  classCode: {
    type: String,
    required: true,
    unique: true,
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course',
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enrolledUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  coverColor: {
    type: String,
    default: '#60a5fa',
  },
}, { timestamps: true });

const Cluster = mongoose.models.Cluster || mongoose.model('Cluster', clusterSchema);

export default Cluster;