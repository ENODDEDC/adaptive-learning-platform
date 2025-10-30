'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionnairePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const questionsPerPage = 5;

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/learning-style/questionnaire');
      const data = await response.json();
      setQuestions(data.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId, option) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const getCurrentPageQuestions = () => {
    const start = currentPage * questionsPerPage;
    const end = start + questionsPerPage;
    return questions.slice(start, end);
  };

  const getTotalPages = () => {
    return Math.ceil(questions.length / questionsPerPage);
  };

  const canGoNext = () => {
    const currentQuestions = getCurrentPageQuestions();
    return currentQuestions.every(q => responses[q.id]);
  };

  const handleNext = () => {
    if (currentPage < getTotalPages() - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length !== questions.length) {
      alert('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/learning-style/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Questionnaire submitted successfully!');
        router.push('/test-classification');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('❌ Error submitting questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    return (Object.keys(responses).length / questions.length) * 100;
  };

  const getDimensionName = (dimension) => {
    const names = {
      activeReflective: 'Active ↔ Reflective',
      sensingIntuitive: 'Sensing ↔ Intuitive',
      visualVerbal: 'Visual ↔ Verbal',
      sequentialGlobal: 'Sequential ↔ Global'
    };
    return names[dimension] || dimension;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Learning Style Questionnaire
          </h1>
          <p className="text-gray-600 mb-4">
            Answer these questions to discover your learning style based on the Felder-Silverman Model
          </p>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Object.keys(responses).length} / {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Page {currentPage + 1} of {getTotalPages()}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {getCurrentPageQuestions().map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {getDimensionName(question.dimension)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Question {currentPage * questionsPerPage + index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {question.question}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Option A */}
                <button
                  onClick={() => handleResponse(question.id, 'a')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    responses[question.id] === 'a'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      responses[question.id] === 'a'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {responses[question.id] === 'a' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{question.options.a.text}</span>
                  </div>
                </button>

                {/* Option B */}
                <button
                  onClick={() => handleResponse(question.id, 'b')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    responses[question.id] === 'b'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      responses[question.id] === 'b'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {responses[question.id] === 'b' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{question.options.b.text}</span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {currentPage < getTotalPages() - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext() || submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? 'Submitting...' : '✓ Submit Questionnaire'}
              </button>
            )}
          </div>

          {!canGoNext() && (
            <p className="text-sm text-orange-600 text-center mt-3">
              Please answer all questions on this page to continue
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About This Questionnaire</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Based on the Felder-Silverman Learning Style Model</li>
            <li>• 20 questions covering 4 learning dimensions</li>
            <li>• Takes about 5 minutes to complete</li>
            <li>• Results help personalize your learning experience</li>
            <li>• No right or wrong answers - choose what feels natural to you</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
