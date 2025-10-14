import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await connectMongoDB();

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || (user.role !== 'admin' && user.role !== 'super admin')) {
      return NextResponse.json({ message: 'Invalid credentials or not an admin' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ 
      userId: user._id,
      id: user._id, // Keep for backward compatibility
      role: user.role,
      email: user.email
    }, process.env.JWT_SECRET, {
      expiresIn: '7d', // Changed from 1h to 7d to match regular login
    });

    const response = NextResponse.json({
      message: 'Admin login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 });

    cookies().set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'Lax',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}