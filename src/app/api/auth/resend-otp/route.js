import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { otpEmailTemplate } from '@/emails/OtpEmail';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateEmail, getClientIP } from '@/utils/inputValidator';
import { generateSecureOTP } from '@/utils/secureOTP';

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    // Input validation
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting (stricter for resend)
    const rateLimit = checkRateLimit(clientIP, 'verifyOtp');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
    }

    // Generate new OTP
    const otp = generateSecureOTP(6);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: `"AssistEd" <${process.env.FROM_EMAIL}>`,
          to: email,
          subject: 'Email Verification OTP - Resent',
          html: otpEmailTemplate(otp),
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ OTP resent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to resend OTP email:', emailError.message);
        return NextResponse.json({ 
          message: 'Failed to send OTP. Please try again later.' 
        }, { status: 500 });
      }
    } else {
      console.log('SMTP not configured. OTP:', otp);
    }

    return NextResponse.json({ 
      message: 'OTP has been resent to your email' 
    }, { status: 200 });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    return NextResponse.json({ 
      message: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
}
