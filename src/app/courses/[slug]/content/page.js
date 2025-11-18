'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseContentManager from '@/components/CourseContentManager';

const CourseContentPage = ({ params }) => {
  const { slug } = React.use(params); // slug is courseId
  const router = useRouter();
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInstructor, setIsInstructor] = useState(true); // For demo purposes

  useEffect(() => {
    fetchCourseDetails();
  }, [slug]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${slug}`); // No need for manual token header, cookie is sent automatically

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setCourseDetails(data.course);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          {/* Animated spinner with gradient */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 border-r-blue-500 animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent rounded-full border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          
          {/* Loading text with animation */}
          <h2 className="mb-2 text-xl font-semibold text-gray-800 animate-pulse">Loading Course Details</h2>
          <p className="text-sm text-gray-600">Please wait while we prepare your content...</p>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error Loading Course</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Course Not Found</h2>
          <p className="mb-4 text-gray-600">The requested course could not be found.</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Course Header */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/courses/${slug}`)}
                className="p-2 text-gray-500 transition-colors rounded-lg hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{courseDetails.subject}</h1>
                <p className="text-gray-600">Content Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Section: {courseDetails.section}</span>
              <div className="flex items-center -space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 border-2 border-white rounded-full">
                  <span className="text-xs font-semibold text-white">
                    {courseDetails.teacherName?.charAt(0) || 'T'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Manager */}
      <div className="mx-auto max-w-7xl">
        <CourseContentManager 
          courseId={slug} 
          isInstructor={isInstructor}
        />
      </div>
    </div>
  );
};

export default CourseContentPage;