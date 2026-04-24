import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';
import FileUpload from './FileUpload';
import SmartThumbnail from './SmartThumbnail';
import {
  XMarkIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  LinkIcon,
  VideoCameraIcon
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileUploadRef = useState(null);
  const [startWidth, setStartWidth] = useState(35);

  // Video link state
  const [videoLinks, setVideoLinks] = useState([]);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [videoLinkError, setVideoLinkError] = useState('');
  const [attachTab, setAttachTab] = useState('files'); // 'files' | 'video'

  // Detect video platform from URL
  const detectVideoPlatform = (url) => {
    if (!url) return null;
    if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube';
    if (/drive\.google\.com/.test(url)) return 'gdrive';
    if (/vimeo\.com/.test(url)) return 'vimeo';
    if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url)) return 'direct';
    return 'unknown';
  };

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#\s]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url) => {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'gdrive': return 'Google Drive';
      case 'vimeo': return 'Vimeo';
      case 'direct': return 'Video File';
      default: return 'Video Link';
    }
  };

  const handleAddVideoLink = () => {
    setVideoLinkError('');
    const trimmed = videoLinkInput.trim();
    if (!trimmed) return;

    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      setVideoLinkError('Please enter a valid URL.');
      return;
    }

    const platform = detectVideoPlatform(trimmed);
    if (platform === 'unknown') {
      setVideoLinkError('Supported: YouTube, Google Drive, Vimeo, or direct video URLs (.mp4, .webm, etc.)');
      return;
    }

    // Check duplicate
    if (videoLinks.some(v => v.url === trimmed)) {
      setVideoLinkError('This link has already been added.');
      return;
    }

    const newLink = {
      _id: `video-link-${Date.now()}`,
      type: 'video-link',
      platform,
      url: trimmed,
      originalName: `${getPlatformLabel(platform)} Video`,
      title: `${getPlatformLabel(platform)} Video`,
      thumbnailUrl: platform === 'youtube' ? getYouTubeThumbnail(trimmed) : null,
    };

    setVideoLinks(prev => [...prev, newLink]);
    setVideoLinkInput('');
  };

  const handleRemoveVideoLink = (id) => {
    setVideoLinks(prev => prev.filter(v => v._id !== id));
  };

  const handleFilesReady = useCallback((newFiles) => {
    setFiles(newFiles);
  }, []);

  // Function to handle Next Step - auto-upload files on Step 2
  const handleNextStep = async () => {
    // For forms, skip the attachments step entirely and go straight to review
    if (type === 'form' && currentStep === 1) {
      setCurrentStep(3);
      return;
    }

    // If on Step 2 and there are pending files, upload them first
    if (currentStep === 2) {
      const pendingFiles = files.filter(file => !file.url && !file._id);
      if (pendingFiles.length > 0) {
        setIsUploadingFiles(true);
        setError('');
        
        try {
          // Trigger file upload via FileUpload component
          const formData = new FormData();
          pendingFiles.forEach(file => {
            formData.append('files', file);
          });
          formData.append('folder', `classwork/${courseId}`);
          if (courseId) {
            formData.append('courseId', courseId);
          }

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload files');
          }

          const result = await response.json();
          
          // Update files with uploaded data
          const uploadedFiles = files.filter(file => file.url || file._id);
          setFiles([...uploadedFiles, ...result.files]);
          
          // Move to next step
          setCurrentStep(currentStep + 1);
        } catch (err) {
          setError('Failed to upload files. Please try again.');
          console.error('Upload error:', err);
        } finally {
          setIsUploadingFiles(false);
        }
        return;
      }
    }
    
    // Otherwise, just move to next step
    setCurrentStep(currentStep + 1);
  };

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
        setFiles(initialData.attachments?.filter(a => a.type !== 'video-link') || []);
        setVideoLinks(initialData.attachments?.filter(a => a.type === 'video-link') || []);
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
        setType(initialType);
        setFiles([]);
        setVideoLinks([]);
      }
      setAttachTab('files');
      setVideoLinkInput('');
      setVideoLinkError('');
      setError('');
    }
  }, [isOpen, initialData, initialType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // For forms, creation is handled by the dedicated form builder route
    if (type === 'form') {
      if (courseId) {
        window.location.href = `/forms/new?courseId=${courseId}`;
      } else {
        window.location.href = '/forms/new';
      }
      setLoading(false);
      return;
    }

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
        attachments: [...uploadedFiles, ...videoLinks]
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

                  {/* Title - Enhanced Input */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-900 flex items-center">
                        <span>Title</span>
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-medium text-gray-400">
                        {title.length || 0}/80
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-gray-500">
                      Give this activity a clear, action-focused name students will see in their feed.
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        id="title"
                        maxLength={80}
                        placeholder={'Example: "Chapter 5 • Linear Equations Practice"'}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400 text-sm"
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

                  {/* Description - Enhanced Textarea */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                        Description
                        <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                      </label>
                      <span className="text-[11px] font-medium text-gray-400">
                        {description.length || 0}/600
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-gray-500">
                      Use this space to outline steps, expectations, and any links or resources students should open.
                    </p>
                    <textarea
                      id="description"
                      maxLength={600}
                      placeholder={'Example: "Complete questions 1–10, show your work, and upload a clear photo of your solution. Watch the intro video first if you need a refresher."'}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder:text-gray-400 text-sm leading-relaxed"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
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

              {/* Step 2: Attachments - Modern Design (Assignments & Materials only) */}
              {currentStep === 2 && type !== 'form' && (
                <div className="space-y-4">
                  {/* Tab switcher */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAttachTab('files')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        attachTab === 'files'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <PaperClipIcon className="w-4 h-4" />
                      Files
                      {files.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{files.length}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachTab('video')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        attachTab === 'video'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      Video Link
                      {videoLinks.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{videoLinks.length}</span>
                      )}
                    </button>
                  </div>

                  {/* Files tab */}
                  {attachTab === 'files' && (
                    <div className="space-y-4">
                      <div className="text-center py-6 px-6 bg-white border border-gray-200 rounded-lg">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-lg mb-3">
                          <PaperClipIcon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Attach Files</h3>
                        <p className="text-xs text-gray-500">PDF, DOCX, PPTX, images — no video files</p>
                      </div>
                      <FileUpload
                        onFilesReady={handleFilesReady}
                        initialFiles={files}
                        folder={`classwork/${courseId}`}
                      />
                      {files.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-800 font-medium">
                            {files.length} {files.length === 1 ? 'file' : 'files'} ready
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Link tab */}
                  {attachTab === 'video' && (
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <VideoCameraIcon className="w-5 h-5 text-slate-600" />
                          <h3 className="text-sm font-semibold text-gray-900">Add Video Link</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Paste a YouTube, Google Drive, Vimeo, or direct video URL. No storage used.
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="url"
                              placeholder="https://youtube.com/watch?v=..."
                              value={videoLinkInput}
                              onChange={(e) => { setVideoLinkInput(e.target.value); setVideoLinkError(''); }}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVideoLink())}
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddVideoLink}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                        {videoLinkError && (
                          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            {videoLinkError}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['YouTube', 'Google Drive', 'Vimeo', 'Direct .mp4'].map(platform => (
                            <span key={platform} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              ✓ {platform}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Added video links */}
                      {videoLinks.length > 0 && (
                        <div className="space-y-2">
                          {videoLinks.map((link) => (
                            <div key={link._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              {/* Thumbnail or icon */}
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                                {link.thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={link.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <VideoCameraIcon className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800">{getPlatformLabel(link.platform)}</p>
                                <p className="text-xs text-gray-500 truncate">{link.url}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVideoLink(link._id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {videoLinks.length === 0 && (
                        <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                          <VideoCameraIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No video links added yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Combined count */}
                  {(files.length > 0 || videoLinks.length > 0) && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">
                        {[
                          files.length > 0 && `${files.length} file${files.length > 1 ? 's' : ''}`,
                          videoLinks.length > 0 && `${videoLinks.length} video link${videoLinks.length > 1 ? 's' : ''}`
                        ].filter(Boolean).join(' + ')} will be attached
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review - Modern Preview */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className={`text-center py-6 rounded-xl ${type === 'form' ? 'bg-white border border-gray-200' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${type === 'form' ? 'bg-gray-200' : 'bg-green-500'}`}>
                      <CheckCircleIcon className={`w-10 h-10 ${type === 'form' ? 'text-green-600' : 'text-white'}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Create</h3>
                    <p className="text-sm text-gray-600">Review your classwork details below</p>
                  </div>

                  {/* Modern Preview Card */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Card Header */}
                    <div
                      className={
                        type === 'form'
                          ? 'px-5 py-4 bg-white border-b border-gray-200'
                          : type === 'assignment'
                            ? 'px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'px-5 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600'
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={
                              type === 'form'
                                ? 'w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'
                                : 'w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'
                            }
                          >
                            {getTypeIcon(type)}
                          </div>
                          <div>
                            <h4 className={`text-lg font-bold ${type === 'form' ? 'text-gray-900' : 'text-white'}`}>{title}</h4>
                            <span className={`text-xs font-medium ${type === 'form' ? 'text-gray-500' : 'text-white/80'}`}>
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

                      {dueDate && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">Due Date</span>
                          </div>
                          <p className="text-xs text-blue-700 font-medium">{formatDueDate()}</p>
                        </div>
                      )}

                      {/* Attachments with Thumbnails */}
                      {files.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <PaperClipIcon className="w-5 h-5 text-gray-600" />
                            <h4 className="text-sm font-semibold text-gray-900">
                              Attachments ({files.length})
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {files.map((file, index) => {
                              console.log('📎 File data for thumbnail:', file);
                              return (
                                <SmartThumbnail
                                  key={file._id || file.key || index}
                                  attachment={{
                                    _id: file._id,
                                    cloudStorage: file.cloudStorage || (file.key ? { key: file.key } : null),
                                    filePath: file.url || file.filePath,
                                    originalName: file.originalName || file.fileName || file.name,
                                    title: file.originalName || file.fileName || file.name,
                                    mimeType: file.mimeType || file.type,
                                    fileSize: file.fileSize || file.size,
                                    thumbnailUrl: file.thumbnailUrl
                                  }}
                                  onPreview={() => {}}
                                  className="w-full"
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Video Links */}
                      {videoLinks.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <VideoCameraIcon className="w-5 h-5 text-gray-600" />
                            <h4 className="text-sm font-semibold text-gray-900">
                              Video Links ({videoLinks.length})
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {videoLinks.map((link) => (
                              <div key={link._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                                  {link.thumbnailUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={link.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <VideoCameraIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800">{getPlatformLabel(link.platform)}</p>
                                  <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                    onClick={() => {
                      if (type === 'form' && currentStep === 3) {
                        setCurrentStep(1);
                      } else {
                        setCurrentStep(currentStep - 1);
                      }
                    }}
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
                    onClick={handleNextStep}
                    disabled={(currentStep === 1 && !isFormValid()) || isUploadingFiles}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    {isUploadingFiles ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading files...</span>
                      </>
                    ) : (
                      <span>Next Step →</span>
                    )}
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
                        <span>
                          {initialData
                            ? type === 'form'
                              ? 'Save Form'
                              : 'Save Changes'
                            : type === 'form'
                              ? 'Create Form'
                              : 'Create Classwork'}
                        </span>
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
