import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export async function GET(req) {
  try {
    await connectMongoDB();
    const payload = await verifyToken();

    if (!payload) {
      return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
    }

    const { userId } = payload;

    const user = await User.findById(userId, '-password'); // Exclude password

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectMongoDB();
    const payload = await verifyToken();

    if (!payload) {
      return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
    }

    const { userId } = payload;
    const body = await req.json();
    const { name, middleName, surname } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (surname) updateData.surname = surname;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}