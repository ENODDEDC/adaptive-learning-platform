/**
 * File Upload Size Limits Configuration
 * 
 * These limits are designed for Backblaze B2 Free Tier:
 * - 10 GB total storage
 * - 1 GB/day download bandwidth
 * - Unlimited uploads
 * 
 * Strategy: Conservative limits to maximize file count within 10GB
 */

// File size limits by MIME type (in bytes)
export const FILE_SIZE_LIMITS = {
  // Documents
  'application/pdf': 5 * 1024 * 1024,                                                    // 5 MB
  'application/msword': 3 * 1024 * 1024,                                                 // 3 MB (DOC)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 3 * 1024 * 1024, // 3 MB (DOCX)
  'application/vnd.ms-powerpoint': 10 * 1024 * 1024,                                     // 10 MB (PPT)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 10 * 1024 * 1024, // 10 MB (PPTX)
  'application/vnd.ms-excel': 5 * 1024 * 1024,                                           // 5 MB (XLS)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 5 * 1024 * 1024, // 5 MB (XLSX)
  
  // Images
  'image/jpeg': 2 * 1024 * 1024,                                                         // 2 MB
  'image/jpg': 2 * 1024 * 1024,                                                          // 2 MB
  'image/png': 2 * 1024 * 1024,                                                          // 2 MB
  'image/gif': 2 * 1024 * 1024,                                                          // 2 MB
  'image/webp': 2 * 1024 * 1024,                                                         // 2 MB
  'image/svg+xml': 1 * 1024 * 1024,                                                      // 1 MB
  
  // Audio
  'audio/mpeg': 10 * 1024 * 1024,                                                        // 10 MB (MP3)
  'audio/wav': 10 * 1024 * 1024,                                                         // 10 MB
  'audio/ogg': 10 * 1024 * 1024,                                                         // 10 MB
  'audio/aac': 10 * 1024 * 1024,                                                         // 10 MB
  
  // Compressed files
  'application/zip': 15 * 1024 * 1024,                                                   // 15 MB
  'application/x-zip-compressed': 15 * 1024 * 1024,                                      // 15 MB
  'application/x-rar-compressed': 15 * 1024 * 1024,                                      // 15 MB
  
  // Text files
  'text/plain': 1 * 1024 * 1024,                                                         // 1 MB
  'text/markdown': 1 * 1024 * 1024,                                                      // 1 MB
  
  // Default for unknown types
  'default': 5 * 1024 * 1024,                                                            // 5 MB
};

// User storage quotas (in bytes)
export const USER_STORAGE_QUOTAS = {
  student: 50 * 1024 * 1024,      // 50 MB per student
  teacher: 500 * 1024 * 1024,     // 500 MB per teacher
  admin: 1024 * 1024 * 1024,      // 1 GB per admin
};

// System-wide limits
export const SYSTEM_LIMITS = {
  totalStorage: 9 * 1024 * 1024 * 1024,  // 9 GB (leave 1 GB buffer from 10 GB free tier)
  maxFilesPerUpload: 10,                  // Maximum files in a single upload request
};

/**
 * Get file size limit for a given MIME type
 * @param {string} mimeType - The MIME type of the file
 * @returns {number} Size limit in bytes
 */
export function getFileSizeLimit(mimeType) {
  return FILE_SIZE_LIMITS[mimeType] || FILE_SIZE_LIMITS['default'];
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

/**
 * Validate file size against limits
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string, limit?: string}}
 */
export function validateFileSize(file) {
  const limit = getFileSizeLimit(file.type);
  
  if (file.size > limit) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the ${formatFileSize(limit)} limit for ${file.type || 'this file type'}`,
      limit: formatFileSize(limit),
    };
  }
  
  return { valid: true };
}

/**
 * Get user-friendly file type label
 * @param {string} mimeType - The MIME type
 * @returns {string} User-friendly label
 */
export function getFileTypeLabel(mimeType) {
  const labels = {
    'application/pdf': 'PDF',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'Image',
    'image/jpg': 'Image',
    'image/png': 'Image',
    'image/gif': 'Image',
    'audio/mpeg': 'Audio',
    'audio/wav': 'Audio',
    'application/zip': 'ZIP Archive',
    'text/plain': 'Text File',
  };
  
  return labels[mimeType] || 'File';
}
