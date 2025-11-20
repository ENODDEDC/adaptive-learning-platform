'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SparklesIcon,
  AcademicCapIcon,
  XMarkIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import AITutorModal from './AITutorModal';
import CleanPDFViewer from './CleanPDFViewer';
import VisualContentModal from './VisualContentModal';
import SequentialLearning from './SequentialLearning';
import GlobalLearning from './GlobalLearning';
import SensingLearning from './SensingLearning';
import IntuitiveLearning from './IntuitiveLearning';
import ActiveLearning from './ActiveLearning';
import ReflectiveLearning from './ReflectiveLearning';
import CacheIndicator from './CacheIndicator';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

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

  // Automatic time tracking for ML classification
  useLearningModeTracking('aiNarrator', aiTutorActive);
  useLearningModeTracking('visualLearning', showVisualContent);

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

    setExtractionError('');

    try {
      const requestBody = {
        fileKey: content.cloudStorage?.key,
        filePath: content.filePath
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
        throw new Error(errorData.error || 'Failed to extract content');
      }
    } catch (error) {
      console.error('❌ Error extracting PDF content:', error);
      setExtractionError(error.message);
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

  const analyzeContentForEducational = async (content) => {
    try {
      const response = await fetch('/api/ai-tutor/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          isEducational: result.isEducational,
          reasoning: result.reasoning,
          contentType: result.contentType,
          confidence: result.confidence
        };
      }
      return { isEducational: false, reasoning: 'Analysis failed', confidence: 0 };
    } catch (error) {
      console.error('❌ Error analyzing content:', error);
      return { isEducational: false, reasoning: 'Network error during analysis', confidence: 0 };
    }
  };

  const handleAITutorClick = async () => {
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
      
      const analysisResult = await analyzeContentForEducational(extractedContent);
      
      console.log('🤖 AI Analysis Result for PDF:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for AI narration. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

AI Narrator works best with instructional content, lessons, or study materials.

DEBUG INFO:
- Content Length: ${extractedContent.length} characters
- Word Count: ${extractedContent.split(/\s+/).length} words
- First 100 chars: "${extractedContent.substring(0, 100)}..."`;

        setExtractionError(errorMessage);
        setIsAITutorLoading(false);
        setShowModeSelection(false);
        return;
      }

      console.log('✅ Content approved for AI narration:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed with mode selection
      setShowModeSelection(true);
      setTimeout(() => {
        if (showModeSelection) {
          startDirectAITeaching('complete');
        }
      }, 3000);

    } catch (error) {
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsAITutorLoading(false);
    }
  };

  // Visual Learning Handler
  const handleVisualContentClick = async () => {
    try {
      setIsVisualLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setVisualLearningError('Failed to extract PDF content for visual generation.');
        setIsVisualLearningLoading(false);
        return;
      }

      // Analyze if content is educational
      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for visual learning materials. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Visual Learning works best with instructional content, lessons, or study materials.`;

        setVisualLearningError(errorMessage);
        setIsVisualLearningLoading(false);
        return;
      }

      // If educational, proceed to open visual content modal
      setPdfContent(extractedContent);
      setShowVisualContent(true);

    } catch (error) {
      console.error('Error analyzing content for visual learning:', error);
      setVisualLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsVisualLearningLoading(false);
    }
  };

  // Sequential Learning Handler
  const handleSequentialLearningClick = async () => {
    try {
      setIsSequentialLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setSequentialLearningError('Failed to extract PDF content for sequential learning.');
        setIsSequentialLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for sequential learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Sequential Learning works best with instructional content, lessons, or study materials.`;

        setSequentialLearningError(errorMessage);
        setIsSequentialLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowSequentialLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sequential learning:', error);
      setSequentialLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSequentialLearningLoading(false);
    }
  };

  // Global Learning Handler
  const handleGlobalLearningClick = async () => {
    console.log('🌍 === GLOBAL LEARNING BUTTON CLICKED ===');
    console.log('📊 Current state:', {
      showGlobalLearning,
      pdfContent: pdfContent?.length || 0,
      isGlobalLearningLoading
    });
    
    try {
      console.log('🔄 Step 1: Setting loading state...');
      setIsGlobalLearningLoading(true);
      
      console.log('📄 Step 2: Extracting PDF content...');
      const extractedContent = pdfContent || await extractPdfContent();
      console.log('✅ Content extracted, length:', extractedContent?.length);

      if (!extractedContent || !extractedContent.trim()) {
        console.error('❌ No content extracted!');
        setGlobalLearningError('Failed to extract PDF content for global learning.');
        setIsGlobalLearningLoading(false);
        return;
      }

      console.log('🔍 Step 3: Analyzing content for educational value...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('📊 Analysis result:', analysisResult);

      if (!analysisResult.isEducational) {
        console.warn('⚠️ Content not educational, showing error');
        const errorMessage = `This document does not appear to contain educational or learning material suitable for global learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Global Learning works best with instructional content, lessons, or study materials.`;

        setGlobalLearningError(errorMessage);
        setIsGlobalLearningLoading(false);
        return;
      }

      console.log('✅ Step 4: Content approved! Setting PDF content...');
      setPdfContent(extractedContent);
      
      console.log('🎯 Step 5: Setting showGlobalLearning to TRUE...');
      setShowGlobalLearning(true);
      
      console.log('✅ === GLOBAL LEARNING SHOULD NOW BE VISIBLE ===');

    } catch (error) {
      console.error('❌ Error in handleGlobalLearningClick:', error);
      setGlobalLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      console.log('🏁 Step 6: Clearing loading state...');
      setIsGlobalLearningLoading(false);
    }
  };

  // Sensing Learning Handler
  const handleSensingLearningClick = async () => {
    try {
      setIsSensingLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setSensingLearningError('Failed to extract PDF content for sensing learning.');
        setIsSensingLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for sensing learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Sensing Learning works best with instructional content, lessons, or study materials.`;

        setSensingLearningError(errorMessage);
        setIsSensingLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowSensingLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sensing learning:', error);
      setSensingLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSensingLearningLoading(false);
    }
  };

  // Intuitive Learning Handler
  const handleIntuitiveLearningClick = async () => {
    try {
      setIsIntuitiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setIntuitiveLearningError('Failed to extract PDF content for intuitive learning.');
        setIsIntuitiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for intuitive learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Intuitive Learning works best with instructional content, lessons, or study materials.`;

        setIntuitiveLearningError(errorMessage);
        setIsIntuitiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowIntuitiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for intuitive learning:', error);
      setIntuitiveLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsIntuitiveLearningLoading(false);
    }
  };

  // Active Learning Handler
  const handleActiveLearningClick = async () => {
    try {
      setIsActiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setActiveLearningError('Failed to extract PDF content for active learning.');
        setIsActiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for active learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Active Learning works best with instructional content, lessons, or study materials.`;

        setActiveLearningError(errorMessage);
        setIsActiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowActiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for active learning:', error);
      setActiveLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsActiveLearningLoading(false);
    }
  };

  // Reflective Learning Handler
  const handleReflectiveLearningClick = async () => {
    try {
      setIsReflectiveLearningLoading(true);
      const extractedContent = pdfContent || await extractPdfContent();

      if (!extractedContent || !extractedContent.trim()) {
        setReflectiveLearningError('Failed to extract PDF content for reflective learning.');
        setIsReflectiveLearningLoading(false);
        return;
      }

      const analysisResult = await analyzeContentForEducational(extractedContent);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for reflective learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Reflective Learning works best with instructional content, lessons, or study materials.`;

        setReflectiveLearningError(errorMessage);
        setIsReflectiveLearningLoading(false);
        return;
      }

      setPdfContent(extractedContent);
      setShowReflectiveLearning(true);

    } catch (error) {
      console.error('Error analyzing content for reflective learning:', error);
      setReflectiveLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsReflectiveLearningLoading(false);
    }
  };

  const fileName = content.title || content.originalName || 'Document.pdf';

  return (
    <>
      {/* Cache Status Indicator */}
      <CacheIndicator 
        show={showCacheIndicator} 
        isCached={isCached}
        onHide={() => setShowCacheIndicator(false)}
      />
      
      <div className="w-full h-full flex relative">
        {/* Enhanced Error/Info Message - Professional Design */}
        {extractionError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${extractionError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {extractionError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {extractionError.includes('not appear to contain educational')
                        ? 'AI Narrator Not Available'
                        : 'AI Narrator Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {extractionError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Something went wrong'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {extractionError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This PDF doesn't contain educational content suitable for AI narration.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material. 
                          AI Narrator works best with lessons, tutorials, study guides, and educational content.
                        </p>
                      </div>
                    </div>

                    {/* Analysis Details */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Analysis Results</h4>
                      
                      {/* AI Analysis Summary */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">AI Analysis</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              The PDF appears to be a personal document rather than instructional content suitable for educational narration.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Structured Analysis Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Content Type</span>
                          </div>
                          <p className="text-xs text-gray-900 font-medium">Personal Document</p>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Confidence</span>
                          </div>
                          <p className="text-xs text-gray-900 font-medium">100%</p>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Try AI Narrator with:
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Educational PDF documents and textbooks</li>
                        <li>• Research papers and academic articles</li>
                        <li>• Course materials and study guides</li>
                        <li>• Tutorial documents and how-to guides</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0">
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process PDF for AI narration
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {extractionError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Powered by AI content analysis</span>
                </div>
                <div className="flex gap-2">
                  {!extractionError.includes('not appear to contain educational') && (
                    <button
                      onClick={handleAITutorClick}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => setExtractionError('')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
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



        {/* Main content - PDF Viewer */}
        <div className="flex-1 relative flex flex-col">

          {/* Clean PDF Viewer */}
          <div className="flex-1">
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
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
          </div>

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
      </div>

      {/* AI Narrator Modal */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        fileName={fileName}
        docxContent={pdfContent}
      />

      {/* Visual Content Modal */}
      <VisualContentModal
        isOpen={showVisualContent}
        onClose={() => setShowVisualContent(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Sequential Learning Modal */}
      <SequentialLearning
        isActive={showSequentialLearning}
        onClose={() => setShowSequentialLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Global Learning Modal */}
      <GlobalLearning
        isActive={showGlobalLearning}
        onClose={() => setShowGlobalLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Sensing Learning Modal */}
      <SensingLearning
        isActive={showSensingLearning}
        onClose={() => setShowSensingLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Intuitive Learning Modal */}
      <IntuitiveLearning
        isActive={showIntuitiveLearning}
        onClose={() => setShowIntuitiveLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Active Learning Modal */}
      <ActiveLearning
        isActive={showActiveLearning}
        onClose={() => setShowActiveLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />

      {/* Reflective Learning Modal */}
      <ReflectiveLearning
        isActive={showReflectiveLearning}
        onClose={() => setShowReflectiveLearning(false)}
        docxContent={pdfContent}
        fileName={fileName}
      />
    </>
  );
};

export default PdfPreviewWithAI;