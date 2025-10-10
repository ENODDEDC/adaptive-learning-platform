'use client';

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  AcademicCapIcon,
  XMarkIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import AITutorModal from './AITutorModal';

/**
 * DOCX Preview Component with AI Tutor Integration
 * This component wraps the DOCX preview and adds AI Tutor functionality
 */
const DocxPreviewWithAI = ({ 
  content, 
  htmlContent, 
  headings = [], 
  notes = [], 
  headingsWithNotes = new Set(),
  injectOverrideStyles 
}) => {
  const [showAITutor, setShowAITutor] = useState(false);
  const [docxContent, setDocxContent] = useState('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [extractionError, setExtractionError] = useState('');
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

  const extractDocxContent = async () => {
    if (isExtractingContent || docxContent) return docxContent;

    setIsExtractingContent(true);
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
      setIsExtractingContent(false);
    }
  };

  const startDirectAITeaching = async (mode) => {
    try {
      setShowModeSelection(false);
      setAiTutorActive(true);
      setTutorMode(mode);
      setCurrentConcept('Analyzing document...');

      // Extract content if not already done
      const content = docxContent || await extractDocxContent();
      
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

      setCurrentConcept('Generating AI tutorial...');
      
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
      setCurrentConcept('Playing AI tutorial...');

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
          setExtractionError(`AI Tutor Error: Google TTS quota exceeded and browser TTS failed. Please try again tomorrow or upgrade your Google API plan.`);
        }
      } else {
        setExtractionError(`AI Tutor Error: ${error.message}`);
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

  // Stop dragging when AI tutor becomes inactive
  useEffect(() => {
    if (!aiTutorActive) {
      setIsDragging(false);
    }
  }, [aiTutorActive]);

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

    // Show mode selection for 3 seconds, then start with default mode
    setShowModeSelection(true);
    setTimeout(() => {
      if (showModeSelection) {
        startDirectAITeaching('complete');
      }
    }, 3000);
  };

  const fileName = content.title || content.originalName || 'Document.docx';

  return (
    <>
      <div className="w-full h-full flex relative">
        {/* AI Tutor Floating Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleAITutorClick}
            disabled={isExtractingContent}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="AI Tutor - Learn with AI assistance in Taglish"
          >
            {isExtractingContent ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            <span className="font-semibold">AI Tutor</span>
            <AcademicCapIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {extractionError && (
          <div className="absolute top-20 right-4 z-10 max-w-sm">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <XMarkIcon className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">AI Tutor Error</p>
                  <p className="text-xs text-red-600 mt-1">{extractionError}</p>
                  <button
                    onClick={handleAITutorClick}
                    className="text-xs text-red-700 underline hover:no-underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar with headings */}
        {headings.length > 0 && (
          <aside className="w-64 flex-shrink-0 h-full overflow-y-auto p-8 border-r bg-slate-50/50 hidden lg:block">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">On this page</h3>
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <SparklesIcon className="w-3 h-3" />
                <span>AI Ready</span>
              </div>
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

            {/* AI Tutor Sidebar Button */}
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
                <span>Learn with AI</span>
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Get tutorials, quizzes & audio in Taglish
              </p>
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <div className="flex-1 relative">
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

            {/* AI Tutor Mode Selection - Platform Aligned */}
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
                      <h2 className="text-xl font-semibold text-gray-900">AI Tutor</h2>
                      <p className="text-sm text-gray-600">Choose your learning mode</p>
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
                      <span>Auto-starting Complete Tutorial in 3 seconds...</span>
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
                          <div className="font-semibold text-gray-900 mb-1">Complete Tutorial</div>
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

          {/* AI Tutor Active Control Panel - Draggable */}
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
                  className={`flex items-center justify-between p-4 pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl border-b border-gray-100 ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
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
                    <span className="text-sm font-semibold text-gray-900">🤖 AI Tutor Active</span>
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

          {/* AI Tutor Hint Overlay */}
          {!showAITutor && !isExtractingContent && !extractionError && !aiTutorActive && !showModeSelection && (
            <div className="absolute bottom-4 right-4 z-10">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 shadow-lg max-w-xs">
                <div className="flex items-start gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">AI Tutor Available!</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Get personalized learning assistance in Taglish based on this document's content.
                    </p>
                    <p className="text-xs text-purple-500 mt-1 font-medium">
                      📚 Document-focused teaching only
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Tutor Modal */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        docxContent={docxContent}
        fileName={fileName}
      />
    </>
  );
};

export default DocxPreviewWithAI;