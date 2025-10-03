'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  XMarkIcon,
  PencilIcon,
  BookmarkIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const EnhancedPDFViewer = ({ content }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(125);
  const [fitMode, setFitMode] = useState('width'); // 'width', 'page', 'actual'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const iframeRef = useRef(null);
  const searchInputRef = useRef(null);

  // PDF URL with parameters
  const getPDFUrl = useCallback(() => {
    const baseUrl = content.filePath || content.url;
    const params = new URLSearchParams();
    
    // Add PDF.js viewer parameters
    params.append('page', currentPage.toString());
    params.append('zoom', zoomLevel.toString());
    
    if (fitMode === 'width') params.append('zoom', 'page-width');
    if (fitMode === 'page') params.append('zoom', 'page-fit');
    if (fitMode === 'actual') params.append('zoom', '100');
    
    return `${baseUrl}#${params.toString()}`;
  }, [content, currentPage, zoomLevel, fitMode]);

  // Initialize PDF viewer
  useEffect(() => {
    const initializePDF = async () => {
      setIsLoading(true);
      try {
        // Simulate PDF loading and page count detection
        // In a real implementation, you'd use PDF.js to get actual page count
        setTotalPages(10); // Placeholder - would be detected from actual PDF
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };

    if (content) {
      initializePDF();
    }
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
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }
          break;
        case 'Escape':
          setIsSearchOpen(false);
          setIsSettingsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

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
    setZoomLevel(Math.min(500, zoomLevel + 25));
    setFitMode('custom');
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(25, zoomLevel - 25));
    setFitMode('custom');
  };

  const handleFitWidth = () => {
    setFitMode('width');
    setZoomLevel(125); // Default for width fit
  };

  const handleFitPage = () => {
    setFitMode('page');
    setZoomLevel(100); // Default for page fit
  };

  const handleActualSize = () => {
    setFitMode('actual');
    setZoomLevel(100);
  };

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Simulate search results - in real implementation, use PDF.js search
    const mockResults = [
      { page: 1, text: query, position: { x: 100, y: 200 } },
      { page: 3, text: query, position: { x: 150, y: 300 } },
      { page: 5, text: query, position: { x: 200, y: 150 } }
    ];
    
    setSearchResults(mockResults);
    setCurrentSearchResult(0);
    
    if (mockResults.length > 0) {
      setCurrentPage(mockResults[0].page);
    }
  };

  const handleSearchNext = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchResult + 1) % searchResults.length;
      setCurrentSearchResult(nextIndex);
      setCurrentPage(searchResults[nextIndex].page);
    }
  };

  const handleSearchPrevious = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchResult === 0 ? searchResults.length - 1 : currentSearchResult - 1;
      setCurrentSearchResult(prevIndex);
      setCurrentPage(searchResults[prevIndex].page);
    }
  };

  // Download and print handlers
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content.filePath || content.url;
    link.download = content.title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  // Annotation handlers
  const handleAddAnnotation = (type, position) => {
    const newAnnotation = {
      id: Date.now(),
      type,
      page: currentPage,
      position,
      content: '',
      timestamp: new Date().toISOString()
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleAddBookmark = () => {
    const newBookmark = {
      id: Date.now(),
      page: currentPage,
      title: `Page ${currentPage}`,
      timestamp: new Date().toISOString()
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading PDF document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading PDF</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Toolbar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Left Section - File Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`font-medium truncate max-w-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {content.title || 'PDF Document'}
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
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          
          <select
            value={fitMode === 'custom' ? zoomLevel : fitMode}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'width') handleFitWidth();
              else if (value === 'page') handleFitPage();
              else if (value === 'actual') handleActualSize();
              else {
                setZoomLevel(parseInt(value));
                setFitMode('custom');
              }
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
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
            <option value="300">300%</option>
          </select>
          
          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-1.5 rounded-md transition-colors ${
              isSearchOpen
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>

          {/* Annotation Toggle */}
          <button
            onClick={() => setIsAnnotationMode(!isAnnotationMode)}
            className={`p-1.5 rounded-md transition-colors ${
              isAnnotationMode
                ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PencilIcon className="w-4 h-4" />
          </button>

          {/* Bookmark */}
          <button
            onClick={handleAddBookmark}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PrinterIcon className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-1.5 rounded-md transition-colors ${
              isSettingsOpen
                ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className={`px-4 py-3 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <MagnifyingGlassIcon className={`absolute right-3 top-2.5 w-4 h-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentSearchResult + 1} of {searchResults.length}
                </span>
                <button
                  onClick={handleSearchPrevious}
                  className={`p-1 rounded ${
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSearchNext}
                  className={`p-1 rounded ${
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={() => setIsSearchOpen(false)}
              className={`p-1 rounded ${
                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={getPDFUrl()}
          className="w-full h-full border-0"
          title={content.title || 'PDF Document'}
          style={{
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'
          }}
        />

        {/* Annotation Overlay */}
        {isAnnotationMode && (
          <div className="absolute inset-0 pointer-events-none">
            {annotations
              .filter(annotation => annotation.page === currentPage)
              .map(annotation => (
                <div
                  key={annotation.id}
                  className="absolute w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 pointer-events-auto cursor-pointer"
                  style={{
                    left: annotation.position.x,
                    top: annotation.position.y
                  }}
                  title={annotation.content || 'Annotation'}
                />
              ))}
          </div>
        )}

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className={`absolute top-4 right-4 w-80 rounded-lg shadow-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  PDF Settings
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className={`p-1 rounded ${
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* View Options */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  View Mode
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'width', label: 'Fit to Width' },
                    { value: 'page', label: 'Fit to Page' },
                    { value: 'actual', label: 'Actual Size' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="fitMode"
                        value={option.value}
                        checked={fitMode === option.value}
                        onChange={(e) => {
                          if (e.target.value === 'width') handleFitWidth();
                          else if (e.target.value === 'page') handleFitPage();
                          else if (e.target.value === 'actual') handleActualSize();
                        }}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bookmarks */}
              {bookmarks.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bookmarks
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {bookmarks.map(bookmark => (
                      <button
                        key={bookmark.id}
                        onClick={() => setCurrentPage(bookmark.page)}
                        className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-opacity-50 ${
                          isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        📖 {bookmark.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyboard Shortcuts */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Keyboard Shortcuts
                </label>
                <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div>← → : Navigate pages</div>
                  <div>+ - : Zoom in/out</div>
                  <div>Ctrl+F : Search</div>
                  <div>Esc : Close panels</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;