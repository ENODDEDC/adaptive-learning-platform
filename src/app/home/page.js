'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  GlobeAltIcon,
  PaperClipIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';

export default function Home() {
  const { openCreateCourseModal, openJoinCourseModal, shouldRefreshCourses } = useLayout();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Ask');
  const [promptText, setPromptText] = useState('');
  const [currentCreatedCourseIndex, setCurrentCreatedCourseIndex] = useState(0);
  const [currentEnrolledCourseIndex, setCurrentEnrolledCourseIndex] = useState(0);

  const recentActivities = [];

  useEffect(() => {
    setIsMounted(true);
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserCourses();
    }
  }, [user, shouldRefreshCourses]);

  useEffect(() => {
    if (currentCreatedCourseIndex >= createdCourses.length - 1) {
      setCurrentCreatedCourseIndex(Math.max(0, createdCourses.length - 2));
    }
  }, [createdCourses.length, currentCreatedCourseIndex]);

  useEffect(() => {
    if (currentEnrolledCourseIndex >= enrolledCourses.length - 1) {
      setCurrentEnrolledCourseIndex(Math.max(0, enrolledCourses.length - 2));
    }
  }, [enrolledCourses.length, currentEnrolledCourseIndex]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/profile'); // No need for manual token header, cookie is sent automatically

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const userData = await res.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user profile:', err);
      setLoading(false);
    }
  };

  const fetchUserCourses = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/courses'); // No need for manual token header, cookie is sent automatically

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const created = [];
      const enrolled = [];

      data.courses.forEach(course => {
        const formattedCourse = {
          id: course._id,
          title: course.subject,
          code: course.section,
          instructor: course.teacherName,
          progress: 0,
          color: course.coverColor,
          progressColor: course.coverColor,
        };

        if (course.createdBy === user._id) {
          created.push(formattedCourse);
        } else if (course.enrolledUsers.includes(user._id)) {
          enrolled.push(formattedCourse);
        }
      });

      setCreatedCourses(created);
      setEnrolledCourses(enrolled);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedMode === 'Ask' && promptText.trim()) {
      router.push(`/ask?q=${encodeURIComponent(promptText)}`);
    } else if (selectedMode === 'Text to Docs' && promptText.trim()) {
      router.push(`/text-to-docs?prompt=${encodeURIComponent(promptText)}`);
    }
  };

  const nextCreatedCourse = () => {
    if (currentCreatedCourseIndex < createdCourses.length - 2) {
      setCurrentCreatedCourseIndex(currentCreatedCourseIndex + 1);
    }
  };

  const prevCreatedCourse = () => {
    if (currentCreatedCourseIndex > 0) {
      setCurrentCreatedCourseIndex(currentCreatedCourseIndex - 1);
    }
  };

  const getVisibleCreatedCourses = () => {
    return createdCourses.slice(currentCreatedCourseIndex, currentCreatedCourseIndex + 2);
  };

  const showPrevCreatedArrow = currentCreatedCourseIndex > 0;
  const showNextCreatedArrow = currentCreatedCourseIndex < createdCourses.length - 2;

  const nextEnrolledCourse = () => {
    if (currentEnrolledCourseIndex < enrolledCourses.length - 2) {
      setCurrentEnrolledCourseIndex(currentEnrolledCourseIndex + 1);
    }
  };

  const prevEnrolledCourse = () => {
    if (currentEnrolledCourseIndex > 0) {
      setCurrentEnrolledCourseIndex(currentEnrolledCourseIndex - 1);
    }
  };

  const getVisibleEnrolledCourses = () => {
    return enrolledCourses.slice(currentEnrolledCourseIndex, currentEnrolledCourseIndex + 2);
  };

  const showPrevEnrolledArrow = currentEnrolledCourseIndex > 0;
  const showNextEnrolledArrow = currentEnrolledCourseIndex < enrolledCourses.length - 2;

  if (loading) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Loading courses...</div>;
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50">
      {/* Welcome Header */}
      <div className="p-6 mx-4 mt-4 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <SparklesIcon className="w-7 h-7" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-gray-900">Hello {user?.fullname || user?.name || 'User'}!</h1>
              <p className="text-sm text-gray-500">Welcome back to your learning dashboard</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="p-6 mx-4 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Assistant</h3>
        
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ask or find anything from your workspace..."
          className="w-full p-4 text-base text-gray-700 placeholder-gray-500 transition-all duration-200 border border-gray-200 resize-none bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedMode('Ask')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedMode === 'Ask' 
                  ? 'text-blue-700 bg-blue-100 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Ask
            </button>
            <button 
              onClick={() => setSelectedMode('Research')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedMode === 'Research' 
                  ? 'text-blue-700 bg-blue-100 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Research
            </button>
            <button 
              onClick={() => setSelectedMode('Text to Docs')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedMode === 'Text to Docs' 
                  ? 'text-white bg-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Text to Docs
            </button>
          </div>
          
          <button 
            onClick={handleSubmit}
            className="p-3 text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
          >
            →
          </button>
        </div>
        
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 transition-colors hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
              <span>All sources</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 transition-colors hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 mx-4 lg:grid-cols-3">
        {/* Courses Section */}
        <div className="lg:col-span-2">
          {/* My Created Courses Section */}
          {createdCourses.length > 0 && (
            <>
              <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">My Created Courses</h2>
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      {createdCourses.length}
                    </span>
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Cluster Section */}
                <div className="flex items-center justify-between p-4 mb-6 border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 shadow-sm bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-800">Cluster1</span>
                      <p className="text-xs text-gray-500">Active Environment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600">Online</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {createdCourses.length === 0 ? (
                    <EmptyState type="courses" message="No courses created yet." />
                  ) : (
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {getVisibleCreatedCourses().map((course) => (
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
                                    <div className="w-3 h-3 mb-1 bg-white rounded-full bg-opacity30"></div>
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
                                    <span>{course.code}</span>
                                    <span>{course.instructor}</span>
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
                        ))}
                      </div>
                    </div>
                  )}

                  {createdCourses.length > 2 && (
                    <>
                      {showPrevCreatedArrow && (
                        <button
                          onClick={prevCreatedCourse}
                          className="absolute left-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 -translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 group"
                        >
                          <ChevronLeftIcon className="w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800" />
                        </button>
                      )}
                      {showNextCreatedArrow && (
                        <button
                          onClick={nextCreatedCourse}
                          className="absolute right-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 group"
                        >
                          <ChevronRightIcon className="w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {createdCourses.length > 2 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                      {Array.from({ length: Math.max(0, createdCourses.length - 1) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentCreatedCourseIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            index === currentCreatedCourseIndex
                              ? 'bg-blue-600 shadow-sm'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {createdCourses.length > 0 && (
                  <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Showing {Math.min(currentCreatedCourseIndex + 2, createdCourses.length)} of {createdCourses.length} created courses
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 rounded-lg hover:text-blue-700 hover:bg-blue-50">
                      <span>View All Created Courses</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* My Enrolled Courses Section */}
          {enrolledCourses.length > 0 && (
            <div className="p-6 mt-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">My Enrolled Courses</h2>
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    {enrolledCourses.length}
                  </span>
                </div>
              </div>

              <div className="relative">
                {enrolledCourses.length === 0 ? (
                  <EmptyState type="courses" message="No courses enrolled yet." />
                ) : (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {getVisibleEnrolledCourses().map((course) => (
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
                                  <span>{course.code}</span>
                                  <span>{course.instructor}</span>
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
                      ))}
                    </div>
                  </div>
                )}

                {enrolledCourses.length > 2 && (
                  <>
                    {showPrevEnrolledArrow && (
                      <button
                        onClick={prevEnrolledCourse}
                        className="absolute left-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 -translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 group"
                      >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800" />
                      </button>
                    )}
                    {showNextEnrolledArrow && (
                      <button
                        onClick={nextEnrolledCourse}
                        className="absolute right-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 group"
                      >
                        <ChevronRightIcon className="w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {enrolledCourses.length > 2 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    {Array.from({ length: Math.max(0, enrolledCourses.length - 1) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentEnrolledCourseIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentEnrolledCourseIndex
                            ? 'bg-green-600 shadow-sm'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {enrolledCourses.length > 0 && (
                <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {Math.min(currentEnrolledCourseIndex + 2, enrolledCourses.length)} of {enrolledCourses.length} enrolled courses
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 transition-all duration-200 rounded-lg hover:text-green-700 hover:bg-green-50">
                    <span>View All Enrolled Courses</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activities Sidebar */}
        <div>
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
            </div>
            
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <EmptyState type="recent" />
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="p-4 transition-colors border border-gray-100 cursor-pointer group bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${activity.color} flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 text-sm font-semibold text-gray-900 truncate transition-colors group-hover:text-blue-600">
                          {activity.title}
                        </h4>
                        <p className="mb-2 text-xs text-gray-500">{activity.course}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{activity.time}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            activity.status === 'submitted' ? 'text-green-700 bg-green-100' :
                            activity.status === 'new' ? 'text-blue-700 bg-blue-100' :
                            activity.status === 'graded' ? 'text-purple-700 bg-purple-100' :
                            activity.status === 'important' ? 'text-orange-700 bg-orange-100' :
                            'text-gray-700 bg-gray-100'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {recentActivities.length > 0 && (
              <div className="pt-4 mt-6 border-t border-gray-200">
                <button className="w-full text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
                  View All Activities
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component definitions
const SparklesIcon = (props) => (
  <Image
    src="/platform_icon.png"
    alt="Intelevo AI"
    width={40}
    height={40}
    className="object-cover w-10 h-10 rounded-full"
    {...props}
  />
);