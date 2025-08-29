import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  surname: {
    type: String,
    required: true,
  },
  suffix: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  googleId: {
    type: String,
  },
  photoURL: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  role: {
    type: String,
    enum: ['super admin', 'admin', 'instructor', 'student'],
    default: 'student',
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);