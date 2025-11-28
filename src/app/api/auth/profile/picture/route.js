import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';
import backblazeService from '@/services/backblazeService';

export async function POST(req) {
  try {
    console.log('📸 Profile picture upload request received');
    
    await connectMongoDB();
    console.log('✅ MongoDB connected');
    
    const payload = await verifyToken();
    console.log('🔐 Token verified:', payload ? 'Yes' : 'No');

    if (!payload) {
      return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
    }

    const { userId } = payload;
    console.log('👤 User ID:', userId);
    
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
    const fileName = `${userId}-${Date.now()}.jpg`;
    console.log('☁️ Uploading to Backblaze:', fileName);
    
    const uploadResult = await backblazeService.uploadFile(buffer, fileName, file.type || 'image/jpeg', 'profile-pictures');
    console.log('✅ Upload successful:', uploadResult.url);

    // Update user profile with new image URL
    console.log('💾 Updating user profile in database...');
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true, select: '-password' }
    );

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('✅ Profile picture updated successfully');
    console.log('🖼️ New image URL:', uploadResult.url);

    return NextResponse.json({ 
      message: 'Profile picture updated successfully',
      imageUrl: uploadResult.url,
      user 
    });
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      message: error.message || 'Server error',
      error: error.toString()
    }, { status: 500 });
  }
}
