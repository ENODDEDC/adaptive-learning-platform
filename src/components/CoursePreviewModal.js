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

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchCourseContent();
    }
  }, [isOpen, course?.id]);

  const fetchCourseContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/content`);
      if (response.ok) {
        const data = await response.json();
        setCourseContent(data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch course content:', error);
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
                            <div className="text-2xl font-bold text-blue-600">24</div>
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
                            <div className="text-2xl font-bold text-purple-600">12</div>
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
                            <div className="text-2xl font-bold text-emerald-600">8</div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                        {courseContent.slice(0, 6).map((content) => (
                          <div
                            key={content.id}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
                            onClick={() => handlePreviewContent(content)}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getContentColor(content.contentType)}`}>
                              {getContentIcon(content.contentType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {content.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{formatFileSize(content.fileSize)}</span>
                                <span>•</span>
                                <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                              <EyeIcon className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
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