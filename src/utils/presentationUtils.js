// Utility functions for PowerPoint presentation handling

/**
 * Extract slide information from HTML content
 * @param {string} htmlContent - The HTML content from LibreOffice conversion
 * @returns {Object} - Object containing slides array and metadata
 */
export function extractSlideInfo(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const presentationContainer = tempDiv.querySelector('.presentation-container');
  if (!presentationContainer) {
    return { slides: [], totalSlides: 0, metadata: {} };
  }

  const slides = Array.from(presentationContainer.querySelectorAll('.slide'));
  const totalSlides = slides.length;

  const processedSlides = slides.map((slide, index) => {
    const title = slide.querySelector('h1, h2, h3')?.textContent || `Slide ${index + 1}`;
    const content = slide.innerHTML;
    const hasImages = slide.querySelector('img') !== null;
    const hasLists = slide.querySelector('ul, ol') !== null;
    const hasTables = slide.querySelector('table') !== null;

    return {
      index: index + 1,
      title: title.trim(),
      content,
      hasImages,
      hasLists,
      hasTables,
      wordCount: slide.textContent.split(/\s+/).length,
      elementCount: slide.children.length
    };
  });

  // Extract metadata
  const metadata = {
    totalSlides,
    hasImages: processedSlides.some(slide => slide.hasImages),
    hasLists: processedSlides.some(slide => slide.hasLists),
    hasTables: processedSlides.some(slide => slide.hasTables),
    averageWordCount: Math.round(
      processedSlides.reduce((sum, slide) => sum + slide.wordCount, 0) / totalSlides
    ),
    created: new Date().toISOString()
  };

  return {
    slides: processedSlides,
    totalSlides,
    metadata
  };
}

/**
 * Generate slide thumbnails for navigation
 * @param {Array} slides - Array of slide objects
 * @returns {Array} - Array of thumbnail objects
 */
export function generateSlideThumbnails(slides) {
  return slides.map((slide, index) => ({
    index: slide.index,
    title: slide.title,
    preview: slide.content.substring(0, 150) + '...',
    hasImages: slide.hasImages,
    hasLists: slide.hasLists,
    hasTables: slide.hasTables,
    wordCount: slide.wordCount
  }));
}

/**
 * Create a slide navigation component
 * @param {Array} slides - Array of slide objects
 * @param {number} currentSlide - Current slide index
 * @param {Function} onSlideChange - Callback for slide changes
 * @returns {Object} - Navigation component props
 */
export function createSlideNavigation(slides, currentSlide, onSlideChange) {
  const currentIndex = currentSlide - 1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < slides.length - 1;

  return {
    currentSlide,
    totalSlides: slides.length,
    hasPrevious,
    hasNext,
    onPrevious: () => hasPrevious && onSlideChange(currentSlide - 1),
    onNext: () => hasNext && onSlideChange(currentSlide + 1),
    onGoToSlide: (slideNumber) => {
      if (slideNumber >= 1 && slideNumber <= slides.length) {
        onSlideChange(slideNumber);
      }
    }
  };
}

/**
 * Format presentation duration based on slide count
 * @param {number} slideCount - Number of slides
 * @param {number} secondsPerSlide - Seconds per slide (default: 5)
 * @returns {string} - Formatted duration string
 */
export function formatPresentationDuration(slideCount, secondsPerSlide = 5) {
  const totalSeconds = slideCount * secondsPerSlide;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Validate PowerPoint file before conversion
 * @param {Object} file - File object
 * @returns {Object} - Validation result
 */
export function validatePowerPointFile(file) {
  const errors = [];
  const warnings = [];

  // Check file type
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  
  if (!validMimeTypes.includes(file.mimeType)) {
    errors.push('Invalid file type. Only PowerPoint files (.pptx, .ppt) are supported.');
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.fileSize && file.fileSize > maxSize) {
    errors.push('File size too large. Maximum size is 50MB.');
  }

  // Check file name
  if (!file.originalName || !file.originalName.match(/\.(pptx?|ppt)$/i)) {
    warnings.push('File extension may not be correct for PowerPoint format.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate presentation statistics
 * @param {Array} slides - Array of slide objects
 * @returns {Object} - Statistics object
 */
export function generatePresentationStats(slides) {
  const totalSlides = slides.length;
  const totalWords = slides.reduce((sum, slide) => sum + slide.wordCount, 0);
  const slidesWithImages = slides.filter(slide => slide.hasImages).length;
  const slidesWithLists = slides.filter(slide => slide.hasLists).length;
  const slidesWithTables = slides.filter(slide => slide.hasTables).length;

  return {
    totalSlides,
    totalWords,
    averageWordsPerSlide: Math.round(totalWords / totalSlides),
    slidesWithImages,
    slidesWithLists,
    slidesWithTables,
    imagePercentage: Math.round((slidesWithImages / totalSlides) * 100),
    listPercentage: Math.round((slidesWithLists / totalSlides) * 100),
    tablePercentage: Math.round((slidesWithTables / totalSlides) * 100),
    estimatedDuration: formatPresentationDuration(totalSlides)
  };
}

/**
 * Create keyboard shortcuts help text
 * @returns {Array} - Array of shortcut descriptions
 */
export function getKeyboardShortcuts() {
  return [
    { key: '← / ↑', description: 'Previous slide' },
    { key: '→ / ↓', description: 'Next slide' },
    { key: 'Space', description: 'Play/Pause presentation' },
    { key: 'F', description: 'Toggle fullscreen' },
    { key: 'Esc', description: 'Exit fullscreen or close viewer' },
    { key: 'M', description: 'Toggle mute' },
    { key: 'T', description: 'Toggle thumbnails' }
  ];
}

/**
 * Generate CSS styles for presentation
 * @returns {string} - CSS styles
 */
export function getPresentationStyles() {
  return `
    .presentation-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
    }
    
    .slide {
      min-height: 100vh;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      position: relative;
    }
    
    .slide h1, .slide h2, .slide h3 {
      margin-bottom: 1rem;
      font-weight: bold;
    }
    
    .slide h1 {
      font-size: 3rem;
      margin-bottom: 2rem;
    }
    
    .slide h2 {
      font-size: 2.5rem;
    }
    
    .slide h3 {
      font-size: 2rem;
    }
    
    .slide p {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      max-width: 800px;
    }
    
    .slide ul, .slide ol {
      text-align: left;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .slide li {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    
    .slide img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .slide table {
      width: 100%;
      max-width: 800px;
      border-collapse: collapse;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .slide th, .slide td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .slide th {
      background: rgba(255, 255, 255, 0.2);
      font-weight: bold;
    }
    
    .slide-content {
      width: 100%;
      max-width: 1200px;
    }
    
    @media (max-width: 768px) {
      .slide {
        padding: 1rem;
      }
      
      .slide h1 {
        font-size: 2rem;
      }
      
      .slide h2 {
        font-size: 1.8rem;
      }
      
      .slide h3 {
        font-size: 1.5rem;
      }
      
      .slide p {
        font-size: 1rem;
      }
    }
  `;
}
