import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { otpEmailTemplate } from '@/emails/OtpEmail';
import ActivityLogger from '@/utils/activityLogger';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateRegistrationData, getClientIP } from '@/utils/inputValidator';
import { validatePassword } from '@/utils/passwordValidator';
import { generateSecureOTP } from '@/utils/secureOTP';

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { name, middleName, surname, suffix, email, password } = body;

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'register');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    // Validate input data
    const validation = validateRegistrationData({ name, middleName, surname, suffix, email });
    if (!validation.valid) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        message: 'Password does not meet requirements', 
        errors: passwordValidation.errors 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: validation.sanitized.email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased from 10 to 12 rounds

    // Generate cryptographically secure OTP
    const otp = generateSecureOTP(6);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Reduced to 5 minutes

    const newUser = new User({
      name: validation.sanitized.name,
      middleName: validation.sanitized.middleName,
      surname: validation.sanitized.surname,
      suffix: validation.sanitized.suffix,
      email: validation.sanitized.email,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    await newUser.save();

    // Log the user registration activity
    try {
      await ActivityLogger.logUserRegistration(newUser._id, {
        name,
        surname,
        email
      });
    } catch (activityError) {
      console.error('Error logging user registration activity:', activityError);
      // Don't fail registration if activity logging fails
    }

    // Skip email sending if SMTP is not configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      console.log('📧 Attempting to send OTP email to:', email);
      console.log('🔢 Generated OTP:', otp);
      
      const transporter = nodemailer.createTransport({
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
        subject: 'Email Verification OTP',
        html: otpEmailTemplate(otp),
      };

      try {
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError.message);
        // Don't throw error, just log it so registration can continue
      }
    } else {
      console.log('SMTP not configured, skipping email. OTP:', otp);
    }

    return NextResponse.json({ 
      message: 'User registered successfully. Please check your email for OTP.',
      email: validation.sanitized.email 
    }, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error.message);
    // Don't expose internal errors to client
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}