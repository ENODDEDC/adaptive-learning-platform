import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';
import FileUpload from './FileUpload';
import {
  XMarkIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CreateClassworkModal = ({ isOpen, onClose, courseId, onClassworkCreated, initialData = null, type: initialType = 'assignment' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [type, setType] = useState(initialType);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const handleFilesReady = useCallback((newFiles) => {
    setFiles(newFiles);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setDueDate(initialData.dueDate ? format(new Date(initialData.dueDate), 'yyyy-MM-dd') : '');
        setType(initialData.type || 'assignment');
        setFiles(initialData.attachments || []);
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
        setType(initialType);
        setFiles([]);
      }
      setError('');
    }
  }, [isOpen, initialData, initialType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim() || !type) {
      setError('Title and type are required.');
      setLoading(false);
      return;
    }

    // Check if there are any pending files that haven't been uploaded yet
    const pendingFiles = files.filter(file => !file.url && !file._id);
    if (pendingFiles.length > 0) {
      setError('Please wait for all files to finish uploading before creating the classwork.');
      setLoading(false);
      return;
    }

    try {
      // Prepare classwork data - files are already uploaded to Backblaze via FileUpload component
      const uploadedFiles = files.filter(file => file.url || file._id);
      const classworkData = {
        title,
        description,
        dueDate: dueDate || null,
        type,
        attachments: uploadedFiles // Only include uploaded files
      };

      console.log('🔍 CLASSWORK: Creating classwork with data:', {
        title,
        type,
        attachmentCount: uploadedFiles.length,
        attachments: uploadedFiles.map(f => ({ name: f.originalName || f.fileName, url: f.url }))
      });

      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/classwork/${initialData._id}` : `/api/courses/${courseId}/classwork`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classworkData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('🔍 CLASSWORK: Classwork created successfully:', responseData);

      console.log('🔍 CLASSWORK: Calling onClassworkCreated callback');
      if (onClassworkCreated && typeof onClassworkCreated === 'function') {
        onClassworkCreated();
        console.log('🔍 CLASSWORK: onClassworkCreated callback executed successfully');
      } else {
        console.warn('🔍 CLASSWORK: onClassworkCreated is not a function or is undefined');
      }
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Failed to save classwork:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getTypeIcon = (typeValue) => {
    switch (typeValue) {
      case 'assignment':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'form':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case 'material':
        return <BookOpenIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (typeValue) => {
    switch (typeValue) {
      case 'assignment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'form':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'material':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDueDate = () => {
    if (!dueDate) return null;
    const date = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T23:59'));
    return format(date, 'MMM dd, yyyy \'at\' h:mm a');
  };

  const isFormValid = () => {
    return title.trim() && type;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow and scroll position
      const originalOverflow = document.body.style.overflow;
      const scrollY = window.scrollY;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Cleanup function to restore original state
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed z-[9999] bg-black bg-opacity-60 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >

          {/* Clean Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${getTypeColor(type)}`}>
                  {getTypeIcon(type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {initialData ? 'Edit Classwork' : 'Create New Classwork'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {initialData ? 'Update your classwork details' : 'Add a new assignment, form, or material'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Simple Progress Steps */}
            <div className="flex items-center justify-center mt-5 space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${currentStep === step
                    ? 'bg-blue-600 text-white'
                    : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                    {currentStep > step ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 mx-2 transition-colors duration-200 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-center mt-2 space-x-16">
              <span className={`text-xs font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                Details
              </span>
              <span className={`text-xs font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                Files
              </span>
              <span className={`text-xs font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-500'}`}>
                Review
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Step 1: Basic Details */}
              {currentStep === 1 && (
                <div className="space-y-5">

                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Classwork Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'assignment', label: 'Assignment', icon: DocumentTextIcon, desc: 'Tasks for students', color: 'blue' },
                        { value: 'form', label: 'Form', icon: QuestionMarkCircleIcon, desc: 'Surveys & quizzes', color: 'orange' },
                        { value: 'material', label: 'Material', icon: BookOpenIcon, desc: 'Resources & files', color: 'emerald' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setType(option.value)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-left ${type === option.value
                            ? `border-${option.color}-300 bg-${option.color}-50 shadow-sm`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`p-1.5 rounded ${type === option.value
                              ? `bg-${option.color}-100 text-${option.color}-600`
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              <option.icon className="w-4 h-4" />
                            </div>
                            <span className={`font-medium text-sm ${type === option.value ? `text-${option.color}-900` : 'text-gray-900'
                              }`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      placeholder="Enter a descriptive title..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      placeholder="Provide detailed instructions or information..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Due Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-900 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="dueTime" className="block text-sm font-medium text-gray-900 mb-2">
                        Due Time
                      </label>
                      <input
                        type="time"
                        id="dueTime"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        disabled={!dueDate}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Attachments */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <PaperClipIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Add Attachments</h3>
                    <p className="text-sm text-gray-600">Upload files, documents, or resources for this classwork</p>
                  </div>

                  <FileUpload
                    onFilesReady={handleFilesReady}
                    initialFiles={files}
                    folder={`classwork/${courseId}`}
                  />

                  {files.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {files.length} file{files.length !== 1 ? 's' : ''} ready to attach
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Review Your Classwork</h3>
                    <p className="text-sm text-gray-600">Please review the details before creating</p>
                  </div>

                  {/* Preview Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                        {getTypeIcon(type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        </div>

                        {description && (
                          <p className="text-gray-700 mb-3 text-sm leading-relaxed">{description}</p>
                        )}

                        {dueDate && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Due: {formatDueDate()}</span>
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <PaperClipIcon className="w-4 h-4" />
                            <span>{files.length} attachment{files.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Clean Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    disabled={loading}
                  >
                    Previous
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 1 && !isFormValid()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>{initialData ? 'Save Changes' : 'Create Classwork'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  // Use portal to render modal at document body level, outside all parent containers
  return typeof document !== 'undefined' 
    ? ReactDOM.createPortal(modalContent, document.body)
    : null;
};

export default CreateClassworkModal;