'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FormPreviewPage = ({ params }) => {
  const { id } = React.use(params);
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Authorization states
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthorizationAndFetchForm();
  }, [id]);

  const checkAuthorizationAndFetchForm = async () => {
    try {
      // Check if user is authenticated
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include'
      });

      if (!authRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await authRes.json();
      setUser(userData);

      // Get the form to find which course it belongs to
      const formRes = await fetch(`/api/forms/${id}`, {
        credentials: 'include'
      });

      if (!formRes.ok) {
        setError('Form not found');
        setIsAuthorized(false);
        setAuthLoading(false);
        setLoading(false);
        return;
      }

      const formData = await formRes.json();
      const courseId = formData.form.courseId;

      // Check if user has access to this course
      // If they can see the course card, they can view forms
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      });

      if (courseRes.ok) {
        // User has access to the course, allow form viewing
        setIsAuthorized(true);
        setForm(formData.form);
        
        // Initialize responses object
        const initialResponses = {};
        formData.form.questions.forEach(question => {
          initialResponses[question.id] = question.type === 'checkboxes' ? [] : '';
        });
        setResponses(initialResponses);
      } else {
        // User doesn't have access to the course
        setError('Access denied. You do not have access to this course.');
        setIsAuthorized(false);
      }
      
    } catch (err) {
      console.error('Authorization or form fetch failed:', err);
      setError('Failed to verify permissions');
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  };

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${id}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Form not found');
      }

      const data = await res.json();
      setForm(data.form);
      
      // Initialize responses object
      const initialResponses = {};
      data.form.questions.forEach(question => {
        initialResponses[question.id] = question.type === 'checkboxes' ? [] : '';
      });
      setResponses(initialResponses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    setResponses(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter(val => val !== option)
        };
      }
    });
  };

  // Calculate total points from all questions
  const calculateTotalPoints = () => {
    if (!form || !form.questions) return 0;
    return form.questions.reduce((total, question) => total + (question.points || 1), 0);
  };

  // Handle successful form submission
  const handleSubmissionSuccess = (result) => {
    setSubmissionResult(result);
    setShowSuccessModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required questions
      const requiredQuestions = form.questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        const response = responses[question.id];
        if (!response || (Array.isArray(response) && response.length === 0)) {
          throw new Error(`Please answer the required question: ${question.title}`);
        }
      }

      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ responses })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to submit form';
        let errorCode = null;

        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
          errorCode = errorData.code;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }

        // Handle specific error cases
        if (errorCode === 'DUPLICATE_SUBMISSION') {
          errorMessage = 'You have already submitted this form. If you need to make changes, please contact your instructor.';
        }

        throw new Error(errorMessage);
      }

      const result = await res.json();
      handleSubmissionSuccess(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">{authLoading ? 'Verifying access...' : 'Loading form...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-md p-8 mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Go Back
            </button>
            <button 
              onClick={() => router.push('/home')}
              className="px-6 py-2 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
        <div className="max-w-3xl min-h-full px-4 py-8 pb-32 mx-auto">
          {/* Scroll indicator */}
          <div className="fixed z-50 p-2 border border-gray-200 rounded-full shadow-lg top-4 right-4 bg-white/80 backdrop-blur-sm">
            <svg className="w-5 h-5 text-indigo-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        {/* Enhanced Form Header */}
        <div className="relative overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          {/* Gradient header bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
          
          <div className="relative p-8 lg:p-12">
            {/* Form icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-16 h-16 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full">Form</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{form.questions.length} questions</span>
                </div>
              </div>
            </div>
            
            <h1 className="mb-4 text-4xl font-bold leading-tight text-transparent bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              {form.title}
            </h1>
            {form.description && (
              <p className="max-w-2xl text-lg leading-relaxed text-gray-600">{form.description}</p>
            )}

            {/* Question Summary */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{form.questions.length} Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Total: {calculateTotalPoints()} Points</span>
              </div>
            </div>

          </div>
        </div>

        {/* Enhanced Form Questions */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {form.questions.map((question, index) => (
            <div key={question.id} className="relative group">
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  Question {index + 1} of {form.questions.length}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 overflow-hidden bg-gray-200 rounded-full">
                    <div
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${((index + 1) / form.questions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 min-w-[2.5rem]">
                    {Math.round(((index + 1) / form.questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Question number indicator - Always visible */}
              <div className="absolute flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full shadow-lg -left-4 top-6 bg-gradient-to-br from-indigo-500 to-purple-600">
                {index + 1}
              </div>
              
              <div className="overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-xl hover:border-indigo-200">
                {/* Question header with gradient accent */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
                
                <div className="p-8">
                  {/* Question Title */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold leading-tight text-gray-900">
                          {question.title}
                          {question.required && (
                            <span className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                              Required
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>{question.points || 1} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Question Input Based on Type */}
                  <div className="space-y-4">
                    {question.type === 'short_answer' && (
                      <div className="relative">
                        <input
                          type="text"
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-4 text-base placeholder-gray-400 transition-all duration-200 border-2 border-gray-200 bg-gray-50 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none"
                          placeholder="Type your answer here..."
                          required={question.required}
                        />
                        <div className="absolute inset-0 transition-opacity duration-200 opacity-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 -z-10 blur group-focus-within:opacity-20"></div>
                      </div>
                    )}

                    {question.type === 'paragraph' && (
                      <div className="relative">
                        <textarea
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-4 text-base placeholder-gray-400 transition-all duration-200 border-2 border-gray-200 resize-none bg-gray-50 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none"
                          rows="5"
                          placeholder="Share your thoughts in detail..."
                          required={question.required}
                        />
                        <div className="absolute inset-0 transition-opacity duration-200 opacity-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 -z-10 blur group-focus-within:opacity-20"></div>
                      </div>
                    )}

                    {question.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="relative flex items-center cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={responses[question.id] === option}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                className="sr-only"
                                required={question.required}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                                responses[question.id] === option 
                                  ? 'border-indigo-500 bg-indigo-500' 
                                  : 'border-gray-300 group-hover:border-indigo-300'
                              }`}>
                                {responses[question.id] === option && (
                                  <div className="absolute w-2 h-2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full top-1/2 left-1/2"></div>
                                )}
                              </div>
                            </div>
                            <div className={`ml-4 px-4 py-3 rounded-xl flex-1 transition-all duration-200 ${
                              responses[question.id] === option 
                                ? 'bg-indigo-50 border-2 border-indigo-200' 
                                : 'bg-gray-50 border-2 border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200'
                            }`}>
                              <span className="text-base font-medium text-gray-900">{option}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'checkboxes' && (
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="relative flex items-center cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={(responses[question.id] || []).includes(option)}
                                onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-200 ${
                                (responses[question.id] || []).includes(option)
                                  ? 'border-indigo-500 bg-indigo-500' 
                                  : 'border-gray-300 group-hover:border-indigo-300'
                              }`}>
                                {(responses[question.id] || []).includes(option) && (
                                  <svg className="absolute w-3 h-3 text-white transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className={`ml-4 px-4 py-3 rounded-xl flex-1 transition-all duration-200 ${
                              (responses[question.id] || []).includes(option)
                                ? 'bg-indigo-50 border-2 border-indigo-200' 
                                : 'bg-gray-50 border-2 border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200'
                            }`}>
                              <span className="text-base font-medium text-gray-900">{option}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'dropdown' && (
                      <div className="relative">
                        <select
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-4 text-base transition-all duration-200 border-2 border-gray-200 appearance-none cursor-pointer bg-gray-50 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none"
                          required={question.required}
                        >
                          <option value="">Select an option...</option>
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>{option}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {question.type === 'linear_scale' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                          <span className="px-3 py-1 text-red-700 bg-red-100 rounded-full">{question.scaleMinLabel || question.scaleMin}</span>
                          <span className="px-3 py-1 text-green-700 bg-green-100 rounded-full">{question.scaleMaxLabel || question.scaleMax}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => {
                            const value = question.scaleMin + i;
                            const isSelected = responses[question.id] == value;
                            return (
                              <label key={value} className="flex flex-col items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={value}
                                  checked={isSelected}
                                  onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value))}
                                  className="sr-only"
                                  required={question.required}
                                />
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                  isSelected 
                                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg scale-110' 
                                    : 'border-gray-300 bg-white text-gray-600 group-hover:border-indigo-300 group-hover:bg-indigo-50'
                                }`}>
                                  <span className="text-sm font-bold">{value}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {question.type === 'date' && (
                      <div className="relative">
                        <input
                          type="date"
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-4 text-base transition-all duration-200 border-2 border-gray-200 bg-gray-50 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none"
                          required={question.required}
                        />
                      </div>
                    )}

                    {question.type === 'time' && (
                      <div className="relative">
                        <input
                          type="time"
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="w-full px-4 py-4 text-base transition-all duration-200 border-2 border-gray-200 bg-gray-50 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none"
                          required={question.required}
                        />
                      </div>
                    )}

                    {question.type === 'true_false' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <label className="relative flex items-center cursor-pointer group">
                            <input
                              type="radio"
                              name={question.id}
                              value="true"
                              checked={responses[question.id] === 'true'}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              className="sr-only"
                              required={question.required}
                            />
                            <div className={`w-full px-4 py-4 text-center rounded-xl border-2 transition-all duration-200 ${
                              responses[question.id] === 'true'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 bg-gray-50 text-gray-600 group-hover:border-green-300 group-hover:bg-green-50'
                            }`}>
                              <span className="font-medium">True</span>
                            </div>
                          </label>

                          <label className="relative flex items-center cursor-pointer group">
                            <input
                              type="radio"
                              name={question.id}
                              value="false"
                              checked={responses[question.id] === 'false'}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              className="sr-only"
                              required={question.required}
                            />
                            <div className={`w-full px-4 py-4 text-center rounded-xl border-2 transition-all duration-200 ${
                              responses[question.id] === 'false'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-300 bg-gray-50 text-gray-600 group-hover:border-red-300 group-hover:bg-red-50'
                            }`}>
                              <span className="font-medium">False</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Submit Section */}
          <div className="relative overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl">
            {/* Decorative gradient bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
            
            <div className="p-8">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready to submit?</h3>
                    <p className="text-sm text-gray-600">Review your answers before submitting</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const initialResponses = {};
                      form.questions.forEach(question => {
                        initialResponses[question.id] = question.type === 'checkboxes' ? [] : '';
                      });
                      setResponses(initialResponses);
                    }}
                    className="px-6 py-3 font-medium text-gray-600 transition-all duration-200 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Clear form
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative px-8 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Submit Form</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md mx-4 duration-300 transform bg-white shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95">
            <div className="relative overflow-hidden">
              {/* Decorative gradient bar */}
              <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

              <div className="p-8">
                {/* Success icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h3 className="mb-4 text-2xl font-bold text-center text-gray-900">
                  Form Submitted Successfully!
                </h3>

                <p className="mb-6 text-center text-gray-600">
                  Thank you for completing the form. Your responses have been recorded.
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      router.push('/home');
                    }}
                    className="px-8 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormPreviewPage;