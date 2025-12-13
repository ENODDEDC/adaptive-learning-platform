import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateEmail, validateOTP, getClientIP } from '@/utils/inputValidator';

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const otp = body.otp?.trim();

    // Input validation
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    if (!validateOTP(otp)) {
      return NextResponse.json({ message: 'Invalid OTP format' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'verifyOtp');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
    }

    // Check OTP validity
    if (!user.otp || !user.otpExpires) {
      return NextResponse.json({ message: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (user.otpExpires < new Date()) {
      return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    return NextResponse.json({ message: 'An error occurred during verification' }, { status: 500 });
  }
}