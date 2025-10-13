import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebaseConfig'; // Ensure this is correctly imported
import { verifyAdmin } from '@/utils/auth';

// Initialize Firebase if not already initialized
let firebaseApp;
if (!initializeApp.length) { // Check if any app is already initialized
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = initializeApp(firebaseConfig, "secondary"); // Initialize a secondary app
}

const storage = getStorage(firebaseApp);

export async function POST(req) {
  await connectMongoDB();
  const adminInfo = await verifyAdmin(req);
  if (!adminInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const adminId = adminInfo.userId;

  try {
    const formData = await req.formData();
    const file = formData.get('profilePicture');

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profile-pictures/${adminId}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, buffer, { contentType: file.type });
    const photoURL = await getDownloadURL(storageRef);

    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    admin.photoURL = photoURL;
    await admin.save();

    return NextResponse.json({ message: 'Profile picture updated successfully', photoURL });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}