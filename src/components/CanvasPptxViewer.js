'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

// Load PowerPoint CSS framework
const loadPowerPointCSS = () => {
  if (typeof document !== 'undefined' && !document.getElementById('powerpoint-css')) {
    const link = document.createElement('link');
    link.id = 'powerpoint-css';
    link.rel = 'stylesheet';
    link.href = '/styles/powerpoint-layout.css';
    document.head.appendChild(link);
  }
};

const CanvasPptxViewer = ({ fileUrl, title }) => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load PowerPoint CSS framework
    loadPowerPointCSS();
    
    if (!fileUrl) return;

    const fetchEnhancedPptxContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const filePath = fileUrl.replace(window.location.origin, '');
        // Use enhanced PPTX processing API
        const response = await fetch(`/api/convert-pptx-enhanced?filePath=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          // Fallback to basic conversion if enhanced fails
          console.log('Enhanced processing failed, falling back to basic conversion...');
          const fallbackResponse = await fetch(`/api/convert-pptx-html5?filePath=${encodeURIComponent(filePath)}`);
          
          if (!fallbackResponse.ok) {
            let errorDetails = `Server error: ${fallbackResponse.statusText}`;
            try {
              const errData = await fallbackResponse.json();
              errorDetails = errData.details || errData.error || errorDetails;
            } catch (jsonError) {
              // Ignore if the error response is not JSON
            }
            throw new Error(errorDetails);
          }
          
          const html = await fallbackResponse.text();
          setSlides([{
            number: 1,
            title: 'Presentation',
            html: wrapWithPowerPointStyles(html),
            enhanced: false
          }]);
          return;
        }
        
        const data = await response.json();
        console.log('🎯 Enhanced API Response received:', data);
        
        if (data.slides && data.slides.length > 0) {
          setSlides(data.slides.map(slide => ({
            ...slide,
            enhanced: true
          })));
        } else {
          throw new Error('No slides found in PowerPoint file');
        }
      } catch (err) {
        console.error('Error fetching enhanced PPTX content:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedPptxContent();
  }, [fileUrl]);

  const wrapWithPowerPointStyles = (html) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PowerPoint Slide</title>
        <link rel="stylesheet" href="/styles/powerpoint-layout.css">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', 'Calibri', system-ui, sans-serif;
            background: #f8f9fb;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .slide-wrapper {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .legacy-content {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 15px rgba(31, 35, 40, 0.1), 0 4px 6px rgba(31, 35, 40, 0.05);
            font-family: 'Segoe UI', 'Calibri', system-ui, sans-serif;
            line-height: 1.6;
            color: #1f2328;
          }
        </style>
      </head>
      <body>
        <div class="slide-wrapper">
          <div class="ppt-presentation-container">
            <div class="ppt-slide ppt-layout-title-content">
              <div class="legacy-content">
                ${html}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Processing PowerPoint...</p>
          <p className="text-sm text-gray-500 mt-2">🎨 Creating authentic PowerPoint layout</p>
          <p className="text-xs text-gray-400 mt-1">Professional typography and visual hierarchy</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50">
        <div className="text-6xl mb-6">📊</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title || 'PowerPoint Presentation'}</h3>
        <p className="text-red-600 mb-6">Error: {error}</p>
        
        <div className="space-y-4 max-w-md">
          <p className="text-gray-500">
            Unable to load this PowerPoint presentation.
          </p>
          
          <div className="flex gap-3 justify-center">
            {fileUrl && (
              <a 
                href={fileUrl} 
                download 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Download File
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No slides found</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold truncate max-w-md text-gray-900 text-lg">
              {title || 'PowerPoint Presentation'}
            </h3>
            <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {currentSlide + 1} of {slides.length}
              {slides[currentSlide]?.enhanced && <span className="ml-2 text-blue-600">✨ Enhanced</span>}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Toggle Fullscreen (F)"
            >
              <ArrowsPointingOutIcon className="w-4 h-4 inline mr-2" />
              Fullscreen
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Display Area - Enhanced PowerPoint Layout */}
      <div className="pt-20 pb-20 h-full bg-gray-50">
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-7xl h-full">
            <iframe
              key={currentSlide}
              srcDoc={currentSlideData.html}
              className="w-full h-full border-0 bg-white rounded-lg shadow-lg"
              title={`${currentSlideData.title} - Slide ${currentSlide + 1}`}
              sandbox="allow-scripts allow-same-origin"
              style={{ 
                aspectRatio: '16/9',
                minHeight: '500px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors text-white"
              title="Previous Slide (←)"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Slide Indicators */}
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors text-white"
              title="Next Slide (→)"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="absolute top-20 right-6 text-gray-600 text-xs bg-white/80 rounded px-2 py-1">
        <div>← → Navigate • F Fullscreen</div>
      </div>
    </div>
  );
};

export default CanvasPptxViewer;