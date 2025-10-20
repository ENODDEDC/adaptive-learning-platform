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
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SunIcon,
  MoonIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const CustomPDFViewer = ({ content }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.25);
  const [fitMode, setFitMode] = useState('width'); // 'width', 'page', 'actual'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize PDF.js with fallback approach
  useEffect(() => {
    const initializePDFJS = async () => {
      try {
        // Dynamically import PDF.js to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        
        // Use a more compatible worker setup
        if (typeof window !== 'undefined') {
          try {
            // Try to use the legacy build which is more compatible
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;
          } catch (workerError) {
            console.warn('Worker setup failed, will try without worker:', workerError);
            // Disable worker as fallback - PDF.js can work without it (slower but functional)
            pdfjsLib.GlobalWorkerOptions.workerSrc = null;
          }
        }
        
        return pdfjsLib;
      } catch (err) {
        console.error('Failed to initialize PDF.js:', err);
        setError('Failed to initialize PDF viewer');
        setIsLoading(false);
        return null;
      }
    };

    initializePDFJS();
  }, []);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      if (!content?.filePath && !content?.url) {
        setError('No PDF file provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        const pdfUrl = content.filePath || content.url;
        console.log('Loading PDF from:', pdfUrl);

        // First attempt: Try with worker
        let loadingTask;
        try {
          // Set up worker
          if (typeof window !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;
          }
          
          loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: `https://mozilla.github.io/pdf.js/cmaps/`,
            cMapPacked: true,
            verbosity: 0,
          });
        } catch (workerError) {
          console.warn('Worker failed, trying without worker:', workerError);
          
          // Second attempt: Try without worker (fallback)
          pdfjsLib.GlobalWorkerOptions.workerSrc = null;
          
          loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            verbosity: 0,
            disableWorker: true, // Explicitly disable worker
          });
        }

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);

        console.log('PDF loaded successfully. Pages:', pdf.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
        
        // If PDF.js completely fails, the error fallback will show browser viewer
        setError(`pdf.js loading failed: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(loadPDF, 100);
    return () => clearTimeout(timer);
  }, [content]);

  // Render current page
  const renderPage = useCallback(async (pageNumber) => {
    if (!pdfDocument || !canvasRef.current || pageRendering) return;

    setPageRendering(true);

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Calculate scale based on fit mode and container size
      let scale = zoomLevel;
      
      if (fitMode === 'width' && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40; // Account for padding
        const viewport = page.getViewport({ scale: 1 });
        scale = containerWidth / viewport.width;
      } else if (fitMode === 'page' && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40;
        const containerHeight = containerRef.current.clientHeight - 40;
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        scale = Math.min(scaleX, scaleY);
      } else if (fitMode === 'actual') {
        scale = 1;
      }

      const viewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Apply dark mode filter if enabled
      if (isDarkMode) {
        context.filter = 'invert(1) hue-rotate(180deg)';
      } else {
        context.filter = 'none';
      }

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      console.log(`Page ${pageNumber} rendered successfully`);
    } catch (err) {
      console.error('Error rendering page:', err);
      setError(`Failed to render page: ${err.message}`);
    } finally {
      setPageRendering(false);
    }
  }, [pdfDocument, zoomLevel, fitMode, isDarkMode, pageRendering]);

  // Re-render when page, zoom, or fit mode changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, renderPage]);

  // Handle window resize for fit modes
  useEffect(() => {
    const handleResize = () => {
      if (fitMode === 'width' || fitMode === 'page') {
        renderPage(currentPage);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode, currentPage, renderPage]);

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

  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content.filePath || content.url;
    link.download = content.title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    if (canvasRef.current) {
      const printWindow = window.open('', '_blank');
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL();
      
      printWindow.document.write(`
        <html>
          <head><title>Print PDF</title></head>
          <body style="margin:0;padding:20px;text-align:center;">
            <img src="${dataUrl}" style="max-width:100%;height:auto;" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading PDF document...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing PDF.js viewer</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Fallback to browser's native PDF viewer if PDF.js fails
    const pdfUrl = content.filePath || content.url;
    
    return (
      <div className="flex flex-col h-full">
        {/* Fallback Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              pdf.js failed - Using browser fallback
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        
        {/* Fallback PDF Viewer */}
        <div className="flex-1">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={content.title || 'PDF Document'}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-red-50">
              <div className="text-center p-8 max-w-md">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading PDF</h3>
                <p className="text-red-600 mb-4 text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
            {Math.round(zoomLevel * 100)}%
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

      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      >
        <div className="flex justify-center">
          <div className={`shadow-lg ${isDarkMode ? 'shadow-gray-800' : 'shadow-gray-300'}`}>
            <canvas
              ref={canvasRef}
              className={`max-w-full h-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                display: pageRendering ? 'none' : 'block'
              }}
            />
            {pageRendering && (
              <div className={`flex items-center justify-center w-full h-96 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Rendering page {currentPage}...
                  </p>
                </div>
              </div>
            )}
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
            Zoom: {Math.round(zoomLevel * 100)}% • {fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : 'Custom'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomPDFViewer;