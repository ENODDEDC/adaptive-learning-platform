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
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const EnhancedPowerPointViewer = ({ filePath, fileName, contentId, onClose, isModal = true }) => {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [loadedThumbnails, setLoadedThumbnails] = useState(new Set([0]));

  // Enhanced text display features
  const [showTextPanel, setShowTextPanel] = useState(true);
  const [textPanelPosition, setTextPanelPosition] = useState('bottom'); // 'bottom', 'right', 'overlay'
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);

  const viewerRef = useRef(null);
  const slideContainerRef = useRef(null);

  // Convert PDF to individual slide images using PDF.js
  const convertPdfToSlides = useCallback(async (pdfUrl, pageCount) => {
    try {
      console.log('🔄 Converting PDF to slide images using PDF.js...');
      
      // Dynamically import PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      console.log('📄 PDF loaded successfully, pages:', pdf.numPages);
      
      const slides = [];
      
      // Convert each page to an image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`🖼️ Converting page ${pageNum} to image...`);
          
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to data URL
          const imageUrl = canvas.toDataURL('image/png', 0.9);
          
          // Extract text content from the page (for search functionality)
          let textContent = '';
          try {
            const textContentObj = await page.getTextContent();
            textContent = textContentObj.items
              .map(item => item.str)
              .join(' ')
              .trim();
          } catch (textError) {
            console.warn(`⚠️ Failed to extract text from page ${pageNum}:`, textError);
          }
          
          slides.push({
            slideNumber: pageNum,
            imageUrl: imageUrl,
            text: textContent,
            notes: '', // PDF doesn't contain speaker notes
            hasImages: true, // PDF pages are essentially images
            hasText: !!textContent,
            isPdfPage: true
          });
          
          console.log(`✅ Page ${pageNum} converted successfully`);
          
        } catch (pageError) {
          console.error(`❌ Error converting page ${pageNum}:`, pageError);
          
          // Create error slide
          slides.push({
            slideNumber: pageNum,
            imageUrl: createSlideImage(pageNum, `Error loading page: ${pageError.message}`, false, true),
            text: `Error loading page: ${pageError.message}`,
            notes: '',
            hasImages: false,
            hasText: false,
            error: true,
            isPdfPage: true
          });
        }
      }
      
      console.log(`✅ PDF conversion completed: ${slides.length} slides created`);
      return slides;
      
    } catch (error) {
      console.error('❌ PDF to slides conversion failed:', error);
      throw new Error(`Failed to convert PDF to slides: ${error.message}`);
    }
  }, [createSlideImage]);

  // Create slide image from text content
  const createSlideImage = useCallback((slideNumber, text, hasImages, isError) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Standard slide dimensions (16:9 aspect ratio)
    canvas.width = 1920;
    canvas.height = 1080;

    // Background
    if (isError) {
      // Error slide - red background
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Error border
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Error icon and text
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', canvas.width / 2, canvas.height / 2 - 100);
      
      ctx.fillStyle = '#7f1d1d';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`Slide ${slideNumber} - Error`, canvas.width / 2, canvas.height / 2);
      
      ctx.font = '32px Arial';
      ctx.fillText('Failed to process this slide', canvas.width / 2, canvas.height / 2 + 60);
      
    } else {
      // Normal slide - clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // Header area with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 120);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 120);

      // Header border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(canvas.width, 120);
      ctx.stroke();

      // Slide number
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Slide ${slideNumber}`, 60, 75);

      // Content area
      if (text && text.length > 0) {
        // Split text into words and create lines
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        const maxWidth = canvas.width - 120; // Margins
        
        ctx.font = '42px Arial';
        
        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
          
          if (lines.length >= 18) break; // Limit lines to fit slide
        }
        
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        // Render text lines
        const lineHeight = 52;
        const startY = 200;
        
        lines.forEach((line, index) => {
          const y = startY + (index * lineHeight);
          
          if (index === 0 && lines.length > 1 && line.length < 80) {
            // First line as title if it's short enough
            ctx.font = 'bold 56px Arial';
            ctx.fillStyle = '#0f172a';
          } else {
            // Regular content
            ctx.font = '42px Arial';
            ctx.fillStyle = '#334155';
          }
          
          ctx.textAlign = 'left';
          ctx.fillText(line, 60, y);
        });
        
        // Add indicators for images if present
        if (hasImages) {
          ctx.fillStyle = '#3b82f6';
          ctx.font = '32px Arial';
          ctx.textAlign = 'right';
          ctx.fillText('📷 Contains Images', canvas.width - 60, canvas.height - 100);
        }
        
      } else {
        // No text found
        ctx.fillStyle = '#94a3b8';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No text content found in this slide', canvas.width / 2, canvas.height / 2);
        
        // Placeholder icon
        ctx.font = '120px Arial';
        ctx.fillText('📄', canvas.width / 2, canvas.height / 2 - 100);
      }

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`PowerPoint Slide ${slideNumber}`, 60, canvas.height - 40);
      
      // Timestamp
      ctx.textAlign = 'right';
      ctx.fillText(new Date().toLocaleDateString(), canvas.width - 60, canvas.height - 40);
    }

    return canvas.toDataURL('image/png', 0.9);
  }, []);

  // Fetch PPT data with PDF conversion
  useEffect(() => {
    let isMounted = true;

    const fetchPresentation = async () => {
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

        console.log('🔍 Converting PowerPoint to PDF for exact visual display...');
        console.log('📁 Processing PowerPoint file:', filePathString);
        
        // Use PDF conversion API to get exact PowerPoint visuals
        const response = await fetch(`/api/convert-ppt-to-pdf?filePath=${encodeURIComponent(filePathString)}&contentId=${contentId || ''}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to convert PowerPoint to PDF');
        }

        const result = await response.json();
        
        if (!isMounted) return;
        
        console.log('🎯 PowerPoint to PDF conversion successful:', result);
        console.log('🎯 PDF URL:', result.pdfUrl);
        console.log('🎯 Total pages:', result.pageCount);
        
        if (result.pdfUrl && result.pageCount > 0) {
          // Convert PDF to individual page images using PDF.js
          const pdfSlides = await convertPdfToSlides(result.pdfUrl, result.pageCount);
          setSlides(pdfSlides);
          console.log('✅ PDF slides loaded successfully');
          return;
        } else {
          throw new Error('No PDF was generated from PowerPoint');
        }
        
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ PowerPoint to PDF conversion failed:', err);
        setError(err.message || 'Failed to load presentation');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPresentation();

    return () => {
      isMounted = false;
    };
  }, [filePath, contentId]);

  // Load thumbnail for a specific slide index
  const loadThumbnail = (slideIndex) => {
    if (!loadedThumbnails.has(slideIndex)) {
      setLoadedThumbnails(prev => new Set([...prev, slideIndex]));
    }
  };

  // Enhanced search functionality that searches in text content
  const searchInSlides = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHighlightedText('');
      return;
    }

    const results = [];
    const queryLower = query.toLowerCase();

    slides.forEach((slide, index) => {
      const slideText = slide.text || '';
      const slideNotes = slide.notes || '';
      const slideNumber = index + 1;

      // Search in slide text
      if (slideText.toLowerCase().includes(queryLower)) {
        const textIndex = slideText.toLowerCase().indexOf(queryLower);
        const contextStart = Math.max(0, textIndex - 50);
        const contextEnd = Math.min(slideText.length, textIndex + query.length + 50);
        const context = slideText.substring(contextStart, contextEnd);
        
        results.push({
          slideIndex: index,
          slideNumber: slideNumber,
          title: `Slide ${slideNumber}`,
          preview: `...${context}...`,
          type: 'text',
          matchText: slideText.substring(textIndex, textIndex + query.length)
        });
      }

      // Search in speaker notes
      if (slideNotes.toLowerCase().includes(queryLower)) {
        const notesIndex = slideNotes.toLowerCase().indexOf(queryLower);
        const contextStart = Math.max(0, notesIndex - 50);
        const contextEnd = Math.min(slideNotes.length, notesIndex + query.length + 50);
        const context = slideNotes.substring(contextStart, contextEnd);
        
        results.push({
          slideIndex: index,
          slideNumber: slideNumber,
          title: `Slide ${slideNumber} (Notes)`,
          preview: `...${context}...`,
          type: 'notes',
          matchText: slideNotes.substring(notesIndex, notesIndex + query.length)
        });
      }
    });

    setSearchResults(results);
    setHighlightedText(query);
  }, [slides]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchInSlides(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchInSlides]);

  // Navigation functions
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

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Fullscreen functions
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

  // Helper function to highlight search text
  const highlightText = (text, searchText) => {
    if (!searchText || !text) return text;
    
    const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchText.toLowerCase()) {
        return <span key={index} className="bg-yellow-200 font-semibold">{part}</span>;
      }
      return part;
    });
  };

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

  // Enhanced keyboard navigation with scrolling prevention
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!slides.length) return;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default for all navigation and scrolling keys
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          prevSlide();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    const handleWheel = (e) => {
      // Prevent wheel scrolling entirely in slide container
      if (slideContainerRef.current && slideContainerRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e) => {
      // Prevent touch scrolling in slide container
      if (slideContainerRef.current && slideContainerRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleScroll = (e) => {
      // Prevent any scroll events in slide container
      if (slideContainerRef.current && slideContainerRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add comprehensive event listeners
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: false });

    const slideContainer = slideContainerRef.current;
    if (slideContainer) {
      slideContainer.addEventListener('wheel', handleWheel, { passive: false });
      slideContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      slideContainer.addEventListener('scroll', handleScroll, { passive: false });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      
      if (slideContainer) {
        slideContainer.removeEventListener('wheel', handleWheel);
        slideContainer.removeEventListener('touchmove', handleTouchMove);
        slideContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [slides.length, nextSlide, prevSlide, toggleFullscreen, zoomIn, zoomOut]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-lg p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Presentation</h3>
          <p className="text-gray-600">Extracting slides and text content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Presentation</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!slides.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Slides Found</h3>
        <p className="text-gray-600">This presentation appears to be empty.</p>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      ref={viewerRef}
      className={`bg-white ${isModal ? 'rounded-2xl shadow-2xl' : ''} flex flex-col h-full overflow-hidden`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <DocumentIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {fileName || 'Presentation'}
            </h1>
            <div className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {slides.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Text Panel Toggle */}
          <button
            onClick={() => setShowTextPanel(!showTextPanel)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              showTextPanel ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title={showTextPanel ? 'Hide text panel' : 'Show text panel'}
          >
            <DocumentTextIcon className="w-5 h-5" />
          </button>

          {/* Speaker Notes Toggle */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              showSpeakerNotes ? 'bg-green-100 text-green-600' : ''
            }`}
            title={showSpeakerNotes ? 'Hide speaker notes' : 'Show speaker notes'}
          >
            <SpeakerWaveIcon className="w-5 h-5" />
          </button>

          {/* Auto-play Toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              isAutoPlay ? 'bg-green-100 text-green-600' : ''
            }`}
            title={isAutoPlay ? 'Stop auto-play' : 'Start auto-play'}
          >
            {isAutoPlay ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-lg">
            <button
              onClick={zoomOut}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search in presentation text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto bg-white border rounded-lg shadow-sm">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => goToSlide(result.slideIndex)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
              >
                <div className="font-medium text-sm text-blue-600">{result.title}</div>
                <div className="text-xs text-gray-600 truncate">{result.preview}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div className="w-48 border-r bg-gray-50 overflow-y-auto">
            <div className="p-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Slides</h3>
              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    onMouseEnter={() => loadThumbnail(index)}
                    className={`w-full p-2 rounded-lg border-2 transition-all ${
                      index === currentSlideIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="relative w-full h-20 bg-gray-100 rounded overflow-hidden">
                      {loadedThumbnails.has(index) ? (
                        <img
                          src={slide.imageUrl}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Active indicator */}
                      {index === currentSlideIndex && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none">
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Slide {index + 1}
                      {slide.text && <span className="text-blue-600"> • Text</span>}
                      {slide.notes && <span className="text-green-600"> • Notes</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Slide Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slide Display */}
          <div 
            ref={slideContainerRef}
            className={`flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-hidden no-scrollbar ${
              textPanelPosition === 'bottom' && showTextPanel ? 'flex-[2]' : ''
            }`}
            style={{
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              className="relative max-w-full max-h-full overflow-hidden"
              style={{ 
                transform: `scale(${zoom})`,
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <img
                src={currentSlide.imageUrl}
                alt={`Slide ${currentSlideIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg no-scrollbar"
                style={{ 
                  maxHeight: '70vh',
                  display: 'block',
                  margin: '0 auto'
                }}
                draggable={false}
              />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Text Panel */}
          {showTextPanel && (
            <div className="border-t bg-white p-4 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Slide {currentSlideIndex + 1} Content
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTextPanelPosition(textPanelPosition === 'bottom' ? 'right' : 'bottom')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Change panel position"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowTextPanel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Hide text panel"
                  >
                    <EyeSlashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slide Text */}
              {currentSlide.text ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Slide Text:</h4>
                  <div className="text-sm text-gray-900 leading-relaxed p-3 bg-gray-50 rounded-lg">
                    {highlightText(currentSlide.text, highlightedText)}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                    No text content extracted from this slide.
                  </div>
                </div>
              )}

              {/* Speaker Notes */}
              {showSpeakerNotes && currentSlide.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Speaker Notes:</h4>
                  <div className="text-sm text-gray-900 leading-relaxed p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    {highlightText(currentSlide.notes, highlightedText)}
                  </div>
                </div>
              )}

              {/* Slide Metadata */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
                  {currentSlide.text && <span>• {currentSlide.text.length} characters</span>}
                  {currentSlide.notes && <span>• Has speaker notes</span>}
                  {currentSlide.hasImages && <span>• Contains images</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-lg transition-colors ${
              showThumbnails ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            title={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedPowerPointViewer;