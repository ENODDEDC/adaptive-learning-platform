import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAdminToken } from '@/utils/auth';

export async function PUT(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdminToken();
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

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