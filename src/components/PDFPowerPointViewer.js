'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Custom PowerPoint style viewer
const PDFPowerPointViewer = ({ filePath, fileName, contentId, onClose, isModal = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10); // Default to 10 pages until we know better
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [loadedThumbnails, setLoadedThumbnails] = useState(new Set([1]));
  const [conversionMethod, setConversionMethod] = useState('');
  const [viewerType, setViewerType] = useState('PDFPowerPointViewer');

  const viewerRef = useRef(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Step 1: Check if PDF already exists or convert PowerPoint to PDF
  useEffect(() => {
    let isMounted = true;
    console.log('🎯 PDFPowerPointViewer: Processing PowerPoint file...', filePath);

    const loadOrConvertPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let filePathString = '';
        if (typeof filePath === 'string') {
          filePathString = filePath;
        } else if (filePath && typeof filePath === 'object' && filePath.path) {
          filePathString = filePath.path;
        } else {
          filePathString = String(filePath || '');
        }

        if (!filePathString || filePathString.trim() === '') {
          throw new Error('Invalid file path provided');
        }

        console.log('🔍 File path:', filePathString);

        // Check if this is already a PDF file
        if (filePathString.toLowerCase().includes('.pdf')) {
          console.log('✅ File is already a PDF, using PDF.js directly');
          setPdfUrl(filePathString);
          setConversionMethod('Direct PDF.js (No Conversion Needed)');
          setIsLoading(false);
          return;
        }

        // For PowerPoint files, convert to PDF
        console.log('🔄 Converting PowerPoint to PDF...');
        let apiUrl = `/api/convert-ppt-to-pdf?filePath=${encodeURIComponent(filePathString)}`;
        if (contentId) {
          apiUrl += `&contentId=${encodeURIComponent(contentId)}`;
        }

        console.log('📡 Calling conversion API:', apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to convert PowerPoint to PDF');
        }

        const data = await response.json();
        console.log('✅ Conversion API Response:', data);

        if (!isMounted) return;

        if (!data.pdfUrl) {
          throw new Error('No PDF URL returned from the conversion API');
        }

        console.log('✅ PowerPoint conversion successful, PDF URL:', data.pdfUrl);
        setPdfUrl(data.pdfUrl);
        
        // Capture conversion method for debugging
        if (data.conversionMethod) {
          setConversionMethod(data.conversionMethod);
        }

        // Set the page count from API response if available
        if (data.pageCount && data.pageCount > 0) {
          console.log('Setting page count from API:', data.pageCount);
          setTotalPages(data.pageCount);
        }

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('PowerPoint conversion failed:', err);
        setError(err.message || 'Failed to process presentation');
        setIsLoading(false);
      }
    };

    loadOrConvertPdf();

    return () => {
      isMounted = false;
    };
  }, [filePath, contentId]);


  // Get full URL with origin and timestamp to force reload
  const getFullPdfUrl = (pageNum = currentPage) => {
    if (!pdfUrl) return '';
    // Enhanced PDF parameters to enforce single-page display and prevent scrolling
    // Critical parameters: view=FitH ensures horizontal fit, pagemode=none prevents navigation
    // zoom=page-width fits content to page width, disableTextLayer prevents text selection issues
    const cleanPdfUrl = `${window.location.origin}${pdfUrl}?t=${Date.now()}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true&page=${pageNum}`;
    return cleanPdfUrl;
  };

  // Navigation functions with forced reload
  const goToNextSlide = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setRefreshKey(Date.now());
    }
  };

  const goToPrevSlide = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setRefreshKey(Date.now());
    }
  };

  // Navigate to specific page
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setRefreshKey(Date.now());
    }
  };

  // Fullscreen function
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await viewerRef.current?.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      document.exitFullscreen();
    }
  };

  // Enhanced event handling to prevent scrolling and handle navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling behavior for navigation keys
      if (['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'Backspace', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        goToPrevSlide();
      }
    };

    const handleWheel = (e) => {
      // Prevent wheel scrolling entirely
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchMove = (e) => {
      // Prevent touch scrolling
      e.preventDefault();
      e.stopPropagation();
    };

    const handleScroll = (e) => {
      // Prevent any scroll events
      e.preventDefault();
      e.stopPropagation();
    };

    const container = containerRef.current;
    const iframe = iframeRef.current;

    // Add event listeners to multiple elements for comprehensive protection
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: false });

    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('scroll', handleScroll, { passive: false });
    }

    if (iframe) {
      iframe.addEventListener('wheel', handleWheel, { passive: false });
      iframe.addEventListener('touchmove', handleTouchMove, { passive: false });
      iframe.addEventListener('scroll', handleScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);

      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('scroll', handleScroll);
      }

      if (iframe) {
        iframe.removeEventListener('wheel', handleWheel);
        iframe.removeEventListener('touchmove', handleTouchMove);
        iframe.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentPage, totalPages]);

  // Handle PDF document message events (for direct PDF controls)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'pdfjs-message') {
        console.log('PDF.js message:', event.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load thumbnail for a specific page
  const loadThumbnail = (pageNum) => {
    if (!loadedThumbnails.has(pageNum)) {
      setLoadedThumbnails(prev => new Set([...prev, pageNum]));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-black">
        <div className="text-center p-6 bg-gray-900 rounded-xl shadow-lg">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <h3 className="text-base font-semibold text-white">Loading Presentation</h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-black p-4">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Presentation</h3>
        <p className="text-gray-400 mb-4 text-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main viewer
  return (
    <div
      ref={viewerRef}
      className={`bg-black text-white h-full w-full overflow-hidden relative flex ${isModal ? 'rounded-2xl' : ''
        }`}
    >
      {/* Thumbnail Sidebar */}
      {showThumbnails && (
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-300">Slides</span>
            </div>
            <button
              onClick={() => setShowThumbnails(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Hide thumbnails"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Thumbnail Grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNum = index + 1;
              const isActive = pageNum === currentPage;

              return (
                <div
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  onMouseEnter={() => loadThumbnail(pageNum)}
                  className={`group cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${isActive
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                    }`}
                >
                  {/* Thumbnail Image Container */}
                  <div className="aspect-[16/9] bg-gray-800 relative overflow-hidden">
                    {loadedThumbnails.has(pageNum) && pdfUrl ? (
                      <div className="w-full h-full relative">
                        <iframe
                          src={`${window.location.origin}${pdfUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&zoom=50`}
                          className="w-full h-full pointer-events-none border-0"
                          title={`Slide ${pageNum} thumbnail`}
                          style={{
                            transform: 'scale(0.25)',
                            transformOrigin: 'top left',
                            width: '400%',
                            height: '400%'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
                          </svg>
                          <div className="text-xs text-gray-500">Slide {pageNum}</div>
                        </div>
                      </div>
                    )}

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none">
                        <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* Slide Number */}
                  <div className={`p-2 text-center text-xs font-medium ${isActive ? 'text-blue-300 bg-blue-600/30' : 'text-gray-400 bg-gray-800'
                    }`}>
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {/* Toggle Thumbnails Button */}
            {!showThumbnails && (
              <button
                onClick={() => setShowThumbnails(true)}
                className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors mr-2"
                title="Show thumbnails"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                </svg>
              </button>
            )}

            <div className="text-orange-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5zM8.5 7v10.5h11V7H8.5z" />
                <path d="M4.5 3h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3zM4.5 5v10.5h11V5H4.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white truncate max-w-96">
                {fileName || 'PowerPoint Presentation'}
              </h2>
              <p className="text-xs text-gray-400">
                Slide {currentPage} of {totalPages}
              </p>
              {/* Debug Information */}
              <div className="text-xs mt-1">
                <span className="text-blue-400 bg-blue-900/30 px-2 py-1 rounded mr-2">
                  Viewer: {viewerType}
                </span>
                {conversionMethod && (
                  <span className={`px-2 py-1 rounded ${
                    conversionMethod.includes('LibreOffice') 
                      ? 'text-green-400 bg-green-900/30' 
                      : 'text-orange-400 bg-orange-900/30'
                  }`}>
                    {conversionMethod.includes('LibreOffice') ? '✅ Real PPT' : '⚠️ Text Only'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={goToPrevSlide}
                disabled={currentPage <= 1}
                className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous slide"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-gray-800 rounded text-white min-w-20 text-center">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={goToNextSlide}
                disabled={currentPage >= totalPages}
                className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next slide"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
              title="Toggle fullscreen"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>

            {/* Close */}
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors ml-2"
                title="Close"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main slide viewer */}
        <div className="flex-1 relative bg-gray-900">
          <div
            ref={containerRef}
            className="w-full h-full absolute inset-0 overflow-hidden no-scrollbar"
            style={{
              backgroundColor: '#1a1a1a',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <div className="w-full h-full relative overflow-hidden">
              <iframe
                key={refreshKey}
                ref={iframeRef}
                src={getFullPdfUrl()}
                className="w-full h-full border-0 no-scrollbar"
                scrolling="no"
                frameBorder="0"
                marginWidth="0"
                marginHeight="0"
                style={{
                  width: '100%',
                  height: '100%',
                  scrollbarWidth: 'none !important', // Firefox
                  msOverflowStyle: 'none !important', // IE/Edge
                  overflow: 'hidden !important',
                  WebkitScrollbar: 'none !important', // WebKit browsers
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                title={fileName || "PowerPoint Presentation"}
                allowFullScreen
              />
              {/* Visual overlay mask to cover any potential scrollbar areas */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, transparent 97%, #1a1a1a 100%)',
                  zIndex: 10
                }}
              />
            </div>
          </div>

          {/* Custom overlay controls */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left/Right Navigation buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
              disabled={currentPage <= 1}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/70 text-white rounded-full hover:bg-black/90 disabled:opacity-0 disabled:cursor-default transition-opacity z-50 pointer-events-auto"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
              disabled={currentPage >= totalPages}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/70 text-white rounded-full hover:bg-black/90 disabled:opacity-0 disabled:cursor-default transition-opacity z-50 pointer-events-auto"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPowerPointViewer;