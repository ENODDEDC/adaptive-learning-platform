'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SunIcon,
  MoonIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const CleanPDFViewer = ({ 
  content, 
  onAITutorClick,
  onVisualLearningClick,
  onSequentialLearningClick,
  onGlobalLearningClick,
  onSensingLearningClick,
  onIntuitiveLearningClick,
  onActiveLearningClick,
  onReflectiveLearningClick,
  isAITutorLoading = false,
  isVisualLearningLoading = false,
  isSequentialLearningLoading = false,
  isGlobalLearningLoading = false,
  isSensingLearningLoading = false,
  isIntuitiveLearningLoading = false,
  isActiveLearningLoading = false,
  isReflectiveLearningLoading = false
}) => {
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

  // Get real PDF page count
  useEffect(() => {
    const getPDFPageCount = async () => {
      if (!content?.filePath && !content?.url) {
        setIsLoading(false);
        return;
      }

      try {
        const pdfUrl = content.filePath || content.url;
        
        // Use dedicated page count API
        const response = await fetch('/api/pdf-page-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfUrl: pdfUrl
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Page count API response:', result);
          
          if (result.success && result.totalPages) {
            setTotalPages(result.totalPages);
            console.log(`✅ PDF has ${result.totalPages} pages (method: ${result.method})`);
          } else {
            console.warn('API returned success=false or no totalPages:', result);
            setTotalPages(1);
          }
        } else {
          console.error('Page count API failed:', response.status, response.statusText);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error getting PDF page count:', error);
        // Fallback to default
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    getPDFPageCount();
  }, [content]);

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

        {/* Center Section - AI Learning Modes */}
        <div className="flex items-center space-x-2">
          {/* AI Narrator */}
          <button
            onClick={onAITutorClick}
            disabled={isAITutorLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isAITutorLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
            <span className="hidden sm:inline">AI Narrator</span>
          </button>

          {/* Visual Learning */}
          <button
            onClick={onVisualLearningClick}
            disabled={isVisualLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isVisualLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            <span className="hidden sm:inline">Visual Learning</span>
          </button>

          {/* Sequential Learning */}
          <button
            onClick={onSequentialLearningClick}
            disabled={isSequentialLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isSequentialLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className="hidden sm:inline">Sequential</span>
          </button>

          {/* Global Learning */}
          <button
            onClick={onGlobalLearningClick}
            disabled={isGlobalLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isGlobalLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="hidden sm:inline">Global</span>
          </button>

          {/* Sensing Learning */}
          <button
            onClick={onSensingLearningClick}
            disabled={isSensingLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-lg hover:from-teal-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isSensingLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            <span className="hidden sm:inline">Sensing</span>
          </button>

          {/* Intuitive Learning */}
          <button
            onClick={onIntuitiveLearningClick}
            disabled={isIntuitiveLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isIntuitiveLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span className="hidden sm:inline">Intuitive</span>
          </button>

          {/* Active Learning */}
          <button
            onClick={onActiveLearningClick}
            disabled={isActiveLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isActiveLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            )}
            <span className="hidden sm:inline">Active</span>
          </button>

          {/* Reflective Learning */}
          <button
            onClick={onReflectiveLearningClick}
            disabled={isReflectiveLearningLoading}
            className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {isReflectiveLearningLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
            <span className="hidden sm:inline">Reflective</span>
          </button>
        </div>

        {/* Right Section - Zoom and Actions */}
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border rounded-md">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 25}
              className={`p-1.5 transition-colors ${
                zoomLevel <= 25
                  ? 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <span className={`px-2 py-1 text-xs font-medium min-w-[50px] text-center ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {fitMode === 'width' ? 'Fit' : fitMode === 'page' ? 'Page' : `${zoomLevel}%`}
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 300}
              className={`p-1.5 transition-colors ${
                zoomLevel >= 300
                  ? 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

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
          <div className="flex items-center space-x-4">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-xs opacity-75">
              Use ← → keys to navigate • +/- to zoom • F for fullscreen
            </span>
          </div>
          <span>
            {fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : `${zoomLevel}%`} • Clean PDF Viewer
          </span>
        </div>
      </div>
    </div>
  );
};

export default CleanPDFViewer;