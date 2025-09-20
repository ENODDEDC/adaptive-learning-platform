'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  CloudIcon,
  DocumentIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';

const MobilePowerPointViewer = ({
  filePath,
  fileName,
  contentId,
  onClose,
  isModal = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [slides, setSlides] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Fetch slides data
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Ensure filePath is a string and handle edge cases
        let filePathString = '';
        if (typeof filePath === 'string') {
          filePathString = filePath;
        } else if (filePath && typeof filePath === 'object' && filePath.path) {
          filePathString = filePath.path;
        } else if (filePath && typeof filePath === 'object' && filePath.toString) {
          filePathString = filePath.toString();
        } else {
          filePathString = String(filePath || '');
        }

        // Ensure we have a valid string
        if (!filePathString || filePathString.trim() === '') {
          throw new Error('Invalid file path provided');
        }

        const url = contentId
          ? `/api/convert-ppt?filePath=${encodeURIComponent(filePathString)}&format=json&contentId=${encodeURIComponent(contentId)}`
          : `/api/convert-ppt?filePath=${encodeURIComponent(filePathString)}&format=json`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to load presentation');
        }

        const data = await response.json();
        setSlides(data.slides || []);
        setTotalSlides(data.slides?.length || 0);
      } catch (err) {
        console.error('Error loading slides:', err);
        setError(err.message || 'Failed to load presentation');
      } finally {
        setIsLoading(false);
      }
    };

    if (filePathString && filePathString.trim() !== '') {
      fetchSlides();
    }
  }, [filePath, contentId]);

  // Touch handlers for swipe navigation
  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [touchStart, touchEnd, currentSlide, totalSlides]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading presentation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Error Loading Presentation</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{fileName || 'Presentation'}</h1>
              <p className="text-sm text-gray-300">
                Slide {currentSlide + 1} of {totalSlides}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center bg-white bg-opacity-10 rounded-lg">
              <button
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-l-lg disabled:opacity-50"
              >
                <MagnifyingGlassMinusIcon className="w-5 h-5" />
              </button>
              <span className="px-3 py-2 text-sm font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom >= 2}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-r-lg disabled:opacity-50"
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main slide area */}
      <div
        className="h-full pt-20 pb-20 flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentSlideData ? (
          <div
            className="relative max-w-full max-h-full overflow-hidden"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <img
              src={currentSlideData.imageUrl}
              alt={`Slide ${currentSlide + 1}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <DocumentIcon className="w-16 h-16 mx-auto mb-4" />
            <p>No slide data available</p>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          {/* Slide indicator */}
          <div className="flex-1 mx-4">
            <div className="bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-300 mt-2">
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Swipe hint for first-time users */}
      {currentSlide === 0 && totalSlides > 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
          Swipe left or right to navigate slides
        </div>
      )}
    </div>
  );
};

export default MobilePowerPointViewer;