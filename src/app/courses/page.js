'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';

const CourseContent = () => {
  const { openCreateCourseModal, openJoinCourseModal, openCreateClusterModal, openJoinClusterModal } = useLayout();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const [courses, setCourses] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !slug) {
      fetchUserCourses();
      fetchUserClusters();
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
      const res = await fetch('/api/courses'); // No need for manual token header, cookie is sent automatically

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

  const fetchUserClusters = async () => {
    try {
      const res = await fetch('/api/clusters');
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (err) {
      console.error('Failed to fetch user clusters:', err);
    }
  };

  if (slug) {
    // Display course detail page
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Course: {formatSlugToTitle(slug)}</h1>
          <button className="px-4 py-2 bg-gray-200 rounded-md">View Streak</button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 border-b">
            <button className="py-2 border-b-2 border-black">All</button>
            <button className="py-2 text-gray-500">Document</button>
            <button className="py-2 text-gray-500">Video</button>
            <button className="py-2 text-gray-500">Audio</button>
          </div>
          <button className="px-4 py-2 bg-gray-200 rounded-md">Upload</button>
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
    <div className="flex-1 min-h-screen p-8 bg-gray-50">
      {/* Enhanced Header */}
      <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
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
              className="flex items-center justify-center w-10 h-10 text-white transition-colors bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            {isCourseMenuOpen && (
              <div className="absolute right-0 z-10 w-48 mt-2 overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl">
                <button
                  onClick={() => {
                    openCreateCourseModal();
                    setIsCourseMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
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
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Join Course
                  </div>
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => {
                    openCreateClusterModal();
                    setIsCourseMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Create Cluster
                  </div>
                </button>
                <button
                  onClick={() => {
                    openJoinClusterModal();
                    setIsCourseMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Join Cluster
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'courses'
                ? 'text-blue-700 bg-blue-100 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'clusters'
                ? 'text-purple-700 bg-purple-100 border border-purple-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Clusters
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 rounded-lg hover:bg-gray-100 hover:text-gray-900">
            Document
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 rounded-lg hover:bg-gray-100 hover:text-gray-900">
            Video
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 rounded-lg hover:bg-gray-100 hover:text-gray-900">
            Audio
          </button>
        </div>
      </div>

      {/* Enhanced Course/Cluster Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeTab === 'courses' ? (
          courses.length === 0 ? (
            <div className="col-span-full">
              <EmptyState type="courses" />
            </div>
          ) : (
            courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                <div className="flex flex-col overflow-hidden transition-all duration-300 transform bg-white border border-gray-200 shadow-sm cursor-pointer rounded-2xl hover:shadow-lg hover:border-gray-300 hover:-translate-y-1">
                  <div className={`h-32 relative p-5 flex flex-col justify-between ${course.color} bg-gradient-to-br from-current to-opacity-90`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                      <button className="p-1 text-white transition-opacity rounded-lg opacity-70 hover:opacity-100 hover:bg-white hover:bg-opacity-20">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-white">
                        <div className="w-3 h-3 mb-1 bg-white rounded-full bg-opacity-30"></div>
                        <div className="text-xs font-medium opacity-90">Active</div>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow p-5">
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">{course.title}</h3>
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

                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
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
          )
        ) : (
          clusters.length === 0 ? (
            <div className="col-span-full">
              <div className="p-8 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No clusters yet</h3>
                <p className="mb-4 text-gray-500">Create your first cluster to group related courses together.</p>
                <button
                  onClick={() => openCreateClusterModal()}
                  className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Create Cluster
                </button>
              </div>
            </div>
          ) : (
            clusters.map((cluster) => (
              <div key={cluster._id} className="overflow-hidden transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg">
                <div className={`h-32 relative p-5 flex flex-col justify-between ${cluster.coverColor} bg-gradient-to-br from-current to-opacity-90`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="px-2 py-1 text-xs font-medium text-white bg-black rounded bg-opacity-20">
                      {cluster.classCode}
                    </div>
                  </div>
                  <div className="text-white">
                    <h3 className="text-lg font-bold">{cluster.name}</h3>
                    {cluster.section && <p className="text-sm opacity-90">{cluster.section}</p>}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <h4 className="mb-2 font-semibold text-gray-900">Courses ({cluster.courses?.length || 0})</h4>
                    <div className="space-y-2">
                      {cluster.courses?.slice(0, 3).map((course) => (
                        <div key={course._id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <div className={`w-3 h-3 rounded-full ${course.coverColor || '#60a5fa'}`}></div>
                          <span className="text-sm text-gray-700">{course.subject}</span>
                          {course.section && <span className="text-xs text-gray-500">({course.section})</span>}
                        </div>
                      ))}
                      {cluster.courses?.length > 3 && (
                        <p className="text-xs text-gray-500">+{cluster.courses.length - 3} more courses</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{cluster.enrolledUsers?.length || 0} members</span>
                    </div>
                    <Link href={`/clusters/${cluster._id}`} className="text-sm font-medium text-purple-600 hover:text-purple-700">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )
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