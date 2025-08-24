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
    const admin = await User.findById(adminId, '-password'); // Exclude password
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }
    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, surname, email, photoURL } = await req.json();

  if (!name || !surname || !email) {
    return NextResponse.json({ message: 'Name, surname, and email are required' }, { status: 400 });
  }

  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    admin.name = name;
    admin.surname = surname;
    admin.email = email;
    if (photoURL) {
      admin.photoURL = photoURL;
    }
    await admin.save();

    return NextResponse.json({ message: 'Profile updated successfully', admin });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}