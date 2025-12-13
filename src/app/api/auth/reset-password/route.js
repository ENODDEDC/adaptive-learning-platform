import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { getClientIP } from '@/utils/inputValidator';
import { validatePassword } from '@/utils/passwordValidator';
import { hashToken } from '@/utils/secureOTP';

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { token, password } = body;

    // Input validation
    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'resetPassword');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        message: 'Password does not meet requirements', 
        errors: passwordValidation.errors 
      }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return NextResponse.json({ 
        message: 'New password must be different from your current password' 
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0; // Reset failed attempts
    user.accountLockedUntil = null; // Unlock account if locked

    await user.save();

    // Send notification email
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransporter({
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
          to: user.email,
          subject: 'Password Changed Successfully',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Password Changed</h1>
              <p>Your password has been successfully changed.</p>
              <p>If you did not make this change, please contact support immediately.</p>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Password change notification sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send password change notification:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    return NextResponse.json({ message: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}