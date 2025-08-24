import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
const verifyAdminToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      return decoded.id;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export async function GET(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await User.find({}, '-password'); // Exclude password
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, name, surname, email, role } = await req.json();

  if (!id || !name || !surname || !email || !role) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.name = name;
    user.surname = surname;
    user.email = email;
    user.role = role;
    await user.save();

    return NextResponse.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}