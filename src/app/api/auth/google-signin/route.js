import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { validateEmail, sanitizeInput, getClientIP } from '@/utils/inputValidator';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';

export async function POST(req) {
  try {
    await connectMongoDB();

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting (using login type since this is a sign-in endpoint)
    const rateLimit = checkRateLimit(clientIP, 'login');
    if (!rateLimit.allowed) {
      console.log('⚠️ Rate limit exceeded for IP:', clientIP);
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const body = await req.json();
    
    // Validate request structure
    if (!body || !body.firebaseUser) {
      console.log('❌ Invalid request structure');
      return NextResponse.json({ 
        success: false,
        message: 'Invalid request format. Please try signing in again.' 
      }, { status: 400 });
    }

    const { firebaseUser } = body;
    const { uid, email, displayName, photoURL } = firebaseUser;

    // Validate required Google data
    if (!uid || !email) {
      console.log('❌ Missing required Google authentication data');
      return NextResponse.json({ 
        success: false,
        message: 'Google authentication data is incomplete. Please try again.' 
      }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log('❌ Invalid email format from Google:', email);
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email format. Please try signing in again.' 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedDisplayName = displayName ? sanitizeInput(displayName) : '';
    const sanitizedUid = sanitizeInput(uid);

    // Check if user exists in MongoDB
    let user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      // User doesn't exist - return flag to redirect to registration completion
      console.log('🔄 New Google user detected, requires registration:', sanitizedEmail);
      
      return NextResponse.json({
        success: true,
        requiresRegistration: true,
        tempData: {
          email: sanitizedEmail,
          googleId: sanitizedUid,
          photoURL: photoURL || '',
          displayName: sanitizedDisplayName
        }
      }, { status: 200 });
    }

    // User exists - proceed with normal login flow
    console.log('✅ Existing Google user logging in:', sanitizedEmail);

    // Update existing user with Google data if needed
    if (!user.googleId) {
      user.googleId = sanitizedUid;
      user.photoURL = photoURL;
      user.authProvider = user.authProvider || 'google';
      user.isVerified = true;
      await user.save();
      console.log('✅ Existing user updated with Google data:', sanitizedEmail);
    }

    // Generate JWT token for your app
    const token = jwt.sign(
      { 
        userId: user._id,
        id: user._id, // Keep for backward compatibility
        email: user.email,
        role: user.role, // Add role to JWT
        provider: 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      requiresRegistration: false,
      message: 'Google sign-in successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        provider: 'google'
      },
      token: token // Include token in response for client-side storage
    }, { status: 200 });

    cookies().set('token', token, {
      httpOnly: false, // Make accessible for drag and drop functionality
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'Lax',
    });

    return response;

  } catch (error) {
    console.error('❌ Google Sign-In Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return NextResponse.json({ 
        success: false,
        message: 'Database connection error. Please try again in a moment.' 
      }, { status: 503 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ 
        success: false,
        message: 'Authentication error. Please try signing in again.' 
      }, { status: 401 });
    }

    // Generic error response
    return NextResponse.json({ 
      success: false,
      message: 'An error occurred during sign-in. Please try again.' 
    }, { status: 500 });
  }
}