import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validateEmail, sanitizeInput, getClientIP } from '@/utils/inputValidator';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import ActivityLogger from '@/utils/activityLogger';

export async function POST(req) {
  let email = '';
  
  try {
    await connectMongoDB();

    const body = await req.json();
    const { googleData, userData } = body;

    // Validate request structure
    if (!googleData || !userData) {
      console.log('❌ Invalid request structure');
      return NextResponse.json({ 
        success: false,
        message: 'Invalid request format. Please try signing in again.' 
      }, { status: 400 });
    }

    const { email: googleEmail, googleId, photoURL } = googleData;
    const { name, middleName, surname, suffix, role, password } = userData;

    email = googleEmail?.toLowerCase().trim();

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'register');
    if (!rateLimit.allowed) {
      console.log('⚠️ Rate limit exceeded for IP:', clientIP);
      return rateLimitResponse(rateLimit.retryAfter);
    }

    // Validate required fields
    if (!email || !googleId) {
      console.log('❌ Missing Google authentication data');
      return NextResponse.json({ 
        success: false,
        message: 'Google authentication data is missing. Please sign in again.' 
      }, { status: 400 });
    }

    if (!name || !surname) {
      console.log('❌ Missing required name fields');
      return NextResponse.json({ 
        success: false,
        message: 'First name and last name are required.' 
      }, { status: 400 });
    }

    if (!role) {
      console.log('❌ Missing role selection');
      return NextResponse.json({ 
        success: false,
        message: 'Please select your role.' 
      }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email format. Please sign in again.' 
      }, { status: 400 });
    }

    // Security: Validate that email matches Google-provided email
    // This prevents tampering with the request data
    if (email !== googleEmail?.toLowerCase().trim()) {
      console.log('❌ Email mismatch - possible tampering detected');
      return NextResponse.json({ 
        success: false,
        message: 'Authentication data mismatch. Please sign in again.' 
      }, { status: 400 });
    }

    // Force role to be "student" for Google OAuth registrations
    const finalRole = 'student';

    // Validate name fields length
    if (name.length < 2 || name.length > 50) {
      console.log('❌ Invalid first name length:', name.length);
      return NextResponse.json({ 
        success: false,
        message: 'First name must be between 2 and 50 characters.' 
      }, { status: 400 });
    }

    if (surname.length < 2 || surname.length > 50) {
      console.log('❌ Invalid last name length:', surname.length);
      return NextResponse.json({ 
        success: false,
        message: 'Last name must be between 2 and 50 characters.' 
      }, { status: 400 });
    }

    if (middleName && middleName.length > 50) {
      console.log('❌ Middle name too long:', middleName.length);
      return NextResponse.json({ 
        success: false,
        message: 'Middle name must not exceed 50 characters.' 
      }, { status: 400 });
    }

    if (suffix && suffix.length > 10) {
      console.log('❌ Suffix too long:', suffix.length);
      return NextResponse.json({ 
        success: false,
        message: 'Suffix must not exceed 10 characters.' 
      }, { status: 400 });
    }

    // Validate password
    if (!password) {
      console.log('❌ Missing password');
      return NextResponse.json({ 
        success: false,
        message: 'Password is required.' 
      }, { status: 400 });
    }

    if (password.length < 8) {
      console.log('❌ Password too short:', password.length);
      return NextResponse.json({ 
        success: false,
        message: 'Password must be at least 8 characters long.' 
      }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      console.log('❌ Password missing uppercase letter');
      return NextResponse.json({ 
        success: false,
        message: 'Password must contain at least one uppercase letter.' 
      }, { status: 400 });
    }

    if (!/[a-z]/.test(password)) {
      console.log('❌ Password missing lowercase letter');
      return NextResponse.json({ 
        success: false,
        message: 'Password must contain at least one lowercase letter.' 
      }, { status: 400 });
    }

    if (!/[0-9]/.test(password)) {
      console.log('❌ Password missing number');
      return NextResponse.json({ 
        success: false,
        message: 'Password must contain at least one number.' 
      }, { status: 400 });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      console.log('❌ Password missing special character');
      return NextResponse.json({ 
        success: false,
        message: 'Password must contain at least one special character.' 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedMiddleName = middleName ? sanitizeInput(middleName) : '';
    const sanitizedSurname = sanitizeInput(surname);
    const sanitizedSuffix = suffix ? sanitizeInput(suffix) : '';

    // Check for duplicate email (race condition protection)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ Duplicate email detected during Google registration:', email);
      return NextResponse.json({ 
        success: false,
        message: 'An account with this email already exists. Please try logging in instead.' 
      }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document with Google data and user-provided information
    const newUser = new User({
      name: sanitizedName,
      middleName: sanitizedMiddleName,
      surname: sanitizedSurname,
      suffix: sanitizedSuffix,
      email,
      password: hashedPassword, // Hashed password for dual authentication
      googleId,
      photoURL: photoURL || '',
      isVerified: true, // Google has verified the email
      authProvider: 'google',
      role: finalRole, // Always "student" for Google OAuth
      lastLoginAt: new Date(),
      lastLoginIP: clientIP,
    });

    await newUser.save();

    console.log('✅ Google registration completed for:', email, 'with role:', role);

    // Log the user registration activity
    try {
      await ActivityLogger.logUserRegistration(newUser._id, {
        name: sanitizedName,
        surname: sanitizedSurname,
        email,
        authProvider: 'google'
      });
    } catch (activityError) {
      console.error('Error logging user registration activity:', activityError);
      // Don't fail registration if activity logging fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id.toString(),
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      token, // Include token in response for client-side storage
      user: {
        id: newUser._id,
        name: `${sanitizedName} ${sanitizedSurname}`,
        email: newUser.email,
        photoURL: newUser.photoURL,
        role: newUser.role,
        provider: 'google'
      }
    }, { status: 201 });

    // Set httpOnly cookie
    cookies().set('token', token, {
      httpOnly: false, // Make accessible for drag and drop functionality (matching google-signin pattern)
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'Lax',
    });

    return response;

  } catch (error) {
    console.error('Complete Google Registration Error:', error.message);
    console.error('Stack:', error.stack);

    // Handle MongoDB duplicate key error (race condition)
    if (error.code === 11000) {
      console.log('⚠️ Duplicate key error (race condition):', email);
      return NextResponse.json({ 
        success: false,
        message: 'An account with this email already exists. Please try logging in instead.' 
      }, { status: 409 });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log('❌ Validation error:', error.message);
      return NextResponse.json({ 
        success: false,
        message: 'Invalid data provided. Please check your information and try again.' 
      }, { status: 400 });
    }

    // Don't expose internal errors to client
    return NextResponse.json({ 
      success: false,
      message: 'An error occurred during registration. Please try again.' 
    }, { status: 500 });
  }
}
