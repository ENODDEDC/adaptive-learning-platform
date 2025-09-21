import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ImageBasedPowerPointViewer = ({ content, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(1);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const [useFallback, setUseFallback] = useState(false);

  // Dynamic import for fallback PDFPowerPointViewer
  const PDFPowerPointViewer = dynamic(() => import('./PDFPowerPointViewer'), {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading fallback viewer...</p>
        </div>
      </div>
    )
  });

  // If fallback is triggered, use PDFPowerPointViewer with enhanced scrolling prevention
  if (useFallback) {
    console.log('🔄 Using PDFPowerPointViewer fallback with enhanced scrolling prevention');
    return (
      <PDFPowerPointViewer
        filePath={content?.filePath ? content.filePath.replace(window.location.origin, '') : ''}
        fileName={content?.title || content?.originalName}
        contentId={content?._id}
        onClose={onClose}
        isModal={true}
      />
    );
  }

  // Convert PowerPoint to PDF first, then PDF pages to images
  useEffect(() => {
    const convertPowerPoint = async () => {
      if (!content?.filePath) {
        setError('No file path provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Step 1: Convert PowerPoint to PDF
        console.log('Converting PowerPoint to PDF...');
        const pdfResponse = await fetch(`/api/convert-ppt-to-pdf?filePath=${encodeURIComponent(content.filePath)}`);
        const pdfResult = await pdfResponse.json();

        if (!pdfResult.success) {
          throw new Error(pdfResult.details || 'Failed to convert PowerPoint to PDF');
        }

        console.log('PDF conversion successful:', pdfResult);
        setTotalSlides(pdfResult.pageCount || 1);

        // Step 2: Convert PDF pages to images
        console.log('Converting PDF pages to images...');
        const imagesResponse = await fetch('/api/pdf-to-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfPath: pdfResult.pdfUrl,
            totalPages: pdfResult.pageCount || 1
          })
        });

        const imagesResult = await imagesResponse.json();

        if (!imagesResult.success) {
          throw new Error('Failed to convert PDF pages to images');
        }

        console.log('Images conversion successful:', imagesResult);
        
        // Sort images by page number and extract URLs
        const sortedImages = imagesResult.imageUrls.sort((a, b) => a.page - b.page);
        setImageUrls(sortedImages.map(img => img.imageUrl));
        setTotalSlides(sortedImages.length);
        
        setLoading(false);
      } catch (err) {
        console.error('Error converting PowerPoint:', err);
        console.log('🔄 Image conversion failed, falling back to enhanced PDF viewer');
        
        // Instead of showing error, fallback to PDFPowerPointViewer
        setUseFallback(true);
        setLoading(false);
      }
    };

    convertPowerPoint();
  }, [content]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((slideIndex) => {
    setCurrentSlide(slideIndex);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        default:
          // Handle number keys (1-9) for direct slide navigation
          if (e.key >= '1' && e.key <= '9') {
            const slideNum = parseInt(e.key) - 1;
            if (slideNum < totalSlides) {
              e.preventDefault();
              goToSlide(slideNum);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, totalSlides, onClose]);

  // Handle image load states
  const handleImageLoad = (index) => {
    setLoadingImages(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoadStart = (index) => {
    setLoadingImages(prev => ({ ...prev, [index]: true }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Converting presentation...</p>
          <p className="text-sm text-gray-300 mt-2">Please wait while we prepare your slides</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h3 className="text-white text-xl font-semibold mb-4">Image Conversion Failed</h3>
          <p className="text-gray-300 mb-6">Unable to convert slides to images. Would you like to use the enhanced PDF viewer instead?</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setUseFallback(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use PDF Viewer
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-white text-lg font-semibold truncate">
              {content?.title || 'PowerPoint Presentation'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm">
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Completely scroll-free */}
      <div className="pt-16 pb-20 h-full flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center px-4">
          {imageUrls.length > 0 && (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              {/* Loading indicator for current image */}
              {loadingImages[currentSlide] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Current slide image */}
              <img
                src={imageUrls[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                onLoad={() => handleImageLoad(currentSlide)}
                onLoadStart={() => handleImageLoadStart(currentSlide)}
                style={{ 
                  maxHeight: 'calc(100vh - 140px)',
                  userSelect: 'none',
                  pointerEvents: 'auto' // Allow image interaction but prevent scrolling
                }}
                draggable={false}
              />

              {/* Navigation arrows */}
              {totalSlides > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-20"
                    title="Previous slide (←)"
                    disabled={currentSlide === 0}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-20"
                    title="Next slide (→)"
                    disabled={currentSlide === totalSlides - 1}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
        <div className="p-4">
          {/* Slide Thumbnails/Dots */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center space-x-2 mb-3 overflow-x-auto max-w-full">
              {Array.from({ length: Math.min(totalSlides, 20) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    i === currentSlide 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-500 hover:bg-gray-400'
                  }`}
                  title={`Go to slide ${i + 1}`}
                />
              ))}
              {totalSlides > 20 && (
                <span className="text-gray-400 text-xs ml-2">+{totalSlides - 20} more</span>
              )}
            </div>
          )}
          
          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => goToSlide(0)}
              disabled={currentSlide === 0}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              title="First slide (Home)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous (←)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-white font-medium px-4 py-2 bg-gray-700 rounded">
              {currentSlide + 1} / {totalSlides}
            </span>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Next (→)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => goToSlide(totalSlides - 1)}
              disabled={currentSlide === totalSlides - 1}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Last slide (End)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageBasedPowerPointViewer;