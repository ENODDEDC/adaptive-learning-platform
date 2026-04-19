/**
 * Utility functions for handling thumbnail and file URLs
 */

/**
 * Normalize any URL to work with current domain
 * @param {string} url - The URL (relative or absolute)
 * @returns {string} - Properly formatted absolute URL for current domain
 */
export function normalizeUrl(url) {
  if (!url) return '';
  
  // If already absolute and from current domain, use as-is
  if (url.startsWith('http')) {
    const currentDomain = window.location.origin;
    const urlDomain = new URL(url).origin;
    
    // If from current domain, use as-is
    if (urlDomain === currentDomain) {
      return url;
    }
    
    // If from different domain, extract path and use current domain
    try {
      const urlPath = new URL(url).pathname;
      return `${currentDomain}${urlPath}`;
    } catch (e) {
      console.warn('Failed to parse URL:', url);
      return '';
    }
  }
  
  // If relative, make absolute with current domain
  const path = url.startsWith('/') ? url : '/' + url;
  return `${window.location.origin}${path}`;
}

/**
 * Normalize thumbnail URL to work with current domain
 * @param {string} thumbnailUrl - The thumbnail URL (relative or absolute)
 * @returns {string} - Properly formatted absolute URL for current domain
 */
export function normalizeThumbnailUrl(thumbnailUrl) {
  return normalizeUrl(thumbnailUrl);
}

/**
 * Get the best file URL from attachment object
 * @param {object} attachment - The attachment object
 * @returns {string} - Normalized file URL
 */
export function getAttachmentFileUrl(attachment) {
  if (!attachment) return '';
  
  // Priority: cloudStorage.url > url > filePath
  const rawUrl = attachment.cloudStorage?.url || attachment.url || attachment.filePath;
  return normalizeUrl(rawUrl);
}

/**
 * Get iframe src URL for PDF thumbnail with viewer parameters
 * @param {string} thumbnailUrl - The thumbnail URL
 * @returns {string} - Complete iframe src URL with PDF viewer parameters
 */
export function getThumbnailIframeSrc(thumbnailUrl) {
  const normalizedUrl = normalizeThumbnailUrl(thumbnailUrl);
  if (!normalizedUrl) return '';
  
  const pdfParams = '#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true';
  return `${normalizedUrl}${pdfParams}`;
}