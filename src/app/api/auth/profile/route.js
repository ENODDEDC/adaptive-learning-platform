import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export async function GET(req) {
  console.log('=== GET PROFILE REQUEST ===');
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  await connectMongoDB();
  console.log('Verifying token...');
  const payload = await verifyToken();
  console.log('Token payload:', payload);
  if (!payload) {
    console.log('No payload, returning 401');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = payload;
  console.log('UserId from token:', userId);

  try {
    const user = await User.findById(userId, '-password'); // Exclude password
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    console.log('Returning user data:', { id: user._id, name: user.name, email: user.email });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}