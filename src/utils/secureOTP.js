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
 * Hash OTP for secure storage
 * @param {string} otp - Plain OTP
 * @returns {string} - Hashed OTP
 */
export function hashOTP(otp) {
  if (!otp) return null;
  return crypto
    .createHash('sha256')
    .update(otp + process.env.JWT_SECRET) // Add salt
    .digest('hex');
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
  if (!token) return null;
  return crypto
    .createHash('sha256')
    .update(token + process.env.JWT_SECRET) // Add salt
    .digest('hex');
}

/**
 * Hash IP address for privacy-preserving storage
 * @param {string} ip - IP address
 * @returns {string} - Hashed IP (truncated to 16 chars)
 */
export function hashIP(ip) {
  if (!ip) return null;
  return crypto
    .createHash('sha256')
    .update(ip + process.env.JWT_SECRET) // Add salt
    .digest('hex')
    .substring(0, 16); // Truncate for storage efficiency
}

/**
 * Generate CSRF token
 * @returns {string}
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create encryption utility for email addresses
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Get encryption key (lazy-loaded to allow dotenv to load first)
 * @returns {Buffer}
 */
function getEncryptionKey() {
  if (!process.env.ENCRYPTION_KEY) {
    console.error('⚠️ ENCRYPTION_KEY not found in environment');
    throw new Error('Encryption key not configured');
  }
  
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  if (key.length !== 32) {
    console.error('⚠️ ENCRYPTION_KEY must be 32 bytes (64 hex characters), got:', key.length);
    throw new Error('Encryption key not configured');
  }
  
  return key;
}

/**
 * Encrypt email address
 * @param {string} email - Plain email
 * @returns {string} - Format: "iv:authTag:encrypted"
 */
export function encryptEmail(email) {
  if (!email) return null;
  
  const ENCRYPTION_KEY = getEncryptionKey();
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Email encryption error:', error);
    throw new Error('Failed to encrypt email');
  }
}

/**
 * Decrypt email address
 * @param {string} encryptedData - Format: "iv:authTag:encrypted"
 * @returns {string} - Decrypted email
 */
export function decryptEmail(encryptedData) {
  if (!encryptedData) return null;
  
  const ENCRYPTION_KEY = getEncryptionKey();
  
  try {
    const [iv, authTag, encrypted] = encryptedData.split(':');
    
    if (!iv || !authTag || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Email decryption error:', error);
    throw new Error('Failed to decrypt email');
  }
}

/**
 * Create searchable hash for email (deterministic)
 * @param {string} email - Email address
 * @returns {string} - Hex hash for searching
 */
export function hashEmailForSearch(email) {
  if (!email) return null;
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(email.toLowerCase())
    .digest('hex');
}
