'use client';

import { useState, useEffect, useRef } from 'react';
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
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const CleanPDFViewer = ({ content }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(125);
  const [fitMode, setFitMode] = useState('width');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // PDF URL with parameters to control display
  const getPDFUrl = () => {
    const baseUrl = content.filePath || content.url;
    if (!baseUrl) return '';
    
    // Add parameters to control PDF display
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    
    if (fitMode === 'width') {
      params.append('zoom', 'page-width');
    } else if (fitMode === 'page') {
      params.append('zoom', 'page-fit');
    } else {
      params.append('zoom', zoomLevel.toString());
    }
    
    // Add toolbar=0 to try to hide browser toolbar (works in some browsers)
    params.append('toolbar', '0');
    params.append('navpanes', '0');
    params.append('scrollbar', '0');
    
    return `${baseUrl}#${params.toString()}`;
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Try to get page count from PDF (simplified approach)
      setTotalPages(10); // Default - in real app you'd detect this
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
    const newZoom = Math.min(300, zoomLevel + 25);
    setZoomLevel(newZoom);
    setFitMode('custom');
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(25, zoomLevel - 25);
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
    setZoomLevel(100);
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
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading PDF document...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing clean PDF viewer</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Custom Toolbar - Clean Design */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Left Section - Document Info (NO FILE PATH) */}
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
            disabled={zoomLevel <= 25}
            className={`p-1.5 rounded-md transition-colors ${
              zoomLevel <= 25
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
            {zoomLevel}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 300}
            className={`p-1.5 rounded-md transition-colors ${
              zoomLevel >= 300
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
            title="Print PDF"
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

      {/* PDF Display with Hidden Browser Toolbar */}
      <div className={`flex-1 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <style jsx>{`
          .pdf-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            ${isDarkMode ? 'filter: invert(1) hue-rotate(180deg);' : ''}
          }
          
          /* Try to hide PDF toolbar with CSS (browser dependent) */
          .pdf-container iframe::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="pdf-container w-full h-full p-4">
          <div className={`w-full h-full shadow-lg rounded-lg overflow-hidden ${
            isDarkMode ? 'shadow-gray-800' : 'shadow-gray-300'
          }`}>
            <iframe
              ref={iframeRef}
              src={getPDFUrl()}
              title={`${content.title || 'PDF Document'} - Page ${currentPage}`}
              className="w-full h-full"
              onLoad={() => {
                // Try to communicate with iframe to hide toolbar (limited by CORS)
                try {
                  const iframe = iframeRef.current;
                  if (iframe && iframe.contentWindow) {
                    // This will only work for same-origin PDFs
                    iframe.contentWindow.postMessage({ action: 'hideToolbar' }, '*');
                  }
                } catch (e) {
                  // Ignore CORS errors
                  console.log('Cannot communicate with PDF iframe (CORS)');
                }
              }}
            />
          </div>
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
            {fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : `${zoomLevel}%`} • Clean PDF Viewer
          </span>
        </div>
      </div>
    </div>
  );
};

export default CleanPDFViewer;