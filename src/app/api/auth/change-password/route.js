import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectMongoDB();
    const payload = await verifyToken();

    if (!payload) {
      return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
    }

    const { userId } = payload;
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return NextResponse.json({ 
        message: 'Cannot change password for OAuth accounts' 
      }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      message: 'Server error',
      error: error.message 
    }, { status: 500 });
  }
}
