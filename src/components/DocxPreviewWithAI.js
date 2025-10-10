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

            {/* Mode Selection Popup */}
          {showModeSelection && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xl max-w-md animate-pulse">
                <div className="text-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900">🤖 How should I teach this?</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose your learning mode or wait 3 seconds for complete tutorial</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => startDirectAITeaching('complete')}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                  >
                    <BookOpenIcon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">📖 Complete Tutorial</div>
                      <div className="text-xs opacity-90">Full explanation with examples</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => startDirectAITeaching('quick')}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">⚡ Quick Overview</div>
                      <div className="text-xs opacity-90">Key points in 5 minutes</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => startDirectAITeaching('keypoints')}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                  >
                    <AcademicCapIcon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">🎯 Key Concepts</div>
                      <div className="text-xs opacity-90">Focus on important ideas</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Tutor Active Control Panel */}
          {aiTutorActive && (
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg min-w-80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-900">🤖 AI Tutor Active</span>
                  </div>
                  <button
                    onClick={handleAITutorClick}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
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