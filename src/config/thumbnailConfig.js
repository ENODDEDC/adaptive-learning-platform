/**
 * Thumbnail Configuration
 * Controls when and how thumbnails are generated to optimize cloud storage usage
 */

export const thumbnailConfig = {
  // Enable/disable automatic thumbnail generation
  autoGenerate: false, // Set to false to prevent automatic downloads

  // Only generate thumbnails when user explicitly requests them
  generateOnDemand: true,

  // Cache thumbnails in browser for this duration (milliseconds)
  clientCacheTime: 60 * 60 * 1000, // 1 hour

  // Maximum number of concurrent thumbnail generations
  maxConcurrentGenerations: 3,

  // File size limits for thumbnail generation (bytes)
  maxFileSizeForThumbnail: {
    pdf: 50 * 1024 * 1024,    // 50MB for PDFs
    docx: 25 * 1024 * 1024,   // 25MB for DOCX
    pptx: 100 * 1024 * 1024   // 100MB for PPTX
  },

  // Thumbnail quality settings
  thumbnailQuality: {
    // PDF thumbnail settings
    pdf: {
      pageNumber: 1, // Always use first page
      scale: 0.2,    // 20% scale for preview
    },
    
    // DOCX thumbnail settings  
    docx: {
      pageNumber: 1,
      scale: 0.2,
    },
    
    // PPTX thumbnail settings
    pptx: {
      slideNumber: 1, // Always use first slide
      scale: 0.2,
    }
  },

  // Rate limiting for thumbnail generation
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100
  },

  // Batch processing settings
  batchProcessing: {
    enabled: false, // Disable batch processing to reduce cloud usage
    maxBatchSize: 5,
    delayBetweenBatches: 2000 // 2 seconds
  }
};

/**
 * Check if file is eligible for thumbnail generation
 * @param {Object} file - File object with size and type info
 * @returns {boolean}
 */
export function isEligibleForThumbnail(file) {
  const { fileSize, mimeType, originalName } = file;
  
  // Check file type
  const isPdf = mimeType === 'application/pdf' || originalName?.toLowerCase().endsWith('.pdf');
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName?.toLowerCase().endsWith('.docx');
  const isPptx = mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || originalName?.toLowerCase().endsWith('.pptx');
  
  if (!isPdf && !isDocx && !isPptx) {
    return false;
  }
  
  // Check file size limits
  const limits = thumbnailConfig.maxFileSizeForThumbnail;
  if (isPdf && fileSize > limits.pdf) return false;
  if (isDocx && fileSize > limits.docx) return false;
  if (isPptx && fileSize > limits.pptx) return false;
  
  return true;
}

/**
 * Get thumbnail generation priority
 * @param {Object} file - File object
 * @returns {string} - 'high', 'medium', 'low'
 */
export function getThumbnailPriority(file) {
  const { fileSize } = file;
  
  // Smaller files get higher priority
  if (fileSize < 1024 * 1024) return 'high';      // < 1MB
  if (fileSize < 10 * 1024 * 1024) return 'medium'; // < 10MB
  return 'low'; // >= 10MB
}