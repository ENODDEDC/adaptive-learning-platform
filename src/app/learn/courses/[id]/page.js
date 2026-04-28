'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  DocumentIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

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

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError('');

      const response = await fetch(`/api/public-courses/${courseId}/enroll`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/learn/courses/${courseId}/learn`);
      } else {
        setError(data.message || 'Failed to enroll');
      }
    } catch (err) {
      setError('Failed to enroll');
      console.error(err);
    } finally {
      setEnrolling(false);
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
      {/* Hero Section */}
      <div
        className="h-64 flex items-center justify-center relative"
        style={{ backgroundColor: course.coverColor || '#60a5fa' }}
      >
        {course.coverImage ? (
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <AcademicCapIcon className="w-24 h-24 text-white opacity-50" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-700 mb-6">{course.description}</p>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                {course.instructorProfilePicture ? (
                  <img
                    src={course.instructorProfilePicture}
                    alt={course.instructorName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                )}
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-semibold text-gray-900">{course.instructorName}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5" />
                  <span>{course.totalModules || 0} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircleIcon className="w-5 h-5" />
                  <span>{course.totalItems || 0} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>{formatDuration(course.totalDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  <span>{course.enrolledStudents?.length || 0} students</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                  {course.category}
                </span>
                <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                  {course.level}
                </span>
              </div>
            </div>

            {/* Course Content Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
              
              {course.modules && course.modules.length === 0 && (
                <p className="text-gray-600">No content available yet</p>
              )}

              <div className="space-y-4">
                {course.modules?.sort((a, b) => a.order - b.order).map((module, index) => (
                  <div key={module._id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Module {index + 1}: {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    )}
                    <div className="space-y-2">
                      {module.items?.sort((a, b) => a.order - b.order).map((item) => (
                        <div key={item._id} className="flex items-center gap-2 text-sm text-gray-700">
                          {item.type === 'video' ? (
                            <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <DocumentIcon className="w-4 h-4 text-green-600" />
                          )}
                          <span>{item.title}</span>
                          {item.type === 'video' && item.videoDuration > 0 && (
                            <span className="text-gray-500">
                              ({formatDuration(item.videoDuration)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              {course.isEnrolled ? (
                <Link
                  href={`/learn/courses/${courseId}/learn`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <PlayCircleIcon className="w-5 h-5" />
                  Continue Learning
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">This course includes:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    {course.totalItems || 0} lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    {formatDuration(course.totalDuration)} of content
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    Certificate of completion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    Self-paced learning
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
