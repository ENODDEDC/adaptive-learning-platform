import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { otpEmailTemplate } from '@/emails/OtpEmail';
import ActivityLogger from '@/utils/activityLogger';

export async function POST(req) {
  try {
    await connectMongoDB();

    const { name, middleName, surname, suffix, email, password } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      name,
      middleName,
      surname,
      suffix,
      email,
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

    return NextResponse.json({ message: 'User registered successfully. Please check your email for OTP.' }, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}