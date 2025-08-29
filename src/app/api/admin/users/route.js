import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

// Helper function to verify admin token
const verifyAdminToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin' || decoded.role === 'super admin') {
      return decoded; // Return the entire decoded token
    }
    return null;
  } catch (error) {
    return null;
  }
};

export async function GET(req) {
  await connectMongoDB();
  const adminInfo = verifyAdminToken(req);
  if (!adminInfo) {
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

export async function POST(req) {
  await connectMongoDB();
  const adminInfo = verifyAdminToken(req);
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, surname, email, password, role } = await req.json();

  if (!name || !surname || !email || !password || !role) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  // Permission logic for creating users
  if (adminInfo.role === 'admin' && (role === 'admin' || role === 'super admin')) {
    return NextResponse.json({ message: 'Unauthorized to create admin users' }, { status: 403 });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword,
      role,
      isVerified: true, // Or based on your logic
    });

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  const adminInfo = verifyAdminToken(req);
  if (!adminInfo) {
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

    // Permission logic for updating users
    if (adminInfo.role === 'admin') {
      // Admin can only update instructor and student roles, and cannot change admin/super admin roles
      if (user.role === 'admin' || user.role === 'super admin' || role === 'admin' || role === 'super admin') {
        return NextResponse.json({ message: 'Unauthorized to update this user role' }, { status: 403 });
      }
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
  const adminInfo = verifyAdminToken(req);
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Permission logic for deleting users
    if (adminInfo.role === 'admin') {
      // Admin can only delete instructor and student roles
      if (user.role === 'admin' || user.role === 'super admin') {
        return NextResponse.json({ message: 'Unauthorized to delete this user role' }, { status: 403 });
      }
    }
    
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}