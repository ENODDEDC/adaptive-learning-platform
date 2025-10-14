'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FormEditPage = ({ params }) => {
  const { id } = React.use(params);
  const router = useRouter();
  
  // Form basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPointsSummary, setShowPointsSummary] = useState(false);

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
      description: 'Single selection from options',
      color: 'blue'
    },
    { 
      value: 'checkboxes', 
      label: 'Checkboxes', 
      icon: '☑',
      description: 'Multiple selections allowed',
      color: 'green'
    },
    { 
      value: 'short_answer', 
      label: 'Short Answer', 
      icon: '─',
      description: 'Single line text input',
      color: 'purple'
    },
    { 
      value: 'paragraph', 
      label: 'Paragraph', 
      icon: '¶',
      description: 'Multi-line text input',
      color: 'indigo'
    },
    { 
      value: 'dropdown', 
      label: 'Dropdown', 
      icon: '▼',
      description: 'Select from dropdown menu',
      color: 'cyan'
    },
    { 
      value: 'linear_scale', 
      label: 'Linear Scale', 
      icon: '⋙',
      description: 'Rating scale (1-5, 1-10, etc.)',
      color: 'orange'
    },
    { 
      value: 'date', 
      label: 'Date', 
      icon: '📅',
      description: 'Date picker input',
      color: 'pink'
    },
    {
      value: 'time',
      label: 'Time',
      icon: '🕐',
      description: 'Time picker input',
      color: 'emerald'
    },
    {
      value: 'true_false',
      label: 'True/False',
      icon: '✓',
      description: 'True or False question',
      color: 'rose'
    }
  ];

  useEffect(() => {
    checkAuthorization();
  }, [id]);

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

      const userData = await authRes.json();

      // Get the form to check who created it
      const formRes = await fetch(`/api/forms/${id}`, {
        credentials: 'include'
      });

      if (!formRes.ok) {
        setError('Form not found');
        setIsAuthorized(false);
        setAuthLoading(false);
        return;
      }

      const formData = await formRes.json();

      // Check if current user is the creator of this form
      if (formData.form.createdBy._id === userData._id) {
        // User is the creator, allow form editing
        setIsAuthorized(true);
        fetchForm();
      } else {
        // User is not the creator, deny access
        setError('Access denied. Only the form creator can edit this form.');
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error('Authorization check failed:', err);
      setError('Failed to verify permissions');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && title && questions.length > 0) {
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [title, description, questions, autoSave]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${id}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Form not found');
      }

      const data = await res.json();
      console.log('=== FORM LOAD DEBUG ===');
      console.log('Form data received:', {
        title: data.form.title,
        questionsCount: data.form.questions?.length,
        sampleQuestion: data.form.questions?.[0] ? {
          id: data.form.questions[0].id,
          title: data.form.questions[0].title,
          type: data.form.questions[0].type,
          correctAnswer: data.form.questions[0].correctAnswer,
          points: data.form.questions[0].points,
          options: data.form.questions[0].options
        } : 'No questions'
      });

      setTitle(data.form.title || '');
      setDescription(data.form.description || '');

      // Load settings with defaults
      setSettings({
        allowMultipleResponses: data.form.settings?.allowMultipleResponses || false,
        showProgress: data.form.settings?.showProgress !== false, // Default to true
        shuffleQuestions: data.form.settings?.shuffleQuestions || false,
        confirmBeforeSubmit: data.form.settings?.confirmBeforeSubmit !== false, // Default to true
        showResultsAfterSubmission: data.form.settings?.showResultsAfterSubmission || false
      });

      // Ensure all questions have the required fields
      const questionsWithDefaults = (data.form.questions || [createEmptyQuestion()]).map(q => ({
        ...q,
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.type === 'checkboxes' ? [] : ''),
        points: q.points !== undefined ? q.points : 1
      }));

      setQuestions(questionsWithDefaults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    console.log('=== EDIT UPDATE QUESTION DEBUG ===');
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

  const handleAutoSave = async () => {
    if (!title.trim() || questions.length === 0) return;
    
    try {
      await saveForm(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const saveForm = async (showSuccess = true) => {
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
        settings
      };

      console.log('=== FORM UPDATE SEND DEBUG ===');
      console.log('FormData being sent to API:', {
        title,
        description,
        questionsCount: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          title: q.title,
          type: q.type,
          correctAnswer: q.correctAnswer,
          points: q.points,
          options: q.options
        }))
      });

      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
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

      if (showSuccess) {
        setLastSaved(new Date());
        // Show success message or toast
      }
    } catch (err) {
      setError(err.message || 'Failed to save form. Please try again.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('=== MANUAL SAVE DEBUG ===');
      console.log('Questions before save:', questions.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        correctAnswer: q.correctAnswer,
        points: q.points,
        options: q.options
      })));

      // Force refresh the questions state to ensure latest values
      setQuestions([...questions]);

      await saveForm(true);

      console.log('=== MANUAL SAVE COMPLETED ===');
      router.push(`/forms/${id}`);
    } catch (err) {
      console.error('Manual save failed:', err);
    }
  };

  // Show loading while checking authorization
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
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

  // Show loading while fetching form data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading form editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50" style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 shadow-sm bg-white/95 backdrop-blur-xl">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Form Builder</h1>
                <p className="text-sm text-gray-500">
                  {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
                </p>
              </div>
            </div>

            {/* Center - Auto-save toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                Auto-save
              </label>
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-indigo-600 animate-spin"></div>
                  Saving...
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  showPreview 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={() => window.open(`/forms/${id}`, '_blank')}
                className="px-4 py-2 text-sm font-medium text-purple-600 transition-all duration-200 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100"
              >
                Preview in New Tab
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {saving ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showPreview ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Form Editor */}
        <div className={`${showPreview ? '' : 'max-w-4xl mx-auto'}`}>
          {error && (
            <div className="p-4 mb-6 border border-red-200 bg-red-50 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form Basic Info */}
          <div className="p-8 mb-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Form Details</h2>
                <p className="text-gray-600">Set up your form title and description</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Form Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging form title..."
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 resize-none bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context or instructions for your form..."
                />
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <div className="p-8 mb-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600">Configure form behavior and options</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 p-4 transition-colors border border-gray-200 cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.allowMultipleResponses}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowMultipleResponses: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Allow multiple responses</div>
                  <div className="text-sm text-gray-500">Let users submit more than once</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 transition-colors border border-gray-200 cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.showProgress}
                  onChange={(e) => setSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Show progress bar</div>
                  <div className="text-sm text-gray-500">Display completion progress</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 transition-colors border border-gray-200 cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.shuffleQuestions}
                  onChange={(e) => setSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Shuffle questions</div>
                  <div className="text-sm text-gray-500">Randomize question order</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 transition-colors border border-gray-200 cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={settings.confirmBeforeSubmit}
                  onChange={(e) => setSettings(prev => ({ ...prev, confirmBeforeSubmit: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Confirm before submit</div>
                  <div className="text-sm text-gray-500">Show confirmation dialog</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 transition-colors border border-gray-200 cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100 md:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.showResultsAfterSubmission}
                  onChange={(e) => setSettings(prev => ({ ...prev, showResultsAfterSubmission: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Show results after submission</div>
                  <div className="text-sm text-gray-500">Display scores and correct answers to students</div>
                </div>
              </label>
            </div>
          </div>

          {/* Questions Section */}
          <div className="p-8 bg-white border border-gray-100 shadow-lg rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h3>
                  <p className="text-gray-600">Build your form with different question types</p>
                  <div className="mt-2">
                    <button
                      onClick={() => setShowPointsSummary(!showPointsSummary)}
                      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {showPointsSummary ? 'Hide' : 'Show'} Points Summary
                      <svg className={`w-4 h-4 transition-transform ${showPointsSummary ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-lg text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100">
                    Quick Add ▼
                  </button>
                  <div className="absolute right-0 z-10 invisible w-64 mt-2 transition-all duration-200 bg-white border border-gray-200 shadow-lg opacity-0 rounded-xl group-hover:opacity-100 group-hover:visible">
                    <div className="p-2">
                      {QUESTION_TYPES.slice(0, 4).map(type => (
                        <button
                          key={type.value}
                          onClick={() => addQuestion(type.value)}
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-left transition-colors duration-150 rounded-lg hover:bg-gray-50"
                        >
                          <span className="text-lg">{type.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => addQuestion()}
                  className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
                >
                  Add Question
                </button>
              </div>
            </div>

            {/* Points Summary */}
            {showPointsSummary && (
              <div className="p-4 mb-6 border border-indigo-200 bg-indigo-50 rounded-xl">
                <h4 className="mb-3 text-lg font-semibold text-indigo-900">Points Summary</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 pb-2 text-sm font-medium text-indigo-700 border-b border-indigo-200">
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
                  <div className="grid grid-cols-12 gap-4 pt-2 text-sm font-bold text-indigo-900 border-t border-indigo-300">
                    <div className="col-span-8">Total Points</div>
                    <div className="col-span-2 text-center">
                      {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                    </div>
                    <div className="col-span-2"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {questions.map((question, index) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="sticky top-24 h-fit">
            <div className="p-6 bg-white border border-gray-100 shadow-lg rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                <FormPreview title={title} description={description} questions={questions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Question Editor Component
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
    <div className="relative p-6 transition-all duration-300 border-2 border-gray-200 group bg-gradient-to-br from-gray-50 to-white rounded-2xl hover:border-indigo-300 hover:shadow-lg">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 bg-gradient-to-br from-${selectedType.color}-500 to-${selectedType.color}-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {index + 1}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={question.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
              className="px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
              ))}
            </select>
            <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
              {selectedType.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          {canMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-indigo-600 hover:bg-indigo-50"
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
              className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-indigo-600 hover:bg-indigo-50"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
            title="Duplicate question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-red-600 hover:bg-red-50"
              title="Remove question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-gray-600 hover:bg-gray-50"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Question Title and Points */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-3 text-lg font-medium transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Points:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={question.points || 1}
                  onChange={(e) => {
                    console.log('Points input changed:', e.target.value, 'for question:', question.id);
                    onUpdate({ points: parseInt(e.target.value) || 0 });
                  }}
                  onBlur={(e) => {
                    // Ensure the value is saved when user leaves the field
                    const newPoints = parseInt(e.target.value) || 0;
                    if (newPoints !== question.points) {
                      console.log('Points blurred, saving:', newPoints);
                      onUpdate({ points: newPoints });
                    }
                  }}
                  className="w-20 px-3 py-2 text-center bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Question Options based on type */}
          {(question.type === 'multiple_choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
            <div className="mb-6 space-y-3">
              <label className="block mb-3 text-sm font-medium text-gray-700">Options & Correct Answer</label>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  {question.type === 'multiple_choice' ? (
                    <input
                      type="radio"
                      name={`correct-answer-${question.id}`}
                      checked={question.correctAnswer === option}
                      onChange={() => {
                        console.log('Setting correct answer:', option, 'for question:', question.id);
                        onUpdate({ correctAnswer: option });
                      }}
                      className="w-5 h-5 text-indigo-600 cursor-pointer form-radio"
                      title="Set as correct answer"
                    />
                  ) : question.type === 'checkboxes' ? (
                    <input
                      type="checkbox"
                      checked={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option)}
                      onChange={(e) => {
                        const newCorrectAnswer = [...(question.correctAnswer || [])];
                        if (e.target.checked) {
                          if (!newCorrectAnswer.includes(option)) {
                            newCorrectAnswer.push(option);
                          }
                        } else {
                          const index = newCorrectAnswer.indexOf(option);
                          if (index > -1) {
                            newCorrectAnswer.splice(index, 1);
                          }
                        }
                        onUpdate({ correctAnswer: newCorrectAnswer });
                      }}
                      className="w-5 h-5 text-indigo-600 rounded cursor-pointer form-checkbox"
                      title="Set as correct answer"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-6 h-6 text-gray-400">{optionIndex + 1}.</div>
                  )}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-grow px-3 py-2 transition-all duration-200 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {question.options.length > 1 && (
                    <button
                      onClick={() => onRemoveOption(optionIndex)}
                      className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-red-600 hover:bg-red-50"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={onAddOption}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Min Value</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={question.scaleMin}
                  onChange={(e) => onUpdate({ scaleMin: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Max Value</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={question.scaleMax}
                  onChange={(e) => onUpdate({ scaleMax: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Min Label (Optional)</label>
                <input
                  type="text"
                  value={question.scaleMinLabel}
                  onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
                  placeholder="e.g., Poor"
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Max Label (Optional)</label>
                <input
                  type="text"
                  value={question.scaleMaxLabel}
                  onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
                  placeholder="e.g., Excellent"
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Required Toggle */}
          {/* Correct answer for text-based questions */}
          {(question.type === 'short_answer' || question.type === 'paragraph') && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Correct Answer</label>
              <input
                type="text"
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                placeholder="Enter the correct answer..."
                className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* True/False question type */}
          {question.type === 'true_false' && (
            <div className="mb-6">
              <label className="block mb-3 text-sm font-medium text-gray-700">Correct Answer</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-4 text-sm font-medium transition-all duration-200 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-green-300">
                  <input
                    type="radio"
                    name={`correct-answer-${question.id}`}
                    value="true"
                    checked={question.correctAnswer === 'true'}
                    onChange={() => onUpdate({ correctAnswer: 'true' })}
                    className="w-4 h-4 text-green-600 form-radio"
                  />
                  <span className="text-gray-700">True</span>
                </label>
                <label className="flex items-center gap-3 p-4 text-sm font-medium transition-all duration-200 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-red-300">
                  <input
                    type="radio"
                    name={`correct-answer-${question.id}`}
                    value="false"
                    checked={question.correctAnswer === 'false'}
                    onChange={() => onUpdate({ correctAnswer: 'false' })}
                    className="w-4 h-4 text-red-600 form-radio"
                  />
                  <span className="text-gray-700">False</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              Required question
            </label>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-lg">{selectedType.icon}</span>
              <span>{selectedType.label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ title, description, questions }) => {
  return (
    <div className="space-y-4">
      {/* Form Header */}
      <div className="p-4 border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
        <h3 className="mb-1 text-lg font-bold text-gray-900">{title || 'Untitled Form'}</h3>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>

      {/* Questions Preview */}
      {questions.map((question, index) => (
        <div key={question.id} className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full">
              {index + 1}
            </span>
            <div className="flex-1">
              <h4 className="mb-2 font-medium text-gray-900">
                {question.title || `Question ${index + 1}`}
                {question.required && <span className="ml-1 text-red-500">*</span>}
              </h4>
              
              {/* Preview based on question type */}
              <div className="text-sm text-gray-600">
                {question.type === 'short_answer' && (
                  <div className="w-full h-8 bg-white border border-gray-300 rounded"></div>
                )}
                {question.type === 'paragraph' && (
                  <div className="w-full h-16 bg-white border border-gray-300 rounded"></div>
                )}
                {(question.type === 'multiple_choice' || question.type === 'checkboxes') && (
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 border border-gray-300 ${question.type === 'checkboxes' ? 'rounded' : 'rounded-full'}`}></div>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === 'dropdown' && (
                  <div className="w-full h-8 px-3 py-1 bg-white border border-gray-300 rounded">
                    Choose...
                  </div>
                )}
                {question.type === 'linear_scale' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{question.scaleMinLabel || question.scaleMin}</span>
                    <div className="flex gap-2">
                      {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => (
                        <div key={i} className="w-6 h-6 border border-gray-300 rounded-full"></div>
                      ))}
                    </div>
                    <span className="text-xs">{question.scaleMaxLabel || question.scaleMax}</span>
                  </div>
                )}
                {(question.type === 'date' || question.type === 'time') && (
                  <div className="w-32 h-8 bg-white border border-gray-300 rounded"></div>
                )}
                {question.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 px-3 py-1 text-sm text-center text-gray-600 bg-white border border-gray-300 rounded">True</div>
                    <div className="h-8 px-3 py-1 text-sm text-center text-gray-600 bg-white border border-gray-300 rounded">False</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormEditPage;