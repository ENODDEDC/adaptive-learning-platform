// Account lockout mechanism for failed login attempts
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';

// In-memory store for failed attempts (use Redis in production)
const failedAttempts = new Map();

const LOCKOUT_CONFIG = {
  maxAttempts: 5, // Lock after 5 failed attempts
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  attemptWindow: 15 * 60 * 1000, // 15 minutes window
};

/**
 * Record failed login attempt
 * @param {string} email
 * @returns {Object} - { locked: boolean, remainingAttempts: number, lockoutTime: Date }
 */
export async function recordFailedAttempt(email) {
  const key = email.toLowerCase();
  const now = Date.now();

  let attempts = failedAttempts.get(key);

  if (!attempts || now > attempts.windowEnd) {
    // Start new attempt window
    attempts = {
      count: 1,
      windowStart: now,
      windowEnd: now + LOCKOUT_CONFIG.attemptWindow,
      lockedUntil: null,
    };
  } else {
    attempts.count++;
  }

  // Check if account should be locked
  if (attempts.count >= LOCKOUT_CONFIG.maxAttempts) {
    attempts.lockedUntil = now + LOCKOUT_CONFIG.lockoutDuration;
  }

  failedAttempts.set(key, attempts);

  return {
    locked: attempts.lockedUntil && now < attempts.lockedUntil,
    remainingAttempts: Math.max(0, LOCKOUT_CONFIG.maxAttempts - attempts.count),
    lockoutTime: attempts.lockedUntil ? new Date(attempts.lockedUntil) : null,
    attemptsCount: attempts.count,
  };
}

/**
 * Check if account is locked
 * @param {string} email
 * @returns {Object} - { locked: boolean, lockoutTime: Date, remainingTime: number }
 */
export function isAccountLocked(email) {
  const key = email.toLowerCase();
  const now = Date.now();
  const attempts = failedAttempts.get(key);

  if (!attempts || !attempts.lockedUntil) {
    return { locked: false, lockoutTime: null, remainingTime: 0 };
  }

  if (now >= attempts.lockedUntil) {
    // Lockout expired, clear attempts
    failedAttempts.delete(key);
    return { locked: false, lockoutTime: null, remainingTime: 0 };
  }

  const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000); // seconds

  return {
    locked: true,
    lockoutTime: new Date(attempts.lockedUntil),
    remainingTime,
  };
}

/**
 * Reset failed attempts (after successful login)
 * @param {string} email
 */
export function resetFailedAttempts(email) {
  const key = email.toLowerCase();
  failedAttempts.delete(key);
}

/**
 * Get remaining attempts before lockout
 * @param {string} email
 * @returns {number}
 */
export function getRemainingAttempts(email) {
  const key = email.toLowerCase();
  const attempts = failedAttempts.get(key);

  if (!attempts) {
    return LOCKOUT_CONFIG.maxAttempts;
  }

  return Math.max(0, LOCKOUT_CONFIG.maxAttempts - attempts.count);
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredLockouts() {
  const now = Date.now();
  for (const [key, attempts] of failedAttempts.entries()) {
    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
      failedAttempts.delete(key);
    } else if (now > attempts.windowEnd && !attempts.lockedUntil) {
      failedAttempts.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredLockouts, 5 * 60 * 1000);
