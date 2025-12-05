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
  const [panelWidth, setPanelWidth] = useState(35); // Default 35% width
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(35);

  const handleFilesReady = useCallback((newFiles) => {
    setFiles(newFiles);
  }, []);

  // Handle mouse down on resize handle
  const handleResizeStart = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(panelWidth);
    if (typeof window !== 'undefined') {
      window.document.body.style.cursor = 'ew-resize';
      window.document.body.style.userSelect = 'none';
    }
  };

  // Handle mouse move during resize
  useEffect(() => {
    let animationFrameId = null;

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Use requestAnimationFrame for smoother updates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const viewportWidth = window.innerWidth;

        // For a right-side panel with left resize handle:
        // - Moving mouse LEFT (decreasing e.clientX) should INCREASE panel width
        // - Moving mouse RIGHT (increasing e.clientX) should DECREASE panel width
        const deltaX = startX - e.clientX;

        // Calculate new width based on pixel movement
        const startWidthPx = (startWidth / 100) * viewportWidth;
        const newWidthPx = startWidthPx + deltaX;
        const newWidthPercent = (newWidthPx / viewportWidth) * 100;

        // Constrain width between 25% and 70%
        const constrainedWidth = Math.max(25, Math.min(70, newWidthPercent));

        // Always update for smooth resizing
        setPanelWidth(constrainedWidth);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (typeof window !== 'undefined') {
        window.document.body.style.cursor = '';
        window.document.body.style.userSelect = '';
      }
    };

    if (isResizing && typeof window !== 'undefined') {
      window.document.addEventListener('mousemove', handleMouseMove);
      window.document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.document.removeEventListener('mousemove', handleMouseMove);
        window.document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [isResizing, startX, startWidth]);

  useEffect(() => {
    if (isOpen) {
      // Collapse the main sidebar when the panel opens
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('collapseMainSidebar'));
      }

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
    <>
      {/* Resize Overlay - Covers entire screen during resize to capture mouse events */}
      {isResizing && (
        <div
          className="fixed inset-0 cursor-ew-resize"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(1px)',
            zIndex: 99998
          }}
        />
      )}

      <div
        className="fixed inset-0 z-[9999] flex justify-end pointer-events-none"
      >
        {/* Slide-in Panel - No backdrop, just the panel */}
        <div
          className="relative bg-white shadow-2xl flex flex-col h-full animate-slide-in-right pointer-events-auto"
          style={{ 
            animation: 'slideInRight 0.3s ease-out',
            width: `${panelWidth}%`,
            transition: isResizing ? 'none' : 'all 300ms ease-in-out'
          }}
        >
          {/* Resize Handle - Much wider invisible hit area with thin visual indicator */}
          <div
            className="absolute left-0 top-0 w-8 h-full cursor-ew-resize z-10 group"
            onMouseDown={handleResizeStart}
            title="Drag to resize panel"
          >
            {/* Visual indicator - thin blue line */}
            <div className="absolute left-0 top-0 w-1 h-full bg-gray-300 group-hover:bg-blue-500 transition-colors duration-200">
              {/* Visual indicator dots */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1">
                <div className="w-0.5 h-0.5 bg-gray-500 group-hover:bg-white rounded-full transition-colors duration-200"></div>
                <div className="w-0.5 h-0.5 bg-gray-500 group-hover:bg-white rounded-full transition-colors duration-200"></div>
                <div className="w-0.5 h-0.5 bg-gray-500 group-hover:bg-white rounded-full transition-colors duration-200"></div>
              </div>
            </div>
          </div>

          {/* Modern Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${getTypeColor(type)} shadow-sm`}>
                  {getTypeIcon(type)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {initialData ? 'Edit Classwork' : 'Create Classwork'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {initialData ? 'Update details' : 'Add new content for students'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Compact Progress Steps */}
            <div className="flex items-center space-x-1">
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Files' },
                { num: 3, label: 'Review' }
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${currentStep === step.num
                      ? 'bg-blue-600 text-white shadow-md'
                      : currentStep > step.num
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                      }`}>
                      {currentStep > step.num ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        step.num
                      )}
                    </div>
                    <span className={`text-xs font-medium ${currentStep === step.num ? 'text-blue-700' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`h-0.5 w-8 transition-colors duration-200 ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                  )}
                </React.Fragment>
              ))}
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

                  {/* Type Selection - Modern Cards */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Choose Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'assignment', label: 'Assignment', icon: DocumentTextIcon, desc: 'Tasks', gradient: 'from-blue-500 to-blue-600' },
                        { value: 'form', label: 'Form', icon: QuestionMarkCircleIcon, desc: 'Surveys', gradient: 'from-orange-500 to-orange-600' },
                        { value: 'material', label: 'Material', icon: BookOpenIcon, desc: 'Resources', gradient: 'from-emerald-500 to-emerald-600' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setType(option.value)}
                          className={`group relative p-3 rounded-xl border-2 transition-all duration-200 text-center ${type === option.value
                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center ${type === option.value ? 'shadow-md' : 'opacity-70 group-hover:opacity-100'}`}>
                            <option.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={`block font-semibold text-xs ${type === option.value ? 'text-blue-900' : 'text-gray-700'}`}>
                            {option.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{option.desc}</span>
                          {type === option.value && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title - Modern Input */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <span>Title</span>
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="title"
                        placeholder="e.g., Chapter 5 Assignment"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                      {title && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description - Modern Textarea */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                      Description
                      <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                      id="description"
                      placeholder="Add instructions, requirements, or additional details..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder:text-gray-400"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">{description.length} characters</p>
                  </div>

                  {/* Due Date and Time - Modern Design */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <CalendarIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Due Date & Time</h3>
                      <span className="text-xs text-gray-500">(Optional)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="dueDate" className="block text-xs font-medium text-gray-700 mb-1.5">
                          Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="dueTime" className="block text-xs font-medium text-gray-700 mb-1.5">
                          Time
                        </label>
                        <div className="relative">
                          <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            id="dueTime"
                            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 text-sm"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            disabled={!dueDate}
                          />
                        </div>
                      </div>
                    </div>
                    {dueDate && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>Due: {formatDueDate()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Attachments - Modern Design */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PaperClipIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Add Attachments</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      Upload files, documents, or resources to share with students
                    </p>
                  </div>

                  <FileUpload
                    onFilesReady={handleFilesReady}
                    initialFiles={files}
                    folder={`classwork/${courseId}`}
                  />

                  {files.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900">
                            {files.length} file{files.length !== 1 ? 's' : ''} ready
                          </p>
                          <p className="text-xs text-green-700">All files uploaded successfully</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review - Modern Preview */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="text-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CheckCircleIcon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Create!</h3>
                    <p className="text-sm text-gray-600">Review your classwork details below</p>
                  </div>

                  {/* Modern Preview Card */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Card Header */}
                    <div className={`px-5 py-4 bg-gradient-to-r ${type === 'assignment' ? 'from-blue-500 to-blue-600' : type === 'form' ? 'from-orange-500 to-orange-600' : 'from-emerald-500 to-emerald-600'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            {getTypeIcon(type)}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{title}</h4>
                            <span className="text-xs text-white/80 font-medium">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-5 py-4 space-y-4">
                      {description && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">{description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {dueDate && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <CalendarIcon className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-900">Due Date</span>
                            </div>
                            <p className="text-xs text-blue-700 font-medium">{formatDueDate()}</p>
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <PaperClipIcon className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-900">Attachments</span>
                            </div>
                            <p className="text-xs text-green-700 font-medium">
                              {files.length} file{files.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Modern Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    disabled={loading}
                  >
                    ← Previous
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  disabled={loading}
                >
                  Cancel
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 1 && !isFormValid()}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
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
    </>
  );

  // Use portal to render modal at document body level, outside all parent containers
  return typeof document !== 'undefined' 
    ? ReactDOM.createPortal(modalContent, document.body)
    : null;
};

export default CreateClassworkModal;