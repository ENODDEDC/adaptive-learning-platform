import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, resetRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateEmail, getClientIP } from '@/utils/inputValidator';
import { isAccountLocked, recordFailedAttempt, resetFailedAttempts } from '@/utils/accountLockout';

export async function POST(req) {
  let email = '';
  
  try {
    await connectMongoDB();

    const body = await req.json();
    email = body.email?.toLowerCase().trim();
    const password = body.password;

    // Input validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Get client IP for rate limiting and logging
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'login');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    // Check account lockout
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      return NextResponse.json({
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(lockStatus.remainingTime / 60)} minutes.`,
        lockedUntil: lockStatus.lockoutTime,
      }, { status: 423 }); // 423 Locked
    }

    // Use constant-time lookup to prevent timing attacks
    const user = await User.findOne({ email }).select('+password');

    // Constant-time response for invalid credentials
    let isValidUser = false;
    let isValidPassword = false;

    if (user) {
      isValidUser = true;
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Perform dummy bcrypt to maintain constant time
      await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattack1234567890');
    }

    // Check credentials
    if (!isValidUser || !isValidPassword) {
      // Record failed attempt
      const failedStatus = await recordFailedAttempt(email);
      
      let message = 'Invalid credentials';
      if (failedStatus.remainingAttempts > 0 && failedStatus.remainingAttempts <= 3) {
        message = `Invalid credentials. ${failedStatus.remainingAttempts} attempt(s) remaining before account lockout.`;
      } else if (failedStatus.locked) {
        message = 'Account locked due to multiple failed attempts. Please try again later.';
      }

      return NextResponse.json({ message }, { status: 401 });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json({ message: 'Please verify your email first' }, { status: 401 });
    }

    // Reset failed attempts and rate limit on successful login
    resetFailedAttempts(email);
    resetRateLimit(clientIP, 'login');

    // Update login history
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    user.lastLoginAt = new Date();
    user.lastLoginIP = clientIP;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    // Keep only last 10 login history entries
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.unshift({
      ip: clientIP,
      userAgent,
      timestamp: new Date(),
      success: true,
    });
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10);
    }

    await user.save();

    // Create JWT with minimal data
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role,
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    }, { status: 200 });

    // Set secure httpOnly cookie
    cookies().set('token', token, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict', // Prevent CSRF attacks
    });

    console.log('✅ Login successful for:', email);

    return response;
  } catch (error) {
    console.error('Login Error:', error.message);
    // Don't expose internal errors to client
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}