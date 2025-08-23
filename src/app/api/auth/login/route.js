import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await connectMongoDB();

    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ message: 'Please verify your email first' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        provider: user.authProvider || 'email'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        provider: user.authProvider || 'email'
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Login Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}