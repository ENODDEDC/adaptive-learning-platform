import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
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

export async function PUT(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: 'New password must be at least 6 characters long' }, { status: 400 });
  }

  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating admin password:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}