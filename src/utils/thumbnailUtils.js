/**
 * Utility functions for handling thumbnail URLs
 */

/**
 * Normalize thumbnail URL to work with current domain
 * @param {string} thumbnailUrl - The thumbnail URL (relative or absolute)
 * @returns {string} - Properly formatted absolute URL for current domain
 */
export function normalizeThumbnailUrl(thumbnailUrl) {
  if (!thumbnailUrl) return '';
  
  // If already absolute and from current domain, use as-is
  if (thumbnailUrl.startsWith('http')) {
    const currentDomain = window.location.origin;
    const urlDomain = new URL(thumbnailUrl).origin;
    
    // If from current domain, use as-is
    if (urlDomain === currentDomain) {
      return thumbnailUrl;
    }
    
    // If from different domain, extract path and use current domain
    try {
      const urlPath = new URL(thumbnailUrl).pathname;
      return `${currentDomain}${urlPath}`;
    } catch (e) {
      console.warn('Failed to parse thumbnail URL:', thumbnailUrl);
      return '';
    }
  }
  
  // If relative, make absolute with current domain
  const path = thumbnailUrl.startsWith('/') ? thumbnailUrl : '/' + thumbnailUrl;
  return `${window.location.origin}${path}`;
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