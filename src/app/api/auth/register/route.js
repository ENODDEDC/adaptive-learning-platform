import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { otpEmailTemplate } from '@/emails/OtpEmail';

export async function POST(req) {
  try {
    await connectToDatabase();

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
      subject: 'Email Verification OTP',
      html: otpEmailTemplate(otp),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'User registered successfully. Please check your email for OTP.' }, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}