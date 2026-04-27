'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  SparklesIcon,
  AcademicCapIcon,
  XMarkIcon,
  BookOpenIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import AITutorModal from './AITutorModal';
import CleanPDFViewer from './CleanPDFViewer';
import VisualDocxOverlay from './VisualDocxOverlay';
import SequentialLearning from './SequentialLearning';
import GlobalLearning from './GlobalLearning';
import { getAttachmentFileUrl } from '@/utils/thumbnailUtils';
import SensingLearning from './SensingLearning';
import IntuitiveLearning from './IntuitiveLearning';
import ActiveLearning from './ActiveLearning';
import ReflectiveLearning from './ReflectiveLearning';
import MermaidDiagram from './MermaidDiagram';
import CacheIndicator from './CacheIndicator';
import ColdStartInterestOverlay from './ColdStartInterestOverlay';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';
import { useColdStartInterestTracking } from '@/hooks/useColdStartInterestTracking';
import { databaseModeToButtonLabel } from '@/constants/learningModeLabels';

/**
 * PDF Preview Component with AI Narrator Integration
 * This component wraps the PDF preview and adds AI Narrator functionality
 */
const PdfPreviewWithAI = ({
  content,
  pdfUrl,
  notes = [],
  injectOverrideStyles,
  disableTools = false
}) => {
  const [showAITutor, setShowAITutor] = useState(false);
  const [showVisualContent, setShowVisualContent] = useState(false);
  const [activeVisualType, setActiveVisualType] = useState('diagram');
  const [showSequentialLearning, setShowSequentialLearning] = useState(false);
  const [showGlobalLearning, setShowGlobalLearning] = useState(false);
  const [showSensingLearning, setShowSensingLearning] = useState(false);
  const [showIntuitiveLearning, setShowIntuitiveLearning] = useState(false);
  const [showActiveLearning, setShowActiveLearning] = useState(false);
  const [showReflectiveLearning, setShowReflectiveLearning] = useState(false);
  const [pdfContent, setPdfContent] = useState('');
  const [isAITutorLoading, setIsAITutorLoading] = useState(false);
  const [isVisualLearningLoading, setIsVisualLearningLoading] = useState(false);
  const [isSequentialLearningLoading, setIsSequentialLearningLoading] = useState(false);
  const [isGlobalLearningLoading, setIsGlobalLearningLoading] = useState(false);
  const [globalLearningStatusMessage, setGlobalLearningStatusMessage] = useState('');
  const [isSensingLearningLoading, setIsSensingLearningLoading] = useState(false);
  const [isIntuitiveLearningLoading, setIsIntuitiveLearningLoading] = useState(false);
  const [isActiveLearningLoading, setIsActiveLearningLoading] = useState(false);
  const [isReflectiveLearningLoading, setIsReflectiveLearningLoading] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [visualLearningError, setVisualLearningError] = useState('');
  const [sequentialLearningError, setSequentialLearningError] = useState('');
  const [globalLearningError, setGlobalLearningError] = useState('');
  const [sensingLearningError, setSensingLearningError] = useState('');
  const [intuitiveLearningError, setIntuitiveLearningError] = useState('');
  const [activeLearningError, setActiveLearningError] = useState('');
  const [reflectiveLearningError, setReflectiveLearningError] = useState('');
  const [aiTutorActive, setAiTutorActive] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentConcept, setCurrentConcept] = useState('');
  const [tutorMode, setTutorMode] = useState('');
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);

  // Cache indicator state
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // ML Recommendations state
  const [topRecommendation, setTopRecommendation] = useState(null);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [hasClassification, setHasClassification] = useState(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  // Cold Start: right panel for new users (no classification yet)
  const [coldStartPanelContent, setColdStartPanelContent] = useState(null);
  const [coldStartPanelCache, setColdStartPanelCache] = useState({}); // Cache for generated modes
  const [coldStartPanelLoading, setColdStartPanelLoading] = useState(false);
  const [coldStartPanelMode, setColdStartPanelMode] = useState('Global Learning'); // default mode
  const [coldStartDismissed, setColdStartDismissed] = useState(false);
  const coldStartModeQueue = ['Global Learning', 'Sequential Learning', 'Visual Learning', 'Hands-On Lab', 'Concept Constellation', 'Active Learning Hub', 'Reflective Learning'];
  const [coldStartModeIndex, setColdStartModeIndex] = useState(0);
  const [showPdfView, setShowPdfView] = useState(false); // Start with generated content view when mode is active
  const [willAutoLoad, setWillAutoLoad] = useState(false); // Track if we're going to auto-load a mode
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0); // Track current position in carousel
  const [filteredRecommendations, setFilteredRecommendations] = useState([]); // Recommendations excluding AI Narrator
  const [errorSource, setErrorSource] = useState('manual'); // Track if error is from 'auto-load' or 'manual' click
  const [isContentEducational, setIsContentEducational] = useState(true); // Track if content is educational (default true until analyzed)
  const [analysisMeta, setAnalysisMeta] = useState({ method: null, confidence: null, contentType: null, verified: false, unavailableReason: null, reasoning: null, evidence: [] });
  const [showAnalysisToast, setShowAnalysisToast] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false); // Track when PDF is fully loaded
  const [recommendationPanelCollapsed, setRecommendationPanelCollapsed] = useState(false);
  const isVerifiedNonEducationalError = analysisMeta.verified === true && isContentEducational === false;

  // Automatic time tracking for ML classification
  useLearningModeTracking('aiNarrator', aiTutorActive);
  useLearningModeTracking('visualLearning', showVisualContent);

  // Cold Start Interest Tracking
  const {
    shouldShowOverlay,
    overlayTriggeredFor,
    interestData,
    handleScroll,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    dismissOverlay,
    getCurrentModeData
  } = useColdStartInterestTracking(
    coldStartPanelMode,
    !hasClassification && !coldStartDismissed && coldStartPanelContent
  );

  // Refs for learning mode buttons (for overlay targeting)
  const learningModeButtonRefs = useRef({});

  // Cold Start: auto-generate right panel for new users
  useEffect(() => {
    if (!hasClassification && !coldStartDismissed && !coldStartPanelContent && !coldStartPanelLoading && pdfUrl) {
      triggerColdStartPanel(coldStartModeQueue[0]);
    }
  }, [hasClassification, coldStartDismissed, pdfUrl]);

  // Reset PDF loaded state when content changes
  useEffect(() => {
    setIsPdfLoaded(false);
  }, [pdfUrl, content]);

  const triggerColdStartPanel = async (modeName) => {
    // Check cache first
    if (coldStartPanelCache[modeName]) {
      setColdStartPanelMode(modeName);
      setColdStartPanelContent(coldStartPanelCache[modeName]);
      return;
    }

    setColdStartPanelLoading(true);
    setColdStartPanelMode(modeName);
    try {
      // Extract PDF content if not already done
      const textContent = pdfContent || await extractPdfContent();
      if (!textContent || !textContent.trim()) {
        setColdStartPanelLoading(false);
        return;
      }
      const response = await fetch('/api/generate-cold-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: textContent, 
          mode: modeName, 
          title: content?.title || '',
          contentId: content?._id || content?.id || (typeof content === 'string' ? content : null)
        })
      });
      if (response.ok) {
        const data = await response.json();
        const generatedContent = data.content || '';
        setColdStartPanelContent(generatedContent);
        
        // Show cache indicator if it came from DB
        if (data.isCached) {
          setIsCached(true);
          setShowCacheIndicator(true);
          // Auto-hide after 2 seconds
          setTimeout(() => setShowCacheIndicator(false), 2000);
        }

        // Store in local cache for this session
        setColdStartPanelCache(prev => ({
          ...prev,
          [modeName]: generatedContent
        }));
      }
    } catch (e) {
      console.error('Cold start panel error:', e);
    } finally {
      setColdStartPanelLoading(false);
    }
  };

  // Set data attribute for conditional styling based on ML recommendations
  useEffect(() => {
    if (hasClassification && filteredRecommendations.length > 0) {
      document.body.setAttribute('data-has-ml-nav', 'true');
    } else {
      document.body.removeAttribute('data-has-ml-nav');
    }
    return () => {
      document.body.removeAttribute('data-has-ml-nav');
    };
  }, [hasClassification, filteredRecommendations.length]);

  // Clear willAutoLoad flag when any mode starts loading
  useEffect(() => {
    if (isVisualLearningLoading || isSequentialLearningLoading || isGlobalLearningLoading ||
      isSensingLearningLoading || isIntuitiveLearningLoading || isActiveLearningLoading ||
      isReflectiveLearningLoading) {
      setWillAutoLoad(false);
    }
  }, [isVisualLearningLoading, isSequentialLearningLoading, isGlobalLearningLoading,
    isSensingLearningLoading, isIntuitiveLearningLoading, isActiveLearningLoading,
    isReflectiveLearningLoading]);

  // Proactively extract PDF content when we know we'll auto-load
  useEffect(() => {
    if (willAutoLoad && !pdfContent && topRecommendation) {
      console.log('📄 Proactively extracting PDF content for auto-load...');
      extractPdfContent().catch(error => {
        console.error('❌ Failed to extract PDF content:', error);
        setWillAutoLoad(false); // Clear flag on error
      });
    }
  }, [willAutoLoad, pdfContent, topRecommendation]);

  // Fetch ML recommendations on mount
  useEffect(() => {
    async function fetchRecommendations() {
      try {
        console.log('🎯 Fetching ML recommendations...');
        const response = await fetch('/api/learning-style/profile');
        if (response.ok) {
          const data = await response.json();
          const profile = data.data?.profile || data.profile || {};
          const modes = profile.recommendedModes ||
            data.profile?.recommendedModes ||
            data.data?.profile?.recommendedModes ||
            data.recommendedModes || [];
          const hasBeenClassified = profile.hasBeenClassified === true;

          console.log('📊 Recommendations received:', modes, 'classified:', hasBeenClassified);

          if (modes.length > 0 && hasBeenClassified) {
            setAllRecommendations(modes);

            // Include ALL modes in carousel (including AI Narrator)
            setFilteredRecommendations(modes);
            console.log('🎠 Carousel recommendations (including AI Narrator):', modes.length);

            // For auto-load, skip AI Narrator and use first non-AI-Narrator mode
            const firstNonAudioMode = modes.find(mode => mode.mode !== 'AI Narrator');

            if (firstNonAudioMode) {
              setTopRecommendation(firstNonAudioMode);
              setHasClassification(true);
              // Find index of first non-audio mode in the full list
              const autoLoadIndex = modes.findIndex(mode => mode.mode === firstNonAudioMode.mode);
              setCurrentRecommendationIndex(autoLoadIndex);
              console.log('✅ Top recommendation for auto-load:', firstNonAudioMode.mode, 'at index', autoLoadIndex);

              setWillAutoLoad(true);
              console.log('🎬 Will auto-load:', firstNonAudioMode.mode);
            } else if (modes.length > 0) {
              // All modes are AI Narrator (unlikely but handle it)
              setTopRecommendation(modes[0]);
              setHasClassification(true);
              setCurrentRecommendationIndex(0);
              console.log('ℹ️ Only AI Narrator available, will show PDF view');
            }
          } else if (modes.length > 0 && !hasBeenClassified) {
            console.log('ℹ️ Recommendations exist but learning style not classified yet — skip auto-load / ML chrome');
          } else {
            console.log('ℹ️ No recommendations available (user not classified yet)');
          }
        }
      } catch (error) {
        console.log('⚠️ Could not fetch ML recommendations:', error);
      }
    }
    fetchRecommendations();
  }, []);

  function activateRecommendationAtIndex(targetIndex) {
    if (filteredRecommendations.length === 0) return;

    const targetRecommendation = filteredRecommendations[targetIndex];
    if (!targetRecommendation) return;

    setCurrentRecommendationIndex(targetIndex);
    setShowVisualContent(false);
    setShowSequentialLearning(false);
    setShowGlobalLearning(false);
    setShowSensingLearning(false);
    setShowIntuitiveLearning(false);
    setShowActiveLearning(false);
    setShowReflectiveLearning(false);
    setShowPdfView(false);

    if (targetRecommendation.mode === 'AI Narrator') {
      setTimeout(() => handleAITutorClick(), 100);
      return;
    }

    const modeHandlers = {
      'Visual Learning': handleVisualContentClick,
      'Sequential Learning': handleSequentialLearningClick,
      'Global Learning': handleGlobalLearningClick,
      'Hands-On Lab': handleSensingLearningClick,
      'Concept Constellation': handleIntuitiveLearningClick,
      'Active Learning Hub': handleActiveLearningClick,
      'Reflective Learning': handleReflectiveLearningClick
    };

    const handler = modeHandlers[targetRecommendation.mode];
    if (handler) {
      setTimeout(() => handler(), 100);
    }
  }

  const visibleRecommendationTabs = filteredRecommendations.slice(0, 4);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/ai-health-check');
        const data = await response.json();
        if (cancelled) return;
        setIsAIAvailable(!!data.available);
      } catch {
        if (!cancelled) setIsAIAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-load top recommendation after PDF content is extracted (EXCEPT AI Narrator)
  useEffect(() => {
    if (!topRecommendation || !pdfContent || autoLoadAttempted) return;
    
    // Don't auto-load if AI is unavailable
    if (!isAIAvailable) {
      console.log('⚠️ Skipping auto-load: AI service is unavailable');
      setAutoLoadAttempted(true);
      setShowPdfView(true); // Show PDF view by default
      setWillAutoLoad(false); // Otherwise loading overlay stays forever (willAutoLoad + !hasActiveLearningMode)
      return;
    }

    // Skip AI Narrator - it's audio-based and shouldn't auto-load
    if (topRecommendation.mode === 'AI Narrator') {
      console.log('⏭️ Skipping auto-load for AI Narrator (audio-based mode)');
      setAutoLoadAttempted(true);
      setShowPdfView(true); // Show PDF view by default for AI Narrator
      setWillAutoLoad(false); // Clear the flag
      return;
    }

    console.log('🚀 Auto-loading top recommendation:', topRecommendation.mode);
    setAutoLoadAttempted(true);
    setShowPdfView(false); // Show generated content by default for other modes

    // IMPORTANT: Analyze content FIRST before auto-loading
    const autoLoadWithAnalysis = async () => {
      try {
        console.log('🔍 Analyzing content before auto-load...');
        const analysisResult = await analyzeContentForEducational(pdfContent);

        console.log('📊 Auto-load analysis result:', {
          isEducational: analysisResult.isEducational,
          confidence: analysisResult.confidence,
          mode: topRecommendation.mode
        });

        // Gate error (Groq 400, etc.): never treat as "non-educational" or hide mode buttons
        if (analysisResult.verified !== true) {
          console.warn('⚠️ Educational gate unavailable during auto-load — skipping auto-open, keeping modes visible');
          setIsContentEducational(true);
          setWillAutoLoad(false);
          setShowPdfView(true);
          return;
        }

        // Only block when the model actually returned a negative verdict
        if (!analysisResult.isEducational) {
          console.log('⚠️ Non-educational content detected during auto-load - showing notification');

          const errorMessage = `This document does not appear to contain educational or learning material suitable for AI learning features.

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

AI learning features work best with instructional content, lessons, or study materials.`;

          setIsContentEducational(false); // Mark content as non-educational - hide AI buttons
          setErrorSource('auto-load'); // Mark this error as coming from auto-load
          setExtractionError(errorMessage);
          setShowPdfView(true); // Show PDF view since AI features won't work
          setWillAutoLoad(false);
          return;
        }

        // Content is educational - proceed with auto-load
        setIsContentEducational(true); // Mark content as educational - show AI buttons
        console.log('✅ Content is educational - proceeding with auto-load');

        // Map database names to handler functions (excluding AI Narrator)
        const modeHandlers = {
          'Visual Learning': handleVisualContentClick,
          'Sequential Learning': handleSequentialLearningClick,
          'Global Learning': handleGlobalLearningClick,
          'Hands-On Lab': handleSensingLearningClick,
          'Concept Constellation': handleIntuitiveLearningClick,
          'Active Learning Hub': handleActiveLearningClick,
          'Reflective Learning': handleReflectiveLearningClick
        };

        const handler = modeHandlers[topRecommendation.mode];
        if (handler) {
          console.log(`✨ Triggering ${topRecommendation.mode} automatically...`);
          // Small delay to ensure UI is ready
          setTimeout(() => {
            handler();
            setWillAutoLoad(false); // Clear the flag after triggering
          }, 500);
        } else {
          console.warn('⚠️ No handler found for mode:', topRecommendation.mode);
          setWillAutoLoad(false); // Clear the flag
        }
      } catch (error) {
        console.error('❌ Error during auto-load analysis:', error);
        setExtractionError(`Error analyzing document: ${error.message}`);
        setShowPdfView(true);
        setWillAutoLoad(false);
      }
    };

    autoLoadWithAnalysis();
  }, [topRecommendation, pdfContent, autoLoadAttempted, isAIAvailable]);

  // Detect cache status when PDF loads - check localStorage FIRST
  useEffect(() => {
    if (!pdfUrl) return;

    // IMPORTANT: Reset indicator state when PDF changes
    setShowCacheIndicator(false);

    // Extract file key from URL for localStorage tracking
    const getFileKeyFromUrl = (url) => {
      try {
        const match = url.match(/\/api\/files\/([^?]+)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    };

    const fileKey = getFileKeyFromUrl(pdfUrl);

    // Check if file was previously opened (stored in localStorage)
    const wasPreviouslyOpened = fileKey && localStorage.getItem(`pdf_opened_${fileKey}`) === 'true';

    // Small delay to ensure clean state transition between different PDFs
    const timer = setTimeout(() => {
      if (wasPreviouslyOpened) {
        // File was opened before, so it should be cached
        console.log(`📦 [CACHE CHECK] File ${fileKey} was previously opened - should be cached`);
        setIsCached(true);
        setShowCacheIndicator(true);
      } else {
        // First time opening - will download
        console.log(`⬇️ [CACHE CHECK] File ${fileKey} is new - will download`);
        setIsCached(false);
        setShowCacheIndicator(true);

        // Mark as opened for future reference
        if (fileKey) {
          localStorage.setItem(`pdf_opened_${fileKey}`, 'true');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pdfUrl]);

  const extractPdfContent = async () => {
    if (pdfContent) return pdfContent;

    // Check if the content object already has extractedText from the database
    if (content?.extractedText) {
      console.log('🚀 Using pre-extracted text from Database property');
      setPdfContent(content.extractedText);
      return content.extractedText;
    }

    setExtractionError('');

    try {
      // Extract file key from the same URL that the viewer uses
      const fileUrl = getAttachmentFileUrl(content);
      let extractedKey = content.cloudStorage?.key;
      
      // If we don't have a direct key, extract it from the URL
      if (!extractedKey && fileUrl) {
        if (fileUrl.includes('/api/files/')) {
          extractedKey = decodeURIComponent(fileUrl.replace(/.*\/api\/files\//, ''));
        } else {
          extractedKey = fileUrl.replace(window.location.origin, '').replace(/^\//, '');
        }
      }

      const requestBody = {
        fileKey: extractedKey,
        filePath: content.filePath,
        contentId: content._id // Send the content ID to enable DB caching
      };

      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.content && result.content.rawText) {
          setPdfContent(result.content.rawText);
          return result.content.rawText;
        } else {
          throw new Error('No text content found in PDF document');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to extract content');
      }
    } catch (error) {
      console.error('❌ Error extracting PDF content:', error);
      setIsContentEducational(true);
      setAnalysisMeta(prev => ({
        ...prev,
        verified: false,
        unavailableReason: `PDF extraction failed: ${error.message}`,
        reasoning: error.message
      }));
      
      // Provide user-friendly error messages based on the error type
      let userFriendlyError = error.message;
      if (error.message.includes('No clean extractable text found')) {
        userFriendlyError = `❌ Cannot extract text from this PDF

This PDF appears to be:
• A scanned document (image-only)
• Password-protected or encrypted
• Contains only images/graphics

💡 Solutions:
• Try a different PDF with selectable text
• Use a PDF that was created digitally (not scanned)
• Check if the PDF is password-protected

The Visual Learning mode needs readable text to generate diagrams and visual content.`;
      } else if (error.message.includes('Failed to download PDF')) {
        userFriendlyError = `❌ Cannot access PDF file

There was a problem downloading the PDF file:
${error.message}

💡 Please try refreshing the page or contact support if the issue persists.`;
      }
      
      setExtractionError(userFriendlyError);
      throw error;
    }
  };

  const startDirectAITeaching = async (mode) => {
    try {
      setShowModeSelection(false);
      setAiTutorActive(true);
      setTutorMode(mode);
      setCurrentConcept('Analyzing document...');

      // Extract content if not already done
      const content = pdfContent || await extractPdfContent();

      // Generate tutorial content based on mode
      let apiEndpoint = '/api/ai-tutor/generate-tutorial';
      let requestBody = {
        docxText: content, // Using same field name for compatibility
        studentLevel: 'intermediate'
      };

      if (mode === 'quick') {
        requestBody.mode = 'quick_overview';
      } else if (mode === 'keypoints') {
        requestBody.mode = 'key_concepts';
      }

      setCurrentConcept('Generating AI narration...');

      const tutorialResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!tutorialResponse.ok) {
        throw new Error('Failed to generate narration content');
      }

      const tutorialData = await tutorialResponse.json();
      const tutorialContent = tutorialData.content;

      setCurrentConcept('Converting to speech...');

      // Generate audio directly with full content
      console.log('🔊 Generating audio for full content, length:', tutorialContent.length);

      const audioResponse = await fetch('/api/ai-tutor/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: tutorialContent,
          voiceName: 'Kore'
        })
      });

      if (!audioResponse.ok) {
        const errorData = await audioResponse.json();
        console.error('❌ Audio generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioData = await audioResponse.json();
      console.log('✅ Audio generated successfully, data length:', audioData.audioData?.length);

      // Convert base64 to blob and create audio URL
      const audioBlob = new Blob([
        new Uint8Array(atob(audioData.audioData).split('').map(c => c.charCodeAt(0)))
      ], { type: 'audio/wav' });

      const audioUrl = URL.createObjectURL(audioBlob);
      setCurrentAudio(audioUrl);
      setCurrentConcept('Playing AI narration...');

      // Play audio automatically
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);

      // Track progress
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(progress || 0);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(100);
        setCurrentConcept('Narration completed!');
        setTimeout(() => {
          setAiTutorActive(false);
          setCurrentConcept('');
          setAudioProgress(0);
        }, 3000);
      });

    } catch (error) {
      console.error('❌ Error in direct AI teaching:', error);

      // Check if it's a quota exceeded error - use browser TTS as fallback
      if (error.message && error.message.includes('QUOTA_EXCEEDED_FALLBACK_TO_BROWSER_TTS')) {
        console.log('🔄 Google TTS quota exceeded, using browser TTS for complete audio...');
        try {
          generateBrowserTTSForCompleteText(tutorialContent || content);
          return;
        } catch (browserError) {
          console.error('❌ Browser TTS also failed:', browserError);
          setExtractionError(`AI Narrator Error: Google TTS quota exceeded and browser TTS failed. Please try again tomorrow or upgrade your Google API plan.`);
        }
      } else {
        setExtractionError(`AI Narrator Error: ${error.message}`);
      }

      setAiTutorActive(false);
      setShowModeSelection(false);
    }
  };

  // Browser TTS fallback function
  const generateBrowserTTSForCompleteText = (text) => {
    console.log('🔊 Using browser TTS as fallback for complete text...');
    console.log('📝 Full text length:', text.length);

    if (!('speechSynthesis' in window)) {
      throw new Error('Browser does not support text-to-speech');
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    // Split long text into chunks for better browser TTS handling
    const maxChunkLength = 200;
    const chunks = [];

    // Split by sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length + 1 > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim() + '.');
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim() + '.');
    }

    console.log(`📊 Split text into ${chunks.length} chunks for browser TTS`);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

    // Prefer Filipino voices, then English voices
    const preferredVoice = voices.find(voice =>
      voice.lang.includes('fil') || voice.lang.includes('tl') ||
      voice.name.toLowerCase().includes('filipino') ||
      voice.name.toLowerCase().includes('tagalog')
    ) || voices.find(voice =>
      voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('en'));

    if (preferredVoice) {
      console.log('🎤 Selected voice:', preferredVoice.name, preferredVoice.lang);
    }

    let currentChunkIndex = 0;

    const speakNextChunk = () => {
      if (currentChunkIndex >= chunks.length) {
        console.log('🔊 Browser TTS completed all chunks');
        setIsPlaying(false);
        setCurrentConcept('Narration completed!');
        setTimeout(() => {
          setAiTutorActive(false);
          setCurrentConcept('');
          setAudioProgress(0);
        }, 3000);
        return;
      }

      const chunk = chunks[currentChunkIndex];
      console.log(`🔊 Speaking chunk ${currentChunkIndex + 1}/${chunks.length}: ${chunk.substring(0, 50)}...`);

      const utterance = new SpeechSynthesisUtterance(chunk);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Configure speech settings
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        if (currentChunkIndex === 0) {
          console.log('🔊 Browser TTS started');
          setIsPlaying(true);
          setCurrentConcept('Playing with browser TTS (Google quota exceeded)');
        }

        // Update progress based on chunk completion
        const progress = (currentChunkIndex / chunks.length) * 100;
        setAudioProgress(progress);
      };

      utterance.onend = () => {
        console.log(`✅ Chunk ${currentChunkIndex + 1} completed`);
        currentChunkIndex++;
        // Small delay between chunks to avoid browser TTS issues
        setTimeout(speakNextChunk, 100);
      };

      utterance.onerror = (event) => {
        console.error(`❌ Browser TTS error on chunk ${currentChunkIndex + 1}:`, event);
        setIsPlaying(false);
        throw new Error(`Browser TTS failed on chunk ${currentChunkIndex + 1}: ${event.error}`);
      };

      // Start speaking this chunk
      window.speechSynthesis.speak(utterance);
    };

    // Start speaking the first chunk
    speakNextChunk();
  };

  // Clean dragging functionality
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = panelPosition.x;
    const startY = panelPosition.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    setIsDragging(true);

    const handleMove = (moveEvent) => {
      const newX = startX + (moveEvent.clientX - startMouseX);
      const newY = startY + (moveEvent.clientY - startMouseY);

      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 250;

      const finalX = Math.max(0, Math.min(newX, maxX));
      const finalY = Math.max(0, Math.min(newY, maxY));

      setPanelPosition({ x: finalX, y: finalY });
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsDragging(false);
    };
  }, []);

  // Stop dragging when AI narrator becomes inactive
  useEffect(() => {
    if (!aiTutorActive) {
      setIsDragging(false);
    }
  }, [aiTutorActive]);

  const analyzeContentForEducational = async (contentToAnalyze, requireUserConfirm = false) => {
    const cleanEvidenceLines = (items) => {
      if (!Array.isArray(items)) return [];
      return items
        .map(item => (typeof item?.text === 'string' ? item.text : ''))
        .map(text => text.replace(/\s+/g, ' ').trim())
        .filter(text => text.length >= 20)
        .filter(text => /^[\x20-\x7E]+$/.test(text))
        .slice(0, 2);
    };

    try {
      // Cheap local zero-shot gate only (no generative credits)
      const gateRes = await fetch('/api/content/educational-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToAnalyze })
      });

      let gate = null;
      try {
        gate = await gateRes.json();
      } catch {
        gate = null;
      }
      if (gateRes.ok) {
        if (gate?.success) {
          const rejectionReason =
            typeof gate.rejectionReason === 'string'
              ? gate.rejectionReason
              : !gate.isEducational && gate.topLabel
                ? `Classified as: ${gate.topLabel} (${typeof gate.confidence === 'number' ? Math.round(gate.confidence * 100) + '%' : 'N/A'})`
                : null;
          const gateResult = {
            isEducational: !!gate.isEducational,
            reasoning: rejectionReason || `Zero-shot gate (${gate.method})`,
            contentType: gate.isEducational ? 'Educational Material' : 'Non-educational Document',
            confidence: typeof gate.confidence === 'number' ? gate.confidence : 0,
            margin: typeof gate.margin === 'number' ? gate.margin : 0,
            method: gate.method,
            verified: true,
            unavailableReason: rejectionReason,
            rejectionReason,
            decision: gate.decision || null,
            evidence: Array.isArray(gate.evidence) ? gate.evidence : []
          };
          setAnalysisMeta({
            method: gateResult.method || null,
            confidence: typeof gateResult.confidence === 'number' ? gateResult.confidence : null,
            contentType: gateResult.contentType || null,
            verified: true,
            unavailableReason: rejectionReason,
            reasoning: gateResult.reasoning || null,
            evidence: Array.isArray(gate.evidence) ? gate.evidence : []
          });
          setShowAnalysisToast(true);
          return gateResult;
        }
      }
      const fallbackResult = {
        isEducational: false,
        reasoning:
          gate?.unavailableReason ||
          gate?.details ||
          gate?.error ||
          `Zero-shot service returned HTTP ${gateRes.status}`,
        contentType: 'unknown',
        confidence: null,
        method: 'zero-shot',
        verified: false,
        unavailableReason:
          gate?.unavailableReason ||
          gate?.details ||
          gate?.error ||
          `Zero-shot service returned HTTP ${gateRes.status}`
      };
      setAnalysisMeta({
        method: fallbackResult.method,
        confidence: fallbackResult.confidence,
        contentType: fallbackResult.contentType,
        verified: false,
        unavailableReason: fallbackResult.unavailableReason,
        reasoning: fallbackResult.reasoning,
        evidence: []
      });
      setShowAnalysisToast(true);
      return fallbackResult;
    } catch (error) {
      console.error('❌ Error analyzing content:', error);
      const errorResult = {
        isEducational: false,
        reasoning: 'Network error during zero-shot analysis',
        contentType: 'unknown',
        confidence: null,
        method: 'zero-shot',
        verified: false,
        unavailableReason: 'Network error during zero-shot analysis'
      };
      setAnalysisMeta({
        method: errorResult.method,
        confidence: errorResult.confidence,
        contentType: errorResult.contentType,
        verified: false,
        unavailableReason: errorResult.unavailableReason,
        reasoning: errorResult.reasoning,
        evidence: []
      });
      setShowAnalysisToast(true);
      return errorResult;
    }
  };

  useEffect(() => {
    if (!showAnalysisToast) return;
    const timer = setTimeout(() => setShowAnalysisToast(false), 4500);
    return () => clearTimeout(timer);
  }, [showAnalysisToast]);

  const handleAITutorClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    if (aiTutorActive) {
      // Stop current session
      setAiTutorActive(false);
      setIsPlaying(false);
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio);
        setCurrentAudio(null);
      }
      // Also stop browser TTS if it's running
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // First, extract and analyze content
    try {
      setIsAITutorLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      // Analyze if content is educational using AI
      console.log('🔍 PDF Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsAITutorLoading(false);
        return;
      }

      console.log('🤖 AI Analysis Result for PDF:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for AI narration. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

AI Narrator works best with instructional content, lessons, or study materials.

DEBUG INFO:
- Content Length: ${extractedContent.length} characters
- Word Count: ${extractedContent.split(/\s+/).length} words
- First 100 chars: "${extractedContent.substring(0, 100)}..."`;

        setIsContentEducational(false); // Mark content as non-educational
        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage);
        setIsAITutorLoading(false);
        setShowModeSelection(false);
        return;
      }

      setIsContentEducational(true); // Mark content as educational

      console.log('✅ Content approved for AI narration:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed with mode selection.
      // Keep start action user-driven to avoid stale-state auto-start issues.
      setShowModeSelection(true);

    } catch (error) {
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsAITutorLoading(false);
    }
  };

  // Visual Learning Handler
  const handleVisualContentClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsVisualLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for visual generation.');
        setIsVisualLearningLoading(false);
        return;
      }

      // Analyze if content is educational
      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsVisualLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for visual learning materials. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Visual Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsVisualLearningLoading(false);
        return;
      }

      // If educational, proceed to open visual content modal
      setPdfContent(extractedContent);
      setShowVisualContent(true);

    } catch (error) {
      console.error('Error analyzing content for visual learning:', error);
      
      // Provide user-friendly error message
      let userFriendlyError = `Error analyzing document: ${error.message}`;
      if (error.message.includes('No clean extractable text found')) {
        userFriendlyError = `❌ Cannot generate diagrams from this PDF

This PDF appears to be a scanned document or image-only file without extractable text.

💡 To use Visual Learning mode:
• Try a PDF with selectable text (not scanned)
• Use a digitally-created PDF document
• Check if the PDF is password-protected

Visual Learning needs readable text to create diagrams and visual content.`;
      }
      
      setExtractionError(userFriendlyError);
    } finally {
      setIsVisualLearningLoading(false);
    }
  };

  // Sequential Learning Handler
  const handleSequentialLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsSequentialLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for sequential learning.');
        setIsSequentialLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsSequentialLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for sequential learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Sequential Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsSequentialLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowSequentialLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sequential learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSequentialLearningLoading(false);
    }
  };

  // Global Learning Handler
  const handleGlobalLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsGlobalLearningLoading(true);
      setGlobalLearningStatusMessage('Checking if this content is educational...');
      const extractedContent = pdfContent || await extractPdfContent();
      if (!extractedContent || !extractedContent.trim()) {
        setIsContentEducational(true);
        setErrorSource('manual');
        setExtractionError('Could not read text from this PDF. It may be scanned/image-only or protected.\n\nTechnical details: extracted text is empty after /api/pdf-extract.');
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const reason = analysisResult.reasoning || 'This content is not suitable for global learning.';
        setErrorSource('manual');
        setExtractionError(`This document does not appear to contain educational or learning material suitable for global learning.\n\nReason: ${reason}`);
        return;
      }

      setIsContentEducational(true);
      setPdfContent(extractedContent);
      setGlobalLearningStatusMessage('Opening Global Learning...');
      setShowGlobalLearning(true);

    } catch (error) {
      const message = String(error?.message || '');
      const isRateLimited = /rate|quota|429/i.test(message);
      const isExtractionFailure = /extract|No clean extractable text|readable source text/i.test(message);
      const friendlyMessage = isRateLimited
        ? `Rate limited right now. Please wait a moment, then try again.\n\nTechnical details: ${message || 'Unknown rate-limit response.'}`
        : isExtractionFailure
          ? `Could not read text from this PDF. It may be scanned/image-only or protected.\n\nTechnical details: ${message || 'Unknown extraction failure.'}`
          : `Error analyzing document: ${message}`;
      setIsContentEducational(true);
      setExtractionError(friendlyMessage);
    } finally {
      setGlobalLearningStatusMessage('');
      setIsGlobalLearningLoading(false);
    }
  };

  // Sensing Learning Handler
  const handleSensingLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsSensingLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for sensing learning.');
        setIsSensingLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsSensingLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for sensing learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Sensing Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsSensingLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowSensingLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sensing learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSensingLearningLoading(false);
    }
  };

  // Intuitive Learning Handler
  const handleIntuitiveLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsIntuitiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for intuitive learning.');
        setIsIntuitiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsIntuitiveLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for intuitive learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Intuitive Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsIntuitiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowIntuitiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for intuitive learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsIntuitiveLearningLoading(false);
    }
  };

  // Active Learning Handler
  const handleActiveLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsActiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for active learning.');
        setIsActiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsActiveLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for active learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Active Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsActiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowActiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for active learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsActiveLearningLoading(false);
    }
  };

  // Reflective Learning Handler
  const handleReflectiveLearningClick = async () => {
    // Dismiss interest tracking overlay when any learning mode is clicked
    dismissOverlay();
    
    try {
      setIsReflectiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setExtractionError('Failed to extract PDF content for reflective learning.');
        setIsReflectiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent, true);
      if (analysisResult.cancelled) {
        setIsReflectiveLearningLoading(false);
        return;
      }

      if (analysisResult.verified === true && !analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for reflective learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Reflective Learning works best with instructional content, lessons, or study materials.`;

        setErrorSource('manual'); // Mark as manual click
        setExtractionError(errorMessage); // Use extractionError to show modal
        setIsReflectiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowReflectiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for reflective learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsReflectiveLearningLoading(false);
    }
  };

  // Handle overlay activation - triggers the corresponding learning mode
  const handleOverlayActivation = useCallback((mode) => {
    console.log(`🎯 Overlay activated for mode: ${mode}`);
    
    // Map mode to handler function
    const modeHandlers = {
      'Global Learning': handleGlobalLearningClick,
      'Sequential Learning': handleSequentialLearningClick,
      'Visual Learning': handleVisualContentClick,
      'Hands-On Lab': handleSensingLearningClick,
      'Concept Constellation': handleIntuitiveLearningClick,
      'Active Learning Hub': handleActiveLearningClick,
      'Reflective Learning': handleReflectiveLearningClick,
      'AI Narrator': handleAITutorClick
    };

    const handler = modeHandlers[mode];
    if (handler) {
      // Dismiss cold start panel first
      setColdStartDismissed(true);
      // Activate the learning mode
      handler();
    }
  }, []);

  // Carousel Navigation Functions
  const handleNextRecommendation = () => {
    if (filteredRecommendations.length === 0) return;

    const nextIndex = (currentRecommendationIndex + 1) % filteredRecommendations.length;
    activateRecommendationAtIndex(nextIndex);
  };

  const handlePrevRecommendation = () => {
    if (filteredRecommendations.length === 0) return;

    const prevIndex = currentRecommendationIndex === 0
      ? filteredRecommendations.length - 1
      : currentRecommendationIndex - 1;
    activateRecommendationAtIndex(prevIndex);
  };

  const fileName = content.title || content.originalName || 'Document.pdf';

  // Check if any learning mode is active
  const hasActiveLearningMode = showVisualContent || showSequentialLearning || showGlobalLearning ||
    showSensingLearning || showIntuitiveLearning || showActiveLearning ||
    showReflectiveLearning;

  return (
    <>
      {/* Cache Status Indicator */}
      <CacheIndicator
        show={showCacheIndicator}
        isCached={isCached}
        onHide={() => setShowCacheIndicator(false)}
      />

      <div className="w-full h-full flex relative">
        {showAnalysisToast && analysisMeta.method === 'zero-shot' && (
          <div className="fixed top-6 right-6 z-50 pointer-events-none">
            <div className={`rounded-xl shadow-2xl max-w-sm border-l-4 overflow-hidden ${analysisMeta.verified ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Zero-shot Analysis Result
                </h3>
                <p className="text-xs text-gray-700">
                  {analysisMeta.verified ? 'Educational content detected.' : 'Analysis unavailable.'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Confidence: {typeof analysisMeta.confidence === 'number' ? `${Math.round(analysisMeta.confidence * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification - Compact Design */}
        {extractionError && (
          <div className="fixed bottom-6 left-6 z-50 pointer-events-auto animate-slide-up">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm border-l-4 border-amber-500 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {isVerifiedNonEducationalError ? 'Learning Features Not Available' : 'Something Went Wrong'}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      {isVerifiedNonEducationalError
                        ? "This document doesn't contain educational content. Zero-shot analysis allows learning modes only for instructional material."
                        : (extractionError || 'An unexpected error happened while preparing learning features.')}
                    </p>
                    {isVerifiedNonEducationalError && (analysisMeta.unavailableReason || !analysisMeta.verified) && (
                      <p className="text-[11px] text-amber-700 leading-relaxed mb-2">
                        Reason: {analysisMeta.unavailableReason || analysisMeta.reasoning || extractionError || 'Zero-shot metadata missing (analysis may not have executed for this action).'}
                      </p>
                    )}

                    {/* Quick Info */}
                    {isVerifiedNonEducationalError && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium text-gray-700">
                          {analysisMeta.contentType || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Confidence:</span>
                        <span className="font-medium text-green-600">
                          {typeof analysisMeta.confidence === 'number' ? `${Math.round(analysisMeta.confidence * 100)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setExtractionError('')}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Footer with AI badge */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>{isVerifiedNonEducationalError ? (analysisMeta.verified ? 'Zero-shot Analysis (Verified)' : 'Zero-shot Analysis (Unavailable)') : 'Runtime Error'}</span>
                </div>
                <button
                  onClick={() => setExtractionError('')}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Analysis Loading */}
        {(isAITutorLoading || isVisualLearningLoading || isSequentialLearningLoading || isGlobalLearningLoading || isSensingLearningLoading || isIntuitiveLearningLoading || isActiveLearningLoading || isReflectiveLearningLoading) && (
          <div className="absolute bottom-4 left-4 z-10 max-w-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">Analyzing Content</p>
                  <p className="text-xs text-blue-600 mt-1">Extracting text from PDF and checking educational content...</p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Main content - Split View */}
        <div className="flex-1 relative flex">
          {/* Determine if any learning mode is active (except AI Narrator) */}
          {(() => {
            const hasActiveLearningMode = showVisualContent || showSequentialLearning || showGlobalLearning ||
              showSensingLearning || showIntuitiveLearning || showActiveLearning ||
              showReflectiveLearning;

            const isLoadingAnyMode = isVisualLearningLoading || isSequentialLearningLoading || isGlobalLearningLoading ||
              isSensingLearningLoading || isIntuitiveLearningLoading || isActiveLearningLoading ||
              isReflectiveLearningLoading;

            return (
              <>
                {/* PDF Viewer - Show when no mode active AND not loading AND not planning to auto-load, OR when user explicitly toggles to PDF view */}
                {((!hasActiveLearningMode && !isLoadingAnyMode && !willAutoLoad) || (hasActiveLearningMode && showPdfView)) && (
                  <div className="flex-1 flex flex-col">
                    {/* Toggle Button - Only show when learning mode is active */}
                    {hasActiveLearningMode && (
                      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Currently viewing: PDF Document</span>
                        <button
                          onClick={() => setShowPdfView(false)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <SparklesIcon className="w-4 h-4" />
                          <span>View Generated Content</span>
                        </button>
                      </div>
                    )}

                    <div className="flex-1 flex">
                      {/* PDF */}
                      <div className={!hasClassification && !coldStartDismissed ? 'flex-1 min-w-0' : 'flex-1'}>
                      {pdfUrl ? (
                        <CleanPDFViewer
                          content={{
                            ...content,
                            filePath: pdfUrl,
                            url: pdfUrl
                          }}
                          onAITutorClick={handleAITutorClick}
                          onVisualLearningClick={handleVisualContentClick}
                          onSequentialLearningClick={handleSequentialLearningClick}
                          onGlobalLearningClick={handleGlobalLearningClick}
                          onSensingLearningClick={handleSensingLearningClick}
                          onIntuitiveLearningClick={handleIntuitiveLearningClick}
                          onActiveLearningClick={handleActiveLearningClick}
                          onReflectiveLearningClick={handleReflectiveLearningClick}
                          isAITutorLoading={isAITutorLoading}
                          isVisualLearningLoading={isVisualLearningLoading}
                          isSequentialLearningLoading={isSequentialLearningLoading}
                          isGlobalLearningLoading={isGlobalLearningLoading}
                          isSensingLearningLoading={isSensingLearningLoading}
                          isIntuitiveLearningLoading={isIntuitiveLearningLoading}
                          isActiveLearningLoading={isActiveLearningLoading}
                          isReflectiveLearningLoading={isReflectiveLearningLoading}
                          // Cold start highlighting props
                          coldStartActive={!hasClassification && !coldStartDismissed}
                          coldStartHighlightMode={coldStartPanelMode}
                          // Button refs for overlay targeting
                          learningModeButtonRefs={learningModeButtonRefs}
                          // ML Recommendations
                          topRecommendation={topRecommendation}
                          allRecommendations={allRecommendations}
                          hasClassification={hasClassification}
                          // Content Educational Status
                          isContentEducational={isContentEducational}
                          // PDF Loading callback
                          onPdfLoaded={() => setIsPdfLoaded(true)}
                        />
                      ) : (
                        <div className="flex-1 h-full p-4 space-y-3">
                          {/* PDF Skeleton Loading */}
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
                      )}
                      </div>

                      {/* Cold Start Right Panel - only for new users */}
                      {!hasClassification && !coldStartDismissed && (
                        <div
                          className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col"
                          style={{ minWidth: '300px', maxWidth: '340px', height: '100%', maxHeight: '100vh', position: 'sticky', top: 0 }}
                          onWheel={e => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-800">
                                {databaseModeToButtonLabel(coldStartPanelMode)}
                              </span>
                            </div>
                            <button
                              onClick={() => { setColdStartDismissed(true); }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Dismiss"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Mode switcher */}
                          <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 overflow-x-auto">
                            {coldStartModeQueue.map((mode, idx) => (
                              <button
                                key={mode}
                                onClick={() => {
                                  setColdStartModeIndex(idx);
                                  if (!coldStartPanelCache[mode]) {
                                    setColdStartPanelContent(null);
                                  }
                                  triggerColdStartPanel(mode);
                                }}
                                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-all ${coldStartPanelMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              >
                                {databaseModeToButtonLabel(mode)}
                              </button>
                            ))}
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 overflow-y-auto p-3 overscroll-contain"
                            style={{ minHeight: 0 }}
                            onWheel={e => e.stopPropagation()}
                            onScroll={handleScroll}
                            onMouseMove={handleMouseMove}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            {coldStartPanelLoading || !isPdfLoaded ? (
                              <div className="p-3 space-y-3">
                                {/* Cold start panel skeleton */}
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                                <div className="h-20 bg-gray-200 rounded-xl animate-pulse w-full mt-2"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                <div className="h-16 bg-gray-200 rounded-xl animate-pulse w-full mt-2"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                              </div>
                            ) : coldStartPanelContent ? (
                              coldStartPanelMode === 'Visual Learning' ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-violet-600 font-semibold">🖼️ Visual Diagram</p>
                                  {/* Parse DIAGRAM and DESCRIPTIONS sections */}
                                  {(() => {
                                    const diagramMatch = coldStartPanelContent.match(/DIAGRAM:\s*([\s\S]*?)(?=DESCRIPTIONS:|$)/);
                                    const descMatch = coldStartPanelContent.match(/DESCRIPTIONS:\s*([\s\S]*?)$/);
                                    const diagramCode = diagramMatch?.[1]?.trim() || coldStartPanelContent;
                                    const descLines = descMatch?.[1]?.trim().split('\n').filter(l => l.trim()) || [];

                                    // Extract node labels from mermaid for color matching
                                    const nodeColors = ['bg-violet-100 border-violet-300 text-violet-800', 'bg-blue-100 border-blue-300 text-blue-800', 'bg-indigo-100 border-indigo-300 text-indigo-800', 'bg-purple-100 border-purple-300 text-purple-800', 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800'];

                                    return (
                                      <>
                                        {/* Diagram - bigger */}
                                        <div className="w-full overflow-x-auto bg-white rounded-xl border border-violet-100 shadow-sm" style={{ minHeight: '220px' }}>
                                          <MermaidDiagram chart={diagramCode} />
                                        </div>

                                        {/* Description cards */}
                                        {descLines.length > 0 && (
                                          <div className="space-y-1.5">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Concepts</p>
                                            {descLines.map((line, i) => {
                                              const colonIdx = line.indexOf(':');
                                              if (colonIdx === -1) return null;
                                              const desc = line.slice(colonIdx + 1).trim().replace(/^\[|\]$/g, '');
                                              // Extract node label from mermaid for display
                                              const nodeId = line.slice(0, colonIdx).trim();
                                              const nodeLabel = diagramCode.match(new RegExp(`${nodeId}\\[([^\\]]+)\\]`))?.[1] || nodeId;
                                              return (
                                                <div key={i} className="flex items-start gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                                                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-white text-xs font-bold" style={{ fontSize: '9px' }}>{i + 1}</span>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-semibold text-gray-800">{nodeLabel}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : coldStartPanelMode === 'Hands-On Lab' ? (
                                // Modern UI for Examples mode only
                                <div className="space-y-4">
                                  {coldStartPanelContent.split('\n').map((line, i) => {
                                    if (!line.trim()) return null;
                                    
                                    // Modern section headers
                                    if (line.startsWith('SECTION_HEADER:')) {
                                      const headerText = line.replace('SECTION_HEADER:', '').trim();
                                      return (
                                        <div key={i} className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                              </svg>
                                            </div>
                                            <h3 className="font-semibold text-slate-800 text-sm">{headerText}</h3>
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    // Example cards with modern styling
                                    if (line.startsWith('EXAMPLE_CARD:')) {
                                      const parts = line.replace('EXAMPLE_CARD:', '').split('|');
                                      const cardTitle = parts[0]?.trim();
                                      const cardDesc = parts[1]?.trim();
                                      return (
                                        <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                            </div>
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-slate-800 text-xs mb-1">{cardTitle}</h4>
                                              <p className="text-xs text-slate-600 leading-relaxed">{cardDesc}</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    // Exercise blocks
                                    if (line.startsWith('EXERCISE_BLOCK:')) {
                                      const parts = line.replace('EXERCISE_BLOCK:', '').split('|');
                                      const exerciseTitle = parts[0]?.trim();
                                      const exerciseDesc = parts[1]?.trim();
                                      return (
                                        <div key={i} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3">
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                              </svg>
                                            </div>
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-emerald-800 text-xs mb-1">{exerciseTitle}</h4>
                                              <p className="text-xs text-emerald-700 leading-relaxed">{exerciseDesc}</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    // Scenario blocks
                                    if (line.startsWith('SCENARIO_BLOCK:')) {
                                      const parts = line.replace('SCENARIO_BLOCK:', '').split('|');
                                      const scenarioTitle = parts[0]?.trim();
                                      const scenarioDesc = parts[1]?.trim();
                                      return (
                                        <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                              </svg>
                                            </div>
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-amber-800 text-xs mb-1">{scenarioTitle}</h4>
                                              <p className="text-xs text-amber-700 leading-relaxed">{scenarioDesc}</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    // Skip unstructured content for Hands-On Lab mode
                                    // Fallback: show unstructured content temporarily for debugging
                                    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return <p key={i} className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                                  })}
                                </div>
                              ) : (
                              <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                                {coldStartPanelContent.split('\n').map((line, i) => {
                                  if (!line.trim()) return null;
                                  // Section headers with emoji
                                  if (/^[🌐🔑🔗📋🖼️📌🗂️🔄🎯💡🤔✍️]/.test(line)) {
                                    return (
                                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3">
                                        <p className="font-semibold text-blue-800 text-xs">{line}</p>
                                      </div>
                                    );
                                  }
                                  // Step lines
                                  if (/^Step \d+:/.test(line)) {
                                    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                      <div key={i} className="bg-indigo-50 border-l-4 border-indigo-400 px-3 py-1.5 rounded-r-lg">
                                        <p className="font-semibold text-indigo-800 text-xs" dangerouslySetInnerHTML={{ __html: boldLine }} />
                                      </div>
                                    );
                                  }
                                  // Question lines
                                  if (/^❓|^💭|^💡/.test(line)) {
                                    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                      <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                        <p className="font-medium text-amber-800 text-xs" dangerouslySetInnerHTML={{ __html: boldLine }} />
                                      </div>
                                    );
                                  }
                                  // Visual CARD lines
                                  if (line.startsWith('CARD:')) {
                                    const parts = line.replace('CARD:', '').split('|');
                                    const cardTitle = parts[0]?.trim();
                                    const cardDesc = parts[1]?.trim();
                                    return (
                                      <div key={i} className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg px-3 py-2 flex gap-2 items-start">
                                        <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></div>
                                        <div>
                                          <p className="text-xs font-bold text-violet-800">{cardTitle}</p>
                                          {cardDesc && <p className="text-xs text-violet-600 mt-0.5">{cardDesc}</p>}
                                        </div>
                                      </div>
                                    );
                                  }
                                  // Visual STEP/FLOW lines
                                  if (line.startsWith('STEP:')) {
                                    const flowText = line.replace('STEP:', '').trim();
                                    return (
                                      <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                                        <span className="text-blue-500 text-xs">▶</span>
                                        <p className="text-xs text-blue-700 font-medium">{flowText}</p>
                                      </div>
                                    );
                                  }
                                  // Bullet points
                                  if (line.startsWith('•') || line.startsWith('│') || line.startsWith('┌') || line.startsWith('└')) {
                                    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return <p key={i} className="text-xs text-gray-600 pl-2 font-mono" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                                  }
                                  // Arrow flows
                                  if (line.includes('→')) {
                                    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return <p key={i} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded font-mono" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                                  }
                                  // Bold text
                                  const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                  return <p key={i} className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                                })}
                              </div>
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2">
                                <p className="text-xs text-gray-400 text-center">Read the PDF to start generating personalized content</p>
                              </div>
                            )}
                          </div>

                          {/* Footer hint */}
                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center">Use the buttons above to switch between learning modes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Loading State - Show when loading a mode OR planning to auto-load */}
                {(isLoadingAnyMode || willAutoLoad) && !hasActiveLearningMode && !isGlobalLearningLoading && (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium text-gray-900 mb-2">Preparing Your Personalized Learning Experience</p>
                      <p className="text-sm text-gray-600">
                        {willAutoLoad ? 'Extracting content and preparing your recommended learning mode...' : 'Generating content based on your learning style...'}
                      </p>
                    </div>
                  </div>
                )}

                {isGlobalLearningLoading && !showGlobalLearning && (
                  <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="mx-4 w-full max-w-md rounded-2xl border border-white/50 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-md">
                      <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
                      <p className="mb-2 text-lg font-semibold text-gray-900">{databaseModeToButtonLabel('Global Learning')}</p>
                      <p className="text-sm text-gray-700">
                        {globalLearningStatusMessage || 'Checking if this content is educational...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Generated Content View - Show when mode is active AND not viewing PDF */}
                {hasActiveLearningMode && !showPdfView && (
                  <div className="flex-1 flex flex-col">
                    {/* Top Navigation Bar - Learning Mode Carousel */}
                    <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-gray-300 shadow-sm px-6 py-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-6">
                        {/* Left: Mode Info */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-800">
                            Currently viewing: {filteredRecommendations[currentRecommendationIndex]?.mode || 'Loading...'}
                          </span>
                          <span className="text-xs text-gray-600 px-2.5 py-1 bg-white/80 border border-gray-200 rounded-md shadow-sm">
                            Recommendation {currentRecommendationIndex + 1} of {filteredRecommendations.length}
                          </span>
                        </div>

                        {/* Right: Navigation Controls + View PDF */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevRecommendation}
                            disabled={filteredRecommendations.length <= 1}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 shadow-sm"
                            title="Previous recommendation"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleNextRecommendation}
                            disabled={filteredRecommendations.length <= 1}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 shadow-sm"
                            title="Next recommendation"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              // Close all learning modes to show PDF
                              setShowVisualContent(false);
                              setShowSequentialLearning(false);
                              setShowGlobalLearning(false);
                              setShowSensingLearning(false);
                              setShowIntuitiveLearning(false);
                              setShowActiveLearning(false);
                              setShowReflectiveLearning(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-md hover:shadow-lg ml-2"
                            title="View original PDF document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>View PDF</span>
                          </button>
                        </div>
                      </div>

                        {visibleRecommendationTabs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Recommended for you
                            </span>
                            {visibleRecommendationTabs.map((recommendation, index) => {
                              const isActive = currentRecommendationIndex === index;
                              return (
                                <button
                                  key={`${recommendation.mode}-${index}`}
                                  onClick={() => activateRecommendationAtIndex(index)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                    isActive
                                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                      : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                                >
                                  {databaseModeToButtonLabel(recommendation.mode)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning Mode Content */}
                    <div className="flex-1 overflow-auto bg-gray-50">
                      {showVisualContent && (
                        <VisualDocxOverlay
                          isActive={true}
                          onClose={() => {
                            setShowVisualContent(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                          onVisualTypeChange={setActiveVisualType}
                          activeVisualType={activeVisualType}
                        />
                      )}

                      {showSequentialLearning && (
                        <SequentialLearning
                          isActive={true}
                          onClose={() => {
                            setShowSequentialLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                        />
                      )}

                      {showGlobalLearning && (
                        <GlobalLearning
                          isActive={true}
                          onClose={() => {
                            setShowGlobalLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                          pdfSource={{
                            fileKey: content?.cloudStorage?.key,
                            filePath: content?.filePath || pdfUrl,
                            mimeType: content?.mimeType || 'application/pdf'
                          }}
                        />
                      )}

                      {showSensingLearning && (
                        <SensingLearning
                          isActive={true}
                          onClose={() => {
                            setShowSensingLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                        />
                      )}

                      {showIntuitiveLearning && (
                        <IntuitiveLearning
                          isActive={true}
                          onClose={() => {
                            setShowIntuitiveLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                        />
                      )}

                      {showActiveLearning && (
                        <ActiveLearning
                          isActive={true}
                          onClose={() => {
                            setShowActiveLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                        />
                      )}

                      {showReflectiveLearning && (
                        <ReflectiveLearning
                          isActive={true}
                          onClose={() => {
                            setShowReflectiveLearning(false);
                            setShowPdfView(false);
                          }}
                          docxContent={pdfContent}
                          fileName={fileName}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {typeof document !== 'undefined' && hasActiveLearningMode && filteredRecommendations.length > 0 && hasClassification &&
          createPortal(
            recommendationPanelCollapsed ? (
              <button
                onClick={() => setRecommendationPanelCollapsed(false)}
                className="fixed right-6 top-24 z-[200000] rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-lg backdrop-blur hover:bg-slate-50"
              >
                Show recommendations
              </button>
            ) : (
              <div className="fixed right-6 top-24 z-[200000] w-[min(90vw,560px)] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Recommended for you
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecommendationPanelCollapsed(true)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => {
                        setShowVisualContent(false);
                        setShowSequentialLearning(false);
                        setShowGlobalLearning(false);
                        setShowSensingLearning(false);
                        setShowIntuitiveLearning(false);
                        setShowActiveLearning(false);
                        setShowReflectiveLearning(false);
                      }}
                      className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      View PDF
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {visibleRecommendationTabs.map((recommendation, index) => {
                    const isActive = currentRecommendationIndex === index;
                    return (
                      <button
                        key={`floating-${recommendation.mode}-${index}`}
                        onClick={() => activateRecommendationAtIndex(index)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        {databaseModeToButtonLabel(recommendation.mode)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
            document.body
          )}

        {/* AI Narrator Mode Selection - Platform Aligned */}
        {showModeSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">AI Narrator</h2>
                    <p className="text-sm text-gray-600">Choose your narration mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModeSelection(false)}
                  className="p-2 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Auto-starting Complete Narration in 3 seconds...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className="bg-purple-500 h-1 rounded-full animate-pulse" style={{ width: '33%' }}></div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {/* Complete Narration */}
                  <button
                    onClick={() => startDirectAITeaching('complete')}
                    className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <BookOpenIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 mb-1">Complete Narration</div>
                        <div className="text-sm text-gray-600">Full explanation with examples and detailed concepts</div>
                        <div className="text-xs text-blue-600 mt-1 font-medium">📚 Recommended for deep learning</div>
                      </div>
                      <div className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Quick Overview */}
                  <button
                    onClick={() => startDirectAITeaching('quick')}
                    className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-300 hover:border-green-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <SparklesIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 mb-1">Quick Overview</div>
                        <div className="text-sm text-gray-600">Essential points covered in 5 minutes</div>
                        <div className="text-xs text-green-600 mt-1 font-medium">⚡ Perfect for quick review</div>
                      </div>
                      <div className="text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Key Concepts */}
                  <button
                    onClick={() => startDirectAITeaching('keypoints')}
                    className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-300 hover:border-purple-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 mb-1">Key Concepts</div>
                        <div className="text-sm text-gray-600">Focus on the most important ideas only</div>
                        <div className="text-xs text-purple-600 mt-1 font-medium">🎯 Great for exam preparation</div>
                      </div>
                      <div className="text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI-powered learning in Taglish</span>
                </div>
                <button
                  onClick={() => setShowModeSelection(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Narrator Active Control Panel - Draggable */}
        {aiTutorActive && (
          <div
            data-draggable-panel
            className="absolute z-20"
            style={{
              left: `${panelPosition.x}px`,
              top: `${panelPosition.y}px`,
              userSelect: 'none',
            }}
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 min-w-[300px] max-w-[400px]">
              <div
                className="cursor-move"
                onMouseDown={handleMouseDown}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900">🤖 AI Narrator Active</span>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Drag to move
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{currentConcept}</span>
                  <button
                    onClick={handleAITutorClick}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Stop
                  </button>
                </div>

                {isPlaying && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${audioProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Playing narration...</span>
                      <span>{Math.round(audioProgress)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Narrator Modal - Keep as modal since it's audio-based */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        fileName={fileName}
        docxContent={pdfContent}
      />

      {/* Cold Start Interest Overlay */}
      <ColdStartInterestOverlay
        isVisible={shouldShowOverlay}
        targetMode={overlayTriggeredFor}
        onDismiss={dismissOverlay}
        onActivateMode={handleOverlayActivation}
        buttonRef={learningModeButtonRefs.current[overlayTriggeredFor]}
        excludeRightPx={!hasClassification && !coldStartDismissed ? 320 : 0}
      />

    </>
  );
};

export default PdfPreviewWithAI;


