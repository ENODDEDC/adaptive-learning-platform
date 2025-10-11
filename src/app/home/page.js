'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SparklesIcon } from '@heroicons/react/24/outline';
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
    return (
      <div className="h-full p-8 overflow-y-auto bg-gray-50 animate-fade-in-up">
        {/* Welcome Header Skeleton */}
        <div className="relative mx-4 mt-4 mb-8 overflow-hidden bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="flex flex-col justify-center space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-1 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* AI Assistant Skeleton */}
        <div className="p-6 mx-4 mb-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl mb-4 animate-pulse"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
          </div>
        </div>

        {/* Courses Grid Skeleton */}
        <div className="grid grid-cols-1 gap-8 mx-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Created Courses Skeleton */}
            <div className="p-6 bg-white/95 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="relative flex flex-col bg-white border cursor-pointer rounded-3xl animate-shadow-enhance">
                    {/* Enhanced gradient header skeleton */}
                    <div className="relative h-56 p-4 pr-6 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                      {/* Animated background pattern skeleton */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                      </div>

                      {/* Top section skeleton */}
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="p-2 text-white/80 rounded-lg opacity-0"></div>
                      </div>

                      {/* Bottom section skeleton */}
                      <div className="relative z-10 flex items-end justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 bg-white/40 rounded-full flex-shrink-0"></div>
                            <div className="h-4 bg-white/40 rounded w-32"></div>
                          </div>
                          <div className="h-3 bg-white/30 rounded w-16 mb-2"></div>
                        </div>
                        <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4 mr-2">
                          <div className="flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl border border-white/20"></div>
                        </div>
                      </div>

                      {/* Floating elements skeleton */}
                      <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full"></div>
                      <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/20 rounded-full"></div>
                    </div>

                    {/* Enhanced content section skeleton */}
                    <div className="relative flex flex-col flex-grow p-6 bg-gradient-to-b from-white to-gray-50/50">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="px-2 py-1 text-xs bg-blue-100 rounded-full w-16 h-5"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-blue-50 rounded-lg w-24 h-6"></div>
                          <div className="px-3 py-1.5 bg-emerald-50 rounded-lg w-32 h-6"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-b-3xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            <div className="p-6 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="relative mx-4 mt-4 mb-8 overflow-hidden bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* Subtle Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 animate-pulse"></div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-8 w-3 h-3 bg-blue-200/40 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-12 right-16 w-2 h-2 bg-indigo-200/50 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-8 left-1/3 w-2.5 h-2.5 bg-blue-300/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/4 right-8 w-1.5 h-1.5 bg-indigo-300/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl animate-fade-in-up">
                  <SparklesIcon className="w-9 h-9 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in-up">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                    return greeting;
                  })()}, <span className="text-blue-600 animate-pulse">
                    {user?.fullname || user?.name || 'User'}
                  </span>!
                </h1>
                <p className="text-lg text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Welcome back to your learning dashboard
                </p>
                <div className="mt-3 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-expand-width" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">This Week</span>
              </div>
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-3 border border-blue-200/50 shadow-lg backdrop-blur-sm">
                <div className="text-center mb-3">
                  <div className="text-sm text-blue-700 font-bold uppercase tracking-wider">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-1 rounded-full"></div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Day headers with modern styling */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={`header-${index}`} className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                      {day.slice(0, 1)}
                    </div>
                  ))}
                  {/* Current week days with enhanced styling */}
                  {(() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

                    const days = [];
                    for (let i = 0; i < 7; i++) {
                      const currentDate = new Date(startOfWeek);
                      currentDate.setDate(startOfWeek.getDate() + i);
                      const isToday = currentDate.toDateString() === today.toDateString();
                      const isPast = currentDate < today && !isToday;
                      const isFuture = currentDate > today;

                      days.push(
                        <div
                          key={i}
                          className={`relative text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 ${
                            isToday
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 animate-pulse border-2 border-white'
                              : isPast
                              ? 'bg-gray-100 text-gray-400 border border-gray-200'
                              : isFuture
                              ? 'bg-white text-blue-700 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                              : 'bg-blue-50 text-blue-600 border border-blue-300'
                          }`}
                        >
                          {currentDate.getDate()}
                          {isToday && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce border border-white"></div>
                          )}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 rounded-full text-xs text-blue-600 font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Today: {new Date().getDate()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="p-6 mx-4 mb-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          AI Assistant
        </h3>

        <div className="relative">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ask or find anything from your workspace..."
            className="w-full p-4 text-base text-gray-700 placeholder-gray-500 transition-all duration-300 border-2 border-gray-200 resize-none bg-gray-50 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:scale-[1.02] hover:border-gray-300"
            rows="3"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {promptText.length}/500
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMode('Ask')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                selectedMode === 'Ask'
                  ? 'text-blue-700 bg-blue-100 border-2 border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-2 border-transparent'
              }`}
            >
              Ask
            </button>
            <button
              onClick={() => setSelectedMode('Research')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                selectedMode === 'Research'
                  ? 'text-blue-700 bg-blue-100 border-2 border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-2 border-transparent'
              }`}
            >
              Research
            </button>
            <button
              onClick={() => setSelectedMode('Text to Docs')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                selectedMode === 'Text to Docs'
                  ? 'text-white bg-blue-600 shadow-lg border-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-2 border-transparent'
              }`}
            >
              Text to Docs
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!promptText.trim()}
            aria-label="Submit query"
            className="relative p-3 text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10">→</span>
            <div className="absolute inset-0 bg-blue-700 scale-0 group-active:scale-100 transition-transform duration-200 rounded-lg"></div>
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:bg-blue-50 rounded-lg hover:scale-110">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105">
              <span>All sources</span>
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:bg-blue-50 rounded-lg hover:scale-110">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 mx-4 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        {/* Courses Section */}
        <div className="lg:col-span-2">
          {/* My Created Courses Section */}
          {createdCourses.length > 0 && (
            <>
              <div className="p-6 mb-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl">
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
                      className="flex items-center justify-center w-10 h-10 text-white transition-all duration-200 bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700 hover:scale-110 active:scale-95"
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
                        {getVisibleCreatedCourses().map((course, index) => (
                          <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                            <div className={`relative flex flex-col bg-white border cursor-pointer rounded-3xl transition-all duration-700 ease-out transform hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl hover:scale-[1.02] animate-shadow-enhance`} style={{ animationDelay: `${index * 0.1}s` }}>
                              {/* Enhanced gradient header with multiple layers */}
                              <div className={`course-card-header relative h-56 p-4 pr-6 flex flex-col justify-between overflow-hidden ${course.color} bg-gradient-to-br from-current via-current to-current transition-all duration-500 group-hover:shadow-inner animate-header-transform`}>
                                {/* Animated background pattern */}
                                <div className="absolute inset-0 opacity-10">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                                </div>

                                {/* Enhanced glass-morphism overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 transition-opacity duration-300 group-hover:opacity-75 rounded-3xl" style={{paddingRight: '2rem'}}></div>

                                {/* Top section with icon and menu */}
                                <div className="relative z-10 flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                                        <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                      </div>
                                      {/* Status indicator */}
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
                                    </div>
                                  </div>

                                  {/* Enhanced menu button */}
                                  <button className="relative z-10 p-2 text-white/80 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:rotate-90 backdrop-blur-sm">
                                    <svg className="w-4 h-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Bottom section with enhanced status and action */}
                                <div className="relative z-10 flex items-end justify-between gap-2">
                                  <div className="text-white flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-3 h-3 bg-white/40 rounded-full animate-status-glow flex-shrink-0"></div>
                                      <div className="text-sm font-bold opacity-95 tracking-wider">ACTIVE COURSE</div>
                                    </div>
                                    <div className="text-xs opacity-85 mb-2">Active</div>
                                  </div>

                                  {/* Enhanced action button */}
                                  <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4 mr-2">
                                    <div className="action-button flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl transition-all duration-300 group-hover:bg-white/25 group-hover:scale-110 shadow-lg border border-white/20 overflow-hidden animate-action-slide">
                                      <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:translate-x-1 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                {/* Floating elements for depth */}
                                <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                              </div>
                              {/* Enhanced content section */}
                              <div className="relative flex flex-col flex-grow p-6 bg-gradient-to-b from-white to-gray-50/50">
                                {/* Course title with improved typography hierarchy */}
                                <div className="mb-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600 leading-tight line-clamp-2 flex-1 mr-2">
                                      {course.title}
                                    </h3>
                                    {/* Course type indicator */}
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                      <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                                        Course
                                      </div>
                                    </div>
                                  </div>

                                  {/* Clean metadata layout */}
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      <span className="font-semibold">{course.code}</span>
                                    </span>
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="font-medium">{course.instructor}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Subtle bottom accent */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-b-3xl"></div>
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
                          aria-label="Previous created courses"
                          className="absolute left-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-500 ease-out -translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-blue-50 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-110 active:scale-95 group animate-bounce-in"
                        >
                          <ChevronLeftIcon className="w-5 h-5 text-gray-600 transition-all duration-300 group-hover:text-blue-600 group-active:translate-x-[-2px]" />
                        </button>
                      )}
                      {showNextCreatedArrow && (
                        <button
                          onClick={nextCreatedCourse}
                          aria-label="Next created courses"
                          className="absolute right-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-500 ease-out translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-blue-50 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-110 active:scale-95 group animate-bounce-in"
                        >
                          <ChevronRightIcon className="w-5 h-5 text-gray-600 transition-all duration-300 group-hover:text-blue-600 group-active:translate-x-[2px]" />
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
                          className={`transition-all duration-500 ease-out rounded-full ${
                            index === currentCreatedCourseIndex
                              ? 'w-8 h-3 bg-blue-600 shadow-lg shadow-blue-500/30 scale-110'
                              : 'w-3 h-3 bg-gray-300 hover:bg-blue-400 hover:scale-125 active:scale-95'
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
            <div className="p-6 mt-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl">
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
                      {getVisibleEnrolledCourses().map((course, index) => (
                        <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                          <div className={`relative flex flex-col bg-white border cursor-pointer rounded-3xl transition-all duration-700 ease-out transform hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl hover:scale-[1.02] animate-shadow-enhance`} style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Enhanced gradient header with multiple layers */}
                            <div className={`course-card-header relative h-56 p-4 pr-6 flex flex-col justify-between overflow-hidden ${course.color} bg-gradient-to-br from-current via-current to-current transition-all duration-500 group-hover:shadow-inner animate-header-transform`}>
                              {/* Animated background pattern */}
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                              </div>

                              {/* Enhanced glass-morphism overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 transition-opacity duration-300 group-hover:opacity-75 rounded-3xl" style={{paddingRight: '2rem'}}></div>

                              {/* Top section with icon and menu */}
                              <div className="relative z-10 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                                      <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                      </svg>
                                    </div>
                                    {/* Status indicator */}
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
                                  </div>
                                </div>

                                {/* Enhanced menu button */}
                                <button className="relative z-10 p-2 text-white/80 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:rotate-90 backdrop-blur-sm">
                                  <svg className="w-4 h-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Bottom section with enhanced status and action */}
                              <div className="relative z-10 flex items-end justify-between gap-2">
                                <div className="text-white flex-1 min-w-0 pr-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-white/40 rounded-full animate-status-glow flex-shrink-0"></div>
                                    <div className="text-sm font-bold opacity-95 tracking-wider">ACTIVE COURSE</div>
                                  </div>
                                  <div className="text-xs opacity-85 mb-2">Active</div>
                                </div>

                                {/* Enhanced action button */}
                                <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4 mr-2">
                                  <div className="action-button flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl transition-all duration-300 group-hover:bg-white/25 group-hover:scale-110 shadow-lg border border-white/20 overflow-hidden animate-action-slide">
                                    <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:translate-x-1 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Floating elements for depth */}
                              <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                              <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            </div>
                            {/* Enhanced content section */}
                            <div className="relative flex flex-col flex-grow p-6 bg-gradient-to-b from-white to-gray-50/50">
                              {/* Course title with improved typography hierarchy */}
                              <div className="mb-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-green-600 leading-tight line-clamp-2 flex-1 mr-2">
                                    {course.title}
                                  </h3>
                                  {/* Course type indicator */}
                                  <div className="flex-shrink-0 flex items-center gap-2">
                                    <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                                      Course
                                    </div>
                                  </div>
                                </div>

                                {/* Clean metadata layout */}
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="font-semibold">{course.code}</span>
                                  </span>
                                  <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-medium">{course.instructor}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Subtle bottom accent */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/20 via-purple-500/20 to-pink-500/20 rounded-b-3xl"></div>
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
                        className="absolute left-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-500 ease-out -translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-green-50 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-110 active:scale-95 group animate-bounce-in"
                      >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600 transition-all duration-300 group-hover:text-green-600 group-active:translate-x-[-2px]" />
                      </button>
                    )}
                    {showNextEnrolledArrow && (
                      <button
                        onClick={nextEnrolledCourse}
                        className="absolute right-0 z-10 flex items-center justify-center w-12 h-12 transition-all duration-500 ease-out translate-x-8 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-2xl top-1/2 hover:bg-green-50 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-110 active:scale-95 group animate-bounce-in"
                      >
                        <ChevronRightIcon className="w-5 h-5 text-gray-600 transition-all duration-300 group-hover:text-green-600 group-active:translate-x-[2px]" />
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
                        className={`transition-all duration-500 ease-out rounded-full ${
                          index === currentEnrolledCourseIndex
                            ? 'w-8 h-3 bg-green-600 shadow-lg shadow-green-500/30 scale-110'
                            : 'w-3 h-3 bg-gray-300 hover:bg-green-400 hover:scale-125 active:scale-95'
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
        <div className="animate-slide-in-right">
          <div className="p-6 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg transition-all duration-300 hover:bg-green-200 hover:scale-110">
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
                recentActivities.map((activity, index) => (
                  <div key={activity.id} className={`p-4 transition-all duration-300 border border-gray-100 cursor-pointer group bg-gray-50 rounded-xl hover:bg-white hover:border-green-200 hover:shadow-md hover:scale-[1.02] animate-fade-in-up`} style={{ animationDelay: `${index * 0.15}s` }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 transition-all duration-300 group-hover:scale-150 group-hover:shadow-lg flex-shrink-0 ${activity.color}`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 text-sm font-semibold text-gray-900 truncate transition-colors duration-300 group-hover:text-green-600">
                          {activity.title}
                        </h4>
                        <p className="mb-2 text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-700">{activity.course}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-gray-600">{activity.time}</span>
                          <span className={`text-xs px-2 py-1 font-medium transition-all duration-300 group-hover:rounded-lg group-hover:scale-105 ${
                            activity.status === 'submitted' ? 'text-green-700 bg-green-100 group-hover:bg-green-200' :
                            activity.status === 'new' ? 'text-blue-700 bg-blue-100 group-hover:bg-blue-200' :
                            activity.status === 'graded' ? 'text-purple-700 bg-purple-100 group-hover:bg-purple-200' :
                            activity.status === 'important' ? 'text-orange-700 bg-orange-100 group-hover:bg-orange-200' :
                            'text-gray-700 bg-gray-100 group-hover:bg-gray-200'
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
                <button className="w-full text-sm font-medium text-blue-600 transition-all duration-300 hover:text-green-600 hover:scale-105">
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
