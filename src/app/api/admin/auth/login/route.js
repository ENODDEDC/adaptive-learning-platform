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

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'login');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    // Check account lockout
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const minutes = Math.ceil(lockStatus.remainingTime / 60);
      return NextResponse.json({
        message: `Account is temporarily locked. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        lockedUntil: lockStatus.lockoutTime,
        remainingTime: lockStatus.remainingTime,
      }, { status: 423 });
    }

    // Use constant-time lookup
    const user = await User.findOne({ email }).select('+password');

    let isValidUser = false;
    let isValidPassword = false;
    let isAdmin = false;

    if (user) {
      isValidUser = true;
      isValidPassword = await bcrypt.compare(password, user.password);
      isAdmin = user.role === 'admin' || user.role === 'super admin';
    } else {
      // Dummy bcrypt to maintain constant time
      await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattack1234567890');
    }

    // Check credentials and admin role
    if (!isValidUser || !isValidPassword || !isAdmin) {
      // Record failed attempt
      const failedStatus = await recordFailedAttempt(email);
      
      // Check if account just got locked
      if (failedStatus.locked) {
        const minutes = Math.ceil(failedStatus.remainingTime / 60);
        return NextResponse.json({
          message: `Account is temporarily locked. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          lockedUntil: failedStatus.lockoutTime,
          remainingTime: Math.ceil((failedStatus.lockoutTime - new Date()) / 1000),
        }, { status: 423 });
      }
      
      let message = 'Invalid credentials or not an admin';
      if (failedStatus.remainingAttempts > 0 && failedStatus.remainingAttempts <= 3) {
        message = `Invalid credentials. ${failedStatus.remainingAttempts} attempt(s) remaining.`;
      }

      return NextResponse.json({ message }, { status: 401 });
    }

    // Reset failed attempts on successful login
    resetFailedAttempts(email);
    resetRateLimit(clientIP, 'login');

    // Update login history
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    user.lastLoginAt = new Date();
    user.lastLoginIP = clientIP;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

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

    const token = jwt.sign({ 
      userId: user._id.toString(),
      role: user.role,
    }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const response = NextResponse.json({
      message: 'Admin login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 });

    cookies().set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });

    console.log('✅ Admin login successful for:', email);

    return response;
  } catch (error) {
    console.error('Admin login error:', error.message);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}