'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const ArchivePage = () => {
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    const fetchArchivedCourses = async () => {
      try {
        const response = await fetch('/api/courses/archived');
        if (!response.ok) {
          throw new Error('Failed to fetch archived courses');
        }
        const data = await response.json();
        setArchivedCourses(data.courses || []);
      } catch (error) {
        console.error('Failed to fetch archived courses:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchArchivedCourses();
  }, []);

  const handleRestoreCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to restore this course? It will be visible to students again.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }

      // Remove the course from the archived list
      setArchivedCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (error) {
      console.error('Failed to restore course:', error);
      setError(error.message);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading archived courses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archived Courses</h1>
              <p className="text-gray-600">Manage your archived courses</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="p-8">
            {archivedCourses.length > 0 ? (
              <div className="space-y-6">
                {archivedCourses.map((course) => (
                  <div key={course._id} className="p-6 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{course.subject}</h3>
                          <span className="px-3 py-1 text-sm rounded-full text-amber-700 bg-amber-100">
                            Archived
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Section:</span> {course.section || 'N/A'}</p>
                          <p><span className="font-medium">Teacher:</span> {course.teacherName}</p>
                          <p><span className="font-medium">Archived on:</span> {format(new Date(course.updatedAt), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() => handleRestoreCourse(course._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-xl">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">No archived courses</h3>
                <p className="text-gray-500">Courses you archive will appear here for management.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;