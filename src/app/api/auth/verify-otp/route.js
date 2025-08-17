import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectMongoDB();

    const { email, otp } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}