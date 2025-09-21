'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const CanvasBasedPowerPointViewer = ({ filePath, fileName, contentId, onClose, isModal = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const [loadingThumbnails, setLoadingThumbnails] = useState({});

  const canvasRef = useRef(null);
  const viewerRef = useRef(null);

  // Dynamic import for fallback PDFPowerPointViewer
  const PDFPowerPointViewer = dynamic(() => import('./PDFPowerPointViewer'), {
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-black">
        <div className="text-center p-6 bg-gray-900 rounded-xl shadow-lg">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <h3 className="text-base font-semibold text-white">Loading Enhanced PDF Viewer...</h3>
        </div>
      </div>
    )
  });

  // If fallback is triggered, use enhanced PDFPowerPointViewer
  if (useFallback) {
    console.log('🔄 Using enhanced PDFPowerPointViewer fallback');
    return (
      <PDFPowerPointViewer
        filePath={filePath}
        fileName={fileName}
        contentId={contentId}
        onClose={onClose}
        isModal={isModal}
      />
    );
  }

  // Initialize PDF.js
  useEffect(() => {
    const initializePdfJs = async () => {
      try {
        // Check if PDF.js is already loaded
        if (window.pdfjsLib) {
          console.log('✅ PDF.js already initialized');
          return;
        }

        console.log('🔄 Initializing PDF.js...');
        
        // Try CDN approach first as it's most reliable with Next.js
        try {
          // Load PDF.js from CDN to avoid module bundling issues
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              script.onload = () => {
                if (window.pdfjsLib) {
                  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                  console.log('✅ PDF.js loaded from CDN successfully');
                  resolve();
                } else {
                  reject(new Error('PDF.js CDN load failed'));
                }
              };
              script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
              document.head.appendChild(script);
            });
          }
        } catch (cdnError) {
          console.log('⚠️ CDN loading failed, trying dynamic import...');
          
          // Fallback to dynamic import with better error handling
          try {
            const pdfjsModule = await import('pdfjs-dist/webpack');
            const pdfjsLib = pdfjsModule.default || pdfjsModule;
            
            // Set worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            window.pdfjsLib = pdfjsLib;
            console.log('✅ PDF.js webpack import successful');
          } catch (webpackError) {
            console.log('⚠️ Webpack import failed, trying legacy method...');
            
            // Final fallback to legacy import
            try {
              const legacyModule = await import('pdfjs-dist/legacy/build/pdf');
              const pdfjsLib = legacyModule.default || legacyModule;
              
              pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              window.pdfjsLib = pdfjsLib;
              console.log('✅ PDF.js legacy import successful');
            } catch (legacyError) {
              console.error('❌ All PDF.js import methods failed:', { cdnError, webpackError, legacyError });
              throw new Error('Unable to load PDF.js library');
            }
          }
        }
        
        console.log('✅ PDF.js initialized successfully');
      } catch (err) {
        console.error('❌ Failed to initialize PDF.js:', err);
        setError(`Canvas rendering initialization failed: ${err.message}. Click 'Use Enhanced PDF Viewer' to continue.`);
      }
    };

    initializePdfJs();
  }, []);

  // Convert PowerPoint to PDF first
  useEffect(() => {
    let isMounted = true;
    
    const convertPptToPdf = async () => {
      if (!filePath) {
        setError('No file path provided');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Converting PowerPoint to PDF...', filePath);

        let apiUrl = `/api/convert-ppt-to-pdf?filePath=${encodeURIComponent(filePath)}`;
        if (contentId) {
          apiUrl += `&contentId=${encodeURIComponent(contentId)}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to convert PowerPoint to PDF');
        }

        const data = await response.json();
        if (!isMounted) return;

        if (!data.pdfUrl) {
          throw new Error('No PDF URL returned from conversion');
        }

        console.log('✅ PowerPoint converted successfully:', data.pdfUrl);
        const fullPdfUrl = `${window.location.origin}${data.pdfUrl}`;
        setPdfUrl(fullPdfUrl);
        setTotalPages(data.pageCount || 1);

        // Load PDF document with PDF.js
        await loadPdfDocument(fullPdfUrl);

      } catch (err) {
        if (!isMounted) return;
        console.error('❌ PowerPoint conversion failed:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    convertPptToPdf();

    return () => {
      isMounted = false;
    };
  }, [filePath, contentId]);

  // Load PDF document using PDF.js
  const loadPdfDocument = async (url) => {
    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js not loaded');
      }

      console.log('📄 Loading PDF document:', url);
      
      // Create loading task with proper configuration
      const loadingTask = window.pdfjsLib.getDocument({
        url: url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        enableXfa: true
      });
      
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      console.log(`✅ PDF loaded successfully - ${pdf.numPages} pages`);

      // Immediately render first page
      await renderPage(1);
      setIsLoading(false);

    } catch (err) {
      console.error('❌ Failed to load PDF:', err);
      setError(`Failed to load PDF document: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Generate thumbnail for specific page
  const generateThumbnail = async (pageNum) => {
    if (!pdfDoc || thumbnails[pageNum] || loadingThumbnails[pageNum]) return;

    setLoadingThumbnails(prev => ({ ...prev, [pageNum]: true }));
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Create a small canvas for thumbnail
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      
      // Get original dimensions
      const originalViewport = page.getViewport({ scale: 1 });
      
      // Calculate thumbnail dimensions to maintain aspect ratio
      const thumbnailMaxSize = 120; // Max width or height for thumbnail
      const aspectRatio = originalViewport.width / originalViewport.height;
      
      let thumbnailWidth, thumbnailHeight;
      if (aspectRatio > 1) {
        // Landscape: fit to width
        thumbnailWidth = thumbnailMaxSize;
        thumbnailHeight = thumbnailMaxSize / aspectRatio;
      } else {
        // Portrait: fit to height
        thumbnailHeight = thumbnailMaxSize;
        thumbnailWidth = thumbnailMaxSize * aspectRatio;
      }
      
      const thumbnailScale = thumbnailWidth / originalViewport.width;
      const viewport = page.getViewport({ scale: thumbnailScale });
      
      thumbnailCanvas.width = viewport.width;
      thumbnailCanvas.height = viewport.height;
      
      // Clear canvas with white background
      thumbnailCtx.fillStyle = '#ffffff';
      thumbnailCtx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
      
      // Render page to thumbnail canvas
      const renderContext = {
        canvasContext: thumbnailCtx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Convert to data URL
      const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/png', 0.8);
      
      setThumbnails(prev => ({ ...prev, [pageNum]: thumbnailDataUrl }));
      console.log(`✅ Thumbnail generated for page ${pageNum} (${thumbnailWidth.toFixed(0)}x${thumbnailHeight.toFixed(0)})`);
      
    } catch (err) {
      console.error(`❌ Failed to generate thumbnail for page ${pageNum}:`, err);
    } finally {
      setLoadingThumbnails(prev => ({ ...prev, [pageNum]: false }));
    }
  };

  // Generate thumbnails for visible pages
  const generateVisibleThumbnails = async () => {
    if (!pdfDoc) return;
    
    // Generate thumbnails for current page and nearby pages
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let page = startPage; page <= endPage; page++) {
      await generateThumbnail(page);
    }
  };

  // Render specific page to canvas
  const renderPage = async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;

    setPageRendering(true);
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Get the original viewport to determine slide dimensions
      const originalViewport = page.getViewport({ scale: 1 });
      
      // Calculate container dimensions with proper padding
      const container = canvas.parentElement;
      const containerWidth = container.clientWidth - 80; // Increased padding
      const containerHeight = container.clientHeight - 80; // Increased padding
      
      // Calculate optimal scale based on slide aspect ratio
      const slideAspectRatio = originalViewport.width / originalViewport.height;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let finalScale;
      
      if (slideAspectRatio > containerAspectRatio) {
        // Slide is wider - fit to width
        finalScale = containerWidth / originalViewport.width;
      } else {
        // Slide is taller - fit to height
        finalScale = containerHeight / originalViewport.height;
      }
      
      // Apply maximum scale limit to prevent oversized slides
      const maxScale = Math.min(2.0, scale * 1.2); // Allow some zoom but limit it
      const minScale = 0.3; // Ensure slides don't get too small
      finalScale = Math.max(minScale, Math.min(maxScale, finalScale));
      
      console.log(`📐 Slide dimensions: ${originalViewport.width}x${originalViewport.height}, AR: ${slideAspectRatio.toFixed(2)}, Scale: ${finalScale.toFixed(2)}`);

      const scaledViewport = page.getViewport({ scale: finalScale });
      
      // Set canvas dimensions
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      // Apply CSS to center the canvas
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.margin = 'auto';
      canvas.style.display = 'block';

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF page
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport
      };

      await page.render(renderContext).promise;
      
      console.log(`✅ Page ${pageNum} rendered successfully at scale ${finalScale.toFixed(2)}`);
      
      // Generate thumbnails for nearby pages after main rendering
      setTimeout(() => generateVisibleThumbnails(), 100);
      
    } catch (err) {
      console.error(`❌ Failed to render page ${pageNum}:`, err);
    } finally {
      setPageRendering(false);
      
      // Handle pending page render
      if (pageNumPending !== null) {
        const pending = pageNumPending;
        setPageNumPending(null);
        await renderPage(pending);
      }
    }
  };

  // Queue page rendering
  const queueRenderPage = (pageNum) => {
    if (pageRendering) {
      setPageNumPending(pageNum);
    } else {
      renderPage(pageNum);
    }
  };

  // Navigation functions
  const goToNextSlide = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      queueRenderPage(nextPage);
    }
  };

  const goToPrevSlide = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      queueRenderPage(prevPage);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
      queueRenderPage(pageNumber);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Fullscreen toggle
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

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && currentPage) {
        setTimeout(() => renderPage(currentPage), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentPage]);

  // Ensure first page renders and start thumbnail generation
  useEffect(() => {
    if (pdfDoc && canvasRef.current && currentPage === 1) {
      // Force render the first page immediately
      renderPage(1);
    }
  }, [pdfDoc]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-black">
        <div className="text-center p-6 bg-gray-900 rounded-xl shadow-lg">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <h3 className="text-base font-semibold text-white">Loading Presentation</h3>
          <p className="text-sm text-gray-400 mt-2">Converting to canvas format...</p>
        </div>
      </div>
    );
  }

  // Error state with fallback option
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-black p-4">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-white mb-2">Canvas Rendering Unavailable</h3>
        <p className="text-gray-400 mb-4 text-sm text-center max-w-md">
          Unable to initialize canvas-based PDF rendering. This may be due to browser compatibility 
          or network connectivity issues.
        </p>
        <p className="text-gray-500 mb-6 text-xs text-center max-w-md">
          Technical details: {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setUseFallback(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Use Enhanced PDF Viewer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewerRef}
      className={`bg-black text-white h-full w-full overflow-hidden relative flex ${
        isModal ? 'rounded-2xl' : ''
      }`}
    >
      {/* Thumbnail Sidebar */}
      {showThumbnails && (
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
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
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNum = index + 1;
              const isActive = pageNum === currentPage;
              const thumbnailSrc = thumbnails[pageNum];
              const isLoadingThumb = loadingThumbnails[pageNum];
              
              return (
                <div
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  onMouseEnter={() => !thumbnailSrc && !isLoadingThumb && generateThumbnail(pageNum)}
                  className={`group cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="aspect-[16/9] bg-gray-800 relative overflow-hidden flex items-center justify-center">
                    {isLoadingThumb ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-1"></div>
                        <div className="text-xs text-gray-500">Loading...</div>
                      </div>
                    ) : thumbnailSrc ? (
                      <img 
                        src={thumbnailSrc} 
                        alt={`Slide ${pageNum}`}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z"/>
                        </svg>
                        <div className="text-xs text-gray-500">Slide {pageNum}</div>
                      </div>
                    )}
                    
                    {isActive && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none">
                        <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-2 text-center text-xs font-medium ${
                    isActive ? 'text-blue-300 bg-blue-600/30' : 'text-gray-400 bg-gray-800'
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
            {!showThumbnails && (
              <button
                onClick={() => setShowThumbnails(true)}
                className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors mr-2"
                title="Show thumbnails"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                </svg>
              </button>
            )}
            
            <div className="text-orange-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white truncate max-w-96">
                {fileName || 'PowerPoint Presentation'}
              </h2>
              <p className="text-xs text-gray-400">
                Slide {currentPage} of {totalPages}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
              title="Toggle fullscreen"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            
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

        {/* Canvas Container - ZERO scrolling possible */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-8">
            <canvas
              ref={canvasRef}
              className="shadow-2xl rounded"
              style={{
                maxWidth: 'calc(100% - 40px)',
                maxHeight: 'calc(100% - 40px)',
                backgroundColor: '#ffffff',
                display: 'block',
                margin: 'auto'
              }}
            />
          </div>
          
          {/* Loading overlay */}
          {pageRendering && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-white text-sm">Rendering slide...</span>
              </div>
            </div>
          )}
          
          {/* Navigation arrows overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <button
              onClick={goToPrevSlide}
              disabled={currentPage <= 1}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/70 text-white rounded-full hover:bg-black/90 disabled:opacity-0 disabled:cursor-default transition-opacity z-50 pointer-events-auto"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            
            <button
              onClick={goToNextSlide}
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

export default CanvasBasedPowerPointViewer;