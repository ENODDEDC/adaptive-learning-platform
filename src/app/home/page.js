'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';

// Utility function to normalize and ensure proper color format
const normalizeColor = (colorValue) => {
  // If it's already a proper Tailwind class, return it
  if (colorValue && colorValue.startsWith('bg-')) {
    return colorValue;
  }
  
  // Map hex colors to Tailwind classes (from your color picker)
  const hexToTailwindMap = {
    // Row 1 - Your color picker colors
    '#60a5fa': 'bg-blue-400',        // Light blue (top-left)
    '#a78bfa': 'bg-purple-400',      // Purple
    '#f472b6': 'bg-pink-400',        // Pink
    '#34d399': 'bg-emerald-400',     // Green/Emerald
    
    // Row 2 - Your color picker colors
    '#fb923c': 'bg-orange-400',      // Orange
    '#f87171': 'bg-red-400',         // Red/Coral
    '#2dd4bf': 'bg-teal-400',        // Teal/Cyan
    '#818cf8': 'bg-indigo-400',      // Indigo/Blue-purple
    
    // Additional Tailwind standard colors (fallbacks)
    '#3b82f6': 'bg-blue-500',
    '#8b5cf6': 'bg-violet-500',
    '#ec4899': 'bg-pink-500',
    '#10b981': 'bg-emerald-500',
    '#f97316': 'bg-orange-500',
    '#ef4444': 'bg-red-500',
    '#14b8a6': 'bg-teal-500',
    '#6366f1': 'bg-indigo-500',
    '#22c55e': 'bg-green-500',
    '#eab308': 'bg-yellow-500',
    '#f59e0b': 'bg-amber-500',
    '#06b6d4': 'bg-cyan-500',
    '#0ea5e9': 'bg-sky-500',
    '#84cc16': 'bg-lime-500',
    '#d946ef': 'bg-fuchsia-500',
    '#f43f5e': 'bg-rose-500',
  };
  
  // Check if it's a hex color
  if (colorValue && colorValue.startsWith('#')) {
    const lowerHex = colorValue.toLowerCase();
    if (hexToTailwindMap[lowerHex]) {
      return hexToTailwindMap[lowerHex];
    }
  }
  
  // Map common color names to Tailwind classes
  const colorNameMap = {
    'blue': 'bg-blue-500',
    'indigo': 'bg-indigo-500',
    'purple': 'bg-purple-500',
    'pink': 'bg-pink-500',
    'red': 'bg-red-500',
    'orange': 'bg-orange-500',
    'amber': 'bg-amber-500',
    'yellow': 'bg-yellow-500',
    'lime': 'bg-lime-500',
    'green': 'bg-green-500',
    'emerald': 'bg-emerald-500',
    'teal': 'bg-teal-500',
    'cyan': 'bg-cyan-500',
    'sky': 'bg-sky-500',
    'violet': 'bg-violet-500',
    'fuchsia': 'bg-fuchsia-500',
    'rose': 'bg-rose-500',
  };
  
  // If it's a color name, convert it
  if (colorValue) {
    const lowerColor = colorValue.toLowerCase().trim();
    if (colorNameMap[lowerColor]) {
      return colorNameMap[lowerColor];
    }
  }
  
  // Default to blue if no valid color
  return 'bg-blue-500';
};

// Utility function to generate color variations based on theme color
const getColorVariations = (colorClass) => {
  // Normalize the color first
  const normalizedColor = normalizeColor(colorClass);
  
  // Map Tailwind color classes to their variations
  const colorMap = {
    'bg-blue-500': { lighter: 'bg-blue-50', darker: 'bg-blue-600', text: 'text-blue-700' },
    'bg-indigo-500': { lighter: 'bg-indigo-50', darker: 'bg-indigo-600', text: 'text-indigo-700' },
    'bg-purple-500': { lighter: 'bg-purple-50', darker: 'bg-purple-600', text: 'text-purple-700' },
    'bg-pink-500': { lighter: 'bg-pink-50', darker: 'bg-pink-600', text: 'text-pink-700' },
    'bg-red-500': { lighter: 'bg-red-50', darker: 'bg-red-600', text: 'text-red-700' },
    'bg-orange-500': { lighter: 'bg-orange-50', darker: 'bg-orange-600', text: 'text-orange-700' },
    'bg-amber-500': { lighter: 'bg-amber-50', darker: 'bg-amber-600', text: 'text-amber-700' },
    'bg-yellow-500': { lighter: 'bg-yellow-50', darker: 'bg-yellow-600', text: 'text-yellow-700' },
    'bg-lime-500': { lighter: 'bg-lime-50', darker: 'bg-lime-600', text: 'text-lime-700' },
    'bg-green-500': { lighter: 'bg-green-50', darker: 'bg-green-600', text: 'text-green-700' },
    'bg-emerald-500': { lighter: 'bg-emerald-50', darker: 'bg-emerald-600', text: 'text-emerald-700' },
    'bg-teal-500': { lighter: 'bg-teal-50', darker: 'bg-teal-600', text: 'text-teal-700' },
    'bg-cyan-500': { lighter: 'bg-cyan-50', darker: 'bg-cyan-600', text: 'text-cyan-700' },
    'bg-sky-500': { lighter: 'bg-sky-50', darker: 'bg-sky-600', text: 'text-sky-700' },
    'bg-violet-500': { lighter: 'bg-violet-50', darker: 'bg-violet-600', text: 'text-violet-700' },
    'bg-fuchsia-500': { lighter: 'bg-fuchsia-50', darker: 'bg-fuchsia-600', text: 'text-fuchsia-700' },
    'bg-rose-500': { lighter: 'bg-rose-50', darker: 'bg-rose-600', text: 'text-rose-700' },
  };
  
  return {
    base: normalizedColor,
    ...colorMap[normalizedColor]
  };
};

export default function Home() {
  const { openCreateCourseModal, openJoinCourseModal, shouldRefreshCourses } = useLayout();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const [expandedSchedules, setExpandedSchedules] = useState({});
  const hasDataRef = useRef(false);

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
    if (currentCourseIndex >= allCourses.length - 1) {
      setCurrentCourseIndex(Math.max(0, allCourses.length - 2));
    }
  }, [allCourses.length, currentCourseIndex]);

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
        const isCreator = course.createdBy === user._id;
        
        const formattedCourse = {
          id: course._id,
          title: course.subject,
          code: course.section,
          instructor: course.teacherName,
          instructorProfilePicture: course.instructorProfilePicture || null,
          progress: 0,
          color: course.coverColor,
          progressColor: course.coverColor,
          isCreator: isCreator,
          role: isCreator ? 'creator' : 'student',
          studentCount: course.studentCount || 0,
          moduleCount: course.moduleCount || 0,
          assignmentCount: course.assignmentCount || 0,
          enrolledUsers: course.enrolledUsers || [],
          schedules: course.schedules || [],
        };

        if (isCreator) {
          created.push(formattedCourse);
        } else if (course.enrolledUsers.includes(user._id)) {
          enrolled.push(formattedCourse);
        }
      });

      setCreatedCourses(created);
      setEnrolledCourses(enrolled);
      // Combine all courses with creators first
      setAllCourses([...created, ...enrolled]);
      hasDataRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  // Smooth scroll carousel implementation
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    
    // Calculate scroll progress (0 to 100)
    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollability();
    container.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);

    return () => {
      container.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [allCourses]);

  const scrollToDirection = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.querySelector('.course-card')?.offsetWidth || 300;
    const gap = 16; // gap-4 = 16px
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft' && canScrollLeft) {
        scrollToDirection('prev');
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        scrollToDirection('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canScrollLeft, canScrollRight]);

  // Only show skeleton on first load, not on subsequent data fetches
  if (loading && !hasDataRef.current) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        {/* Welcome Header Skeleton - Matches actual layout */}
        <div className="relative mx-4 mt-3 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl"></div>
          <div className="relative px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex flex-col justify-center flex-1 min-w-0 space-y-2">
                  <div className="h-7 bg-gray-200 rounded w-64 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-200 w-44 h-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Matches actual layout */}
        <div className="flex-1 grid grid-cols-1 gap-4 mx-4 my-3 lg:grid-cols-3 overflow-hidden">
          {/* Courses Section Skeleton */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col p-4 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-2xl animate-pulse"></div>
                  <div className="flex flex-col flex-shrink-0 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="w-11 h-11 bg-gray-200 rounded-2xl animate-pulse"></div>
              </div>

              {/* Course Cards Skeleton - Horizontal Slider */}
              <div className="relative flex-1 overflow-hidden">
                <div className="flex gap-4 h-full pb-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[calc(50%-8px)] min-w-[300px] max-w-[420px]">
                      <div className="relative flex flex-col h-full bg-white border border-gray-200 rounded-3xl overflow-hidden">
                        {/* Card Header Skeleton */}
                        <div className="relative h-44 p-5 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                          </div>
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="w-11 h-11 bg-white/30 rounded-2xl"></div>
                            <div className="w-20 h-7 bg-white/30 rounded-xl"></div>
                          </div>
                          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                            <div className="space-y-2">
                              <div className="h-3 bg-white/40 rounded w-24"></div>
                              <div className="h-4 bg-white/40 rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                        {/* Card Content Skeleton */}
                        <div className="relative flex flex-col flex-grow p-5 bg-gradient-to-b from-white to-gray-50/30">
                          <div className="mb-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                              <div className="h-8 bg-gray-200 rounded-xl w-28 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-3xl"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar Skeleton */}
              <div className="mt-5 flex-shrink-0">
                <div className="h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex items-center justify-center mt-3">
                  <div className="h-6 bg-gray-200 rounded-full w-48 animate-pulse"></div>
                </div>
              </div>

              {/* Footer Skeleton */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 flex-shrink-0">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton - Matches actual layout */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col p-4 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-200 flex-shrink-0">
                <div className="w-6 h-6 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border-2 border-gray-200 bg-white rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 bg-gray-200 rounded-full mt-1.5 animate-pulse"></div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
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
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-y-auto">
      {/* Compact Welcome Header - Clean Design */}
      <div className="relative mx-4 mt-3 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow duration-300">
        {/* Subtle accent line - Single color */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl"></div>

        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left Section - Compact Welcome */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl shadow-sm">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                    return greeting;
                  })()}, <span className="text-blue-600">
                    {user ? `${user.name} ${user.surname}` : 'User'}
                  </span>!
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back to your learning dashboard
                </p>
              </div>
            </div>

            {/* Right Section - Compact Calendar */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">This Week</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 border border-gray-200">
                <div className="text-center mb-1.5">
                  <div className="text-xs text-blue-700 font-bold">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`header-${index}`} className="text-[10px] text-blue-600 font-bold mb-1">
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());

                    const days = [];
                    for (let i = 0; i < 7; i++) {
                      const currentDate = new Date(startOfWeek);
                      currentDate.setDate(startOfWeek.getDate() + i);
                      const isToday = currentDate.toDateString() === today.toDateString();
                      const isPast = currentDate < today && !isToday;

                      days.push(
                        <div
                          key={i}
                          className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-lg ${
                            isToday
                              ? 'bg-blue-500 text-white'
                              : isPast
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                        >
                          {currentDate.getDate()}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Optimized for single viewport */}
      <div className="flex-1 grid grid-cols-1 gap-4 mx-4 my-3 lg:grid-cols-3 overflow-hidden">
        {/* Unified Courses Section */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-4 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-5 flex-shrink-0 pb-4 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-2xl shadow-sm flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-shrink-0">
                      <h2 className="text-base font-bold text-gray-800 tracking-tight">My Courses</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-gray-500">
                          {allCourses.length} total
                        </span>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-lg border border-blue-200 whitespace-nowrap">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            {createdCourses.length}
                          </span>
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-green-600 bg-green-50 rounded-lg border border-green-200 whitespace-nowrap">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            {enrolledCourses.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative flex-shrink-0 z-50">
                    <button
                      onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
                      className="flex items-center justify-center w-11 h-11 text-white transition-all duration-300 bg-blue-600 rounded-2xl shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    {isCourseMenuOpen && (
                      <div className="absolute right-0 z-50 w-56 mt-3 bg-white border-2 border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
                        <button
                          onClick={() => {
                            openCreateCourseModal();
                            setIsCourseMenuOpen(false);
                          }}
                          className="block w-full px-5 py-3.5 text-sm font-semibold text-left text-gray-800 transition-all hover:bg-blue-50 hover:text-blue-700 border-b-2 border-gray-100 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              <svg className="w-4 h-4 text-blue-600 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>Create Course</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            openJoinCourseModal();
                            setIsCourseMenuOpen(false);
                          }}
                          className="block w-full px-5 py-3.5 text-sm font-semibold text-left text-gray-800 transition-all hover:bg-green-50 hover:text-green-700 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                              <svg className="w-4 h-4 text-green-600 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <span>Join Course</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden">
                  {allCourses.length === 0 ? (
                    <EmptyState type="courses" message="No courses yet. Create or join a course to get started!" />
                  ) : (
                    <div className="h-full relative">
                      {/* Smooth scroll container */}
                      <div 
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto overflow-y-hidden h-full pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {allCourses.map((course, index) => {
                          const colorVariations = getColorVariations(course.color);
                          
                          return (
                          <Link 
                            key={course.id} 
                            href={`/courses/${course.id}`} 
                            className="course-card flex-shrink-0 w-[calc(50%-8px)] min-w-[300px] max-w-[420px] snap-start group"
                          >
                            <div className="relative flex flex-col h-full bg-white border border-gray-200 cursor-pointer rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-300 overflow-hidden">
                              {/* Colored Header - Optimized */}
                              <div className={`relative px-5 py-6 overflow-hidden ${colorVariations.base} transition-all duration-300`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/15"></div>
                                <div className="absolute inset-0 opacity-[0.06]">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
                                </div>

                                <div className="relative z-10 space-y-3.5">
                                  {/* Section Badge - Improved */}
                                  <div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-800 shadow-sm border border-white/50">
                                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">Section</span>
                                      <span className="text-gray-900">{course.code}</span>
                                    </span>
                                  </div>

                                  {/* Course Title - Better Typography */}
                                  <h3 className="text-xl font-bold text-white leading-snug line-clamp-2 pr-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.5)' }}>
                                    {course.title}
                                  </h3>
                                </div>
                              </div>

                              {/* Content Section - Optimized Spacing */}
                              <div className="flex-1 px-5 py-5 flex flex-col">
                                {/* Instructor - Better Visual Weight */}
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-sm overflow-hidden">
                                    {course.instructorProfilePicture ? (
                                      <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                          src={course.instructorProfilePicture} 
                                          alt={course.instructor}
                                          className="absolute inset-0 w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                        <span className="text-sm font-bold text-white">
                                          {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-sm font-bold text-white">
                                        {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-500 mb-0.5">Instructor</div>
                                    <div className="text-sm font-semibold text-gray-900 truncate">{course.instructor}</div>
                                  </div>
                                </div>

                                {/* Schedule Display */}
                                {course.schedules && course.schedules.length > 0 && (
                                  <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Schedule</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {(expandedSchedules[course.id] ? course.schedules : course.schedules.slice(0, 2)).map((schedule, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <span className="font-semibold text-indigo-700">{schedule.day.slice(0, 3)}</span>
                                          <span className="text-indigo-600">{schedule.startTime} - {schedule.endTime}</span>
                                        </div>
                                      ))}
                                      {course.schedules.length > 2 && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setExpandedSchedules(prev => ({
                                              ...prev,
                                              [course.id]: !prev[course.id]
                                            }));
                                          }}
                                          className="w-full text-xs text-indigo-600 hover:text-indigo-700 font-semibold text-center pt-1 transition-colors flex items-center justify-center gap-1"
                                        >
                                          {expandedSchedules[course.id] ? (
                                            <>
                                              <span>Show less</span>
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                              </svg>
                                            </>
                                          ) : (
                                            <>
                                              <span>+{course.schedules.length - 2} more</span>
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Metrics - Improved Layout */}
                                <div className="flex items-stretch gap-2.5 pt-4 border-t border-gray-200 mt-auto">
                                  {course.isCreator ? (
                                    <>
                                      <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-blue-50 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
                                        <svg className="w-5 h-5 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.studentCount}</div>
                                          <div className="text-xs font-medium text-gray-600">Students</div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-purple-50 rounded-xl border border-purple-100 transition-all hover:bg-purple-100">
                                        <svg className="w-5 h-5 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.moduleCount}</div>
                                          <div className="text-xs font-medium text-gray-600">Materials</div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-purple-50 rounded-xl border border-purple-100 transition-all hover:bg-purple-100">
                                        <svg className="w-5 h-5 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.moduleCount}</div>
                                          <div className="text-xs font-medium text-gray-600">Materials</div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-emerald-50 rounded-xl border border-emerald-100 transition-all hover:bg-emerald-100">
                                        <svg className="w-5 h-5 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.assignmentCount}</div>
                                          <div className="text-xs font-medium text-gray-600">Assignments</div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                          );
                        })}
                      </div>

                      {/* Enhanced Navigation Controls - Modern Design */}
                      {allCourses.length > 2 && (
                        <>
                          {/* Left Navigation Button - Premium Design */}
                          <button
                            onClick={() => scrollToDirection('prev')}
                            disabled={!canScrollLeft}
                            aria-label="Previous courses"
                            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl shadow-md transition-all duration-200 ${
                              canScrollLeft
                                ? 'opacity-100 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 active:scale-95'
                                : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            <ChevronLeftIcon className={`w-6 h-6 transition-colors duration-300 ${
                              canScrollLeft ? 'text-gray-700 group-hover:text-white' : 'text-gray-400'
                            }`} />
                          </button>

                          {/* Right Navigation Button - Premium Design */}
                          <button
                            onClick={() => scrollToDirection('next')}
                            disabled={!canScrollRight}
                            aria-label="Next courses"
                            className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl shadow-md transition-all duration-200 ${
                              canScrollRight
                                ? 'opacity-100 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 active:scale-95'
                                : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            <ChevronRightIcon className={`w-6 h-6 transition-colors duration-300 ${
                              canScrollRight ? 'text-gray-700 group-hover:text-white' : 'text-gray-400'
                            }`} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Simplified Progress Bar - Eye-friendly */}
                {allCourses.length > 2 && (
                  <div className="mt-5 flex-shrink-0">
                    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gray-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, scrollProgress + 20)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Scroll or use arrow keys</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                )}

                {allCourses.length > 0 && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 flex-shrink-0">
                    <div className="text-xs text-gray-500">
                      {Math.min(currentCourseIndex + 2, allCourses.length)} of {allCourses.length}
                      <span className="ml-1 text-[10px] text-gray-400">
                        ({createdCourses.length}C, {enrolledCourses.length}E)
                      </span>
                    </div>
                    <button 
                      onClick={() => router.push('/courses')}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                    >
                      <span>View All</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
          </div>
        </div>

        {/* Compact Recent Activities Sidebar */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-4 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-lg">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recent Activities</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {recentActivities.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">No recent activities</p>
                    <p className="text-xs text-gray-400 mt-1">Your activity will appear here</p>
                  </div>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={activity.id} className="p-3 border-2 border-gray-200 cursor-pointer group bg-white rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activity.color}`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate mb-1">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-600 truncate mb-2">{activity.course}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
                          <span className={`text-xs px-2 py-0.5 font-semibold rounded-md ${
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
              <div className="pt-3 mt-3 border-t border-gray-200 flex-shrink-0">
                <button className="w-full text-sm font-semibold text-purple-600 hover:text-purple-700 py-1 hover:bg-purple-50 rounded-lg transition-colors">
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
