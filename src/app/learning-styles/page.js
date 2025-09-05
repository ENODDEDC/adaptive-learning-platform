'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LearningStylesPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('intro'); // intro, assessment, results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Learning styles questions based on VARK model (Visual, Auditory, Reading/Writing, Kinesthetic)
  const questions = [
    {
      id: 1,
      question: "When you need to learn something new, what helps you most?",
      options: [
        { text: "Watching videos or looking at diagrams", style: "visual", value: "A" },
        { text: "Listening to explanations or discussions", style: "auditory", value: "B" },
        { text: "Reading detailed instructions or taking notes", style: "reading", value: "C" },
        { text: "Trying it out hands-on or practicing", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 2,
      question: "In a classroom, you learn best when the teacher:",
      options: [
        { text: "Uses visual aids like charts, graphs, or slides", style: "visual", value: "A" },
        { text: "Explains concepts verbally with clear examples", style: "auditory", value: "B" },
        { text: "Provides written materials and handouts", style: "reading", value: "C" },
        { text: "Includes interactive activities and experiments", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 3,
      question: "When studying for an exam, you prefer to:",
      options: [
        { text: "Create mind maps, flowcharts, or visual summaries", style: "visual", value: "A" },
        { text: "Discuss topics with others or explain concepts aloud", style: "auditory", value: "B" },
        { text: "Read textbooks and write detailed notes", style: "reading", value: "C" },
        { text: "Use flashcards or practice problems repeatedly", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 4,
      question: "You remember information best when it's presented as:",
      options: [
        { text: "Pictures, diagrams, or color-coded materials", style: "visual", value: "A" },
        { text: "Spoken words, music, or rhythmic patterns", style: "auditory", value: "B" },
        { text: "Written text, lists, or detailed descriptions", style: "reading", value: "C" },
        { text: "Physical models or real-world examples", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 5,
      question: "When working on a group project, you naturally:",
      options: [
        { text: "Create visual presentations or design layouts", style: "visual", value: "A" },
        { text: "Lead discussions and brainstorming sessions", style: "auditory", value: "B" },
        { text: "Research and write detailed reports", style: "reading", value: "C" },
        { text: "Build prototypes or organize practical tasks", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 6,
      question: "You understand directions best when they are:",
      options: [
        { text: "Shown with maps, pictures, or demonstrations", style: "visual", value: "A" },
        { text: "Explained verbally with clear descriptions", style: "auditory", value: "B" },
        { text: "Written down step-by-step", style: "reading", value: "C" },
        { text: "Practiced by doing them yourself", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 7,
      question: "When you're trying to concentrate, you need:",
      options: [
        { text: "A clean, organized visual environment", style: "visual", value: "A" },
        { text: "Background music or complete silence", style: "auditory", value: "B" },
        { text: "Written materials and good lighting for reading", style: "reading", value: "C" },
        { text: "The ability to move around or fidget", style: "kinesthetic", value: "D" }
      ]
    },
    {
      id: 8,
      question: "You prefer to receive feedback through:",
      options: [
        { text: "Visual progress charts or highlighted corrections", style: "visual", value: "A" },
        { text: "Verbal discussions and spoken explanations", style: "auditory", value: "B" },
        { text: "Written comments and detailed text feedback", style: "reading", value: "C" },
        { text: "Hands-on practice and immediate application", style: "kinesthetic", value: "D" }
      ]
    }
  ];

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateResults = () => {
    const scores = {
      visual: 0,
      auditory: 0,
      reading: 0,
      kinesthetic: 0
    };

    Object.values(answers).forEach(answer => {
      if (answer.style) {
        scores[answer.style]++;
      }
    });

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const percentages = {};
    
    Object.keys(scores).forEach(style => {
      percentages[style] = Math.round((scores[style] / total) * 100);
    });

    const primaryStyle = Object.keys(percentages).reduce((a, b) => 
      percentages[a] > percentages[b] ? a : b
    );

    return {
      scores,
      percentages,
      primaryStyle,
      total
    };
  };

  const handleSubmitAssessment = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const calculatedResults = calculateResults();
      setResults(calculatedResults);
      setCurrentStep('results');
      setIsLoading(false);
      
      // Save to localStorage for persistence
      localStorage.setItem('learningStyleResults', JSON.stringify(calculatedResults));
    }, 1500);
  };

  const getStyleDescription = (style) => {
    const descriptions = {
      visual: {
        title: "Visual Learner",
        description: "You learn best through seeing and visualizing information. You prefer charts, diagrams, mind maps, and color-coded materials.",
        strengths: ["Strong spatial awareness", "Good at remembering faces and places", "Enjoys visual arts and design", "Processes information through images"],
        tips: ["Use mind maps and flowcharts", "Highlight important text with colors", "Watch educational videos", "Create visual summaries"]
      },
      auditory: {
        title: "Auditory Learner", 
        description: "You learn best through listening and speaking. You prefer lectures, discussions, music, and verbal explanations.",
        strengths: ["Good listening skills", "Strong verbal communication", "Remembers spoken information well", "Enjoys music and sounds"],
        tips: ["Record lectures to listen later", "Study with background music", "Discuss topics with others", "Read aloud when studying"]
      },
      reading: {
        title: "Reading/Writing Learner",
        description: "You learn best through reading and writing. You prefer text-based information, note-taking, and written materials.",
        strengths: ["Strong reading comprehension", "Good at written communication", "Enjoys research and analysis", "Organized note-taking"],
        tips: ["Take detailed written notes", "Create lists and outlines", "Read extensively on topics", "Write summaries and essays"]
      },
      kinesthetic: {
        title: "Kinesthetic Learner",
        description: "You learn best through hands-on experience and movement. You prefer practical activities, experiments, and physical involvement.",
        strengths: ["Good at hands-on tasks", "Strong physical coordination", "Learns through experience", "Enjoys building and creating"],
        tips: ["Use hands-on activities", "Take breaks to move around", "Build models or prototypes", "Practice skills repeatedly"]
      }
    };
    return descriptions[style];
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const restartAssessment = () => {
    setCurrentStep('intro');
    setCurrentQuestion(0);
    setAnswers({});
    setResults(null);
  };

  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Your Learning Style</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Understanding how you learn best can help you study more effectively and achieve better results. 
                This assessment will identify your preferred learning style based on the VARK model.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Visual Learning</h3>
                <p className="text-gray-600">Learn through seeing - charts, diagrams, and visual aids</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Auditory Learning</h3>
                <p className="text-gray-600">Learn through listening - lectures, discussions, and audio</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reading/Writing</h3>
                <p className="text-gray-600">Learn through text - reading, writing, and note-taking</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5l2 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kinesthetic Learning</h3>
                <p className="text-gray-600">Learn through doing - hands-on activities and movement</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Assessment Information</h4>
                  <p className="text-yellow-700 text-sm">
                    This assessment takes about 5-7 minutes to complete. Answer honestly based on your natural preferences. 
                    There are no right or wrong answers - we're simply identifying how you learn best.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/home')}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => setCurrentStep('assessment')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'assessment') {
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestion === questions.length - 1;
    const canProceed = answers[question.id];

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(question.id, option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      answers[question.id]?.value === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[question.id]?.value === option.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id]?.value === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentQuestion
                        ? 'bg-blue-600'
                        : answers[questions[index].id]
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={!canProceed || isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Analyzing...' : 'Complete Assessment'}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  disabled={!canProceed}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'results' && results) {
    const primaryStyleInfo = getStyleDescription(results.primaryStyle);
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              <p className="text-lg text-gray-600">Here are your personalized learning style results</p>
            </div>
          </div>

          {/* Primary Learning Style */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Primary Learning Style</h2>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-full border border-blue-200">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {results.percentages[results.primaryStyle]}%
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900">{primaryStyleInfo.title}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 mb-6">{primaryStyleInfo.description}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Strengths</h3>
                <ul className="space-y-2">
                  {primaryStyleInfo.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Tips for You</h3>
                <div className="space-y-3">
                  {primaryStyleInfo.tips.map((tip, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-800 text-sm">{tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Learning Styles Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Learning Style Profile</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(results.percentages).map(([style, percentage]) => {
                const styleInfo = getStyleDescription(style);
                const isPrimary = style === results.primaryStyle;
                
                return (
                  <div key={style} className={`p-6 rounded-xl border-2 ${
                    isPrimary 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${isPrimary ? 'text-blue-900' : 'text-gray-900'}`}>
                        {styleInfo.title}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isPrimary 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {percentage}%
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          isPrimary 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    
                    <p className={`text-sm ${isPrimary ? 'text-blue-800' : 'text-gray-600'}`}>
                      {styleInfo.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h3>
              <p className="text-gray-600 mb-6">
                Your learning style results have been saved to your profile. We'll use this information to personalize your learning experience.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => router.push('/home')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                >
                  Continue to Dashboard
                </button>
                <button
                  onClick={restartAssessment}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Retake Assessment
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Print Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LearningStylesPage;