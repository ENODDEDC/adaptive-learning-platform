// Secure OTP generation and validation
import crypto from 'crypto';

/**
 * Generate cryptographically secure OTP
 * @param {number} length - OTP length (default: 6)
 * @returns {string}
 */
export function generateSecureOTP(length = 6) {
  // Use crypto.randomInt for cryptographically secure random numbers
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Generate secure reset token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string}
 */
export function generateResetToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash token for storage
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate CSRF token
 * @returns {string}
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}
