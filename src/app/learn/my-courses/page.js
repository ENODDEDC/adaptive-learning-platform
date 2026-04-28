'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public-courses/my-courses');
      const data = await response.json();

      if (response.ok) {
        setCourses(data.courses || []);
      } else {
        setError(data.message || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
              <p className="text-gray-600 mt-1">Continue your learning journey</p>
            </div>
            <Link
              href="/learn/browse"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && courses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">Start learning by enrolling in a course</p>
            <Link
              href="/learn/browse"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course._id}
                href={`/learn/courses/${course._id}/learn`}
                className="block bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Course Cover */}
                <div
                  className="h-40 flex items-center justify-center relative"
                  style={{ backgroundColor: course.coverColor || '#60a5fa' }}
                >
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AcademicCapIcon className="w-16 h-16 text-white opacity-50" />
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-blue-600 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 mb-3">
                    {course.instructorProfilePicture ? (
                      <img
                        src={course.instructorProfilePicture}
                        alt={course.instructorName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">{course.instructorName}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">
                        {course.progress.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.progress.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <AcademicCapIcon className="w-4 h-4" />
                      <span>{course.totalModules} modules</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{formatDuration(course.totalDuration)}</span>
                    </div>
                  </div>

                  {/* Certificate Badge */}
                  {course.progress.certificateIssued && (
                    <Link
                      href={`/learn/courses/${course._id}/certificate`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200 transition-colors mb-3"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      View Certificate
                    </Link>
                  )}

                  {/* Category & Level */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {course.category}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {course.level}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
