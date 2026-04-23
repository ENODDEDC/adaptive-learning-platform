'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/ConfirmationModal';

const FormPreviewPage = ({ params }) => {
  const resolvedParams = React.use(params);
  const id = resolvedParams?.id;
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [courseSlug, setCourseSlug] = useState('');
  
  // Confirmation and Error modals state
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger' });
  
  // Authorization states
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && id) {
      checkAuthorizationAndFetchForm();
      
      // Remove double scrollbar: disable body scroll and use internal workspace scroll
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore original scroll behavior when leaving this page
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [id, isMounted]);

  const checkAuthorizationAndFetchForm = async () => {
    if (!id) {
      console.warn('🔍 FORM PREVIEW: No ID provided in params');
      return;
    }
    try {
      // Check if user is authenticated
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include'
      });

      if (!authRes.ok) {
        console.warn('🔍 FORM PREVIEW: User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      const userData = await authRes.json();
      console.log('🔍 FORM PREVIEW: User authenticated:', userData._id);
      setUser(userData);

      // Get the form to find which course it belongs to
      const formRes = await fetch(`/api/forms/${id}`, {
        credentials: 'include'
      });

      if (!formRes.ok) {
        console.error('🔍 FORM PREVIEW: Form fetch failed with status:', formRes.status);
        setError('Form not found');
        setIsAuthorized(false);
        return;
      }

      const formData = await formRes.json();
      console.log('🔍 FORM PREVIEW: Form data received:', formData.form?.title);
      
      if (!formData.form || !formData.form.courseId) {
        console.error('🔍 FORM PREVIEW: Form data is missing or has no courseId');
        setError('Invalid form data');
        setIsAuthorized(false);
        return;
      }

      const courseId = formData.form.courseId;
      console.log('🔍 FORM PREVIEW: Checking access for course:', courseId);

      // Check if user has access to this course
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      });

      if (courseRes.ok) {
        console.log('🔍 FORM PREVIEW: Access granted to course');
        const courseData = await courseRes.json();
        // User has access to the course, allow form viewing
        setIsAuthorized(true);
        setForm(formData.form);
        setCourseSlug(courseData.course.slug);
        
        // Initialize responses object
        const initialResponses = {};
        if (formData.form.questions) {
          formData.form.questions.forEach(question => {
            initialResponses[question.id] = question.type === 'checkboxes' ? [] : '';
          });
        }
        setResponses(initialResponses);
      } else {
        console.warn('🔍 FORM PREVIEW: Access denied to course, status:', courseRes.status);
        setError('Access denied. You do not have access to this course.');
        setIsAuthorized(false);
      }
      
    } catch (err) {
      console.error('🔍 FORM PREVIEW: Error in checkAuthorizationAndFetchForm:', err);
      setError('Failed to verify permissions: ' + err.message);
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
    if (e) e.preventDefault();
    
    // Check if we should show confirmation first
    if (form?.settings?.confirmBeforeSubmit && !showConfirmSubmitModal) {
      // Validate required questions before showing confirmation
      const requiredQuestions = form.questions.filter(q => q.required);
      const missingQuestions = requiredQuestions.filter(question => {
        const response = responses[question.id];
        return !response || (Array.isArray(response) && response.length === 0);
      });

      if (missingQuestions.length > 0) {
        const message = missingQuestions.length === 1 
          ? `Please answer the required question: ${missingQuestions[0].title}`
          : `You have ${missingQuestions.length} unanswered required questions. Please complete them before submitting.`;
          
        setErrorModal({
          isOpen: true,
          title: 'Incomplete Submission',
          message: message,
          variant: 'warning'
        });
        return;
      }
      
      setShowConfirmSubmitModal(true);
      return;
    }

    // Close confirmation modal if it was open
    setShowConfirmSubmitModal(false);
    setIsSubmitting(true);

    try {
      // Validate required questions (again for safety)
      const requiredQuestions = form.questions.filter(q => q.required);
      const missingQuestions = requiredQuestions.filter(question => {
        const response = responses[question.id];
        return !response || (Array.isArray(response) && response.length === 0);
      });

      if (missingQuestions.length > 0) {
        const message = missingQuestions.length === 1 
          ? `Please answer the required question: ${missingQuestions[0].title}`
          : `You have ${missingQuestions.length} unanswered required questions.`;
        throw new Error(message);
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
      setErrorModal({
        isOpen: true,
        title: 'Submission Error',
        message: err.message,
        variant: 'danger'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Form</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Initializing form content...</p>
        </div>
      </div>
    );
  }

  // Calculate current completion progress
  const calculateProgress = () => {
    if (!form || !form.questions) return 0;
    const answeredCount = form.questions.filter(q => {
      const resp = responses[q.id];
      return resp && (Array.isArray(resp) ? resp.length > 0 : String(resp).trim() !== '');
    }).length;
    return Math.round((answeredCount / form.questions.length) * 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row w-full h-screen bg-white overflow-hidden font-sans text-slate-900 animate-in fade-in duration-500">
      {/* LEFT SIDEBAR - Persistent Dashboard */}
      <div className="w-full lg:w-[380px] lg:h-full bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div className="p-8 lg:p-10 flex-1 overflow-y-auto custom-scrollbar">
          {/* Form Branding */}
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all duration-200 shadow-sm group"
              title="Exit Workspace"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate" title={form?.title}>
                {form?.title || 'Untitled Form'}
              </h1>
            </div>
          </div>

          {/* Circular Progress Gauge */}
          <div className="mb-12 p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * calculateProgress()) / 100}
                  strokeLinecap="round"
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{calculateProgress()}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 text-center leading-relaxed">
              {form?.questions?.filter(q => responses[q.id] && (Array.isArray(responses[q.id]) ? responses[q.id].length > 0 : String(responses[q.id]).trim() !== '')).length} of {form?.questions?.length} tasks completed
            </p>
          </div>

          {/* Question Navigation Map */}
          <div className="mb-10">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-3">
              {(form?.questions || []).map((q, idx) => {
                const resp = responses[q.id];
                const isAnswered = resp && (Array.isArray(resp) ? resp.length > 0 : String(resp).trim() !== '');
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const el = document.getElementById(`q-${q.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`h-10 rounded-xl text-xs font-bold transition-all duration-200 border-2 flex items-center justify-center ${
                      isAnswered 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-100/50 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Weight</span>
                <span className="text-sm font-bold text-slate-700">{calculateTotalPoints()} Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer - Actions */}
        <div className="p-8 bg-white border-t border-slate-200">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>FINALIZE SUBMISSION</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="w-full mt-4 py-3 text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-[0.2em] transition-colors"
          >
            Reset All Progress
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT AREA - Questions */}
      <div className="flex-1 h-full overflow-y-auto bg-white custom-scrollbar relative">
        <div className="max-w-3xl px-8 lg:px-20 py-16 lg:py-24 mx-auto">
          {/* Form Description Header */}
          {form?.description && (
            <div className="mb-20 p-8 border-l-4 border-indigo-600 bg-indigo-50/30 rounded-r-3xl">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 mb-3">Submission Instructions</h2>
              <p className="text-lg font-medium text-slate-600 leading-relaxed italic">
                "{form.description}"
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-24 pb-32">
            {(form?.questions || []).map((question, index) => (
              <div key={question.id} id={`q-${question.id}`} className="scroll-mt-24">
                {/* Question Header */}
                <div className="flex items-start gap-6 mb-8 group">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-lg font-bold text-slate-300 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all duration-300">
                    {index + 1}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                      {question.title}
                      {question.required && <span className="ml-2 text-rose-500">*</span>}
                    </h3>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Weight: {question.points || 1} Pts</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{question.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Question Input */}
                <div className="pl-0 lg:pl-18 lg:ml-18 space-y-4">
                  {question.type === 'short_answer' && (
                    <div className="relative group">
                      <input
                        type="text"
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        className="w-full px-0 py-4 text-xl font-bold text-slate-900 border-b-2 border-slate-100 focus:border-indigo-600 bg-transparent outline-none transition-all duration-300 placeholder-slate-200"
                        placeholder="Start typing your response..."
                        required={question.required}
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 transition-all duration-500 w-0 group-focus-within:w-full"></div>
                    </div>
                  )}

                  {question.type === 'paragraph' && (
                    <div className="relative group">
                      <textarea
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        className="w-full px-6 py-6 text-lg font-bold text-slate-900 border-2 border-slate-100 focus:border-indigo-600 bg-slate-50/30 rounded-3xl outline-none transition-all duration-300 placeholder-slate-200 min-h-[180px] focus:bg-white"
                        placeholder="Share your detailed thoughts..."
                        required={question.required}
                      />
                    </div>
                  )}

                  {question.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option, idx) => (
                        <label key={idx} className={`group flex items-center p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                          responses[question.id] === option 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' 
                            : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                        }`}>
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={responses[question.id] === option}
                            onChange={(e) => handleResponseChange(question.id, e.target.value)}
                            className="sr-only"
                            required={question.required}
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-300 ${
                            responses[question.id] === option 
                              ? 'border-indigo-600 bg-indigo-600' 
                              : 'border-slate-200 bg-white'
                          }`}>
                            {responses[question.id] === option && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <span className={`text-base font-bold transition-colors duration-300 ${
                            responses[question.id] === option ? 'text-indigo-900' : 'text-slate-600'
                          }`}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkboxes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option, idx) => (
                        <label key={idx} className={`group flex items-center p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                          (responses[question.id] || []).includes(option)
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' 
                            : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                        }`}>
                          <input
                            type="checkbox"
                            checked={(responses[question.id] || []).includes(option)}
                            onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mr-4 transition-all duration-300 ${
                            (responses[question.id] || []).includes(option)
                              ? 'border-indigo-600 bg-indigo-600' 
                              : 'border-slate-200 bg-white'
                          }`}>
                            {(responses[question.id] || []).includes(option) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-base font-bold transition-colors duration-300 ${
                            (responses[question.id] || []).includes(option) ? 'text-indigo-900' : 'text-slate-600'
                          }`}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'linear_scale' && (
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="text-center md:text-left min-w-[120px]">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Lower Bound</span>
                          <span className="text-sm font-bold text-slate-700">{question.scaleMinLabel || 'Minimum'}</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => {
                            const val = question.scaleMin + i;
                            const isSel = responses[question.id] == val;
                            return (
                              <label key={val} className="flex flex-col items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={val}
                                  checked={isSel}
                                  onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value))}
                                  className="sr-only"
                                  required={question.required}
                                />
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                                  isSel 
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110' 
                                    : 'border-white bg-white text-slate-300 hover:border-indigo-300 hover:text-indigo-600'
                                }`}>
                                  {val}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        <div className="text-center md:text-right min-w-[120px]">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Upper Bound</span>
                          <span className="text-sm font-bold text-slate-700">{question.scaleMaxLabel || 'Maximum'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(question.type === 'date' || question.type === 'time') && (
                    <div className="max-w-xs">
                      <input
                        type={question.type}
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        className="w-full px-6 py-4 text-lg font-bold text-slate-900 border-2 border-slate-100 bg-slate-50/30 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all duration-300"
                        required={question.required}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </form>
        </div>
      </div>

      {/* Success Modal Restructured for New Layout */}
      {showSuccessModal && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`relative w-full max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 ${submissionResult?.score ? 'max-w-2xl' : 'max-w-md'} border border-white/20 custom-scrollbar`}>
              <div className="relative">
                <div className={`sticky top-0 z-20 h-2 w-full ${submissionResult?.score ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>

                <div className="p-8 lg:p-12">
                  <div className={`flex items-center justify-center w-20 h-20 mx-auto mb-6 ${submissionResult?.score ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} rounded-3xl shadow-inner border border-white`}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h3 className="mb-2 text-xl font-bold text-center text-slate-900 tracking-tight leading-none">
                    {submissionResult?.score ? 'Submission Finalized' : 'Confirmed!'}
                  </h3>
                  
                  <p className="mb-8 text-xs font-bold text-center text-slate-400 uppercase tracking-widest">
                    {submissionResult?.score 
                      ? 'Your performance has been evaluated.' 
                      : 'Your responses are safely recorded.'}
                  </p>

                  {submissionResult?.score && (
                    <div className="mb-10 space-y-8">
                      {/* High-End Score Card */}
                      <div className="relative p-10 text-center border-2 border-slate-50 bg-slate-50/50 rounded-[2.5rem] overflow-hidden">
                        <div className="relative z-10">
                          <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Final Grade Evaluation</span>
                          <div className="flex items-baseline justify-center gap-2 mb-2">
                            <span className="text-7xl font-black text-indigo-600 tracking-tighter">{submissionResult.score.earnedPoints}</span>
                            <span className="text-2xl font-black text-slate-300">/ {submissionResult.score.totalPoints}</span>
                          </div>
                          <div className="inline-block px-6 py-2 rounded-full bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 uppercase">
                            Level: {submissionResult.score.percentage}%
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                      </div>

                      {/* Question Map Results */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Response Analysis</h4>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                            {submissionResult.score.questionResults.filter(r => r.isCorrect).length} Correct
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[240px] pr-2 custom-scrollbar">
                          {submissionResult.score.questionResults.map((result, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                              result.isCorrect ? 'bg-white border-slate-50' : 'bg-rose-50/30 border-rose-50'
                            }`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Q{idx + 1} • {result.pointsEarned}/{result.maxPoints} PTS</div>
                                  <div className="text-sm font-bold text-slate-800 leading-snug">{result.questionTitle}</div>
                                </div>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${result.isCorrect ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                                  {result.isCorrect ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (courseSlug) {
                        router.push(`/courses/${courseSlug}`);
                      } else {
                        router.push('/home');
                      }
                    }}
                    className="w-full py-5 font-black text-sm text-white bg-slate-900 hover:bg-black rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest"
                  >
                    Return to Course
                  </button>
                </div>
              </div>
            </div>
          </div>,
        document.body
      )}

      {/* Finalize Submission Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmSubmitModal}
        onClose={() => setShowConfirmSubmitModal(false)}
        onConfirm={() => handleSubmit()}
        title="Finalize Submission?"
        message="Are you sure you want to submit your responses? You may not be able to edit them later."
        confirmText="Yes, Submit"
        cancelText="Review Responses"
        variant="info"
        loading={isSubmitting}
        zIndex={110}
      />

      {/* Reset Progress Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={() => {
          setResponses({});
          setShowResetConfirmModal(false);
        }}
        title="Clear All Progress?"
        message="This will reset all your answers in this form. This action cannot be undone."
        confirmText="Reset Everything"
        cancelText="Keep My Answers"
        variant="danger"
        zIndex={110}
      />

      {/* Error/Notification Modal */}
      <ConfirmationModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        confirmText="Understood"
        showCancel={false}
        variant={errorModal.variant}
        zIndex={110}
      />
    </div>
  );
};

export default FormPreviewPage;