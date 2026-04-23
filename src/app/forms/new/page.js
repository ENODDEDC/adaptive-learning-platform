'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';

const FormNewPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  // Form basic info
  const [title, setTitle] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const showPreview = true;
  const [autoSave, setAutoSave] = useState(false); // Disabled for new forms
  const [showPointsSummary, setShowPointsSummary] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(true);
  const fileInputRef = useRef(null);

  // Form settings
  const [settings, setSettings] = useState({
    allowMultipleResponses: false,
    showProgress: true,
    shuffleQuestions: false,
    confirmBeforeSubmit: true,
    showResultsAfterSubmission: false
  });
  
  // Authorization states
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Question types with enhanced icons
  const QUESTION_TYPES = [
    { 
      value: 'multiple_choice', 
      label: 'Multiple Choice', 
      icon: '○',
      description: 'Single selection from options'
    },
    { 
      value: 'checkboxes', 
      label: 'Checkboxes', 
      icon: '☑',
      description: 'Multiple selections allowed'
    },
    { 
      value: 'short_answer', 
      label: 'Short Answer', 
      icon: '─',
      description: 'Single line text input'
    },
    { 
      value: 'paragraph', 
      label: 'Paragraph', 
      icon: '¶',
      description: 'Multi-line text input'
    },
    { 
      value: 'dropdown', 
      label: 'Dropdown', 
      icon: '▼',
      description: 'Select from dropdown menu'
    },
    { 
      value: 'linear_scale', 
      label: 'Linear Scale', 
      icon: '⋙',
      description: 'Rating scale (1-5, 1-10, etc.)'
    },
    { 
      value: 'date', 
      label: 'Date', 
      icon: '📅',
      description: 'Date picker input'
    },
    { 
      value: 'time', 
      label: 'Time', 
      icon: '🕐',
      description: 'Time picker input'
    }
  ];

  useEffect(() => {
    if (!courseId) {
      setError('Course ID is required');
      setAuthLoading(false);
      return;
    }
    checkAuthorization();
  }, [courseId]);

  const checkAuthorization = async () => {
    try {
      // Check if user is authenticated
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include'
      });

      if (!authRes.ok) {
        router.push('/login');
        return;
      }

      // Check if user has access to this course
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      });

      if (courseRes.ok) {
        // User has access to the course, allow form creation
        setIsAuthorized(true);
        initializeForm();
      } else {
        // User doesn't have access to the course
        setError('Access denied. You do not have access to this course.');
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error('Authorization check failed:', err);
      setError('Failed to verify permissions');
    } finally {
      setAuthLoading(false);
    }
  };

  const initializeForm = () => {
    // Initialize with one empty question
    setQuestions([createEmptyQuestion()]);
    setLoading(false);
  };

  const createEmptyQuestion = () => ({
    id: Date.now().toString(),
    type: 'multiple_choice',
    title: '',
    required: false,
    options: ['Option 1'],
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: '',
    correctAnswer: '',
    points: 1,
  });

  const addQuestion = (type = 'multiple_choice') => {
    const newQuestion = {
      ...createEmptyQuestion(),
      type,
      id: Date.now().toString()
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId, updates) => {
    console.log('=== NEW FORM UPDATE QUESTION DEBUG ===');
    console.log('Question ID:', questionId);
    console.log('Updates:', updates);

    setQuestions(prevQuestions => {
      console.log('Previous questions state:', prevQuestions.map(q => ({
        id: q.id,
        title: q.title,
        correctAnswer: q.correctAnswer,
        points: q.points
      })));

      const newQuestions = prevQuestions.map(q => {
        if (q.id === questionId) {
          const newQuestion = { ...q, ...updates };
          // If question type is changed, reset the correct answer
          if (updates.type && q.type !== updates.type) {
            newQuestion.correctAnswer = updates.type === 'checkboxes' ? [] : '';
          }
          console.log('New question after update:', {
            id: newQuestion.id,
            title: newQuestion.title,
            correctAnswer: newQuestion.correctAnswer,
            points: newQuestion.points
          });
          return newQuestion;
        }
        return q;
      });

      console.log('Final questions state:', newQuestions.map(q => ({
        id: q.id,
        title: q.title,
        correctAnswer: q.correctAnswer,
        points: q.points
      })));

      return newQuestions;
    });
  };

  const moveQuestion = (questionId, direction) => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < questions.length - 1)
    ) {
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const newQuestions = [...questions];
      [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];
      setQuestions(newQuestions);
    }
  };

  const duplicateQuestion = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const duplicatedQuestion = {
        ...question,
        id: Date.now().toString(),
        title: `${question.title} (Copy)`
      };
      const currentIndex = questions.findIndex(q => q.id === questionId);
      const newQuestions = [...questions];
      newQuestions.splice(currentIndex + 1, 0, duplicatedQuestion);
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options, `Option ${question.options.length + 1}`];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId, optionIndex) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options.length > 1) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Uploading and extracting text...');
    setImportError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImportStatus('AI is analyzing your document...');
      const res = await fetch('/api/forms/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse document');
      }

      setImportStatus('Structuring your questions...');
      const data = await res.json();
      
      if (data.questions && data.questions.length > 0) {
        setImportStatus(`Successfully imported ${data.questions.length} questions!`);
        
        // Add IDs to imported questions
        const processedQuestions = data.questions.map(q => ({
          ...q,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          required: q.required ?? true
        }));

        // Ask if user wants to append or replace
        const shouldReplace = questions.length === 1 && !questions[0].title.trim();
        
        if (shouldReplace) {
          setQuestions(processedQuestions);
        } else {
          setQuestions([...questions, ...processedQuestions]);
        }
      } else {
        setImportError('No questions could be extracted from this document.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err.message || 'Failed to import questions. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearAllQuestions = () => {
    if (questions.length === 0) return;
    setShowClearModal(true);
  };

  const confirmClearAll = () => {
    setQuestions([]);
    setShowClearModal(false);
  };

  const saveForm = async () => {
    setSaving(true);
    setError('');

    if (!title.trim()) {
      setError('Form title is required.');
      setSaving(false);
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required.');
      setSaving(false);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title.trim()) {
        setError(`Question ${i + 1} title is required.`);
        setSaving(false);
        return;
      }

      if ((q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') && q.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options.`);
        setSaving(false);
        return;
      }
    }

    try {
      const formData = {
        title,
        description,
        type: 'form',
        questions,
        courseId,
        settings
      };

      console.log('=== FORM CREATION DEBUG ===');
      console.log('Questions being sent:', questions.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        correctAnswer: q.correctAnswer,
        points: q.points,
        options: q.options
      })));

      // Also log the raw formData
      console.log('Raw formData being sent:', JSON.stringify(formData, null, 2));

      const res = await fetch(`/api/courses/${courseId}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      
      // Redirect to the course page or form view
      router.push(`/courses/${courseId}`);
    } catch (err) {
      setError(err.message || 'Failed to create form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show loading while checking authorization
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if not authorized
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || 'Access denied'}</p>
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

  // Show loading while initializing form
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Setting up form builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Enhanced Header */}
      <div className="shrink-0 border-b border-gray-200 shadow-sm bg-white/95 backdrop-blur-xl">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-slate-600 transition-all duration-200 rounded-lg hover:text-slate-900 hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 font-display">Create New Form</h1>
                <p className="text-xs font-medium text-slate-500">Build your form with questions and options</p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveForm}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-hidden max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="shrink-0 p-4 mb-6 border border-red-200 bg-red-50 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {importError && (
          <div className="shrink-0 p-4 mb-6 border border-rose-200 bg-rose-50 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium text-rose-600">{importError}</p>
            <button onClick={() => setImportError('')} className="text-rose-400 hover:text-rose-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="h-full grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex flex-col h-full gap-6 overflow-hidden">
            {/* Form Basic Info */}
            <section className="shrink-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
              <div 
                className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 cursor-pointer group/header"
                onClick={() => setIsIdentityExpanded(!isIdentityExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center transition-colors ${isIdentityExpanded ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-slate-900 font-display">Form Identity</h3>
                      {!isIdentityExpanded && title.trim() && (
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-left-2">
                          {title.length > 40 ? title.substring(0, 40) + '...' : title}
                        </span>
                      )}
                    </div>
                    {isIdentityExpanded && (
                      <p className="text-xs font-medium text-slate-500">Basic details about your assessment.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsModal(true);
                    }}
                    className="p-2 text-slate-400 transition-all rounded-lg hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                    title="Form Settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <div className={`p-1.5 rounded-lg transition-colors ${isIdentityExpanded ? 'text-slate-400 hover:bg-slate-100' : 'text-indigo-500 bg-indigo-50'}`}>
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isIdentityExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {isIdentityExpanded && (
                <div className="p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 font-display">Form Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 border border-slate-200 bg-slate-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 font-sans"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                      }}
                      onBlur={() => {
                        if (title.trim()) setIsIdentityExpanded(false);
                      }}
                      placeholder="Enter a clear and specific form title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 font-display">Description (Optional)</label>
                    <textarea
                      className="w-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 border border-slate-200 resize-none bg-slate-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 font-sans"
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add context or instructions."
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Questions Section */}
            <section className="flex flex-col flex-grow overflow-hidden bg-white border border-slate-200 shadow-sm rounded-3xl mb-4">
              <div className="shrink-0 flex flex-col gap-4 px-8 py-5 border-b border-slate-200 bg-slate-50/50 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 font-display">Question Bank</h3>
                    <p className="text-sm font-medium text-slate-500">Compose and arrange each prompt in final delivery order.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  
                  {/* Unified Actions Menu Trigger */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptionsModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all border rounded-xl text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-display"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Options
                    </button>
                  </div>

                  <button
                    onClick={() => addQuestion()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white transition-all rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 font-display"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Question
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent flex flex-col">
                {showPointsSummary && questions.length > 0 && (
                  <div className="p-4 mb-6 border border-gray-200 bg-gray-50 rounded-xl">
                    <h4 className="mb-3 text-lg font-semibold text-gray-900">Points Summary</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-4 pb-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                        <div className="col-span-8">Question</div>
                        <div className="col-span-2 text-center">Points</div>
                        <div className="col-span-2 text-center">Type</div>
                      </div>
                      {questions.map((question, index) => (
                        <div key={question.id} className="grid grid-cols-12 gap-4 py-1 text-sm text-gray-700">
                          <div className="col-span-8">
                            Q{index + 1}: {question.title || 'Untitled Question'}
                          </div>
                          <div className="col-span-2 font-medium text-center">
                            {question.points || 0}
                          </div>
                          <div className="col-span-2 text-xs text-center text-gray-500">
                            {QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-4 pt-2 text-sm font-bold text-gray-900 border-t border-gray-300">
                        <div className="col-span-8">Total Points</div>
                        <div className="col-span-2 text-center">
                          {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                        </div>
                        <div className="col-span-2"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`flex-grow ${questions.length === 0 ? 'flex flex-col items-center justify-center' : 'space-y-6'}`}>
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                      <div className={`flex items-center justify-center transition-all duration-300 rounded-[2rem] bg-slate-50 border border-slate-100 text-slate-300 shadow-sm ${isIdentityExpanded ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'}`}>
                        <svg className={`transition-all duration-300 ${isIdentityExpanded ? 'w-8 h-8' : 'w-10 h-10'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className={`font-bold text-slate-900 font-display transition-all duration-300 ${isIdentityExpanded ? 'text-sm uppercase tracking-widest text-slate-400' : 'text-xl'}`}>
                        {isIdentityExpanded ? 'Questions Empty' : 'No questions yet'}
                      </h4>
                      {!isIdentityExpanded && (
                        <p className="max-w-xs mt-3 text-sm font-medium leading-relaxed text-slate-500 animate-in fade-in slide-in-from-top-1 duration-500">
                          Start building your assessment by adding a question manually or using the AI Magic Import.
                        </p>
                      )}
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <EnhancedQuestionEditor
                        key={question.id}
                        question={question}
                        index={index}
                        questionTypes={QUESTION_TYPES}
                        onUpdate={(updates) => updateQuestion(question.id, updates)}
                        onRemove={() => removeQuestion(question.id)}
                        onMoveUp={() => moveQuestion(question.id, 'up')}
                        onMoveDown={() => moveQuestion(question.id, 'down')}
                        onDuplicate={() => duplicateQuestion(question.id)}
                        onAddOption={() => addOption(question.id)}
                        onUpdateOption={(optionIndex, value) => updateOption(question.id, optionIndex, value)}
                        onRemoveOption={(optionIndex) => removeOption(question.id, optionIndex)}
                        canMoveUp={index > 0}
                        canMoveDown={index < questions.length - 1}
                        canRemove={questions.length > 1}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 xl:h-[calc(100vh-140px)] xl:mb-10">
            <div className="flex flex-col h-full p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <div className="flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Live Preview</h3>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <FormPreview title={title} description={description} questions={questions} />
                </div>
              </div>
          </aside>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowClearModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md overflow-hidden transition-all transform bg-white shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 text-rose-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-center text-slate-900 font-display">Clear All Questions?</h3>
              <p className="mt-3 text-sm font-medium text-center leading-relaxed text-slate-500">
                This will permanently remove all questions from your current form bank. This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-3 mt-8 sm:flex-row">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-6 py-3 text-sm font-bold transition-all border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 font-display"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 px-6 py-3 text-sm font-bold text-white transition-all bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 active:scale-95 font-display"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Options Modal */}
      {showOptionsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowOptionsModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg overflow-hidden transition-all transform bg-white shadow-2xl rounded-[2.5rem] animate-in fade-in zoom-in duration-200">
            <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
              {/* Left Side - Actions */}
              <div className="p-6 space-y-3">
                <p className="px-2 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</p>
                
                <button
                  onClick={() => {
                    setShowOptionsModal(false);
                    fileInputRef.current?.click();
                  }}
                  disabled={isImporting}
                  className="flex items-center w-full gap-3 px-3 py-3 text-sm font-semibold text-left transition-all rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 group/item"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 transition-transform group-hover/item:scale-110">
                    {isImporting ? (
                      <div className="w-5 h-5 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-display leading-tight text-xs">AI Magic Import</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowPointsSummary(!showPointsSummary);
                  }}
                  className={`flex items-center w-full gap-3 px-3 py-3 text-sm font-semibold text-left transition-all rounded-2xl ${showPointsSummary ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'} group/item`}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-transform group-hover/item:scale-110 ${showPointsSummary ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="font-display leading-tight text-xs">Points Table</div>
                </button>

                <div className="h-px mx-3 my-1 bg-slate-100"></div>
                
                <button
                  onClick={() => {
                    setShowOptionsModal(false);
                    clearAllQuestions();
                  }}
                  className="flex items-center w-full gap-3 px-3 py-3 text-sm font-bold text-left transition-all rounded-2xl text-rose-600 hover:bg-rose-50 group/item"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-100 text-rose-600 transition-transform group-hover/item:scale-110">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="font-display leading-tight text-xs">Clear All</div>
                </button>
              </div>

              {/* Right Side - Quick Add */}
              <div className="p-6 bg-slate-50/50">
                <p className="px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Add</p>
                <div className="grid grid-cols-1 gap-1">
                  {QUESTION_TYPES.slice(0, 6).map(type => (
                    <button
                      key={type.value}
                      onClick={() => {
                        addQuestion(type.value);
                        setShowOptionsModal(false);
                      }}
                      className="flex items-center w-full gap-3 px-2 py-2 text-xs font-semibold text-left transition-all rounded-xl text-slate-700 hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent group/item"
                    >
                      <span className="flex items-center justify-center w-7 h-7 text-sm rounded-lg bg-white border border-slate-100 transition-transform group-hover/item:scale-110">{type.icon}</span>
                      <span className="font-display">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Response Rules (Settings) Modal */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowSettingsModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl overflow-hidden transition-all transform bg-white shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">Response Rules</h3>
                  <p className="text-sm font-medium text-slate-500">Global settings for how students interact with this form.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-2 transition-colors rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-4 p-4 transition-all border border-slate-100 cursor-pointer rounded-2xl bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md group">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.allowMultipleResponses ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.allowMultipleResponses}
                      onChange={(e) => setSettings(prev => ({ ...prev, allowMultipleResponses: e.target.checked }))}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allowMultipleResponses ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-display">Multiple Responses</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allow re-submission</div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 transition-all border border-slate-100 cursor-pointer rounded-2xl bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md group">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showProgress ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.showProgress}
                      onChange={(e) => setSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showProgress ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-display">Progress Bar</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Show completion status</div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 transition-all border border-slate-100 cursor-pointer rounded-2xl bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md group">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.shuffleQuestions}
                      onChange={(e) => setSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-display">Shuffle Order</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Randomize questions</div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 transition-all border border-slate-100 cursor-pointer rounded-2xl bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md group">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.confirmBeforeSubmit ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.confirmBeforeSubmit}
                      onChange={(e) => setSettings(prev => ({ ...prev, confirmBeforeSubmit: e.target.checked }))}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.confirmBeforeSubmit ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-display">Confirm Submit</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Show final warning</div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 transition-all border border-slate-100 cursor-pointer rounded-2xl bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md group md:col-span-2">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showResultsAfterSubmission ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.showResultsAfterSubmission}
                      onChange={(e) => setSettings(prev => ({ ...prev, showResultsAfterSubmission: e.target.checked }))}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showResultsAfterSubmission ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-display">Show Results Instantly</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display scores and correct answers to students</div>
                  </div>
                </label>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full px-6 py-4 text-sm font-bold text-white transition-all bg-slate-900 rounded-2xl hover:bg-slate-800 active:scale-[0.98] font-display shadow-lg shadow-slate-200"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Processing Modal */}
      {isImporting && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 transition-opacity bg-slate-900/40 backdrop-blur-md"></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-sm overflow-hidden transition-all transform bg-white shadow-2xl rounded-[2.5rem] animate-in fade-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-8">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                {/* Middle rotating ring */}
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                {/* Center icon */}
                <div className="relative flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full text-white shadow-xl shadow-indigo-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 font-display">AI Magic at Work</h3>
              <p className="mt-3 text-sm font-semibold text-indigo-600 animate-pulse">
                {importStatus}
              </p>
              
              <div className="mt-8 space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing your document</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Enhanced Question Editor Component (same as edit page)
const EnhancedQuestionEditor = ({
  question,
  index,
  questionTypes,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  canMoveUp,
  canMoveDown,
  canRemove
}) => {
  const selectedType = questionTypes.find(type => type.value === question.type) || questionTypes[0];
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative p-6 transition-all duration-300 border border-slate-200 group rounded-2xl bg-white shadow-sm hover:border-indigo-200 hover:shadow-md">
      {/* Question Header */}
      <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg bg-slate-50 font-display">
            {index + 1}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase font-display">Question Block</p>
            <select
              value={question.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
              className="px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
              ))}
            </select>
            <span className="px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-100 bg-slate-50/50 rounded-full">
              {selectedType.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {canMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1.5 text-slate-400 transition-all duration-200 rounded-lg hover:text-indigo-600 hover:bg-white hover:shadow-sm"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {canMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 text-slate-400 transition-all duration-200 rounded-lg hover:text-indigo-600 hover:bg-white hover:shadow-sm"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
          <button
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-white hover:shadow-sm"
            title="Duplicate question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 transition-all duration-200 rounded-lg hover:text-rose-600 hover:bg-white hover:shadow-sm"
              title="Remove question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 transition-all duration-200 rounded-lg hover:bg-white hover:shadow-sm ${isExpanded ? 'text-slate-600' : 'text-indigo-600 bg-indigo-50'}`}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Question Title and Points */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold tracking-wide uppercase text-slate-400 font-display">Question Text</label>
              <textarea
                value={question.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Enter your question here..."
                rows="2"
                className="w-full px-4 py-3 text-base font-semibold transition-all duration-200 bg-slate-50/30 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 font-sans resize-none leading-snug"
              />
            </div>
            
            <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50/30 w-fit">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <label className="text-xs font-bold tracking-widest uppercase text-slate-500 font-display">Weight</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={question.points}
                  onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1.5 text-center font-bold text-indigo-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-sm font-bold text-slate-400 font-display uppercase tracking-tighter">Points</span>
              </div>
            </div>
          </div>

          {/* Question Options based on type */}
          {(question.type === 'multiple_choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-400 font-display">Options & Correct Answer</label>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                  {question.type === 'multiple_choice' ? 'Single Select' : question.type === 'checkboxes' ? 'Multi Select' : 'Dropdown List'}
                </span>
              </div>
              
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = question.type === 'checkboxes' 
                    ? (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option))
                    : question.correctAnswer === option;

                  return (
                    <div key={optionIndex} className={`flex items-center gap-3 p-2 pl-4 transition-all border rounded-xl group/option ${isCorrect ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                      <button
                        onClick={() => {
                          if (question.type === 'multiple_choice' || question.type === 'dropdown') {
                            onUpdate({ correctAnswer: option });
                          } else {
                            const newCorrectAnswer = [...(question.correctAnswer || [])];
                            if (newCorrectAnswer.includes(option)) {
                              onUpdate({ correctAnswer: newCorrectAnswer.filter(a => a !== option) });
                            } else {
                              onUpdate({ correctAnswer: [...newCorrectAnswer, option] });
                            }
                          }
                        }}
                        className={`flex items-center justify-center w-6 h-6 transition-all rounded-lg border-2 ${isCorrect ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'border-slate-200 text-transparent hover:border-indigo-400'}`}
                        title="Mark as correct"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      <input
                        type="text"
                        value={option}
                        onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className={`flex-grow px-0 py-1 text-sm font-medium transition-all bg-transparent border-none focus:ring-0 ${isCorrect ? 'text-indigo-900' : 'text-slate-600 placeholder:text-slate-300'}`}
                      />

                      <div className="flex items-center gap-1 opacity-0 group-hover/option:opacity-100 transition-opacity pr-2">
                        {question.options.length > 1 && (
                          <button
                            onClick={() => onRemoveOption(optionIndex)}
                            className="p-1.5 text-slate-400 transition-all rounded-lg hover:text-rose-500 hover:bg-rose-50"
                            title="Remove option"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={onAddOption}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 transition-all rounded-xl bg-indigo-50 hover:bg-indigo-100 font-display"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </button>
            </div>
          )}

          {/* Linear Scale */}
          {question.type === 'linear_scale' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Scale Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.scaleMin}
                    onChange={(e) => onUpdate({ scaleMin: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={question.scaleMax}
                    onChange={(e) => onUpdate({ scaleMax: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Labels (Optional)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={question.scaleMinLabel}
                    onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
                    placeholder="Low end label"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={question.scaleMaxLabel}
                    onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
                    placeholder="High end label"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Correct answer for text-based questions */}
          {(question.type === 'short_answer' || question.type === 'paragraph') && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Correct Answer</label>
              <input
                type="text"
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                placeholder="Enter the correct answer..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 transition-all border border-slate-100 rounded-xl bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${question.required ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 font-display">Required Question</p>
                <p className="text-[10px] font-medium text-slate-500">Students cannot submit without answering</p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ required: !question.required })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${question.required ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${question.required ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ title, description, questions }) => {
  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-slate-100">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">{title || 'Untitled Form'}</h2>
        {description && (
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-400 font-display uppercase tracking-widest">Preview Mode</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Add questions to see them in real-time</p>
        </div>
      ) : (
        questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-sm font-bold text-slate-400 font-display">{index + 1}.</span>
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700 font-sans leading-snug break-words">
                    {question.title || 'Untitled Question'}
                    {question.required && <span className="ml-1 text-rose-500">*</span>}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Weight</span>
                    <span className="text-xs font-bold text-indigo-600">{question.points || 0}</span>
                  </div>
                </div>
                
                {/* Preview based on question type */}
                <div className="mt-3">
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="radio" name={`preview-${question.id}`} disabled className="text-indigo-600" />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'checkboxes' && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" disabled className="text-indigo-600 rounded" />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'dropdown' && (
                    <select disabled className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-lg bg-gray-50">
                      <option>Choose an option</option>
                      {question.options.map((option, optionIndex) => (
                        <option key={optionIndex}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {question.type === 'short_answer' && (
                    <input
                      type="text"
                      disabled
                      placeholder="Short answer text"
                      className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  
                  {question.type === 'paragraph' && (
                    <textarea
                      disabled
                      placeholder="Long answer text"
                      rows="3"
                      className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-lg resize-none bg-gray-50"
                    />
                  )}
                  
                  {question.type === 'linear_scale' && (
                    <div className="flex items-center gap-4">
                      {question.scaleMinLabel && (
                        <span className="text-sm text-gray-600">{question.scaleMinLabel}</span>
                      )}
                      <div className="flex items-center gap-2">
                        {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => (
                          <label key={i} className="flex flex-col items-center gap-1">
                            <input type="radio" name={`scale-${question.id}`} disabled className="text-indigo-600" />
                            <span className="text-xs text-gray-500">{question.scaleMin + i}</span>
                          </label>
                        ))}
                      </div>
                      {question.scaleMaxLabel && (
                        <span className="text-sm text-gray-600">{question.scaleMaxLabel}</span>
                      )}
                    </div>
                  )}
                  
                  {question.type === 'date' && (
                    <input
                      type="date"
                      disabled
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                  
                  {question.type === 'time' && (
                    <input
                      type="time"
                      disabled
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

function FormNewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading…</div>}>
      <FormNewPageContent />
    </Suspense>
  );
}

export default FormNewPage;
