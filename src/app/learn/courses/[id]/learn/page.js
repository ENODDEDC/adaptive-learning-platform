'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = params.id;

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseContent();
    }
  }, [courseId]);

  useEffect(() => {
    // Auto-select first incomplete item or first item
    if (course && !selectedItem) {
      const firstIncompleteItem = findFirstIncompleteItem();
      if (firstIncompleteItem) {
        setSelectedItem(firstIncompleteItem);
      }
    }
  }, [course]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-courses/${courseId}/content`);
      const data = await response.json();

      if (response.ok) {
        setCourse(data.course);
        setProgress(data.progress);
        
        // Expand all modules by default
        const expanded = {};
        data.course.modules?.forEach(module => {
          expanded[module._id] = true;
        });
        setExpandedModules(expanded);
      } else {
        setError(data.message || 'Failed to fetch course');
      }
    } catch (err) {
      setError('Failed to fetch course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const findFirstIncompleteItem = () => {
    if (!course?.modules) return null;
    
    for (const module of course.modules) {
      for (const item of module.items || []) {
        if (!item.isCompleted) {
          return item;
        }
      }
    }
    
    // If all complete, return first item
    return course.modules[0]?.items?.[0] || null;
  };

  const handleMarkComplete = async () => {
    if (!selectedItem || markingComplete) return;

    console.log('🔵 Marking item as complete:', selectedItem._id);

    try {
      setMarkingComplete(true);

      const response = await fetch(`/api/public-courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem._id }),
      });

      const data = await response.json();
      console.log('🔵 Progress response:', data);

      if (response.ok) {
        console.log('✅ Item marked complete, refreshing...');
        // Refresh course content to get updated completion status
        await fetchCourseContent();
        
        // Auto-advance to next item
        const nextItem = findNextItem();
        if (nextItem) {
          console.log('➡️ Auto-advancing to next item:', nextItem.title);
          setSelectedItem(nextItem);
        } else {
          console.log('🎉 No more items - course complete!');
        }
      } else {
        console.error('❌ Failed to mark complete:', data.message);
        alert(data.message || 'Failed to mark as complete');
      }
    } catch (err) {
      console.error('❌ Error marking complete:', err);
      alert('Failed to mark as complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const findNextItem = () => {
    if (!course?.modules || !selectedItem) return null;

    let foundCurrent = false;
    for (const module of course.modules) {
      for (const item of module.items || []) {
        if (foundCurrent && !item.isCompleted) {
          return item;
        }
        if (item._id === selectedItem._id) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || 'Course not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/learn/my-courses"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress?.completionPercentage || 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {progress?.completionPercentage || 0}% complete
                  </span>
                </div>
              </div>
            </div>

            {/* Certificate Button */}
            {progress?.completionPercentage === 100 && (
              <Link
                href={`/learn/courses/${courseId}/certificate`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5" />
                View Certificate
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedItem ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-5xl mx-auto">
              {/* Content Display */}
              {selectedItem.type === 'video' ? (
                <div className="bg-black aspect-video flex items-center justify-center">
                  {selectedItem.videoUrl ? (
                    <video
                      src={selectedItem.videoUrl}
                      controls
                      className="w-full h-full"
                      autoPlay
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-white">Video not available</div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{selectedItem.fileName}</p>
                    {selectedItem.fileUrl && (
                      <a
                        href={selectedItem.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                      >
                        Download File
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Content Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedItem.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {selectedItem.type === 'video' && (
                        <span>{formatDuration(selectedItem.videoDuration)}</span>
                      )}
                      {selectedItem.type === 'file' && (
                        <>
                          <span>{selectedItem.fileType?.toUpperCase()}</span>
                          <span>{(selectedItem.fileSize / 1024).toFixed(2)} KB</span>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedItem.isCompleted ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5" />
                      Completed
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {markingComplete ? 'Marking...' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Select a lesson to start learning</p>
            </div>
          )}
        </div>

        {/* Sidebar - Course Content */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
            
            <div className="space-y-2">
              {course.modules?.map((module) => (
                <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-left">{module.title}</span>
                    {expandedModules[module._id] ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Module Items */}
                  {expandedModules[module._id] && (
                    <div className="border-t border-gray-200">
                      {module.items?.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => setSelectedItem(item)}
                          className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                            selectedItem?._id === item._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded ${
                            item.type === 'video' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {item.type === 'video' ? (
                              <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                            ) : (
                              <DocumentIcon className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            {item.type === 'video' && item.videoDuration > 0 && (
                              <p className="text-xs text-gray-500">
                                {formatDuration(item.videoDuration)}
                              </p>
                            )}
                          </div>

                          {item.isCompleted && (
                            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
