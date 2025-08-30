'use client';

import { useState, useEffect } from 'react';
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

export default function Home({ userName }) {
  const { openCreateCourseModal, openJoinCourseModal } = useLayout();
  const router = useRouter();
  const [user, setUser] = useState({ name: 'User' });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Ask');
  const [promptText, setPromptText] = useState('');
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);

  const recentActivities = [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (userName) {
        setUser({ name: userName });
      } else {
        setUser({ name: 'User' });
      }
      fetchUserCourses();
    }
  }, [userName, isMounted]);

  useEffect(() => {
    if (currentCourseIndex >= courses.length - 1) {
      setCurrentCourseIndex(Math.max(0, courses.length - 2));
    }
  }, [courses.length, currentCourseIndex]);

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
      const formattedCourses = data.courses.map(course => ({
        id: course._id,
        title: course.subject,
        code: course.section,
        instructor: course.teacherName,
        progress: 0,
        color: course.coverColor,
        progressColor: course.coverColor,
      }));
      setCourses(formattedCourses);
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

  const nextCourse = () => {
    if (currentCourseIndex < courses.length - 2) {
      setCurrentCourseIndex(currentCourseIndex + 1);
    }
  };

  const prevCourse = () => {
    if (currentCourseIndex > 0) {
      setCurrentCourseIndex(currentCourseIndex - 1);
    }
  };

  const getVisibleCourses = () => {
    return courses.slice(currentCourseIndex, currentCourseIndex + 2);
  };

  const showPrevArrow = currentCourseIndex > 0;
  const showNextArrow = currentCourseIndex < courses.length - 2;

  if (loading) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Loading courses...</div>;
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="h-full bg-gray-50 p-8 overflow-y-auto">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mx-4 mt-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hello Justine!</h1>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mx-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant</h3>
        
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ask or find anything from your workspace..."
          className="w-full p-4 text-base text-gray-700 placeholder-gray-500 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            className="p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            →
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
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
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mx-4">
        {/* Courses Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                  {courses.length}
                </span>
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

            {/* Enhanced Cluster Section */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-gray-800 text-lg">Cluster1</span>
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
              {courses.length === 0 ? (
                <EmptyState type="courses" />
              ) : (
                <div className="overflow-hidden">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {getVisibleCourses().map((course) => (
                      <Link key={course.id} href={`/courses/${course.title.toLowerCase().replace(/\s+/g, '-')}`} className="block group">
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
                                <span>{course.code}</span>
                                <span>{course.instructor}</span>
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
                    ))}
                  </div>
                </div>
              )}

              {courses.length > 2 && (
                <>
                  {showPrevArrow && (
                    <button 
                      onClick={prevCourse}
                      className="absolute left-0 flex items-center justify-center w-12 h-12 transition-all duration-200 -translate-x-8 -translate-y-1/2 bg-white rounded-2xl shadow-lg border border-gray-200 top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 z-10 group"
                    >
                      <ChevronLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                    </button>
                  )}
                  {showNextArrow && (
                    <button 
                      onClick={nextCourse}
                      className="absolute right-0 flex items-center justify-center w-12 h-12 transition-all duration-200 translate-x-8 -translate-y-1/2 bg-white rounded-2xl shadow-lg border border-gray-200 top-1/2 hover:bg-gray-50 hover:shadow-xl hover:scale-105 z-10 group"
                    >
                      <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                    </button>
                  )}
                </>
              )}
            </div>

            {courses.length > 2 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  {Array.from({ length: Math.max(0, courses.length - 1) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCourseIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentCourseIndex 
                          ? 'bg-blue-600 shadow-sm' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {courses.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {Math.min(currentCourseIndex + 2, courses.length)} of {courses.length} courses
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <span>View All Courses</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
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
                  <div key={activity.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100 hover:border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${activity.color} flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">{activity.course}</p>
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
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
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
    className="w-10 h-10 object-cover rounded-full"
    {...props}
  />
);