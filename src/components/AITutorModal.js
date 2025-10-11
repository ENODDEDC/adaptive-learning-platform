'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, BookOpenIcon, QuestionMarkCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const AITutorModal = ({ isOpen, onClose, docxContent, fileName }) => {
  const [activeTab, setActiveTab] = useState('tutorial');
  const [tutorialContent, setTutorialContent] = useState('');
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState('');
  const [studyTips, setStudyTips] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState({});
  const [showAnswers, setShowAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  // Initialize content when modal opens
  useEffect(() => {
    if (isOpen && docxContent && !tutorialContent) {
      generateAllContent();
    }
  }, [isOpen, docxContent]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setTutorialContent('');
    setQuestions([]);
    setSummary('');
    setStudyTips('');
    setSelectedAnswer({});
    setShowAnswers({});
    setScore(0);
    setQuizCompleted(false);
    setError('');
  };

  const generateAllContent = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Generate tutorial content
      const tutorialResponse = await fetch('/api/ai-tutor/generate-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docxText: docxContent,
          studentLevel: 'intermediate'
        })
      });

      if (!tutorialResponse.ok) {
        throw new Error('Failed to generate tutorial content');
      }

      const tutorialData = await tutorialResponse.json();
      setTutorialContent(tutorialData.content);

      // Generate other content in parallel
      const [questionsResponse, summaryResponse, tipsResponse] = await Promise.all([
        fetch('/api/ai-tutor/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docxText: docxContent, numQuestions: 5 })
        }),
        fetch('/api/ai-tutor/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docxText: docxContent })
        }),
        fetch('/api/ai-tutor/generate-study-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docxText: docxContent })
        })
      ]);

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.summary);
      }

      if (tipsResponse.ok) {
        const tipsData = await tipsResponse.json();
        setStudyTips(tipsData.tips);
      }

    } catch (err) {
      console.error('Error generating AI content:', err);
      setError('Failed to generate AI narration content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async (text) => {
    if (!text) return;

    console.log('🔊 CLIENT: Starting audio generation...');
    console.log('📝 CLIENT: Text length:', text.length);
    console.log('📝 CLIENT: Text preview:', text.substring(0, 100) + '...');

    setLoading(true);
    try {
      const requestPayload = { 
        text: text, // Send full text - let the service handle chunking
        voiceName: 'Kore' // Filipino-friendly voice
      };
      
      console.log('📤 CLIENT: Sending request to /api/ai-tutor/generate-audio');
      console.log('📋 CLIENT: Request payload:', requestPayload);
      
      const response = await fetch('/api/ai-tutor/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      console.log('📥 CLIENT: Response received');
      console.log('📊 CLIENT: Response status:', response.status);
      console.log('📊 CLIENT: Response statusText:', response.statusText);
      console.log('📊 CLIENT: Response ok:', response.ok);
      console.log('📊 CLIENT: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ CLIENT: Response not ok, attempting to parse error...');
        console.error('📊 CLIENT: Response status:', response.status);
        console.error('📊 CLIENT: Response statusText:', response.statusText);
        
        let errorData;
        try {
          const responseText = await response.text();
          console.log('📄 CLIENT: Raw error response:', responseText);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              console.log('📋 CLIENT: Parsed error data:', errorData);
            } catch (jsonError) {
              console.error('❌ CLIENT: Response is not valid JSON:', jsonError);
              errorData = { 
                error: `Server Error: ${response.status} ${response.statusText}`,
                details: responseText,
                rawResponse: responseText
              };
            }
          } else {
            errorData = { 
              error: `Empty response: ${response.status} ${response.statusText}`,
              details: 'Server returned empty response'
            };
          }
        } catch (textError) {
          console.error('❌ CLIENT: Failed to read response text:', textError);
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: 'Could not read server response'
          };
        }
        
        const errorMessage = errorData.error || errorData.details || 'Failed to generate audio';
        console.error('🔥 CLIENT: Final error message:', errorMessage);
        console.error('🔥 CLIENT: Full error data:', errorData);
        
        throw new Error(errorMessage);
      }

      console.log('✅ CLIENT: Response ok, parsing JSON...');
      const audioData = await response.json();
      console.log('📋 CLIENT: Audio data received:', {
        success: audioData.success,
        audioDataLength: audioData.audioData?.length,
        audioDataPreview: audioData.audioData?.substring(0, 50) + '...'
      });
      
      // Convert base64 to blob and create audio URL
      const audioBlob = new Blob([
        new Uint8Array(atob(audioData.audioData).split('').map(c => c.charCodeAt(0)))
      ], { type: 'audio/wav' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      setCurrentAudio(audioUrl);
      
      // Play audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        startProgressTracking();
      }

    } catch (err) {
      console.error('❌ DETAILED CLIENT-SIDE ERROR in generateAudio:');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Full error object:', err);
      
      if (err.message && err.message.includes('Failed to fetch')) {
        console.error('🌐 This appears to be a network/fetch error');
        setError('🌐 Network error: Could not connect to audio service. Please check your internet connection.');
      } else if (err.message && err.message.includes('temporarily unavailable')) {
        setError('🔊 Audio feature is temporarily unavailable, but you can still read all the AI-generated content! We\'re working on bringing you audio in Taglish soon.');
      } else {
        setError(`Audio generation failed: ${err.message}. You can still read all the AI content!`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking();
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      startProgressTracking();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioProgress(0);
    stopProgressTracking();
    if (currentAudio) {
      URL.revokeObjectURL(currentAudio);
      setCurrentAudio(null);
    }
  };

  const startProgressTracking = () => {
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setAudioProgress(progress || 0);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };



  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswer(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleShowAnswer = (questionIndex) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionIndex]: true
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswer[index] === question.correct) {
        correct++;
      }
    });
    setScore(correct);
    setQuizCompleted(true);
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'tutorial':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">AI Narration</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateAudio(tutorialContent)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  Listen
                </button>
                {currentAudio && (
                  <button
                    onClick={toggleAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                )}
              </div>
            </div>
            
            {currentAudio && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <SpeakerWaveIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Audio Tutorial</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${audioProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="prose max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                {tutorialContent ? (
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {tutorialContent}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>AI narration content will appear here...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Interactive Quiz</h3>
              {questions.length > 0 && !quizCompleted && (
                <button
                  onClick={calculateScore}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Submit Quiz
                </button>
              )}
            </div>

            {quizCompleted && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Quiz Results</h4>
                <p className="text-green-700">
                  You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
                </p>
              </div>
            )}

            <div className="space-y-4">
              {questions.length > 0 ? questions.map((question, qIndex) => (
                <div key={qIndex} className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {qIndex + 1}. {question.question}
                  </h4>
                  
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAnswer[qIndex] === oIndex
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        } ${
                          showAnswers[qIndex] && oIndex === question.correct
                            ? 'bg-green-50 border-green-300'
                            : showAnswers[qIndex] && selectedAnswer[qIndex] === oIndex && oIndex !== question.correct
                            ? 'bg-red-50 border-red-300'
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={selectedAnswer[qIndex] === oIndex}
                          onChange={() => handleAnswerSelect(qIndex, oIndex)}
                          className="mr-3"
                          disabled={showAnswers[qIndex]}
                        />
                        <span className="text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>

                  {!showAnswers[qIndex] && selectedAnswer[qIndex] !== undefined && (
                    <button
                      onClick={() => handleShowAnswer(qIndex)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Show Answer
                    </button>
                  )}

                  {showAnswers[qIndex] && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center text-gray-500">
                  <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Quiz questions will appear here...</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Document Summary</h3>
              {summary && (
                <button
                  onClick={() => generateAudio(summary)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  Listen
                </button>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
              {summary ? (
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {summary}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Document summary will appear here...</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Study Tips</h3>
              {studyTips && (
                <button
                  onClick={() => generateAudio(studyTips)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  Listen
                </button>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
              {studyTips ? (
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {studyTips}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <LightBulbIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Study tips will appear here...</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Narrator</h2>
                <p className="text-blue-100 text-sm">{fileName}</p>
                <p className="text-blue-200 text-xs mt-1">Teaching based on document content only</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'tutorial', label: 'Tutorial', icon: BookOpenIcon },
              { id: 'quiz', label: 'Quiz', icon: QuestionMarkCircleIcon },
              { id: 'summary', label: 'Summary', icon: BookOpenIcon },
              { id: 'tips', label: 'Study Tips', icon: LightBulbIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">AI is generating content...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={generateAllContent}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && getTabContent()}
          </div>

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onEnded={() => {
              setIsPlaying(false);
              setAudioProgress(0);
              stopProgressTracking();
            }}
            onError={() => {
              setIsPlaying(false);
              setError('Failed to play audio');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AITutorModal;