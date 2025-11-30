import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyAdmin } from '@/utils/auth';

export async function GET(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdmin(req);

  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = await User.findById(adminInfo.userId, '-password');
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
  const adminInfo = await verifyAdmin(req);

  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, surname, email, photoURL } = await req.json();

  if (!name || !surname || !email) {
    return NextResponse.json({ message: 'Name, surname, and email are required' }, { status: 400 });
  }

  try {
    const admin = await User.findById(adminInfo.userId);
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    admin.name = name;
    admin.surname = surname;
    admin.email = email;
    if (photoURL !== undefined) {
      admin.photoURL = photoURL;
    }
    await admin.save();

    const { password, ...adminData } = admin.toObject();
    return NextResponse.json({ message: 'Profile updated successfully', admin: adminData });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}