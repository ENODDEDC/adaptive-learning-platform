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
      setTitle(data.form.title || '');
      setDescription(data.form.description || '');
      setQuestions(data.form.questions || [createEmptyQuestion()]);
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
        questions
      };

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
      await saveForm(true);
      router.push(`/forms/${id}`);
    } catch (err) {
      // Error already handled in saveForm
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

  // Show loading while fetching form data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form editor...</p>
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
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Auto-save
              </label>
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
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
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all duration-200"
              >
                Preview in New Tab
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Value</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Value</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Label (Optional)</label>
                <input
                  type="text"
                  value={question.scaleMinLabel}
                  onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
                  placeholder="e.g., Poor"
                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Label (Optional)</label>
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
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title || 'Untitled Form'}</h3>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>

      {/* Questions Preview */}
      {questions.map((question, index) => (
        <div key={question.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-3 mb-3">
            <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">
                {question.title || `Question ${index + 1}`}
                {question.required && <span className="text-red-500 ml-1">*</span>}
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
                  <div className="w-full h-8 bg-white border border-gray-300 rounded px-3 py-1">
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
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormEditPage;