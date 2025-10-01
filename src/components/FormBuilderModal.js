import React, { useState, useEffect } from 'react';

const FormBuilderModal = ({ isOpen, onClose, courseId, onFormCreated, initialData = null }) => {
  // Form basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Question types (Google Forms style)
  const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '○' },
    { value: 'checkboxes', label: 'Checkboxes', icon: '☑' },
    { value: 'short_answer', label: 'Short Answer', icon: '─' },
    { value: 'paragraph', label: 'Paragraph', icon: '¶' },
    { value: 'dropdown', label: 'Dropdown', icon: '▼' },
    { value: 'linear_scale', label: 'Linear Scale', icon: '⋙' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'time', label: 'Time', icon: '🕐' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setQuestions(initialData.questions || []);
      } else {
        // Initialize with one empty question
        setTitle('');
        setDescription('');
        setQuestions([createEmptyQuestion()]);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const createEmptyQuestion = () => ({
    id: Date.now().toString(),
    type: 'multiple_choice',
    title: '',
    required: false,
    options: ['Option 1'], // For multiple choice, checkboxes, dropdown
    // For linear scale
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: ''
  });

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim()) {
      setError('Form title is required.');
      setLoading(false);
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required.');
      setLoading(false);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title.trim()) {
        setError(`Question ${i + 1} title is required.`);
        setLoading(false);
        return;
      }

      if ((q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') && q.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options.`);
        setLoading(false);
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

      console.log('Sending form data:', {
        title,
        description,
        questionsCount: questions.length,
        courseId
      });

      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/forms/${initialData._id}` : `/api/courses/${courseId}/forms`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(formData)
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }
        console.error('Form creation failed:', errorData);
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('Form created successfully:', responseData);

      if (onFormCreated && typeof onFormCreated === 'function') {
        onFormCreated();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save form:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="w-full max-w-4xl p-6 sm:p-8 bg-white rounded-2xl shadow-xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {initialData ? 'Edit Form' : 'Create Form'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Build your form with multiple question types</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-grow mt-6 overflow-hidden flex flex-col">
            {/* Form Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Form Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title..."
                  required
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your form..."
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    index={index}
                    questionTypes={QUESTION_TYPES}
                    onUpdate={(updates) => updateQuestion(question.id, updates)}
                    onRemove={() => removeQuestion(question.id)}
                    onMoveUp={() => moveQuestion(question.id, 'up')}
                    onMoveDown={() => moveQuestion(question.id, 'down')}
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

            {/* Footer Actions */}
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-200 flex-shrink-0">
              <div>
                {initialData && (
                  <button
                    type="button"
                    onClick={() => window.open(`/forms/${initialData._id}`, '_blank')}
                    className="px-6 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    disabled={loading}
                  >
                    Preview Form
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-medium text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : (initialData ? 'Update Form' : 'Create Form')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// Question Editor Component
const QuestionEditor = ({
  question,
  index,
  questionTypes,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  canMoveUp,
  canMoveDown,
  canRemove
}) => {
  const selectedType = questionTypes.find(type => type.value === question.type) || questionTypes[0];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Question Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
        <div className="flex-grow">
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {questionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          {canMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {canMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Remove question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Question Title */}
      <div className="mb-3">
        <input
          type="text"
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter your question..."
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Question Options based on type */}
      {(question.type === 'multiple_choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
        <div className="space-y-2 mb-3">
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-6">
                {question.type === 'multiple_choice' ? (optionIndex === 0 ? '○' : '○') :
                 question.type === 'checkboxes' ? '☐' : `${optionIndex + 1}.`}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                className="flex-grow px-3 py-1 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {question.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveOption(optionIndex)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
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
            type="button"
            onClick={onAddOption}
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
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
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Min Value</label>
            <input
              type="number"
              min="0"
              max="10"
              value={question.scaleMin}
              onChange={(e) => onUpdate({ scaleMin: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Value</label>
            <input
              type="number"
              min="2"
              max="10"
              value={question.scaleMax}
              onChange={(e) => onUpdate({ scaleMax: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Min Label (Optional)</label>
            <input
              type="text"
              value={question.scaleMinLabel}
              onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
              placeholder="e.g., Poor"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Label (Optional)</label>
            <input
              type="text"
              value={question.scaleMaxLabel}
              onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
              placeholder="e.g., Excellent"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Required Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Required
        </label>
        <span className="text-xs text-gray-500">{selectedType.icon} {selectedType.label}</span>
      </div>
    </div>
  );
};

export default FormBuilderModal;