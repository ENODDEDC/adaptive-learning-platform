// Input validation and sanitization utilities

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) return false;

  // Additional checks
  if (email.length > 254) return false; // Max email length
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) return false; // Max local part length

  return true;
}

/**
 * Sanitize string input (prevent XSS)
 * @param {string} input
 * @returns {string}
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize general input (alias for sanitizeString for backward compatibility)
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  return sanitizeString(input);
}

/**
 * Validate name fields
 * @param {string} name
 * @param {string} fieldName
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 1) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmedName.length > 50) {
    return { valid: false, error: `${fieldName} must not exceed 50 characters` };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true, sanitized: sanitizeString(trimmedName) };
}

/**
 * Validate OTP format
 * @param {string} otp
 * @returns {boolean}
 */
export function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') return false;
  return /^\d{6}$/.test(otp); // Exactly 6 digits
}

/**
 * Get client IP address from request
 * @param {Request} request
 * @returns {string}
 */
export function getClientIP(request) {
  // Check various headers for IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to connection IP (may not be available in all environments)
  return request.ip || 'unknown';
}

/**
 * Validate and sanitize registration data
 * @param {Object} data
 * @returns {Object} - { valid: boolean, errors: string[], sanitized: Object }
 */
export function validateRegistrationData(data) {
  const errors = [];
  const sanitized = {};

  // Validate name
  const nameValidation = validateName(data.name, 'First name');
  if (!nameValidation.valid) {
    errors.push(nameValidation.error);
  } else {
    sanitized.name = nameValidation.sanitized;
  }

  // Validate surname
  const surnameValidation = validateName(data.surname, 'Surname');
  if (!surnameValidation.valid) {
    errors.push(surnameValidation.error);
  } else {
    sanitized.surname = surnameValidation.sanitized;
  }

  // Validate optional middle name
  if (data.middleName) {
    const middleNameValidation = validateName(data.middleName, 'Middle name');
    if (!middleNameValidation.valid) {
      errors.push(middleNameValidation.error);
    } else {
      sanitized.middleName = middleNameValidation.sanitized;
    }
  }

  // Validate optional suffix
  if (data.suffix) {
    const suffix = sanitizeString(data.suffix);
    if (suffix.length > 10) {
      errors.push('Suffix must not exceed 10 characters');
    } else {
      sanitized.suffix = suffix;
    }
  }

  // Validate email
  if (!validateEmail(data.email)) {
    errors.push('Invalid email address');
  } else {
    sanitized.email = data.email.toLowerCase().trim();
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
