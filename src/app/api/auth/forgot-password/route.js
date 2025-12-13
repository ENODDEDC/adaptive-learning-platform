import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateEmail, getClientIP } from '@/utils/inputValidator';
import { generateResetToken, hashToken } from '@/utils/secureOTP';

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

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'forgotPassword');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      }, { status: 200 });
    }

    // Generate secure reset token (32 bytes = 64 hex characters)
    const resetToken = generateResetToken(32);
    const passwordResetToken = hashToken(resetToken);
    const passwordResetExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = passwordResetToken;
    user.resetPasswordExpires = passwordResetExpires;

    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${resetToken}`;

    // Skip email sending if SMTP is not configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset</h1>
            <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', email);
    } else {
      console.log('SMTP not configured, skipping email. Reset URL:', resetUrl);
    }

    // Always return success message (prevent email enumeration)
    return NextResponse.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    return NextResponse.json({ message: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}