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
import DocumentViewerTour from './DocumentViewerTour';
import { databaseModeToButtonLabel, buttonLabelToDatabaseMode } from '../constants/learningModeLabels';
import { LearningModeToolbarIcon } from '../constants/learningModeUi';

// Hover copy for learning modes (database keys)
const tooltipData = {
  'AI Narrator': {
    description: 'Listen to AI-powered narration of your document. Perfect for auditory learners and multitasking while learning.'
  },
  'Visual Learning': {
    description: 'Transform content into visual formats like diagrams, flowcharts, and infographics. See concepts come to life.'
  },
  'Sequential Learning': {
    description: 'Learn step-by-step in a logical, linear progression. Perfect for building foundational knowledge systematically.'
  },
  'Global Learning': {
    description: 'See the big picture first, then dive into details. Understand how concepts interconnect and relate to each other.'
  },
  'Hands-On Lab': {
    description: 'Learn through practical experiments, real-world examples, and concrete applications. Experience concepts in action.'
  },
  'Concept Constellation': {
    description: 'Discover patterns, explore theories, and make innovative connections. Think abstractly and creatively.'
  },
  'Active Learning Hub': {
    description: 'Engage actively through discussions, problem-solving, and hands-on activities. Learn by doing and experimenting.'
  },
  'Reflective Learning': {
    description: 'Think deeply, observe carefully, and learn through contemplation. Process information thoughtfully before acting.'
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
  isContentEducational = true,
  // Cold start highlighting props
  coldStartActive = false,
  coldStartHighlightMode = null,
  coldStartPanelError = null,
  // Button refs for overlay targeting
  learningModeButtonRefs = { current: {} },
  // PDF Loading callback
  onPdfLoaded = null
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
  const [showTour, setShowTour] = useState(false);

  // AI Health Check state
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [aiHealthError, setAiHealthError] = useState(null);
  const [isCheckingAIHealth, setIsCheckingAIHealth] = useState(true);

  // Recommendation system state
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [pdfTextContent, setPdfTextContent] = useState('');
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);

  // Refs
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const getButtonToDatabaseName = (buttonName) =>
    buttonLabelToDatabaseMode[buttonName] || buttonName;

  const getModeDisplayName = (databaseName) => databaseModeToButtonLabel(databaseName);

  // Helper function to check if a mode should be highlighted by cold start
  const isColdStartHighlighted = (modeDbKey) => {
    if (!coldStartActive || !coldStartHighlightMode || !isContentEducational || coldStartPanelError) return false;
    return coldStartHighlightMode === modeDbKey;
  };

  // Get tour attribute for learning mode buttons
  const getTourAttribute = (dbKey) => {
    const tourMap = {
      'AI Narrator': 'ai-narrator',
      'Visual Learning': 'visual-learning',
      'Sequential Learning': 'step-by-step',
      'Global Learning': 'big-picture',
      'Hands-On Lab': 'hands-on',
      'Concept Constellation': 'theory',
      'Active Learning Hub': 'practice',
      'Reflective Learning': 'reflect'
    };
    return tourMap[dbKey] || '';
  };

  const allModes = [
    { 
      dbKey: 'AI Narrator', 
      name: databaseModeToButtonLabel('AI Narrator'), 
      handler: onAITutorClick, 
      loading: isAITutorLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Visual Learning', 
      name: databaseModeToButtonLabel('Visual Learning'), 
      handler: onVisualLearningClick, 
      loading: isVisualLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Sequential Learning', 
      name: databaseModeToButtonLabel('Sequential Learning'), 
      handler: onSequentialLearningClick, 
      loading: isSequentialLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Global Learning', 
      name: databaseModeToButtonLabel('Global Learning'), 
      handler: onGlobalLearningClick, 
      loading: isGlobalLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Hands-On Lab', 
      name: databaseModeToButtonLabel('Hands-On Lab'), 
      handler: onSensingLearningClick, 
      loading: isSensingLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Concept Constellation', 
      name: databaseModeToButtonLabel('Concept Constellation'), 
      handler: onIntuitiveLearningClick, 
      loading: isIntuitiveLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Active Learning Hub', 
      name: databaseModeToButtonLabel('Active Learning Hub'), 
      handler: onActiveLearningClick, 
      loading: isActiveLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    { 
      dbKey: 'Reflective Learning', 
      name: databaseModeToButtonLabel('Reflective Learning'), 
      handler: onReflectiveLearningClick, 
      loading: isReflectiveLearningLoading, 
      color: 'bg-slate-100 border border-slate-200 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    }
  ];

  const recommendedModeNames = allRecommendations.map(r => getModeDisplayName(r.mode));
  const recommendedButtons = allModes.filter(m => recommendedModeNames.includes(m.name));
  const otherButtons = allModes.filter(m => !recommendedModeNames.includes(m.name));

  // Check AI Health on component mount
  useEffect(() => {
    const checkAIHealth = async () => {
      try {
        setIsCheckingAIHealth(true);
        console.log('🏥 [PDF Viewer] Checking AI service health...');
        
        const response = await fetch('/api/ai-health-check');
        const data = await response.json();
        
        if (data.available) {
          console.log('✅ [PDF Viewer] AI service is available and working');
          setIsAIAvailable(true);
          setAiHealthError(null);
        } else {
          console.warn('⚠️ [PDF Viewer] AI service is unavailable:', data.error);
          setIsAIAvailable(false);
          setAiHealthError(data.error);
        }
      } catch (error) {
        console.error('❌ [PDF Viewer] Failed to check AI health:', error);
        setIsAIAvailable(false);
        setAiHealthError('Unable to connect to AI service');
      } finally {
        setIsCheckingAIHealth(false);
      }
    };

    checkAIHealth();
  }, []);

  // Render a single mode button
  const renderModeButton = (mode, isRecommended = false) => {
    const tooltipKey = mode.dbKey;

    const getTourAttribute = (dbKey) => {
      const tourMap = {
        'AI Narrator': 'ai-narrator',
        'Visual Learning': 'visual-learning',
        'Sequential Learning': 'step-by-step',
        'Global Learning': 'big-picture',
        'Hands-On Lab': 'hands-on',
        'Concept Constellation': 'theory',
        'Active Learning Hub': 'practice',
        'Reflective Learning': 'reflect'
      };
      return tourMap[dbKey] || '';
    };

    return (
      <div key={mode.name} className="relative group">
        <button
          data-tour={getTourAttribute(mode.dbKey)}
          onClick={mode.handler}
          disabled={mode.loading}
          title=""
          onMouseEnter={() => {
            const tooltip = isRecommended
              ? 'Personalized for you: this mode matches your learning style.'
              : tooltipData[tooltipKey]?.description || mode.name;
            setShowTooltip({ mode: mode.name, content: tooltip });
          }}
          onMouseLeave={() => setShowTooltip({ mode: null, content: null })}
          className={`relative flex flex-col items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale min-w-[120px] h-20 ${
            isRecommended 
              ? `${mode.color} ring-2 ring-blue-400 ring-offset-1 shadow-md` 
              : `${mode.color} shadow-sm hover:shadow-md`
          }`}
        >
          {mode.loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          ) : (
            <LearningModeToolbarIcon databaseMode={tooltipKey} className="w-6 h-6 text-slate-600 mb-2" />
          )}
          <span className="text-center leading-tight font-semibold text-slate-700 text-xs">{mode.name}</span>
          {isRecommended && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
        {showTooltip.mode === mode.name && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 z-50 animate-fade-in border border-gray-700">
            <p className="text-gray-200 leading-relaxed text-center">{showTooltip.content}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
        tooltip: 'Personalized for you: this mode matches your learning style based on your behavior.'
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

    // Comprehensive parameters to hide browser PDF viewer UI elements
    params.append('toolbar', '0');        // Hide toolbar
    params.append('navpanes', '0');       // Hide navigation panes
    params.append('scrollbar', '0');      // Hide scrollbar
    params.append('statusbar', '0');      // Hide status bar
    params.append('messages', '0');       // Hide messages
    params.append('view', 'FitH');        // Fit horizontally
    params.append('pagemode', 'none');    // No page mode
    params.append('nameddest', 'none');   // No named destination

    return `${baseUrl}#${params.toString()}`;
  };

  // Get real PDF page count and extract content for recommendations
  useEffect(() => {
    const getPDFPageCount = async () => {
      if (!content?.filePath && !content?.url) {
        setIsLoading(false);
        // Notify parent that PDF is loaded (even if no content)
        if (onPdfLoaded) {
          onPdfLoaded();
        }
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
        // Notify parent that PDF is loaded
        if (onPdfLoaded) {
          onPdfLoaded();
        }
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
      <div className="flex-1 h-full p-4 space-y-3 bg-gray-50">
        {/* PDF Document Skeleton Loading */}
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse w-full mt-4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse w-full mt-4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Left Sidebar - Learning Modes */}
      {isContentEducational && (
        <div className={`w-16 flex flex-col border-r ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} transition-all duration-300 hover:w-48 group`}>
          {/* Sidebar Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Learning Modes</span>
            </div>
          </div>
          
          {/* Learning Mode Buttons */}
          <div data-tour="learning-modes" className="flex-1 p-2 space-y-2 overflow-y-auto">
            {allModes.map(mode => (
              <div key={mode.name} className="relative">
                <button
                  ref={(el) => {
                    if (learningModeButtonRefs.current) {
                      learningModeButtonRefs.current[mode.dbKey] = el;
                    }
                  }}
                  data-tour={getTourAttribute(mode.dbKey)}
                  onClick={mode.handler}
                  disabled={mode.loading}
                  onMouseEnter={() => {
                    const tooltip = recommendedModeNames.includes(mode.name)
                      ? 'Personalized for you: this mode matches your learning style.'
                      : tooltipData[mode.dbKey]?.description || mode.name;
                    setShowTooltip({ mode: mode.name, content: tooltip });
                  }}
                  onMouseLeave={() => setShowTooltip({ mode: null, content: null })}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                    isColdStartHighlighted(mode.dbKey)
                      ? 'bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 border-2 border-purple-400 text-purple-800 shadow-lg transform scale-105 ring-2 ring-purple-300 ring-opacity-50'
                      : recommendedModeNames.includes(mode.name)
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title=""
                >
                  {/* Cold start highlight animation overlay */}
                  {isColdStartHighlighted(mode.dbKey) && (
                    <>
                      {/* Pulsing glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20 animate-pulse rounded-lg"></div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-lg"></div>
                      
                      {/* Floating particles effect */}
                      <div className="absolute top-1 right-1 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="absolute top-2 right-3 w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="absolute top-3 right-2 w-0.5 h-0.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </>
                  )}
                  
                  {mode.loading ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin flex-shrink-0 z-10"></div>
                  ) : (
                    <div className="relative z-10">
                      <LearningModeToolbarIcon 
                        databaseMode={mode.dbKey} 
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                          isColdStartHighlighted(mode.dbKey) 
                            ? 'text-purple-700 drop-shadow-sm animate-pulse' 
                            : 'text-current'
                        }`} 
                      />
                    </div>
                  )}
                  
                  <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden z-10 ${
                    isColdStartHighlighted(mode.dbKey) 
                      ? 'opacity-100 font-semibold text-purple-800' 
                      : ''
                  }`}>
                    {mode.name}
                    {isColdStartHighlighted(mode.dbKey) && (
                      <span className="ml-1 text-xs animate-pulse">← Preview Active</span>
                    )}
                  </span>
                  
                  {/* Enhanced indicator for highlighted mode */}
                  {isColdStartHighlighted(mode.dbKey) && (
                    <div className="flex items-center gap-1 z-10">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    </div>
                  )}
                  
                  {recommendedModeNames.includes(mode.name) && !isColdStartHighlighted(mode.dbKey) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {showTooltip.mode === mode.name && (
                  <div className="absolute left-full ml-2 top-0 w-48 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 z-50 animate-fade-in border border-gray-700 group-hover:hidden">
                    <p className="text-gray-200 leading-relaxed">{showTooltip.content}</p>
                    <div className="absolute right-full top-3 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Tour Button */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTour(true)}
              className="w-full flex items-center gap-2 p-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
              title="Take a tour of learning modes"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Tour</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Personalization Banner */}
        {isContentEducational && hasClassification && topRecommendation && showPersonalizationBanner && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-900">
                  <strong>Personalized for you:</strong> We've loaded{' '}
                  <span className="font-semibold">{getModeDisplayName(topRecommendation.mode)}</span>{' '}
                  based on your learning style. Try other modes in the sidebar!
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

        {/* Top Toolbar - Compact */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Left - File Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Page {currentPage} of {totalPages}</span>
            </div>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border rounded-md bg-gray-50 dark:bg-gray-700">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 25}
                className={`p-1.5 transition-colors ${zoomLevel <= 25
                    ? 'text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-600'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              <span className={`px-2 py-1 text-xs font-medium min-w-[50px] text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {fitMode === 'width' ? 'Fit' : fitMode === 'page' ? 'Page' : `${zoomLevel}%`}
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 300}
                className={`p-1.5 transition-colors ${zoomLevel >= 300
                    ? 'text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-600'
                      : 'text-gray-600 hover:bg-gray-200'
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
              className={`p-1.5 rounded-md transition-colors border ${isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700 border-gray-600' 
                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
              }`}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ?
                <ArrowsPointingInIcon className="w-4 h-4" /> :
                <ArrowsPointingOutIcon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* PDF Display Area */}
        <div className={`flex-1 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="pdf-container w-full h-full p-4">
            <div className={`w-full h-full shadow-lg rounded-lg overflow-hidden ${isDarkMode ? 'shadow-gray-800' : 'shadow-gray-300'}`}>
              <embed
                ref={iframeRef}
                src={getPDFUrl()}
                type="application/pdf"
                title={`PDF Document - Page ${currentPage}`}
                className={`w-full h-full ${isDarkMode ? 'filter invert hue-rotate-180' : ''}`}
                style={{
                  border: 'none',
                  outline: 'none'
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
              <span className="font-medium">
                {content.title || 'PDF Document'}
              </span>
              <span className="text-xs opacity-75">
                Use ← → keys to navigate • +/- to zoom • F for fullscreen
              </span>
            </div>
            <span className="text-xs">
              {fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : `${zoomLevel}%`} • Clean PDF Viewer
            </span>
          </div>
        </div>
      </div>

      {/* Document Viewer Tour */}
      <DocumentViewerTour show={showTour} onComplete={() => setShowTour(false)} />
    </div>
  );
};

export default CleanPDFViewer;