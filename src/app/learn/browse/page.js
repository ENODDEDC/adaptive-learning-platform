'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Personal Development', 'Other'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function BrowseCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');

  useEffect(() => {
    fetchCourses();
  }, [search, category, level]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (level !== 'All') params.append('level', level);

      const response = await fetch(`/api/public-courses/browse?${params}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-600 mt-1">Discover courses to expand your knowledge</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course._id}
                href={`/learn/courses/${course._id}`}
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
                  
                  {/* Enrolled Badge */}
                  {course.isEnrolled && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Enrolled
                    </div>
                  )}
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
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{course.enrolledCount}</span>
                    </div>
                  </div>

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
