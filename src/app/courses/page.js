'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';

const CourseContent = () => {
  const { openCreateCourseModal, openJoinCourseModal } = useLayout();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !slug) {
      fetchUserCourses();
    }
  }, [isMounted, slug]);

  const formatSlugToTitle = (s) => {
    if (!s) return '';
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fetchUserCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      // Map fetched courses to the expected format for display
      const formattedCourses = data.courses.map(course => ({
        id: course._id,
        title: course.subject,
        code: course.section,
        instructor: course.teacherName,
        progress: 0, // Assuming progress is not part of the fetched data yet
        color: course.coverColor,
        progressColor: course.coverColor, // Using coverColor for progressColor for now
      }));
      setCourses(formattedCourses);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (slug) {
    // Display course detail page
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Course: {formatSlugToTitle(slug)}</h1>
          <button className="bg-gray-200 px-4 py-2 rounded-md">View Streak</button>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-8 border-b">
            <button className="py-2 border-b-2 border-black">All</button>
            <button className="py-2 text-gray-500">Document</button>
            <button className="py-2 text-gray-500">Video</button>
            <button className="py-2 text-gray-500">Audio</button>
          </div>
          <button className="bg-gray-200 px-4 py-2 rounded-md">Upload</button>
        </div>
        <div className="space-y-4">
          {/* Course content will be dynamically loaded here */}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">
        Loading courses...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">
        Error: {error}
      </div>
    );
  }

  // Default fallback - no slug provided, show all courses
  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
              <p className="text-sm text-gray-500">Manage and explore your learning journey</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            {isCourseMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                <button
                  onClick={() => {
                    openCreateCourseModal();
                    setIsCourseMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Create Course
                  </div>
                </button>
                <button
                  onClick={() => {
                    openJoinCourseModal();
                    setIsCourseMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Join Course
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-1">
          <button className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200">
            All
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200">
            Document
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200">
            Video
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200">
            Audio
          </button>
        </div>
      </div>

      {/* Enhanced Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full">
            <EmptyState type="courses" />
          </div>
        ) : (
          courses.map((course) => (
            <Link key={course.id} href={`/courses?slug=${course.title.toLowerCase().replace(/\s+/g, '-')}`} className="block group">
              <div className="flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                <div className={`h-32 relative p-5 flex flex-col justify-between ${course.color} bg-gradient-to-br from-current to-opacity-90`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <button className="text-white opacity-70 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white hover:bg-opacity-20">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-white">
                      <div className="w-3 h-3 bg-white bg-opacity-30 rounded-full mb-1"></div>
                      <div className="text-xs font-medium opacity-90">Active</div>
                    </div>
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-grow p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {course.code}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {course.instructor}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">{course.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Updated today</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const CoursePage = () => {
  return (
    <Suspense fallback={<div className="p-8">Loading course...</div>}>
      <CourseContent />
    </Suspense>
  );
};

export default CoursePage;