import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export async function GET(req) {
  console.log('=== GET PROFILE REQUEST ===');
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    await connectMongoDB();
    console.log('Verifying token...');
    const payload = await verifyToken();

    if (!payload) {
      console.log('❌ No valid token found - Authentication failed');
      return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
    }

    const { userId } = payload;
    console.log('✅ Token verified for userId:', userId);

    const user = await User.findById(userId, '-password'); // Exclude password
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('✅ Returning user data:', { id: user._id, name: user.name, email: user.email });
    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}