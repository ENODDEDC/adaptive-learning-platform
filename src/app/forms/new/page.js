'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const FormNewPage = () => {
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
  const [showPreview, setShowPreview] = useState(false);
  const [autoSave, setAutoSave] = useState(false); // Disabled for new forms
  
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
    scaleMaxLabel: ''
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
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ));
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
        courseId
      };

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Access denied'}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up form builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50" style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create New Form</h1>
                <p className="text-sm text-gray-500">Build your form with questions and options</p>
              </div>
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
                onClick={saveForm}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Creating...' : 'Create Form'}
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form Basic Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging form title..."
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context or instructions for your form..."
                />
              </div>
            </div>
          </div>       
   {/* Questions Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h3>
                  <p className="text-gray-600">Build your form with different question types</p>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all duration-200">
                    Quick Add ▼
                  </button>
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="p-2">
                      {QUESTION_TYPES.slice(0, 4).map(type => (
                        <button
                          key={type.value}
                          onClick={() => addQuestion(type.value)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors duration-150"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Question
                </button>
              </div>
            </div>

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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
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
    <div className="group relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
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
              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {selectedType.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {canMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
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
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Duplicate question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Remove question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
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
          {/* Question Title */}
          <div className="mb-6">
            <input
              type="text"
              value={question.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Enter your question..."
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium transition-all duration-200"
            />
          </div>

          {/* Question Options based on type */}
          {(question.type === 'multiple_choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 text-gray-400">
                    {question.type === 'multiple_choice' ? '○' :
                     question.type === 'checkboxes' ? '☐' : `${optionIndex + 1}.`}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-grow px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                  {question.options.length > 1 && (
                    <button
                      onClick={() => onRemoveOption(optionIndex)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Scale Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.scaleMin}
                    onChange={(e) => onUpdate({ scaleMin: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={question.scaleMax}
                    onChange={(e) => onUpdate({ scaleMax: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Labels (Optional)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={question.scaleMinLabel}
                    onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
                    placeholder="Low end label"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={question.scaleMaxLabel}
                    onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
                    placeholder="High end label"
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={`required-${question.id}`} className="text-sm font-medium text-gray-700">
              Required question
            </label>
          </div>
        </>
      )}
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ title, description, questions }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900">{title || 'Untitled Form'}</h2>
        {description && (
          <p className="text-gray-600 mt-2">{description}</p>
        )}
      </div>
      
      {questions.map((question, index) => (
        <div key={question.id} className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-500 mt-1">{index + 1}.</span>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900">
                {question.title || 'Untitled Question'}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              
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
                  <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                )}
                
                {question.type === 'paragraph' && (
                  <textarea
                    disabled
                    placeholder="Long answer text"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 resize-none"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                )}
                
                {question.type === 'time' && (
                  <input
                    type="time"
                    disabled
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormNewPage;