'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  VideoCameraIcon, 
  SpeakerWaveIcon, 
  FolderIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import UploadContentModal from './UploadContentModal';
import ContentViewer from './ContentViewer.client';

const CourseContentManager = ({ courseId, isInstructor = false }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [courseContent, setCourseContent] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const contentTypes = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'document', label: 'Document', count: 0, icon: DocumentIcon },
    { value: 'video', label: 'Video', count: 0, icon: VideoCameraIcon },
    { value: 'audio', label: 'Audio', count: 0, icon: SpeakerWaveIcon },
    { value: 'material', label: 'Material', count: 0, icon: FolderIcon }
  ];

  useEffect(() => {
    fetchCourseContent();
  }, [courseId]);

  const fetchCourseContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/courses/${courseId}/content`, { headers });
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

  const handleUploadSuccess = (newContent) => {
    setCourseContent(prev => [newContent, ...prev]);
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/courses/${courseId}/content?contentId=${contentId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setCourseContent(prev => prev.filter(content => content.id !== contentId));
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  const getFilteredContent = () => {
    if (activeFilter === 'all') return courseContent;
    return courseContent.filter(content => content.contentType === activeFilter);
  };

  const getContentCounts = () => {
    const counts = { all: courseContent.length };
    contentTypes.forEach(type => {
      if (type.value !== 'all') {
        counts[type.value] = courseContent.filter(content => content.contentType === type.value).length;
      }
    });
    return counts;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'video': return VideoCameraIcon;
      case 'audio': return SpeakerWaveIcon;
      case 'material': return FolderIcon;
      default: return DocumentIcon;
    }
  };

  const getContentColor = (contentType) => {
    switch (contentType) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'audio': return 'text-green-600 bg-green-100';
      case 'material': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredContent = getFilteredContent();
  const contentCounts = getContentCounts();

  return (
    <div className="space-y-6">
      {selectedContent ? (
        <ContentViewer
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          isModal={false}
        />
      ) : (
        <>
          {/* Header with Upload Button */}
          <div className="flex items-center justify-between p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
              <p className="text-gray-600">Manage and organize your course materials</p>
            </div>
            
            {isInstructor && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Upload Content
              </button>
            )}
          </div>

          {/* Content Type Filters */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => {
                const IconComponent = type.icon;
                const count = contentCounts[type.value] || 0;
                
                return (
                  <button
                    key={type.value}
                    onClick={() => setActiveFilter(type.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeFilter === type.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    <span>{type.label}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeFilter === type.value
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading content...</span>
                </div>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-600 mb-4">
                  {activeFilter === 'all'
                    ? 'No content has been uploaded to this course yet.'
                    : `No ${activeFilter} content found.`
                  }
                </p>
                {isInstructor && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload First Content
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map((content) => {
                  const IconComponent = getContentIcon(content.contentType);
                  const colorClasses = getContentColor(content.contentType);
                  
                  return (
                    <div key={content.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      {/* Content Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        
                        {isInstructor && (
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{content.title}</h3>
                        {content.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
                        )}
                      </div>

                      {/* Content Meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{formatFileSize(content.fileSize)}</span>
                        <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedContent(content)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </button>
                        <a
                          href={content.filePath}
                          download
                          className="flex items-center justify-center p-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <UploadContentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        courseId={courseId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default CourseContentManager;