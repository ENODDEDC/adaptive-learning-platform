'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  XMarkIcon,
  DocumentIcon,
  Squares2X2Icon,
  ViewfinderCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const PowerPointViewer = ({ filePath, fileName, contentId, onClose, isModal = true }) => {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [loadedThumbnails, setLoadedThumbnails] = useState(new Set([0])); // Track loaded thumbnails

  // New advanced features state
  const [viewMode, setViewMode] = useState('presentation'); // 'presentation', 'overview', 'notes'
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [slideTransition, setSlideTransition] = useState('fade'); // 'fade', 'slide', 'none'
  const [speakerNotes, setSpeakerNotes] = useState([]);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  const viewerRef = useRef(null);
  const slideContainerRef = useRef(null);


  // Fetch PPT data with performance optimizations
  useEffect(() => {
    let isMounted = true;

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

    const fetchPresentation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Add timeout for long conversions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

        // Ensure we have a valid string
        if (!filePathString || filePathString.trim() === '') {
          throw new Error('Invalid file path provided');
        }

        const url = contentId
          ? `/api/convert-ppt?filePath=${encodeURIComponent(filePathString)}&format=json&contentId=${encodeURIComponent(contentId)}`
          : `/api/convert-ppt?filePath=${encodeURIComponent(filePathString)}&format=json`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!isMounted) return;

        if (!data.slides || data.slides.length === 0) {
          throw new Error('No slides found in the presentation. The file might be corrupted or empty.');
        }

        setSlides(data.slides);

        // Preload adjacent slides for better performance
        if (data.slides.length > 1) {
          // Preload next slide
          const nextSlideImg = new Image();
          nextSlideImg.src = data.slides[1]?.imageUrl;

          // Preload previous slide if not first
          if (data.slides.length > 2) {
            const prevSlideImg = new Image();
            prevSlideImg.src = data.slides[data.slides.length - 1]?.imageUrl;
          }
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('Error loading presentation:', err);

        if (err.name === 'AbortError') {
          setError('Conversion timed out. The presentation might be too large or complex. Try downloading the file instead.');
        } else if (err.message.includes('LibreOffice')) {
          setError('Failed to process the presentation. LibreOffice might not be installed on the server.');
        } else if (err.message.includes('not found')) {
          setError('Presentation file not found. It might have been moved or deleted.');
        } else {
          setError(err.message || 'Failed to load presentation');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (filePathString && filePathString.trim() !== '') {
      fetchPresentation();
    } else {
      console.warn('PowerPointViewer: No filePath provided');
      setError('No presentation file specified');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [filePath]); // Re-run when filePath changes

  // Keyboard navigation and accessibility
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!slides.length) return;

      // Don't handle keyboard shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          // Announce slide change to screen readers
          announceToScreenReader(`Slide ${currentSlideIndex + 2} of ${slides.length}`);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          announceToScreenReader(`Slide ${currentSlideIndex} of ${slides.length}`);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          announceToScreenReader(isFullscreen ? 'Exited fullscreen mode' : 'Entered fullscreen mode');
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          announceToScreenReader(`Zoom level: ${Math.round((zoom + 0.25) * 100)}%`);
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          announceToScreenReader(`Zoom level: ${Math.round((zoom - 0.25) * 100)}%`);
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          announceToScreenReader(`Slide 1 of ${slides.length}`);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          announceToScreenReader(`Slide ${slides.length} of ${slides.length}`);
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
            announceToScreenReader('Exited fullscreen mode');
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Quick navigation to slide number
          const slideNum = parseInt(e.key);
          if (slideNum <= slides.length) {
            e.preventDefault();
            goToSlide(slideNum - 1);
            announceToScreenReader(`Slide ${slideNum} of ${slides.length}`);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [slides.length, currentSlideIndex, zoom, isFullscreen]);

  // Screen reader announcements
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any cached images
      if (slides.length > 0) {
        slides.forEach(slide => {
          if (slide.imageData && slide.imageData.startsWith('data:')) {
            // For data URLs, we can't directly clear them, but we can suggest garbage collection
            URL.revokeObjectURL(slide.imageData);
          }
        });
      }
    };
  }, [slides]);

  // Lazy load thumbnails
  const loadThumbnail = useCallback((index) => {
    if (!loadedThumbnails.has(index) && slides[index]) {
      setLoadedThumbnails(prev => new Set([...prev, index]));
    }
  }, [loadedThumbnails, slides]);

  // Load thumbnails for visible range
  useEffect(() => {
    if (slides.length > 0) {
      const startIndex = Math.max(0, currentSlideIndex - 2);
      const endIndex = Math.min(slides.length - 1, currentSlideIndex + 2);

      for (let i = startIndex; i <= endIndex; i++) {
        loadThumbnail(i);
      }
    }
  }, [currentSlideIndex, slides.length, loadThumbnail]);

  // Auto-play functionality
  useEffect(() => {
    let intervalId;
    if (isAutoPlay && slides.length > 1) {
      intervalId = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % slides.length);
      }, autoPlayInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlay, slides.length, autoPlayInterval]);

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
    }
  }, [slides.length]);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await viewerRef.current?.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      document.exitFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // Advanced features functions
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      if (prev === 'presentation') return 'overview';
      if (prev === 'overview') return 'notes';
      return 'presentation';
    });
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlay(prev => !prev);
  }, []);

  const searchInSlides = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    slides.forEach((slide, index) => {
      // For now, we'll search in slide numbers and basic metadata
      // In a real implementation, you'd extract text from slides
      const slideNumber = (index + 1).toString();
      const title = `Slide ${slideNumber}`;

      if (title.toLowerCase().includes(query.toLowerCase()) ||
          slideNumber.includes(query)) {
        results.push({
          slideIndex: index,
          slideNumber: slideNumber,
          title: title,
          preview: `Slide ${slideNumber}`
        });
      }
    });

    setSearchResults(results);
  }, [slides]);

  const exportSlides = useCallback(async (format = 'images') => {
    try {
      // Create a simple export of current slide
      const link = document.createElement('a');
      link.href = slides[currentSlideIndex]?.imageUrl;
      link.download = `slide-${currentSlideIndex + 1}.png`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [slides, currentSlideIndex]);

  const togglePresentationMode = useCallback(() => {
    setPresentationMode(prev => !prev);
    if (!presentationMode) {
      setShowThumbnails(false);
      setIsFullscreen(true);
    } else {
      setShowThumbnails(true);
      exitFullscreen();
    }
  }, [presentationMode, exitFullscreen]);

  // Search functionality
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchInSlides(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchInSlides]);

  // Enhanced Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-lg p-8 bg-white rounded-2xl shadow-xl">
          {/* Animated logo/icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0V1m10 3V1m0 3l1 1v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5l1-1z" />
              </svg>
            </div>
            {/* Animated rings */}
            <div className="absolute inset-0 -m-4">
              <div className="w-28 h-28 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="absolute inset-0 -m-8">
              <div className="w-36 h-36 border-2 border-purple-200 border-t-purple-400 rounded-full animate-spin mx-auto animation-delay-300"></div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">Converting Your Presentation</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We're transforming your PowerPoint into an interactive web experience with stunning visuals and smooth navigation.
          </p>

          {/* Progress steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <span className="text-sm text-blue-700 font-medium">Extracting slides from presentation</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce animation-delay-500"></div>
              <span className="text-sm text-purple-700 font-medium">Converting to high-resolution images</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce animation-delay-1000"></div>
              <span className="text-sm text-green-700 font-medium">Optimizing for web viewing</span>
            </div>
          </div>

          {/* Fun facts or tips */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-indigo-700">Did you know?</span>
            </div>
            <p className="text-sm text-indigo-600">
              PowerPoint presentations can be up to 10x more engaging when viewed interactively on the web!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>This may take 30-60 seconds for large presentations</span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="max-w-2xl w-full">
          {/* Error illustration */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              {/* Animated warning icon */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white font-bold text-sm">!</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Oops! Presentation Loading Failed</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>

          {/* Error details */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Troubleshooting Steps
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Check File Integrity</h5>
                    <p className="text-sm text-blue-700">Ensure the PowerPoint file isn't corrupted</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-900">Verify Format</h5>
                    <p className="text-sm text-green-700">Make sure it's a valid .ppt or .pptx file</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-900">Test in PowerPoint</h5>
                    <p className="text-sm text-purple-700">Try opening the file in Microsoft PowerPoint</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-900">Contact Support</h5>
                    <p className="text-sm text-orange-700">Get help from our support team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>

            {filePath && (
              <>
                <a
                  href={typeof filePath === 'string' ? filePath : String(filePath || '')}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download File
                </a>

                <a
                  href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + (typeof filePath === 'string' ? filePath : String(filePath || '')))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Online
                </a>
              </>
            )}
          </div>

          {/* Fun fact */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-gray-600">Pro tip: Most PowerPoint issues can be resolved by re-saving the file!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No slides
  if (!slides.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Slides Found</h3>
        <p className="text-gray-600 mb-6">This presentation appears to be empty or corrupted.</p>
        <a
          href={typeof filePath === 'string' ? filePath : String(filePath || '')}
          download
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download File
        </a>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      ref={viewerRef}
      className={`bg-white ${isModal ? 'rounded-2xl shadow-2xl' : ''} flex flex-col h-full overflow-hidden`}
    >
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .slide-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .presentation-mode {
          background: #000;
          color: white;
        }
        .presentation-mode .slide-container {
          background: #000;
        }
      `}</style>
      {/* Header */}
      <header
        className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0"
        role="banner"
        aria-label="Presentation viewer header"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <DocumentIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate" id="presentation-title">
              {fileName || 'Presentation'}
            </h1>
            <div
              className="text-sm text-gray-600"
              aria-live="polite"
              aria-atomic="true"
              id="slide-counter"
            >
              Slide {currentSlideIndex + 1} of {slides.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" role="toolbar" aria-label="Presentation controls">
          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              viewMode !== 'presentation' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title={`Switch to ${viewMode === 'presentation' ? 'overview' : viewMode === 'overview' ? 'notes' : 'presentation'} mode`}
          >
            {viewMode === 'presentation' && <ViewfinderCircleIcon className="w-5 h-5" />}
            {viewMode === 'overview' && <Squares2X2Icon className="w-5 h-5" />}
            {viewMode === 'notes' && <DocumentIcon className="w-5 h-5" />}
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              showSearch ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="Search in presentation"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          {/* Auto-play Toggle */}
          <button
            onClick={toggleAutoPlay}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              isAutoPlay ? 'bg-green-100 text-green-600' : ''
            }`}
            title={isAutoPlay ? 'Stop auto-play' : 'Start auto-play'}
          >
            {isAutoPlay ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>

          {/* Export Button */}
          <button
            onClick={() => exportSlides('images')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export current slide"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 3}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous slide"
            aria-label={`Go to previous slide (${currentSlideIndex} of ${slides.length})`}
            aria-disabled={currentSlideIndex === 0}
          >
            <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          <div
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
            aria-live="polite"
            aria-atomic="true"
            role="status"
          >
            {currentSlideIndex + 1} / {slides.length}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next slide"
            aria-label={`Go to next slide (${currentSlideIndex + 2} of ${slides.length})`}
            aria-disabled={currentSlideIndex === slides.length - 1}
          >
            <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Toggle fullscreen"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Close viewer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search slides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {searchResults.map((result) => (
                  <button
                    key={`search-${result.slideIndex}`}
                    onClick={() => {
                      goToSlide(result.slideIndex);
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{result.title}</div>
                    <div className="text-sm text-gray-600">{result.preview}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto-play Speed</label>
              <select
                value={autoPlayInterval}
                onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1000}>Fast (1s)</option>
                <option value={3000}>Normal (3s)</option>
                <option value={5000}>Slow (5s)</option>
                <option value={10000}>Very Slow (10s)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transition</label>
              <select
                value={slideTransition}
                onChange={(e) => setSlideTransition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showSpeakerNotes}
                  onChange={(e) => setShowSpeakerNotes(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show Speaker Notes</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Slide viewer */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
          {viewMode === 'presentation' && (
            <div
              ref={slideContainerRef}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
                slideTransition === 'fade' ? 'animate-fade-in' : ''
              }`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center top',
                transition: slideTransition === 'slide' ? 'transform 0.3s ease-in-out' : 'transform 0.2s ease-in-out'
              }}
            >
              <img
                src={currentSlide.imageUrl}
                alt={`Slide ${currentSlide.slideNumber}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  width: currentSlide.width || '800px',
                  height: currentSlide.height || '600px'
                }}
                draggable={false}
              />
              {isAutoPlay && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Auto-playing...
                </div>
              )}
            </div>
          )}

          {viewMode === 'overview' && (
            <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              {slides.map((slide, index) => (
                <div
                  key={slide.slideNumber}
                  onClick={() => goToSlide(index)}
                  className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                    index === currentSlideIndex ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                >
                  <div className="aspect-video">
                    <img
                      src={slide.imageUrl}
                      alt={`Slide ${slide.slideNumber}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                    <div className="text-sm font-medium">{slide.slideNumber}</div>
                  </div>
                  {index === currentSlideIndex && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'notes' && (
            <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex">
                {/* Slide */}
                <div className="flex-1 p-6">
                  <img
                    src={currentSlide.imageUrl}
                    alt={`Slide ${currentSlide.slideNumber}`}
                    className="w-full max-h-96 object-contain rounded-lg shadow-sm"
                    draggable={false}
                  />
                </div>
                {/* Notes */}
                <div className="w-80 border-l bg-gray-50 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaker Notes</h3>
                  <div className="text-sm text-gray-600">
                    {speakerNotes[currentSlideIndex] || (
                      <div className="text-gray-400 italic">
                        No speaker notes available for this slide.
                        <br />
                        <br />
                        This feature would display any notes embedded in the PowerPoint file.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Thumbnail sidebar */}
        {showThumbnails && viewMode === 'presentation' && (
          <aside
            className="w-56 flex-shrink-0 bg-gradient-to-b from-gray-50 to-gray-100 border-l overflow-y-auto shadow-inner"
            role="complementary"
            aria-label="Presentation slides overview"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900" id="thumbnail-heading">
                  Slides ({slides.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowThumbnails(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Hide thumbnails"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3" role="tablist" aria-labelledby="thumbnail-heading">
                {slides.map((slide, index) => (
                  <div key={`thumbnail-${slide.slideNumber}-${index}`} className="relative group">
                    <button
                      onClick={() => goToSlide(index)}
                      className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        index === currentSlideIndex
                          ? 'border-blue-500 shadow-lg ring-2 ring-blue-500 ring-offset-2 transform scale-105'
                          : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                      }`}
                      aria-label={`Go to slide ${slide.slideNumber} of ${slides.length}${index === currentSlideIndex ? ' (current slide)' : ''}`}
                      aria-selected={index === currentSlideIndex}
                      role="tab"
                    >
                      {loadedThumbnails.has(index) ? (
                        <img
                          src={slide.imageUrl}
                          alt={`Thumbnail for slide ${slide.slideNumber}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-xs text-gray-500 font-medium">{slide.slideNumber}</div>
                          </div>
                        </div>
                      )}

                      {/* Slide number overlay */}
                      <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        index === currentSlideIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-black bg-opacity-50 text-white group-hover:bg-blue-500'
                      }`}>
                        {slide.slideNumber}
                      </div>

                      {/* Current slide indicator */}
                      {index === currentSlideIndex && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 rounded-lg"></div>
                      )}
                    </button>

                    {/* Progress indicator for loaded slides */}
                    {loadedThumbnails.has(index) && (
                      <div className="absolute bottom-1 left-1 right-1 h-1 bg-black bg-opacity-20 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '100%' }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick navigation */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Quick Navigation</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => goToSlide(0)}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => goToSlide(Math.floor(slides.length / 2))}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    Middle
                  </button>
                  <button
                    onClick={() => goToSlide(slides.length - 1)}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 flex-shrink-0">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default PowerPointViewer;