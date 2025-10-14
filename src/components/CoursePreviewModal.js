'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  FolderIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/outline';
import {
  DocumentIcon as DocumentIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid,
  FolderIcon as FolderIconSolid
} from '@heroicons/react/24/solid';

const CoursePreviewModal = ({ course, isOpen, onClose, onViewCourse }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedContentIds, setSelectedContentIds] = useState(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchCourseContent();
    }
  }, [isOpen, course?.id]);

  const fetchCourseContent = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching course content for course ID:', course.id);

      // Get token from localStorage for client-side requests
      const token = localStorage.getItem('token');
      console.log('🔍 Token found:', !!token);

      // Fetch current user profile to determine ownership
      let currentUserId = null;
      try {
        const profileRes = await fetch('/api/auth/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          currentUserId = profile?._id || profile?.id || profile?.userId || null;
        }
      } catch (_) {
        // ignore profile fetch error; ownership will remain false
      }

      // First, let's check if we can access the course itself
      console.log('🔍 Testing course access first...');
      const courseResponse = await fetch(`/api/courses/${course.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Course access status:', courseResponse.status);

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        console.log('🔍 Course data:', courseData);
        const creatorId = courseData?.course?.createdBy?.toString?.() || courseData?.course?.createdBy || null;
        if (creatorId && currentUserId) {
          setIsOwner(creatorId === currentUserId);
        } else {
          setIsOwner(false);
        }
      }

      // Now try to fetch content
      const response = await fetch(`/api/courses/${course.id}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Content API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Course content data:', data);
        console.log('🔍 Materials count:', data.content?.length || 0);
        console.log('🔍 Materials list:', data.content?.map(c => ({
          id: c.id,
          title: c.title,
          contentType: c.contentType,
          mimeType: c.mimeType
        })) || []);
        setCourseContent(data.content || []);
      } else {
        const errorText = await response.text();
        console.error('🔍 API response not ok:', response.status, response.statusText);
        console.error('🔍 Error response:', errorText);

        // If access denied, show helpful message
        if (response.status === 403) {
          console.log('🔍 Access denied - user may not be enrolled in this course');
          console.log('🔍 Course ID:', course.id);
          console.log('🔍 User may need to join/enroll in the course first');
        }

        setCourseContent([]);
      }
    } catch (error) {
      console.error('🔍 Failed to fetch course content:', error);
      setCourseContent([]);
    } finally {
      setLoading(false);
   }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getContentIcon = (contentType, isSolid = false) => {
    const iconProps = { className: 'w-5 h-5' };

    if (isSolid) {
      switch (contentType) {
        case 'video': return <VideoCameraIconSolid {...iconProps} />;
        case 'audio': return <SpeakerWaveIconSolid {...iconProps} />;
        case 'material': return <FolderIconSolid {...iconProps} />;
        default: return <DocumentIconSolid {...iconProps} />;
      }
    } else {
      switch (contentType) {
        case 'video': return <VideoCameraIcon {...iconProps} />;
        case 'audio': return <SpeakerWaveIcon {...iconProps} />;
        case 'material': return <FolderIcon {...iconProps} />;
        default: return <DocumentIcon {...iconProps} />;
      }
    }
  };

  const getContentColor = (contentType) => {
    switch (contentType) {
      case 'video': return 'text-red-600 bg-red-100 border-red-200';
      case 'audio': return 'text-green-600 bg-green-100 border-green-200';
      case 'material': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const handlePreviewContent = (content) => {
    setPreviewContent(content);
    setActiveTab('content');
  };

  const handleClosePreview = () => {
    setPreviewContent(null);
    setActiveTab('overview');
  };

  const handleDeleteContent = (content) => {
    if (!content?.id) return;
    setConfirmDeleteIds([content.id]);
    setConfirmDeleteOpen(true);
  };

  const handleToggleSelect = (e, contentId) => {
    e.stopPropagation();
    setSelectedContentIds(prev => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedContentIds.size === courseContent.length) {
      setSelectedContentIds(new Set());
    } else {
      setSelectedContentIds(new Set(courseContent.map(c => c.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (!isOwner || selectedContentIds.size === 0) return;
    setConfirmDeleteIds(Array.from(selectedContentIds));
    setConfirmDeleteOpen(true);
  };

  const executeDeletion = async () => {
    if (!confirmDeleteIds || confirmDeleteIds.length === 0) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const ids = [...confirmDeleteIds];
      const results = await Promise.allSettled(ids.map(id =>
        fetch(`/api/courses/${course.id}/content?contentId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include'
        })
      ));

      const succeeded = new Set();
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.ok) {
          succeeded.add(ids[i]);
        }
      }

      if (succeeded.size > 0) {
        setCourseContent(prev => prev.filter(c => !succeeded.has(c.id)));
        setSelectedContentIds(prev => {
          const next = new Set(prev);
          succeeded.forEach(id => next.delete(id));
          return next;
        });
        setToast({ type: 'success', message: `${succeeded.size} item(s) deleted` });
      }

      const failed = ids.length - succeeded.size;
      if (failed > 0) {
        setToast({ type: 'error', message: `${failed} item(s) failed to delete` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Deletion failed due to a server error' });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setConfirmDeleteIds([]);
      // Auto-hide toast
      if (toast == null) {
        setTimeout(() => setToast(null), 2500);
      } else {
        // reset timer for new toast
        setTimeout(() => setToast(null), 2500);
      }
    }
  };

  if (!isOpen || !course) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl transform transition-all duration-300 scale-95 opacity-0 animate-modal-appear"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className={`relative h-48 p-8 rounded-t-3xl ${course.color} bg-gradient-to-br from-current via-current to-current overflow-hidden`}>
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16 animate-float"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12 animate-float" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                      <AcademicCapIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-3 py-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      {course.code}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">{course.title}</h2>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4" />
                      <span>{course.progress}% Complete</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => onViewCourse && onViewCourse(course)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white font-semibold rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/30"
                  >
                    <EyeIcon className="w-5 h-5" />
                    View Course
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
                {[
                  { id: 'overview', label: 'Overview', icon: BookOpenIcon },
                  { id: 'content', label: 'Materials', icon: FolderIcon },
                  { id: 'progress', label: 'Progress', icon: ChartBarIcon }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Course Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{course.studentCount || 0}</div>
                            <div className="text-sm text-blue-700">Students</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl">
                            <FolderIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{course.moduleCount || 0}</div>
                            <div className="text-sm text-purple-700">Modules</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                            <ClockIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-emerald-600">-</div>
                            <div className="text-sm text-emerald-700">Weeks</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Overall Completion</span>
                          <span className="font-semibold text-gray-900">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Just getting started</span>
                          <span>Course completion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4">
                    {/* Toast */}
                    {toast && (
                      <div className={`fixed top-6 right-6 z-[70] px-4 py-3 rounded-lg shadow-lg border text-sm ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
                        {toast.message}
                      </div>
                    )}
                    {isOwner && courseContent.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedContentIds.size === courseContent.length}
                            onChange={handleToggleSelectAll}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-gray-700">Select all</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSelected(); }}
                          disabled={selectedContentIds.size === 0}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${selectedContentIds.size === 0 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete selected ({selectedContentIds.size})
                        </button>
                      </div>
                    )}
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                          <span className="text-gray-600">Loading materials...</span>
                        </div>
                      </div>
                    ) : courseContent.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No materials available yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {courseContent.map((content) => {
                          // Helper function to detect file types (same as Activities tab)
                          const isPdfFile = (content) => {
                            return content?.mimeType === 'application/pdf' ||
                                   content?.originalName?.toLowerCase().endsWith('.pdf') ||
                                   content?.title?.toLowerCase().endsWith('.pdf');
                          };

                          const isDocxFile = (content) => {
                            return content?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                   content?.originalName?.toLowerCase().endsWith('.docx') ||
                                   content?.title?.toLowerCase().endsWith('.docx');
                          };

                          const isPptxFile = (content) => {
                            return content?.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                                   content?.originalName?.toLowerCase().endsWith('.pptx') ||
                                   content?.title?.toLowerCase().endsWith('.pptx');
                          };

                          // Render different components based on file type - List Layout
                          if (isPdfFile(content) || isPptxFile(content)) {
                            return (
                              <div
                                key={content.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200 group"
                              >
                                {isOwner && (
                                  <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={selectedContentIds.has(content.id)}
                                    onChange={(e) => handleToggleSelect(e, content.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                {/* Thumbnail */}
                                <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                  <iframe
                                    src={`${window.location.origin}/api/generate-thumbnail?contentId=${content.id}&fileKey=${content.cloudStorage?.key || content.filePath}`}
                                    className="w-full h-full pointer-events-none border-0"
                                    title={`${content.title} thumbnail`}
                                    style={{
                                      transform: 'scale(0.25)',
                                      transformOrigin: 'top left',
                                      width: '400%',
                                      height: '400%'
                                    }}
                                  />
                                  {/* File Type Badge */}
                                  <div className={`absolute -top-1 -right-1 text-white px-1.5 py-0.5 rounded text-xs font-semibold ${
                                    isPdfFile(content) ? 'bg-red-500' : 'bg-orange-500'
                                  }`}>
                                    {isPdfFile(content) ? 'PDF' : 'PPTX'}
                                  </div>
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {content.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span>{content.fileSize ? `${Math.round(content.fileSize / 1024)} KB` : 'Document'}</span>
                                    <span>•</span>
                                    <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center gap-2 text-gray-400">
                                  <button
                                    type="button"
                                    className="hover:text-blue-500 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); /* Eye disabled */ }}
                                    aria-label="Preview"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      className="hover:text-red-600 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteContent(content); }}
                                      aria-label="Delete"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (isDocxFile(content)) {
                            return (
                              <div
                                key={content.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200 group"
                              >
                                {isOwner && (
                                  <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={selectedContentIds.has(content.id)}
                                    onChange={(e) => handleToggleSelect(e, content.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                {/* Thumbnail */}
                                <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                  <iframe
                                    src={`${window.location.origin}/api/docx-thumbnail?contentId=${content.id}&fileKey=${content.cloudStorage?.key || content.filePath}`}
                                    className="w-full h-full pointer-events-none border-0"
                                    title={`${content.title} thumbnail`}
                                    style={{
                                      transform: 'scale(0.25)',
                                      transformOrigin: 'top left',
                                      width: '400%',
                                      height: '400%'
                                    }}
                                  />
                                  {/* File Type Badge */}
                                  <div className="absolute -top-1 -right-1 text-white px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-500">
                                    DOCX
                                  </div>
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {content.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span>{content.fileSize ? `${Math.round(content.fileSize / 1024)} KB` : 'Word Document'}</span>
                                    <span>•</span>
                                    <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center gap-2 text-gray-400">
                                  <button
                                    type="button"
                                    className="hover:text-blue-500 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); /* Eye disabled */ }}
                                    aria-label="Preview"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      className="hover:text-red-600 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteContent(content); }}
                                      aria-label="Delete"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // Default display for other file types - List Layout
                          const fileName = content.originalName || content.title || 'Document';
                          const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                          return (
                            <div
                              key={content.id}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200 group"
                            >
                              {isOwner && (
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={selectedContentIds.has(content.id)}
                                  onChange={(e) => handleToggleSelect(e, content.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getContentColor(content.contentType)}`}>
                                {getContentIcon(content.contentType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {content.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{extension}</span>
                                  <span>•</span>
                                  <span>{content.fileSize ? `${Math.round(content.fileSize / 1024)} KB` : 'Document'}</span>
                                  <span>•</span>
                                  <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <button
                                  type="button"
                                  className="hover:text-blue-500 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); /* Eye disabled */ }}
                                  aria-label="Preview"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                {isOwner && (
                                  <button
                                    type="button"
                                    className="hover:text-red-600 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteContent(content); }}
                                    aria-label="Delete"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'progress' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                        <ChartBarIcon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Detailed Progress</h3>
                      <p className="text-gray-600">Track your learning journey</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-4">Weekly Activity</h4>
                        <div className="space-y-3">
                          {['This Week', 'Last Week', '2 Weeks Ago'].map((week, index) => (
                            <div key={week} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{week}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${[75, 60, 45][index]}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{[75, 60, 45][index]}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-4">Achievements</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 text-sm">🏆</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">First Steps</div>
                              <div className="text-xs text-gray-500">Completed first module</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm">📚</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Consistent Learner</div>
                              <div className="text-xs text-gray-500">5 days streak</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !isDeleting && setConfirmDeleteOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Delete {confirmDeleteIds.length} item{confirmDeleteIds.length > 1 ? 's' : ''}?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => !isDeleting && setConfirmDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-white ${isDeleting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={executeDeletion}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getContentColor(previewContent.contentType)}`}>
                    {getContentIcon(previewContent.contentType, true)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{previewContent.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(previewContent.fileSize)} • {new Date(previewContent.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                {previewContent.contentType === 'video' ? (
                  <div className="text-center">
                    <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Video Preview</p>
                  </div>
                ) : previewContent.contentType === 'audio' ? (
                  <div className="text-center">
                    <SpeakerWaveIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Audio Preview</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Document Preview</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <EyeIcon className="w-4 h-4" />
                    Preview
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CoursePreviewModal;