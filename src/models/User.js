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
  // Email - Encrypted + Hash for searching
  emailHash: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },
  emailEncrypted: {
    type: String,
    required: true,
  },
  
  // Password - Hashed with bcrypt
  password: {
    type: String,
    required: true,
  },
  
  // OTP - Hashed for security
  otpHash: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Reset Token - Hashed for security
  resetPasswordTokenHash: {
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
  profilePicture: {
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
  // Security fields
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLockedUntil: {
    type: Date,
  },
  lastLoginAt: {
    type: Date,
  },
  lastLoginIPHash: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
  },
  loginHistory: [{
    ipHash: String,  // Hashed for privacy
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean,
  }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);