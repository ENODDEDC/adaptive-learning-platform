'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentIcon,
  VideoCameraIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import ModuleEditor from '@/components/public-courses/ModuleEditor';
import CourseSettings from '@/components/public-courses/CourseSettings';

export default function EditPublicCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'settings'
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-courses/${courseId}`);
      const data = await response.json();

      if (response.ok) {
        setCourse(data.course);
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

  const handleCreateModule = async () => {
    const title = prompt('Enter module title:');
    if (!title) return;

    try {
      const response = await fetch(`/api/public-courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '' }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCourse();
      } else {
        alert(data.message || 'Failed to create module');
      }
    } catch (err) {
      alert('Failed to create module');
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/public-courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCourse();
        if (selectedModule?._id === moduleId) {
          setSelectedModule(null);
        }
      } else {
        alert(data.message || 'Failed to delete module');
      }
    } catch (err) {
      alert('Failed to delete module');
      console.error(err);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await fetch(`/api/public-courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });

      const data = await response.json();

      if (response.ok) {
        setCourse({ ...course, isPublished: !course.isPublished });
      } else {
        alert(data.message || 'Failed to update course');
      }
    } catch (err) {
      alert('Failed to update course');
      console.error(err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/public-courses"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>{course.totalModules || 0} modules</span>
                  <span>{course.totalItems || 0} items</span>
                  <span>{formatDuration(course.totalDuration)}</span>
                  <span>{course.enrolledStudents?.length || 0} students</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                course.isPublished
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {course.isPublished ? (
                <>
                  <EyeIcon className="w-5 h-5" />
                  Published
                </>
              ) : (
                <>
                  <EyeSlashIcon className="w-5 h-5" />
                  Draft
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modules List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
                  <button
                    onClick={handleCreateModule}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>

                {course.modules && course.modules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No modules yet</p>
                    <button
                      onClick={handleCreateModule}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Create your first module
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {course.modules?.sort((a, b) => a.order - b.order).map((module) => (
                    <div
                      key={module._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedModule?._id === module._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedModule(module)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{module.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {module.items?.length || 0} items
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module._id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Module Editor */}
            <div className="lg:col-span-2">
              {selectedModule ? (
                <ModuleEditor
                  courseId={courseId}
                  module={selectedModule}
                  onUpdate={fetchCourse}
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">Select a module to edit its content</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <CourseSettings course={course} onUpdate={fetchCourse} />
        )}
      </div>
    </div>
  );
}
