import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await connectMongoDB();

    const { firebaseUser } = await req.json();
    const { uid, email, displayName, photoURL } = firebaseUser;

    // Split displayName into name parts
    const nameParts = displayName ? displayName.split(' ') : ['', ''];
    const name = nameParts[0] || '';
    const surname = nameParts[nameParts.length - 1] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // Check if user exists in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google data
      user = new User({
        name,
        middleName,
        surname,
        suffix: '',
        email,
        password: 'google_auth', // Placeholder since Google users don't have passwords
        isVerified: true, // Google users are pre-verified
        googleId: uid,
        photoURL,
        authProvider: 'google'
      });
      await user.save();
      console.log('✅ New Google user created in MongoDB:', email);
    } else {
      // Update existing user with Google data if needed
      if (!user.googleId) {
        user.googleId = uid;
        user.photoURL = photoURL;
        user.authProvider = user.authProvider || 'google';
        user.isVerified = true;
        await user.save();
        console.log('✅ Existing user updated with Google data:', email);
      }
    }

    // Generate JWT token for your app
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        provider: 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        provider: 'google'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Google Sign-In Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}