'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SunIcon,
  MoonIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const ImageBasedPDFViewer = ({ content }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fitMode, setFitMode] = useState('width'); // 'width', 'page', 'actual'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageImages, setPageImages] = useState({});
  const [loadingPages, setLoadingPages] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Load PDF and render pages using client-side canvas
  const loadPDFDocument = useCallback(async () => {
    if (!content?.filePath && !content?.url) {
      setError('No PDF file provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pdfUrl = content.filePath || content.url;
      console.log('Loading PDF document:', pdfUrl);

      // First get PDF info from our API
      const response = await fetch('/api/pdf-to-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: pdfUrl,
          fileName: content.title || content.originalName || 'document.pdf'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process PDF: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTotalPages(result.totalPages);
        setCurrentPage(1);
        
        // Store the PDF URL for client-side rendering
        setPageImages({ pdfUrl: result.pdfUrl });
        
        console.log(`PDF loaded successfully. ${result.totalPages} pages`);
      } else {
        throw new Error(result.error || 'Failed to process PDF');
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [content]);

  // Load PDF on component mount
  useEffect(() => {
    loadPDFDocument();
  }, [loadPDFDocument]);

  // Handle zoom and fit calculations
  const calculateImageStyle = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return {};

    const containerWidth = containerRef.current.clientWidth - 40; // Account for padding
    const containerHeight = containerRef.current.clientHeight - 40;
    
    let scale = zoomLevel;
    
    if (fitMode === 'width') {
      scale = containerWidth / (imageRef.current.naturalWidth || 800);
    } else if (fitMode === 'page') {
      const scaleX = containerWidth / (imageRef.current.naturalWidth || 800);
      const scaleY = containerHeight / (imageRef.current.naturalHeight || 1000);
      scale = Math.min(scaleX, scaleY);
    }

    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      maxWidth: 'none',
      transition: 'transform 0.2s ease-in-out'
    };
  }, [zoomLevel, fitMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  // Navigation handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageJump = (page) => {
    const pageNum = Math.max(1, Math.min(totalPages, parseInt(page) || 1));
    setCurrentPage(pageNum);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevel + 0.25);
    setZoomLevel(newZoom);
    setFitMode('custom');
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.25, zoomLevel - 0.25);
    setZoomLevel(newZoom);
    setFitMode('custom');
  };

  const handleFitWidth = () => {
    setFitMode('width');
  };

  const handleFitPage = () => {
    setFitMode('page');
  };

  const handleActualSize = () => {
    setFitMode('actual');
    setZoomLevel(1);
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content.filePath || content.url;
    link.download = content.title || content.originalName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    if (imageRef.current) {
      imageRef.current.contentWindow?.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading PDF document...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing custom PDF viewer</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-8 max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading PDF</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadPDFDocument}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = pageImages[currentPage];

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Custom Toolbar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Left Section - File Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`font-medium truncate max-w-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.title || content.originalName || 'PDF Document'}
            </span>
          </div>
          
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className={`p-1.5 rounded-md transition-colors ${
                currentPage <= 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => handlePageJump(e.target.value)}
                className={`w-12 px-2 py-1 text-sm text-center border rounded ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                / {totalPages}
              </span>
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-md transition-colors ${
                currentPage >= totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Section - Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.25}
            className={`p-1.5 rounded-md transition-colors ${
              zoomLevel <= 0.25
                ? 'text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          
          <select
            value={fitMode}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'width') handleFitWidth();
              else if (value === 'page') handleFitPage();
              else if (value === 'actual') handleActualSize();
            }}
            className={`px-3 py-1 text-sm border rounded ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="width">Fit Width</option>
            <option value="page">Fit Page</option>
            <option value="actual">Actual Size</option>
          </select>
          
          <span className={`text-sm px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {Math.round((fitMode === 'custom' ? zoomLevel : 1) * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className={`p-1.5 rounded-md transition-colors ${
              zoomLevel >= 3
                ? 'text-gray-400 cursor-not-allowed'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? 
              <ArrowsPointingInIcon className="w-4 h-4" /> : 
              <ArrowsPointingOutIcon className="w-4 h-4" />
            }
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Print current page"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Download PDF"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Custom PDF Display */}
      <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="w-full h-full flex justify-center items-center p-4">
          {pageImages.pdfUrl ? (
            <div className={`w-full h-full shadow-lg ${isDarkMode ? 'shadow-gray-800' : 'shadow-gray-300'} rounded-lg overflow-hidden`}>
              <iframe
                ref={imageRef}
                src={`${pageImages.pdfUrl}#page=${currentPage}&zoom=${Math.round((fitMode === 'custom' ? zoomLevel : 1) * 100)}`}
                className={`w-full h-full border-0 ${isDarkMode ? 'filter invert hue-rotate-180' : ''}`}
                title={`${content.title || 'PDF Document'} - Page ${currentPage}`}
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  transform: fitMode === 'custom' ? `scale(${zoomLevel})` : 'none',
                  transformOrigin: 'center center'
                }}
              />
            </div>
          ) : (
            <div className={`flex items-center justify-center w-full h-96 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg rounded-lg`}>
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Loading PDF document...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className={`px-4 py-2 border-t text-sm ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-300' 
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <span>
            {fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : `${Math.round((fitMode === 'custom' ? zoomLevel : 1) * 100)}%`} • Image-based PDF Viewer
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageBasedPDFViewer;