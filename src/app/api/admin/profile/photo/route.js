import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyAdmin } from '@/utils/auth';
import backblazeService from '@/services/backblazeService';

export async function POST(req) {
  try {
    console.log('📸 Admin profile picture upload request received');
    
    await connectMongoDB();
    console.log('✅ MongoDB connected');
    
    const adminInfo = await verifyAdmin(req);
    console.log('🔐 Admin verified:', adminInfo ? 'Yes' : 'No');

    if (!adminInfo) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const adminId = adminInfo.userId;
    console.log('👤 Admin ID:', adminId);
    
    const formData = await req.formData();
    const file = formData.get('profilePicture');
    console.log('📁 File received:', file ? `Yes (${file.size} bytes, ${file.type})` : 'No');

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('📦 Buffer created:', buffer.length, 'bytes');

    // Upload to Backblaze
    const fileName = `admin-${adminId}-${Date.now()}.jpg`;
    console.log('☁️ Uploading to Backblaze:', fileName);
    
    const uploadResult = await backblazeService.uploadFile(buffer, fileName, file.type || 'image/jpeg', 'profile-pictures');
    console.log('✅ Upload successful:', uploadResult.url);

    // Update admin profile with new image URL
    console.log('💾 Updating admin profile in database...');
    const admin = await User.findByIdAndUpdate(
      adminId,
      { photoURL: uploadResult.url },
      { new: true, select: '-password' }
    );

    if (!admin) {
      console.error('❌ Admin not found:', adminId);
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    console.log('✅ Admin profile picture updated successfully');
    console.log('🖼️ New image URL:', uploadResult.url);

    return NextResponse.json({ 
      message: 'Profile picture updated successfully',
      photoURL: uploadResult.url,
      admin: {
        name: admin.name,
        surname: admin.surname,
        email: admin.email,
        photoURL: admin.photoURL
      }
    });
  } catch (error) {
    console.error('❌ Error uploading admin profile picture:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      message: error.message || 'Server error',
      error: error.toString()
    }, { status: 500 });
  }
}