'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SparklesIcon,
  AcademicCapIcon,
  XMarkIcon,
  BookOpenIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AITutorModal from './AITutorModal';
import DocumentToolsSidebar from './DocumentToolsSidebar';
import EnhancedFloatingNotes from './EnhancedFloatingNotes';
import VisualContentModal from './VisualContentModal';
import VisualDocxOverlay from './VisualDocxOverlay';
import SequentialLearning from './SequentialLearning';
import GlobalLearning from './GlobalLearning';
import SensingLearning from './SensingLearning';
import IntuitiveLearning from './IntuitiveLearning';
import ActiveLearning from './ActiveLearning';
import ReflectiveLearning from './ReflectiveLearning';

/**
 * DOCX Preview Component with AI Narrator Integration
 * This component wraps the DOCX preview and adds AI Narrator functionality
 */
const DocxPreviewWithAI = ({
  content,
  htmlContent,
  headings = [],
  notes = [],
  headingsWithNotes = new Set(),
  injectOverrideStyles,
  disableTools = false
}) => {
  const [showAITutor, setShowAITutor] = useState(false);
  const [showVisualContent, setShowVisualContent] = useState(false);
  const [showVisualOverlay, setShowVisualOverlay] = useState(false);
  const [showSequentialLearning, setShowSequentialLearning] = useState(false);
  const [showGlobalLearning, setShowGlobalLearning] = useState(false);
  const [showSensingLearning, setShowSensingLearning] = useState(false);
  const [showIntuitiveLearning, setShowIntuitiveLearning] = useState(false);
  const [showActiveLearning, setShowActiveLearning] = useState(false);
  const [showReflectiveLearning, setShowReflectiveLearning] = useState(false);
  const [activeVisualType, setActiveVisualType] = useState('diagram');
  const [docxContent, setDocxContent] = useState('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [isAINarratorLoading, setIsAINarratorLoading] = useState(false);
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
  const [aiTutorActive, setAiTutorActive] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentConcept, setCurrentConcept] = useState('');
  const [tutorMode, setTutorMode] = useState('');
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 }); // Initial position (top-left)
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Ref for floating notes
  const floatingNotesRef = useRef(null);

  const extractDocxContent = async (toolType = 'general') => {
    if (docxContent) return docxContent;

    if (toolType === 'ai-narrator' && isAINarratorLoading) return docxContent;
    if (toolType === 'visual' && isExtractingContent) return docxContent;
    if (toolType === 'sequential' && isSequentialLearningLoading) return docxContent;
    if (toolType === 'global' && isGlobalLearningLoading) return docxContent;

    if (toolType === 'visual') {
      setIsExtractingContent(true);
    } else if (toolType === 'ai-narrator') {
      setIsAINarratorLoading(true);
    } else if (toolType === 'sequential') {
      setIsSequentialLearningLoading(true);
    }
    setExtractionError('');

    try {
      const requestBody = {
        fileKey: content.cloudStorage?.key,
        filePath: content.filePath
      };

      const response = await fetch('/api/docx-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.content && result.content.rawText) {
          setDocxContent(result.content.rawText);
          return result.content.rawText;
        } else {
          throw new Error('No text content found in document');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract content');
      }
    } catch (error) {
      console.error('❌ Error extracting DOCX content:', error);
      setExtractionError(error.message);
      throw error;
    } finally {
      if (toolType === 'visual') {
        setIsExtractingContent(false);
      } else if (toolType === 'ai-narrator') {
        setIsAINarratorLoading(false);
      } else if (toolType === 'sequential') {
        setIsSequentialLearningLoading(false);
      }
    }
  };

  const startDirectAITeaching = async (mode) => {
    try {
      setShowModeSelection(false);
      setAiTutorActive(true);
      setTutorMode(mode);
      setCurrentConcept('Analyzing document...');

      // Extract content if not already done
      const content = docxContent || await extractDocxContent('ai-narrator');

      // Generate tutorial content based on mode
      let apiEndpoint = '/api/ai-tutor/generate-tutorial';
      let requestBody = {
        docxText: content,
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
        throw new Error('Failed to generate tutorial content');
      }

      const tutorialData = await tutorialResponse.json();
      const tutorialContent = tutorialData.content;

      setCurrentConcept('Converting to speech...');

      // Generate audio directly with full content (no truncation)
      console.log('🔊 Generating audio for full content, length:', tutorialContent.length);

      const audioResponse = await fetch('/api/ai-tutor/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: tutorialContent, // Send FULL content - let the service handle chunking
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
        setCurrentConcept('Tutorial completed!');
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

  // Browser TTS fallback function for complete text when Google TTS quota is exceeded
  const generateBrowserTTSForCompleteText = (text) => {
    console.log('🔊 Using browser TTS as fallback for complete text...');
    console.log('📝 Full text length:', text.length);

    if (!('speechSynthesis' in window)) {
      throw new Error('Browser does not support text-to-speech');
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    // Split long text into chunks for better browser TTS handling
    const maxChunkLength = 200; // Browser TTS works better with shorter chunks
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
        setCurrentConcept('Tutorial completed!');
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
      utterance.rate = 0.9; // Slightly slower for better comprehension
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
    // Only handle left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    // Capture starting positions
    const startX = panelPosition.x;
    const startY = panelPosition.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    setIsDragging(true);

    // Mouse move handler
    const handleMove = (moveEvent) => {
      const newX = startX + (moveEvent.clientX - startMouseX);
      const newY = startY + (moveEvent.clientY - startMouseY);

      // Boundary check
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 250;

      const finalX = Math.max(0, Math.min(newX, maxX));
      const finalY = Math.max(0, Math.min(newY, maxY));

      setPanelPosition({ x: finalX, y: finalY });
    };

    // Mouse up handler
    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Cleanup effect - simple and safe
  useEffect(() => {
    // Cleanup on component unmount
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
      setIsAINarratorLoading(true);
      const extractedContent = docxContent || await extractDocxContent();

      // Analyze if content is educational using AI
      console.log('🔍 DOCX Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      const analysisResult = await analyzeContentForEducational(extractedContent);

      console.log('🤖 AI Analysis Result for DOCX:', {
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

AI Narrator works best with instructional content, lessons, or study materials.`;

        setExtractionError(errorMessage);
        setIsAINarratorLoading(false);
        // Make sure mode selection modal is NOT shown
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
      setIsAINarratorLoading(false);
    }
  };

  const handleVisualContentClick = async () => {
    // First, extract and analyze content BEFORE opening visual overlay
    try {
      setIsExtractingContent(true);
      const extractedContent = docxContent || await extractDocxContent('visual');

      if (!extractedContent || !extractedContent.trim()) {
        setVisualLearningError('Failed to extract document content for visual generation.');
        setIsExtractingContent(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as AI Narrator
      console.log('🎨 Visual Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      const analysisResult = await analyzeContentForEducational(extractedContent);

      console.log('🎨 AI Analysis Result for Visual Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for visual learning materials. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Visual Learning works best with instructional content, lessons, or study materials.`;

        setVisualLearningError(errorMessage);
        setIsExtractingContent(false);
        return;
      }

      console.log('✅ Content approved for visual learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open visual overlay
      setDocxContent(extractedContent);
      setShowVisualOverlay(true);

    } catch (error) {
      console.error('Error analyzing content for visual learning:', error);
      setExtractionError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsExtractingContent(false);
    }
  };

  const handleSequentialLearningClick = async () => {
    // First, extract and analyze content BEFORE opening sequential learning overlay
    try {
      setIsSequentialLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('sequential');

      if (!extractedContent || !extractedContent.trim()) {
        setSequentialLearningError('Failed to extract document content for sequential learning.');
        setIsSequentialLearningLoading(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as AI Narrator
      console.log('📚 Sequential Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      console.log('📚 About to call analyzeContentForEducational...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('📚 analyzeContentForEducational returned:', analysisResult);

      console.log('📚 AI Analysis Result for Sequential Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      console.log('📚 Checking if content is educational:', analysisResult.isEducational);

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

      console.log('✅ Content approved for sequential learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open sequential learning overlay
      setDocxContent(extractedContent);
      setShowSequentialLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sequential learning:', error);
      setSequentialLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSequentialLearningLoading(false);
    }
  };

  const handleGlobalLearningClick = async () => {
    // First, extract and analyze content BEFORE opening global learning overlay
    try {
      setIsGlobalLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('global');

      if (!extractedContent || !extractedContent.trim()) {
        setGlobalLearningError('Failed to extract document content for global learning.');
        setIsGlobalLearningLoading(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as other learning features
      console.log('🌍 Global Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      console.log('🌍 About to call analyzeContentForEducational...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('🌍 analyzeContentForEducational returned:', analysisResult);

      console.log('🌍 AI Analysis Result for Global Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      console.log('🌍 Checking if content is educational:', analysisResult.isEducational);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for global learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Global Learning works best with instructional content, lessons, or study materials.`;

        setGlobalLearningError(errorMessage);
        setIsGlobalLearningLoading(false);
        return;
      }

      console.log('✅ Content approved for global learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open global learning overlay
      setDocxContent(extractedContent);
      setShowGlobalLearning(true);

    } catch (error) {
      console.error('Error analyzing content for global learning:', error);
      setGlobalLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsGlobalLearningLoading(false);
    }
  };

  const handleSensingLearningClick = async () => {
    // First, extract and analyze content BEFORE opening sensing learning overlay
    try {
      setIsSensingLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('sensing');

      if (!extractedContent || !extractedContent.trim()) {
        setSensingLearningError('Failed to extract document content for hands-on learning.');
        setIsSensingLearningLoading(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as other learning features
      console.log('🔬 Sensing Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      console.log('🔬 About to call analyzeContentForEducational...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('🔬 analyzeContentForEducational returned:', analysisResult);

      console.log('🔬 AI Analysis Result for Sensing Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      console.log('🔬 Checking if content is educational:', analysisResult.isEducational);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for hands-on learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Hands-On Lab works best with instructional content, lessons, or study materials.`;

        setSensingLearningError(errorMessage);
        setIsSensingLearningLoading(false);
        return;
      }

      console.log('✅ Content approved for sensing learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open sensing learning overlay
      setDocxContent(extractedContent);
      setShowSensingLearning(true);

    } catch (error) {
      console.error('Error analyzing content for sensing learning:', error);
      setSensingLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsSensingLearningLoading(false);
    }
  };

  const handleIntuitiveLearningClick = async () => {
    console.log('🔮 INTUITIVE LEARNING BUTTON CLICKED!');
    // First, extract and analyze content BEFORE opening intuitive learning overlay
    try {
      setIsIntuitiveLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('intuitive');

      if (!extractedContent || !extractedContent.trim()) {
        setIntuitiveLearningError('Failed to extract document content for conceptual pattern discovery.');
        setIsIntuitiveLearningLoading(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as other learning features
      console.log('🔮 Intuitive Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      console.log('🔮 About to call analyzeContentForEducational...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('🔮 analyzeContentForEducational returned:', analysisResult);

      if (!analysisResult) {
        console.error('🔮 ERROR: analyzeContentForEducational returned null/undefined');
        setIntuitiveLearningError('Failed to analyze document content. Please try again.');
        setIsIntuitiveLearningLoading(false);
        return;
      }

      console.log('🔮 AI Analysis Result for Intuitive Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      console.log('🔮 Checking if content is educational:', analysisResult.isEducational);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for conceptual pattern discovery. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Concept Constellation works best with instructional content, lessons, or study materials.`;

        setIntuitiveLearningError(errorMessage);
        setIsIntuitiveLearningLoading(false);
        return;
      }

      console.log('✅ Content approved for intuitive learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open intuitive learning overlay
      setDocxContent(extractedContent);
      console.log('🔮 Setting showIntuitiveLearning to true...');
      setShowIntuitiveLearning(true);
      console.log('🔮 showIntuitiveLearning should now be true!');

    } catch (error) {
      console.error('Error analyzing content for intuitive learning:', error);
      setIntuitiveLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsIntuitiveLearningLoading(false);
    }
  };

  const handleActiveLearningClick = async () => {
    console.log('🎯 ACTIVE LEARNING BUTTON CLICKED!');
    // First, extract and analyze content BEFORE opening active learning overlay
    try {
      setIsActiveLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('active');

      if (!extractedContent || !extractedContent.trim()) {
        setActiveLearningError('Failed to extract document content for interactive activities.');
        setIsActiveLearningLoading(false);
        return;
      }

      // Analyze if content is educational using the SAME AI as other learning features
      console.log('🎯 Active Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      console.log('🎯 About to call analyzeContentForEducational...');
      const analysisResult = await analyzeContentForEducational(extractedContent);
      console.log('🎯 analyzeContentForEducational returned:', analysisResult);
      
      if (!analysisResult) {
        console.error('🎯 ERROR: analyzeContentForEducational returned null/undefined');
        setActiveLearningError('Failed to analyze document content. Please try again.');
        setIsActiveLearningLoading(false);
        return;
      }

      console.log('🎯 AI Analysis Result for Active Learning:', {
        isEducational: analysisResult.isEducational,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        contentType: analysisResult.contentType
      });

      console.log('🎯 Checking if content is educational:', analysisResult.isEducational);

      if (!analysisResult.isEducational) {
        const errorMessage = `This document does not appear to contain educational or learning material suitable for interactive activities and collaborative learning. 

AI Analysis: ${analysisResult.reasoning}
Content Type: ${analysisResult.contentType}
Confidence: ${Math.round(analysisResult.confidence * 100)}%

Active Learning Hub works best with instructional content, lessons, or study materials that can be transformed into hands-on activities.`;

        setActiveLearningError(errorMessage);
        setIsActiveLearningLoading(false);
        return;
      }

      console.log('✅ Content approved for active learning:', {
        contentType: analysisResult.contentType,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning
      });

      // If educational, proceed to open active learning overlay
      setDocxContent(extractedContent);
      console.log('🎯 Setting showActiveLearning to true...');
      setShowActiveLearning(true);
      console.log('🎯 showActiveLearning should now be true!');

    } catch (error) {
      console.error('Error analyzing content for active learning:', error);
      setActiveLearningError(`Error analyzing document: ${error.message}`);
    } finally {
      setIsActiveLearningLoading(false);
    }
  };

  const handleReflectiveLearningClick = async () => {
    console.log('🤔 REFLECTIVE LEARNING BUTTON CLICKED!');
    // Extract and analyze content for reflective learning
    try {
      setIsReflectiveLearningLoading(true);
      const extractedContent = docxContent || await extractDocxContent('reflective');

      if (!extractedContent || !extractedContent.trim()) {
        console.error('Failed to extract document content for reflective learning.');
        setIsReflectiveLearningLoading(false);
        return;
      }

      console.log('🤔 Reflective Learning Content Analysis Debug:');
      console.log('📝 Content length:', extractedContent.length);
      console.log('📄 First 200 chars:', extractedContent.substring(0, 200));
      console.log('📊 Word count:', extractedContent.split(/\s+/).length);

      // Reflective learning works with any content that can be contemplated
      // No need for strict educational validation - reflection can be applied to any material
      console.log('✅ Content approved for reflective learning - all content is suitable for contemplation');

      // Set content and open reflective learning overlay
      setDocxContent(extractedContent);
      console.log('🤔 Setting showReflectiveLearning to true...');
      setShowReflectiveLearning(true);
      console.log('🤔 showReflectiveLearning should now be true!');

    } catch (error) {
      console.error('Error preparing content for reflective learning:', error);
    } finally {
      setIsReflectiveLearningLoading(false);
    }
  };

  const handleVisualTypeChange = (newType) => {
    setActiveVisualType(newType);
  };

  const handleCloseVisualOverlay = () => {
    setShowVisualOverlay(false);
    setActiveVisualType('diagram');
  };

  const fileName = content.title || content.originalName || 'Document.docx';

  // Hide document header when overlays are active
  const hideDocumentHeader = showVisualOverlay || showSequentialLearning || showGlobalLearning || showSensingLearning || showIntuitiveLearning || showActiveLearning;

  return (
    <>
      {/* Document Header - Hide when overlays are active */}
      {!showVisualOverlay && !showSequentialLearning && !showGlobalLearning && (
        <div className="w-full bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{fileName}</h1>
                <p className="text-sm text-gray-600">Document Viewer</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">DOCX</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full flex relative">
        {/* Visual Overlay - replaces the entire document view */}
        {showVisualOverlay && (
          <VisualDocxOverlay
            isActive={showVisualOverlay}
            onClose={handleCloseVisualOverlay}
            docxContent={docxContent}
            fileName={fileName}
            onVisualTypeChange={handleVisualTypeChange}
            activeVisualType={activeVisualType}
          />
        )}

        {/* Sequential Learning Overlay - replaces the entire document view */}
        {showSequentialLearning && (
          <SequentialLearning
            isActive={showSequentialLearning}
            onClose={() => setShowSequentialLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

        {/* Global Learning Overlay - replaces the entire document view */}
        {showGlobalLearning && (
          <GlobalLearning
            isActive={showGlobalLearning}
            onClose={() => setShowGlobalLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

        {/* Sensing Learning Overlay - replaces the entire document view */}
        {showSensingLearning && (
          <SensingLearning
            isActive={showSensingLearning}
            onClose={() => setShowSensingLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

        {/* Intuitive Learning Overlay - replaces the entire document view */}
        {showIntuitiveLearning && (
          <IntuitiveLearning
            isActive={showIntuitiveLearning}
            onClose={() => setShowIntuitiveLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

        {/* Active Learning Overlay - replaces the entire document view */}
        {showActiveLearning && (
          <ActiveLearning
            isActive={showActiveLearning}
            onClose={() => setShowActiveLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

        {/* Reflective Learning Overlay - replaces the entire document view */}
        {showReflectiveLearning && (
          <ReflectiveLearning
            isActive={showReflectiveLearning}
            onClose={() => setShowReflectiveLearning(false)}
            docxContent={docxContent}
            fileName={fileName}
          />
        )}

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
                          This document doesn't contain educational content suitable for AI narration.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for educational narration.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Structured Analysis Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Content Type</span>
                          </div>
                          <p className="text-xs text-gray-900 font-medium">Personal Study Log</p>
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
                        <li>• Lesson plans and study materials</li>
                        <li>• Educational articles and tutorials</li>
                        <li>• Course content and learning guides</li>
                        <li>• Research papers and academic content</li>
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
                          Unable to process document for AI narration
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

        {/* Visual Learning Error Modal */}
        {visualLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Visual Learning Not Available</h2>
                    <p className="text-green-100 text-sm">Content analysis complete</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {visualLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for visual learning.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Visual Learning works best with lessons, tutorials, study guides, and educational content.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for visual learning materials.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Structured Analysis Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Content Type</span>
                          </div>
                          <p className="text-xs text-gray-900 font-medium">Personal Study Log</p>
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
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Try Visual Learning with:
                      </h4>
                      <ul className="text-xs text-green-800 space-y-1">
                        <li>• Lesson plans and study materials</li>
                        <li>• Educational articles and tutorials</li>
                        <li>• Course content and learning guides</li>
                        <li>• Research papers and academic content</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process document for visual learning
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {visualLearningError}
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
                  {!visualLearningError.includes('not appear to contain educational') && (
                    <button
                      onClick={handleVisualContentClick}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => setVisualLearningError('')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sequential Learning Error Modal - Same Design as AI Narrator */}
        {sequentialLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${sequentialLearningError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {sequentialLearningError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {sequentialLearningError.includes('not appear to contain educational')
                        ? 'Sequential Learning Not Available'
                        : 'Sequential Learning Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {sequentialLearningError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Something went wrong'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {sequentialLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for sequential learning.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Sequential Learning works best with lessons, tutorials, study guides, and educational content.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for sequential learning.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Structured Analysis Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Content Type</span>
                          </div>
                          <p className="text-xs text-gray-900 font-medium">Personal Study Log</p>
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
                        Try Sequential Learning with:
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Lesson plans and study materials</li>
                        <li>• Educational articles and tutorials</li>
                        <li>• Course content and learning guides</li>
                        <li>• Research papers and academic content</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process document for sequential learning
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {sequentialLearningError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Powered by AI content analysis</span>
                </div>
                <div className="flex gap-2">
                  {!sequentialLearningError.includes('not appear to contain educational') && (
                    <button
                      onClick={handleSequentialLearningClick}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => setSequentialLearningError('')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Learning Error Modal - Same Design as Other Learning Features */}
        {globalLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${globalLearningError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {globalLearningError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {globalLearningError.includes('not appear to contain educational')
                        ? 'Global Learning Not Available'
                        : 'Global Learning Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {globalLearningError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Something went wrong'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {globalLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for global learning.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Global Learning works best with lessons, tutorials, study guides, and educational content.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for global learning.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Try Global Learning with:
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Academic textbooks or course materials</li>
                          <li>• Research papers and scholarly articles</li>
                          <li>• Educational tutorials and guides</li>
                          <li>• Training manuals and instructional content</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0 mt-0.5">
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process document for global learning
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {globalLearningError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-200 mt-6">
                  <div className="flex gap-2">
                    {!globalLearningError.includes('not appear to contain educational') && (
                      <button
                        onClick={handleGlobalLearningClick}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setGlobalLearningError('')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sensing Learning Error Modal - Same Design as Other Learning Features */}
        {sensingLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${sensingLearningError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {sensingLearningError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {sensingLearningError.includes('not appear to contain educational')
                        ? 'Hands-On Lab Not Available'
                        : 'Hands-On Lab Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {sensingLearningError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Something went wrong'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {sensingLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-teal-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for hands-on learning.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Hands-On Lab works best with lessons, tutorials, study guides, and educational content.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for hands-on learning.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                        <h4 className="text-xs font-semibold text-teal-800 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Try Hands-On Lab with:
                        </h4>
                        <ul className="text-xs text-teal-800 space-y-1">
                          <li>• Science experiments and lab procedures</li>
                          <li>• Mathematical problem-solving exercises</li>
                          <li>• Technical tutorials with step-by-step instructions</li>
                          <li>• Engineering or programming guides</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0 mt-0.5">
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process document for hands-on learning
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {sensingLearningError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-200 mt-6">
                  <div className="flex gap-2">
                    {!sensingLearningError.includes('not appear to contain educational') && (
                      <button
                        onClick={handleSensingLearningClick}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setSensingLearningError('')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Concept Constellation Error Modal */}
        {intuitiveLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${intuitiveLearningError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {intuitiveLearningError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {intuitiveLearningError.includes('not appear to contain educational')
                        ? 'Concept Constellation Not Available'
                        : 'Concept Constellation Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {intuitiveLearningError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Unable to process document'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {intuitiveLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg flex-shrink-0 mt-0.5">
                        <EyeIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for conceptual pattern discovery.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Concept Constellation works best with lessons, tutorials, study guides, and educational content.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">AI Analysis</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {intuitiveLearningError.split('AI Analysis: ')[1]?.split('Content Type:')[0]?.trim() || 
                             'The document appears to be non-educational content rather than instructional material suitable for pattern discovery and conceptual learning.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0 mt-0.5">
                      <XMarkIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Unable to Process Document
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {intuitiveLearningError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-gray-200 mt-6">
                  <div className="flex gap-2">
                    {!intuitiveLearningError.includes('not appear to contain educational') && (
                      <button
                        onClick={handleIntuitiveLearningClick}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setIntuitiveLearningError('')}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Learning Error Modal - Same Design as Other Learning Features */}
        {activeLearningError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${activeLearningError.includes('not appear to contain educational')
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                    {activeLearningError.includes('not appear to contain educational') ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {activeLearningError.includes('not appear to contain educational')
                        ? 'Active Learning Hub Not Available'
                        : 'Active Learning Hub Error'
                      }
                    </h3>
                    <p className="text-sm text-white text-opacity-90">
                      {activeLearningError.includes('not appear to contain educational')
                        ? 'Document analysis complete'
                        : 'Something went wrong'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeLearningError.includes('not appear to contain educational') ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          This document doesn't contain educational content suitable for interactive activities and collaborative learning.
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Our AI analyzed the document and determined it's not instructional material.
                          Active Learning Hub works best with lessons, tutorials, study guides, and educational content that can be transformed into hands-on activities.
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
                              The document appears to be a personal study log or development schedule rather than instructional content suitable for interactive activities.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <h4 className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Try Active Learning Hub with:
                        </h4>
                        <ul className="text-xs text-orange-800 space-y-1">
                          <li>• Course materials and lesson plans</li>
                          <li>• Training manuals and workshops</li>
                          <li>• Educational textbooks and guides</li>
                          <li>• Study materials with practical applications</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg flex-shrink-0 mt-0.5">
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Unable to process document for interactive activities
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {activeLearningError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-200 mt-6">
                  <div className="flex gap-2">
                    {!activeLearningError.includes('not appear to contain educational') && (
                      <button
                        onClick={handleActiveLearningClick}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setActiveLearningError('')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Analysis Loading */}
        {isExtractingContent && (
          <div className="absolute bottom-4 left-4 z-10 max-w-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">Analyzing Content</p>
                  <p className="text-xs text-blue-600 mt-1">Checking if document contains educational material...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar with headings - Hide when Sequential Learning is active */}
        {headings.length > 0 && !showSequentialLearning && (
          <aside className="w-64 flex-shrink-0 h-full overflow-y-auto p-8 border-r bg-slate-50/50 hidden lg:block">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">On this page</h3>
            </div>
            <ul className="space-y-2">
              {headings.map((heading) => (
                <li key={heading.id} className={`text-sm ${heading.level === 2 ? 'pl-3' : ''} ${heading.level === 3 ? 'pl-6' : ''}`}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector(`#${heading.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors py-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="truncate max-w-[11rem]" title={heading.text}>{heading.text}</span>
                    {headingsWithNotes.has(heading.id) && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" title="This section has notes"></span>
                    )}
                  </a>
                </li>
              ))}
            </ul>

            {/* AI Narrator Sidebar Button */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={handleAITutorClick}
                disabled={isExtractingContent}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 text-sm font-medium"
              >
                {isExtractingContent ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AcademicCapIcon className="w-4 h-4" />
                )}
                <span>Listen with AI</span>
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Get tutorials, quizzes & audio in Taglish
              </p>
            </div>
          </aside>
        )}

        {/* Document Tools Sidebar - Only show if tools are not disabled and no overlay is active */}
        {!disableTools && !showVisualOverlay && !showSequentialLearning && !showGlobalLearning && !showSensingLearning && !showIntuitiveLearning && !showActiveLearning && !showReflectiveLearning && (
          <DocumentToolsSidebar
            onAITutorClick={handleAITutorClick}
            onVisualContentClick={handleVisualContentClick}
            onSequentialLearningClick={handleSequentialLearningClick}
            onGlobalLearningClick={handleGlobalLearningClick}
            onSensingLearningClick={handleSensingLearningClick}
            onIntuitiveLearningClick={handleIntuitiveLearningClick}
            onActiveLearningClick={handleActiveLearningClick}
            onReflectiveLearningClick={handleReflectiveLearningClick}
            onNotesClick={() => {
              // Toggle notes panel using the ref
              if (floatingNotesRef.current) {
                floatingNotesRef.current.toggleNotesPanel();
              }
            }}
            isExtractingContent={isExtractingContent}
            isAINarratorLoading={isAINarratorLoading}
            isSequentialLearningLoading={isSequentialLearningLoading}
            isGlobalLearningLoading={isGlobalLearningLoading}
            isSensingLearningLoading={isSensingLearningLoading}
            isIntuitiveLearningLoading={isIntuitiveLearningLoading}
            isActiveLearningLoading={isActiveLearningLoading}
            isReflectiveLearningLoading={isReflectiveLearningLoading}
          />
        )}

        {/* Main content - Hide when Sequential Learning is active */}
        <div className={`flex-1 relative ${showSequentialLearning ? 'hidden' : ''}`}>
          {htmlContent ? (
            <iframe
              className="w-full h-full rounded-lg bg-white"
              title={content.title}
              srcDoc={injectOverrideStyles(htmlContent)}
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
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
                    {/* Complete Tutorial */}
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
                userSelect: 'none', // Prevent text selection during drag
                transition: isDragging ? 'none' : 'all 0.1s ease-out' // Smooth when not dragging
              }}
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg min-w-80 max-w-sm select-none">
                {/* Draggable Header */}
                <div
                  className={`flex items-center justify-between p-4 pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl border-b border-gray-100 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  onMouseDown={handleMouseDown}
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-900">🤖 AI Narrator Active</span>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Drag to move
                    </div>
                  </div>
                  <button
                    onClick={handleAITutorClick}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-4 pt-3 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-purple-600">{currentConcept}</span>
                    </div>
                  </div>

                  {isPlaying && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium text-gray-900">{Math.round(audioProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${audioProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Teaching mode: {tutorMode === 'complete' ? 'Complete Tutorial' : tutorMode === 'quick' ? 'Quick Overview' : 'Key Concepts'}</span>
                  </div>

                  {/* Visual indicator that panel is draggable */}
                  <div className="flex items-center justify-center pt-2 border-t border-gray-100">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>


      </div>

      {/* Enhanced FloatingNotes component - Hide when any overlay is active */}
      {!showVisualOverlay && !showSequentialLearning && (
        <EnhancedFloatingNotes
          ref={floatingNotesRef}
          contentId={content?._id || content?.id || 'docx-content'}
          courseId={content?.courseId || 'default-course'}
          userId="current-user"
          isVisible={true}
        />
      )}

      {/* AI Narrator Modal */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        docxContent={docxContent}
        fileName={fileName}
      />

      {/* Visual Content Modal */}
      <VisualContentModal
        isOpen={showVisualContent}
        onClose={() => setShowVisualContent(false)}
        docxContent={docxContent}
        fileName={fileName}
      />
    </>
  );
};

export default DocxPreviewWithAI;