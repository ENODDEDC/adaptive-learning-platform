// Rate limiter utility for preventing brute force attacks
import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Configuration for different endpoints
const RATE_LIMIT_CONFIG = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  verifyOtp: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  resetPassword: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  api: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per minute for general API calls
};

/**
 * Rate limiter middleware
 * @param {string} identifier - Unique identifier (email or IP)
 * @param {string} type - Type of endpoint (login, register, etc.)
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: Date }
 */
export function checkRateLimit(identifier, type = 'login') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.login;
  const key = `${type}:${identifier}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstAttempt: now,
    };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: config.maxAttempts - 1, resetTime: new Date(entry.resetTime) };
  }

  // Increment attempt count
  entry.count++;

  if (entry.count > config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(entry.resetTime),
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: new Date(entry.resetTime),
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier, type = 'login') {
  const key = `${type}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 10 minutes
setInterval(cleanupExpiredEntries, 10 * 60 * 1000);

/**
 * Rate limit response helper
 */
export function rateLimitResponse(retryAfter) {
  return NextResponse.json(
    {
      message: 'Too many attempts. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
