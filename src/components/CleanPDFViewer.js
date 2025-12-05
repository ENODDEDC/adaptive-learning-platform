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
  ArrowsPointingInIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import learningModeRecommendationService from '../services/learningModeRecommendationService';

// Tooltip data for learning modes
const tooltipData = {
  'AI Narrator': {
    title: 'AI Narrator',
    description: 'Listen to AI-powered narration of your document. Perfect for auditory learners and multitasking while learning.',
    icon: '🎙️'
  },
  'Visual Learning': {
    title: 'Visual Learning',
    description: 'Transform content into visual formats like diagrams, flowcharts, and infographics. See concepts come to life.',
    icon: '🎨'
  },
  'Sequential Learning': {
    title: 'Sequential Learning',
    description: 'Learn step-by-step in a logical, linear progression. Perfect for building foundational knowledge systematically.',
    icon: '📚'
  },
  'Global Learning': {
    title: 'Global Learning',
    description: 'See the big picture first, then dive into details. Understand how concepts interconnect and relate to each other.',
    icon: '🌍'
  },
  'Hands-On Lab': {
    title: 'Hands-On Lab (Sensing)',
    description: 'Learn through practical experiments, real-world examples, and concrete applications. Experience concepts in action.',
    icon: '🧪'
  },
  'Concept Constellation': {
    title: 'Concept Constellation (Intuitive)',
    description: 'Discover patterns, explore theories, and make innovative connections. Think abstractly and creatively.',
    icon: '👁️'
  },
  'Active Learning Hub': {
    title: 'Active Learning Hub',
    description: 'Engage actively through discussions, problem-solving, and hands-on activities. Learn by doing and experimenting.',
    icon: '✋'
  },
  'Reflective Learning': {
    title: 'Reflective Learning Processor',
    description: 'Think deeply, observe carefully, and learn through contemplation. Process information thoughtfully before acting.',
    icon: '🤔'
  }
};

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
  isReflectiveLearningLoading = false,
  // ML Recommendations props
  topRecommendation = null,
  allRecommendations = [],
  hasClassification = false,
  // Content Educational Status
  isContentEducational = true
}) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(125);
  const [fitMode, setFitMode] = useState('width');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState({ mode: null, content: null });
  const [showPersonalizationBanner, setShowPersonalizationBanner] = useState(true);
  const [showMoreModes, setShowMoreModes] = useState(false);

  // Recommendation system state
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [pdfTextContent, setPdfTextContent] = useState('');
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);

  // Refs
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Convert button display names to database names for matching
  const getButtonToDatabaseName = (buttonName) => {
    const nameMap = {
      'AI Narrator': 'AI Narrator',
      'Visual Learning': 'Visual Learning',
      'Step-by-Step': 'Sequential Learning',
      'Big Picture': 'Global Learning',
      'Hands-On': 'Hands-On Lab',
      'Theory': 'Concept Constellation',
      'Practice': 'Active Learning Hub',
      'Reflect': 'Reflective Learning'
    };
    return nameMap[buttonName] || buttonName;
  };

  // Convert database names to button display names
  const getModeDisplayName = (databaseName) => {
    const nameMap = {
      'AI Narrator': 'AI Narrator',
      'Visual Learning': 'Visual Learning',
      'Sequential Learning': 'Step-by-Step',
      'Global Learning': 'Big Picture',
      'Hands-On Lab': 'Hands-On',
      'Concept Constellation': 'Theory',
      'Active Learning Hub': 'Practice',
      'Reflective Learning': 'Reflect'
    };
    return nameMap[databaseName] || databaseName;
  };

  // Organize modes into recommended and other
  const allModes = [
    { name: 'AI Narrator', handler: onAITutorClick, loading: isAITutorLoading, color: 'from-purple-500 to-indigo-600' },
    { name: 'Visual Learning', handler: onVisualLearningClick, loading: isVisualLearningLoading, color: 'from-green-500 to-emerald-600' },
    { name: 'Step-by-Step', handler: onSequentialLearningClick, loading: isSequentialLearningLoading, color: 'from-blue-500 to-cyan-600' },
    { name: 'Big Picture', handler: onGlobalLearningClick, loading: isGlobalLearningLoading, color: 'from-orange-500 to-red-600' },
    { name: 'Hands-On', handler: onSensingLearningClick, loading: isSensingLearningLoading, color: 'from-teal-500 to-green-600' },
    { name: 'Theory', handler: onIntuitiveLearningClick, loading: isIntuitiveLearningLoading, color: 'from-pink-500 to-rose-600' },
    { name: 'Practice', handler: onActiveLearningClick, loading: isActiveLearningLoading, color: 'from-yellow-500 to-orange-600' },
    { name: 'Reflect', handler: onReflectiveLearningClick, loading: isReflectiveLearningLoading, color: 'from-indigo-500 to-purple-600' }
  ];

  const recommendedModeNames = allRecommendations.map(r => getModeDisplayName(r.mode));
  const recommendedButtons = allModes.filter(m => recommendedModeNames.includes(m.name));
  const otherButtons = allModes.filter(m => !recommendedModeNames.includes(m.name));

  // Render a single mode button
  const renderModeButton = (mode, isRecommended = false) => {
    const tooltipKey = mode.name === 'Step-by-Step' ? 'Sequential Learning' :
                       mode.name === 'Big Picture' ? 'Global Learning' :
                       mode.name === 'Hands-On' ? 'Hands-On Lab' :
                       mode.name === 'Theory' ? 'Concept Constellation' :
                       mode.name === 'Practice' ? 'Active Learning Hub' :
                       mode.name === 'Reflect' ? 'Reflective Learning' :
                       mode.name;

    return (
      <div key={mode.name} className="relative group">
        <button
          onClick={mode.handler}
          disabled={mode.loading}
          onMouseEnter={() => {
            const tooltip = isRecommended 
              ? '🎯 ML Personalized: This mode matches your learning style'
              : tooltipData[tooltipKey]?.description || mode.name;
            setShowTooltip({ mode: mode.name, content: tooltip });
          }}
          onMouseLeave={() => setShowTooltip({ mode: null, content: null })}
          className={`relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${mode.color} text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 text-sm ${isRecommended ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
        >
          {mode.loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-lg">{tooltipData[tooltipKey]?.icon || '📚'}</span>
          )}
          <span className="hidden sm:inline font-medium">{mode.name}</span>
          {isRecommended && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        {showTooltip.mode === mode.name && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 z-50 animate-fade-in">
            <p className="text-gray-300 leading-relaxed">{showTooltip.content}</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  // Fetch ML personalized recommendations
  useEffect(() => {
    async function fetchPersonalizedRecs() {
      try {
        const response = await fetch('/api/learning-style/profile');
        if (response.ok) {
          const data = await response.json();
          
          // Try different possible data structures
          let modes = [];
          if (data.profile?.recommendedModes) {
            modes = data.profile.recommendedModes.map(r => r.mode);
          } else if (data.data?.profile?.recommendedModes) {
            modes = data.data.profile.recommendedModes.map(r => r.mode);
          } else if (data.recommendedModes) {
            modes = data.recommendedModes.map(r => r.mode);
          }
          
          setPersonalizedRecommendations(modes);
        }
      } catch (error) {
        console.log('No ML recommendations available yet');
      }
    }
    fetchPersonalizedRecs();
  }, []);

  // Helper function to determine recommendation type and styling
  const getRecommendationStyle = (buttonDisplayName) => {
    // ONLY show ML personalized recommendations (no content-based)
    // ML personalized recommendations use database names (e.g., "Sequential Learning", "Hands-On Lab")
    const databaseName = getButtonToDatabaseName(buttonDisplayName);
    const isPersonalized = personalizedRecommendations.includes(databaseName);

    if (isPersonalized) {
      return {
        ring: 'ring-2 ring-green-500 ring-offset-2',
        tooltip: '🎯 ML Personalized: This mode matches your learning style based on your behavior'
      };
    }
    return { ring: '', tooltip: '' };
  };

  // Helper function to check if a mode is recommended (for backward compatibility)
  const isRecommended = (modeName) => {
    const style = getRecommendationStyle(modeName);
    return style.ring !== '';
  };

  // Get recommendation reason
  const getRecommendationReason = (modeName) => {
    const rec = recommendations.find(r => r.mode === modeName);
    return rec?.reason || '';
  };

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

  // Get real PDF page count and extract content for recommendations
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

        // Extract PDF text content for recommendations
        try {
          const extractResponse = await fetch('/api/pdf-extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileKey: content.cloudStorage?.key,
              filePath: content.filePath
            }),
          });

          if (extractResponse.ok) {
            const extractResult = await extractResponse.json();
            if (extractResult.content && extractResult.content.rawText) {
              setPdfTextContent(extractResult.content.rawText);
              console.log('✅ PDF content extracted for recommendations:', extractResult.content.rawText.length, 'characters');
            }
          }
        } catch (extractError) {
          console.log('⚠️ Could not extract PDF content for recommendations:', extractError);
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

  // Content-based recommendations DISABLED - only using ML personalized recommendations
  // This ensures exactly 4 recommendations (from Settings) are shown

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
      {/* Personalization Banner */}
      {isContentEducational && hasClassification && topRecommendation && showPersonalizationBanner && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-900">
                <strong>Personalized for you:</strong> We've loaded{' '}
                <span className="font-semibold">{getModeDisplayName(topRecommendation.mode)}</span>{' '}
                based on your learning style. Try other modes below!
              </p>
            </div>
            <button 
              onClick={() => setShowPersonalizationBanner(false)} 
              className="text-green-600 hover:text-green-800 transition-colors p-1"
              title="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Toolbar - Clean Design */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        {/* Left/Center Section - Smart AI Learning Modes */}
        {isContentEducational && (
          <div className="flex items-center space-x-2">
            {hasClassification && recommendedButtons.length > 0 ? (
              <>
                {/* Recommended Modes - Prominent */}
                {recommendedButtons.map(mode => renderModeButton(mode, true))}
                
                {/* Other Modes - Dropdown */}
                {otherButtons.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreModes(!showMoreModes)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <span>More</span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${showMoreModes ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showMoreModes && (
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
                        {otherButtons.map(mode => (
                          <button
                            key={mode.name}
                            onClick={() => {
                              mode.handler();
                              setShowMoreModes(false);
                            }}
                            disabled={mode.loading}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <span className="text-lg">{tooltipData[mode.name === 'Step-by-Step' ? 'Sequential Learning' : mode.name === 'Big Picture' ? 'Global Learning' : mode.name === 'Hands-On' ? 'Hands-On Lab' : mode.name === 'Theory' ? 'Concept Constellation' : mode.name === 'Practice' ? 'Active Learning Hub' : mode.name === 'Reflect' ? 'Reflective Learning' : mode.name]?.icon || '📚'}</span>
                            <span className="font-medium">{mode.name}</span>
                            {mode.loading && (
                              <div className="ml-auto w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* No classification - Show all 8 modes equally */
              allModes.map(mode => renderModeButton(mode, false))
            )}
          </div>
        )}

        {/* Right Section - Zoom and Actions */}
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border rounded-md">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 25}
              className={`p-1.5 transition-colors ${zoomLevel <= 25
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

            <span className={`px-2 py-1 text-xs font-medium min-w-[50px] text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              {fitMode === 'width' ? 'Fit' : fitMode === 'page' ? 'Page' : `${zoomLevel}%`}
            </span>

            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 300}
              className={`p-1.5 transition-colors ${zoomLevel >= 300
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
            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
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
            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            title="Print PDF"
          >
            <PrinterIcon className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            title="Download PDF"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
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
          <div className={`w-full h-full shadow-lg rounded-lg overflow-hidden ${isDarkMode ? 'shadow-gray-800' : 'shadow-gray-300'
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
      <div className={`px-4 py-2 border-t text-sm ${isDarkMode
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