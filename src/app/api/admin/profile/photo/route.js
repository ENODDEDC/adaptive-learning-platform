import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebaseConfig'; // Ensure this is correctly imported

// Initialize Firebase if not already initialized
let firebaseApp;
if (!initializeApp.length) { // Check if any app is already initialized
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = initializeApp(firebaseConfig, "secondary"); // Initialize a secondary app
}

const storage = getStorage(firebaseApp);

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

export async function POST(req) {
  await connectMongoDB();
  const adminId = verifyAdminToken(req);
  if (!adminId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

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