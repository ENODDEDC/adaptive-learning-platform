'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

// Import the PowerPoint CSS framework
const loadPowerPointCSS = () => {
  if (typeof document !== 'undefined' && !document.getElementById('powerpoint-css')) {
    const link = document.createElement('link');
    link.id = 'powerpoint-css';
    link.rel = 'stylesheet';
    link.href = '/styles/powerpoint-layout.css';
    document.head.appendChild(link);
  }
};

const EnhancedPptxViewer = ({ fileUrl, title }) => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState('fit'); // fit, width, actual
  const containerRef = useRef(null);
  const slideRef = useRef(null);

  useEffect(() => {
    // Load the PowerPoint CSS framework
    loadPowerPointCSS();
    
    if (!fileUrl) return;

    const fetchEnhancedPptx = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const filePath = fileUrl.replace(window.location.origin, '');
        // Try enhanced first, fallback to original if it fails
        let response = await fetch(`/api/convert-pptx-enhanced?filePath=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          console.log('Enhanced processing failed, falling back to original...');
          response = await fetch(`/api/convert-pptx-html5?filePath=${encodeURIComponent(filePath)}`);
          
          if (response.ok) {
            const html = await response.text();
            // Convert single HTML to slides format with better handling
            setSlides([{
              number: 1,
              html: html,
              enhanced: false
            }]);
            return;
          }
        }
        
        if (!response.ok) {
          let errorDetails = `Server error: ${response.statusText}`;
          try {
            const errData = await response.json();
            errorDetails = errData.details || errData.error || errorDetails;
          } catch (jsonError) {
            // Ignore if the error response is not JSON
          }
          throw new Error(errorDetails);
        }
        
        const data = await response.json();
        if (data.slides && data.slides.length > 0) {
          setSlides(data.slides);
        } else {
          throw new Error('No slides found in PowerPoint file');
        }
      } catch (err) {
        console.error('Error fetching enhanced PPTX:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedPptx();
  }, [fileUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, slides.length]);

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isPlaying && currentSlide < slides.length - 1) {
      interval = setInterval(() => {
        setCurrentSlide(prev => prev + 1);
      }, 5000); // 5 seconds per slide
    } else if (isPlaying && currentSlide === slides.length - 1) {
      setIsPlaying(false); // Stop at the end
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Processing PowerPoint...</p>
          <p className="text-sm text-gray-500 mt-2">🎨 Creating authentic PowerPoint layout</p>
          <p className="text-xs text-gray-400 mt-1">Professional typography and visual hierarchy</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-6">📊</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title || 'PowerPoint Presentation'}</h3>
        <p className="text-red-600 mb-6">Error: {error}</p>
        
        <div className="space-y-4 max-w-md">
          <p className="text-gray-500">
            Unable to process this PowerPoint presentation with enhanced layout engine.
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
      className={`relative w-full h-full bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold truncate max-w-md">{title || 'PowerPoint Presentation'}</h3>
            <span className="text-sm opacity-75">
              {currentSlide + 1} of {slides.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="bg-black/30 border border-white/20 rounded px-2 py-1 text-sm"
            >
              <option value="fit">Fit to Screen</option>
              <option value="width">Fit Width</option>
              <option value="actual">Actual Size</option>
            </select>
            
            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="Toggle Fullscreen (F)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Display */}
      <div className="flex items-center justify-center h-full p-4 pt-20 pb-20">
        <div 
          ref={slideRef}
          className={`relative bg-white shadow-2xl rounded-lg ${
            viewMode === 'fit' ? 'w-full h-full' :
            viewMode === 'width' ? 'w-full' :
            'w-auto h-auto'
          }`}
          style={{
            aspectRatio: viewMode === 'actual' ? 'auto' : '16/9',
            minHeight: viewMode === 'fit' ? '400px' : 'auto',
            maxWidth: viewMode === 'fit' ? '100%' : 'none',
            maxHeight: viewMode === 'fit' ? '100%' : 'none',
            ...(viewMode === 'actual' && { width: '1280px', height: '720px' })
          }}
        >
          {/* Slide Content */}
          {currentSlideData.enhanced ? (
            <div
              className="w-full h-full overflow-hidden rounded-lg"
              dangerouslySetInnerHTML={{ __html: currentSlideData.html }}
            />
          ) : (
            <iframe
              srcDoc={currentSlideData.html}
              className="w-full h-full border-0 rounded-lg"
              title={`Slide ${currentSlide + 1}`}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
          
          {/* Slide Number Overlay */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentSlide + 1}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors text-white"
            title="Previous Slide (←)"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          {/* Slide Thumbnails */}
          <div className="flex gap-2 max-w-md overflow-x-auto scrollbar-hide">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-16 h-10 bg-white/20 hover:bg-white/30 rounded border-2 transition-all ${
                  index === currentSlide ? 'border-blue-400 bg-white/40' : 'border-transparent'
                }`}
                title={`Go to slide ${index + 1}`}
              >
                <div 
                  className="w-full h-full rounded text-xs text-white flex items-center justify-center"
                  style={{ fontSize: '8px' }}
                >
                  {index + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors text-white"
            title="Next Slide (→)"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-white/20 rounded-full h-1">
          <div 
            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute top-20 right-4 text-white text-xs opacity-50">
        <div>← → Navigate</div>
        <div>F Fullscreen</div>
        <div>Space Play/Pause</div>
      </div>
    </div>
  );
}

export default EnhancedPptxViewer;