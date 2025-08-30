'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const CourseContentTab = ({ courseId, isInstructor = false }) => {
  const router = useRouter();
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course Materials</h3>
              <p className="text-sm text-gray-600">Upload and manage course content</p>
            </div>
            
            {isInstructor && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/courses/${courseId}/content`)}
                  className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  Manage Content
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Upload
                </button>
              </div>
            )}
          </div>

          {/* Content Type Filters */}
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => {
              const IconComponent = type.icon;
              const count = contentCounts[type.value] || 0;
              
              return (
                <button
                  key={type.value}
                  onClick={() => setActiveFilter(type.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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

          {/* Content List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading content...</span>
              </div>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FolderIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">No content found</h4>
              <p className="text-sm text-gray-600 mb-4">
                {activeFilter === 'all'
                  ? 'No content has been uploaded yet.'
                  : `No ${activeFilter} content found.`
                }
              </p>
              {isInstructor && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Upload First Content
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContent.slice(0, 5).map((content) => {
                const IconComponent = getContentIcon(content.contentType);
                const colorClasses = getContentColor(content.contentType);
                
                return (
                  <div key={content.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{content.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{formatFileSize(content.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedContent(content)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <a
                        href={content.filePath}
                        download
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </a>
                      {isInstructor && (
                        <button
                          onClick={() => handleDeleteContent(content.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredContent.length > 5 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push(`/courses/${courseId}/content`)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    View All {filteredContent.length} Items
                  </button>
                </div>
              )}
            </div>
          )}
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

export default CourseContentTab;