'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  BellIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';
import HomeTour from '@/components/HomeTour';
import HorizontalNav from '@/components/HorizontalNav';
import useViewportInfo from '@/hooks/useViewportInfo';

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
  const [publicCourses, setPublicCourses] = useState([]);
  const [publicCoursesSearch, setPublicCoursesSearch] = useState('');
  const [selectedPublicCourse, setSelectedPublicCourse] = useState(null);
  const [joiningCourse, setJoiningCourse] = useState(false);
  const [joinSuccessModal, setJoinSuccessModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const [expandedSchedules, setExpandedSchedules] = useState({});
  const [showTour, setShowTour] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('public');
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasDataRef = useRef(false);
  const { height: viewportHeight, isShortHeight, isVeryShortHeight, isNarrowWidth, isCompactUi } = useViewportInfo();

  const recentActivities = [];
  const isSearchingPublicCourses = publicCoursesSearch.trim().length > 0;

  const sortedPublicCourses = useMemo(
    () => [...publicCourses].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0)),
    [publicCourses]
  );
  const featuredPublicCourses = useMemo(
    () => sortedPublicCourses.slice(0, 3),
    [sortedPublicCourses]
  );
  const remainingPublicCourses = useMemo(
    () => sortedPublicCourses.slice(3),
    [sortedPublicCourses]
  );
  const publicCourseTitleClass = 'text-sm font-semibold text-gray-900 leading-tight';
  const publicCourseTeacherClass = 'text-xs text-gray-600';
  const publicCourseMetaClass = 'text-[11px] text-gray-500';
  const publicCoursePrimaryButtonClass = 'text-[11px] px-2.5 py-1 font-semibold rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors';
  const publicModalPrimaryButtonClass = 'flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70';
  const publicModalSecondaryButtonClass = 'flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

  useEffect(() => {
    setIsMounted(true);
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserCourses();
      fetchPublicCourses();
      fetchNotifications();
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
        // createdBy is populated as an object, so we need to compare the _id
        // Handle null/undefined createdBy
        const creatorId = course.createdBy 
          ? (typeof course.createdBy === 'object' ? course.createdBy._id : course.createdBy)
          : null;
        const isCreator = creatorId && creatorId === user._id;
        
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
      // Show only enrolled courses on home page (not created courses)
      setAllCourses(enrolled);
      hasDataRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCourses = async () => {
    try {
      const res = await fetch('/api/courses/public');
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setPublicCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to fetch public courses:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const notifs = data.notifications || data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (!unreadIds.length) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const searchPublicCourses = async (searchTerm) => {
    if (!searchTerm.trim()) {
      fetchPublicCourses();
      return;
    }
    try {
      const res = await fetch(`/api/courses/public?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setPublicCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to search public courses:', err);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (publicCoursesSearch) {
        searchPublicCourses(publicCoursesSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [publicCoursesSearch]);

  const handleJoinPublicCourse = async () => {
    if (!selectedPublicCourse) return;
    
    setJoiningCourse(true);
    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseKey: selectedPublicCourse.uniqueKey }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to join course');
      }

      // Refresh courses
      fetchUserCourses();
      fetchPublicCourses();
      
      // Show success modal
      setJoinSuccessModal(selectedPublicCourse);
      setSelectedPublicCourse(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setJoiningCourse(false);
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
    return <div className="flex h-screen items-center justify-center p-6 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col bg-gray-100 overflow-hidden" style={{ height: `${viewportHeight}px` }}>
      {/* Tour Component */}
      <HomeTour show={showTour} onComplete={() => setShowTour(false)} />
      
      {/* Simple Clean Header */}
      <div className={`welcome-header relative ${isVeryShortHeight ? 'mx-2.5 mt-1.5' : 'mx-3 mt-2'} bg-white border border-gray-300 shadow-md rounded-xl hover:shadow-lg transition-shadow duration-200`}>
        <div className={`relative ${isVeryShortHeight ? 'px-5 py-3' : 'px-6 py-4'}`}>
          <div className={`flex items-center justify-between ${isVeryShortHeight ? 'gap-4' : 'gap-6'}`}>
            {/* Left Section - Simple Welcome */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl border border-gray-300 shadow-sm">
                  <SparklesIcon className="w-6 h-6 text-gray-700" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h1 className={`${isVeryShortHeight ? 'text-[1.5rem]' : isShortHeight ? 'text-[1.65rem]' : 'text-[1.85rem]'} font-bold text-gray-900 leading-tight`}>
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                    return greeting;
                  })()}, <span className="text-gray-900">
                    {user ? `${user.name}` : 'User'}
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600">
                    Welcome back to your learning dashboard
                  </p>
                  <button
                    onClick={() => setShowTour(true)}
                    className="text-xs text-gray-700 hover:text-gray-900 underline font-medium"
                    title="Start tour"
                  >
                    Take a tour
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section - Simple Calendar */}
            <div className={`flex-shrink-0 ${isNarrowWidth ? 'scale-95 origin-right' : ''}`}>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-2 font-medium">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>This Week</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-300 shadow-sm">
                <div className="text-center mb-1.5">
                  <div className="text-xs text-gray-900 font-semibold">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`header-${index}`} className="text-[10px] text-gray-600 font-semibold mb-1">
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
                          className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                            isToday
                              ? 'bg-gray-900 text-white shadow-sm'
                              : isPast
                              ? 'bg-gray-200 text-gray-400'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm'
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

      {/* Horizontal Navigation */}
      <HorizontalNav />

      {/* Main Content Grid - Optimized for single viewport */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 ${isVeryShortHeight ? 'gap-2.5 mx-2.5 my-1.5' : 'gap-3 mx-3 my-2'} lg:grid-cols-3 overflow-hidden`}>
        {/* Unified Courses Section */}
        <div className="joined-courses-section lg:col-span-2 flex min-h-0 flex-col overflow-hidden">
          <div className={`flex-1 flex min-h-0 flex-col ${isVeryShortHeight ? 'p-2.5' : 'p-3'} bg-white border border-gray-300 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300`}>
                <div className={`flex items-center justify-between ${isVeryShortHeight ? 'mb-2.5 pb-2.5' : 'mb-3 pb-3'} flex-shrink-0 border-b border-gray-200`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                    <div className={`${isVeryShortHeight ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center bg-blue-500 rounded-2xl shadow-sm flex-shrink-0`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-shrink-0">
                      <h2 className={`${isVeryShortHeight ? 'text-sm' : 'text-[15px]'} font-bold text-gray-800 tracking-tight`}>Joined Courses</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-gray-500">
                          {allCourses.length} enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="add-course-button relative flex-shrink-0 z-50">
                    <button
                      onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
                      className={`flex items-center justify-center ${isVeryShortHeight ? 'w-9 h-9' : 'w-10 h-10'} text-white transition-all duration-300 bg-blue-600 rounded-2xl shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 active:scale-95`}
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

                <div className="relative flex-1 min-h-0 overflow-hidden">
                  {allCourses.length === 0 ? (
                    <EmptyState type="courses" message="No courses yet. Create or join a course to get started!" />
                  ) : (
                    <div className="h-full relative">
                      {/* Smooth scroll container */}
                      <div 
                        ref={scrollContainerRef}
                        className={`flex ${isVeryShortHeight ? 'gap-2.5 pb-1.5' : 'gap-3 pb-2'} overflow-x-auto overflow-y-hidden h-full scroll-smooth snap-x snap-mandatory scrollbar-hide`}
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
                            className={`course-card flex-shrink-0 ${isCompactUi ? 'w-[calc(50%-5px)] min-w-[260px] max-w-[360px]' : 'w-[calc(50%-6px)] min-w-[280px] max-w-[390px]'} snap-start group`}
                          >
                            <div className="relative flex flex-col h-full bg-white border-2 border-gray-300 cursor-pointer rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-gray-400 overflow-hidden shadow-lg">
                              {/* Colored Header - Modern & Clean */}
                              <div className={`relative ${isVeryShortHeight ? 'px-5 py-4' : 'px-5 py-5'} ${colorVariations.base}`}>
                                {/* Subtle pattern overlay */}
                                <div className="absolute inset-0 opacity-10">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black rounded-full translate-y-12 -translate-x-12"></div>
                                </div>

                                <div className="relative z-10">
                                  {/* Section Badge - Minimal */}
                                  <div className="mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-800 shadow-sm">
                                      <span className="text-gray-500 font-medium">SECTION</span>
                                      <span className="text-gray-900">{course.code}</span>
                                    </span>
                                  </div>

                                  {/* Course Title - Clean Typography */}
                                  <h3 className="text-xl font-bold text-white leading-tight line-clamp-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                                    {course.title}
                                  </h3>
                                </div>
                              </div>

                              {/* Content Section - Clean Layout */}
                              <div className={`flex-1 ${isVeryShortHeight ? 'px-5 py-4' : 'px-5 py-5'} flex flex-col bg-white`}>
                                {/* Instructor - Minimal Design */}
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                  <div className="relative flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-300">
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
                                        <span className="text-sm font-bold text-gray-700">
                                          {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-sm font-bold text-gray-700">
                                        {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-500 mb-0.5">Instructor</div>
                                    <div className="text-sm font-bold text-gray-900 truncate">{course.instructor}</div>
                                  </div>
                                </div>

                                {/* Schedule Display - Fixed height */}
                                {course.schedules && course.schedules.length > 0 && (
                                  <div className={`${isVeryShortHeight ? 'my-3' : 'my-4'} bg-gray-50 rounded-lg border border-gray-200 overflow-hidden`}>
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Schedule</span>
                                      </div>
                                      {course.schedules.length > 2 && (
                                        <span className="text-xs text-gray-500 font-medium">
                                          +{course.schedules.length - 2} more
                                        </span>
                                      )}
                                    </div>
                                    {/* Fixed height container - reduced since no "+X more" text inside */}
                                    <div className="h-16 px-3 py-2 overflow-y-auto">
                                      <div className="space-y-1.5">
                                        {course.schedules.slice(0, 2).map((schedule, idx) => (
                                          <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-700">{schedule.day.slice(0, 3)}</span>
                                            <span className="text-gray-600 font-medium">{schedule.startTime} - {schedule.endTime}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Metrics - Compact Grid */}
                                <div className={`grid grid-cols-2 ${isVeryShortHeight ? 'gap-2 pt-2' : 'gap-2 pt-3'} mt-auto`}>
                                  {course.isCreator ? (
                                    <>
                                      <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.studentCount}</div>
                                          <div className="text-[10px] font-medium text-gray-600">Students</div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.moduleCount}</div>
                                          <div className="text-[10px] font-medium text-gray-600">Materials</div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.moduleCount}</div>
                                          <div className="text-[10px] font-medium text-gray-600">Materials</div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.assignmentCount}</div>
                                          <div className="text-[10px] font-medium text-gray-600">Assignments</div>
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

                        {/* Placeholder Card - Show when only 1 course */}
                        {allCourses.length === 1 && (
                          <div className="flex-shrink-0 flex-1 snap-start">
                            <div className="relative flex flex-col h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-lg">
                              {/* Header */}
                              <div className={`relative ${isVeryShortHeight ? 'px-5 py-4' : 'px-5 py-5'} bg-gradient-to-br from-gray-100 to-gray-200 border-b-2 border-gray-300`}>
                                <div className="flex items-center justify-center">
                                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-md">
                                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Content */}
                              <div className={`flex-1 ${isVeryShortHeight ? 'px-5 py-4' : 'px-5 py-5'} flex flex-col items-center justify-center text-center bg-white`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  Explore More Courses
                                </h3>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                  Browse public courses to expand your learning journey
                                </p>

                                {/* Stats */}
                                <div className="mt-auto pt-4 border-t border-gray-200 w-full">
                                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                    </svg>
                                    <span className="font-medium">Discover new learning opportunities</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
                  <div className={`${isVeryShortHeight ? 'mt-2.5' : 'mt-3'} flex-shrink-0`}>
                    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gray-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, scrollProgress + 20)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-center mt-2 text-[11px] text-gray-500">
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

        {/* Right Sidebar — Notifications + Public Courses */}
        <div className="recent-activities flex min-h-0 flex-col overflow-hidden">
          <div className={`flex-1 flex min-h-0 flex-col ${isVeryShortHeight ? 'p-2.5' : 'p-3'} bg-white border border-gray-300 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300`}>

            {/* Tab Header */}
            <div className={`flex items-center gap-1 ${isVeryShortHeight ? 'mb-2.5' : 'mb-3'} flex-shrink-0 bg-gray-100 rounded-xl p-1`}>
              <button
                onClick={() => setSidebarTab('notifications')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sidebarTab === 'notifications'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BellIcon className="w-3.5 h-3.5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('public')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sidebarTab === 'public'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <GlobeAltIcon className="w-3.5 h-3.5" />
                Public
                <span className="text-[10px] font-bold text-gray-400">({publicCourses.length})</span>
              </button>
            </div>

            {/* ── Notifications Tab ── */}
            {sidebarTab === 'notifications' && (
              <>
                {/* Mark all read */}
                {unreadCount > 0 && (
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-500">{unreadCount} unread</span>
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <CheckIcon className="w-3 h-3" /> Mark all read
                    </button>
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <BellIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No notifications</p>
                      <p className="text-[11px] text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => notif.link && router.push(notif.link)}
                        className={`rounded-xl border p-3 transition-all cursor-pointer ${
                          notif.read
                            ? 'bg-white border-gray-200 hover:border-gray-300'
                            : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                              {notif.type === 'announcement' ? '📢' : '📎'}{' '}
                              {notif.message
                                .replace(/<[^>]*>/g, ' ')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/\s+/g, ' ')
                                .replace(/^"|"$/g, '')
                                .trim()
                              }
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                              {notif.course?.subject || 'Course'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-200 flex-shrink-0">
                    <button
                      onClick={fetchNotifications}
                      className="w-full text-xs font-semibold text-slate-700 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Public Courses Tab ── */}
            {sidebarTab === 'public' && (
              <>
                {/* Search Input */}
                <div className="mb-3 flex-shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by subject or teacher"
                      value={publicCoursesSearch}
                      onChange={(e) => setPublicCoursesSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-xs text-gray-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {publicCoursesSearch && (
                      <button
                        onClick={() => { setPublicCoursesSearch(''); fetchPublicCourses(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                  {publicCourses.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center py-8">
                        <div className="w-14 h-14 mx-auto mb-2.5 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{publicCoursesSearch ? 'No courses found' : 'No public courses'}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{publicCoursesSearch ? 'Try a different search' : 'Public courses will appear here'}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!isSearchingPublicCourses && featuredPublicCourses.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Featured</p>
                            <span className="text-[11px] text-gray-400">Top enrolled</span>
                          </div>
                          {featuredPublicCourses.map((course, index) => (
                            <div key={course._id} className="rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 to-white p-3 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-start gap-2.5">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: course.coverColor || '#3b82f6' }}>
                                  {course.subject?.charAt(0) || 'C'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`${publicCourseTitleClass} line-clamp-2`}>{course.subject}</h4>
                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200">#{index + 1}</span>
                                  </div>
                                  <p className={`${publicCourseTeacherClass} truncate mt-0.5`}>{course.teacherName}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className={publicCourseMetaClass}>{course.studentCount} students</span>
                                    <button onClick={() => setSelectedPublicCourse(course)} className={publicCoursePrimaryButtonClass}>Join</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {isSearchingPublicCourses ? 'Search Results' : 'More Courses'}
                          </p>
                          {!isSearchingPublicCourses && remainingPublicCourses.length > 0 && (
                            <span className="text-[11px] text-gray-400">{remainingPublicCourses.length} available</span>
                          )}
                        </div>
                        {(isSearchingPublicCourses ? sortedPublicCourses : remainingPublicCourses).map((course) => (
                          <div key={course._id} className="rounded-xl border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                            <div className="flex items-start gap-2.5">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: course.coverColor || '#3b82f6' }}>
                                {course.subject?.charAt(0) || 'C'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`${publicCourseTitleClass} truncate`}>{course.subject}</h4>
                                <p className={`${publicCourseTeacherClass} truncate`}>{course.teacherName}</p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className={`flex items-center gap-1.5 min-w-0 ${publicCourseMetaClass}`}>
                                    <span className="truncate">{course.studentCount} students</span>
                                    {course.section && <span className="truncate">• {course.section}</span>}
                                  </div>
                                  <button onClick={() => setSelectedPublicCourse(course)} className={publicCoursePrimaryButtonClass}>Join</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {publicCourses.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-200 flex-shrink-0">
                    <button onClick={() => fetchPublicCourses()} className="w-full text-xs font-semibold text-slate-700 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Refresh Public Courses
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Join Course Confirmation Modal */}
      {selectedPublicCourse && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Join Course</h3>
              <p className="mt-1 text-xs text-gray-500">Review course details before enrolling.</p>
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: selectedPublicCourse.coverColor || '#3b82f6' }}
                >
                  {selectedPublicCourse.subject?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`${publicCourseTitleClass} line-clamp-2`}>{selectedPublicCourse.subject}</h4>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className={`${publicCourseTeacherClass} truncate`}>{selectedPublicCourse.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className={publicCourseMetaClass}>{selectedPublicCourse.studentCount} students</span>
                    </div>
                    {selectedPublicCourse.section && (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className={`${publicCourseMetaClass} truncate`}>Section: {selectedPublicCourse.section}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setSelectedPublicCourse(null)}
                disabled={joiningCourse}
                className={publicModalSecondaryButtonClass}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinPublicCourse}
                disabled={joiningCourse}
                className={publicModalPrimaryButtonClass}
              >
                {joiningCourse ? 'Joining...' : 'Join Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {joinSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-9 w-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900">Successfully Joined!</h3>
            <p className="mt-2 mb-5 text-xs text-gray-600">
              You are now enrolled in <span className="font-semibold text-gray-900">{joinSuccessModal.subject}</span>.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setJoinSuccessModal(null)}
                className={publicModalSecondaryButtonClass.replace(' disabled:cursor-not-allowed disabled:opacity-50', '')}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setJoinSuccessModal(null);
                  router.push(`/courses/${joinSuccessModal._id}`);
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Go to Course
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Component definitions
const SparklesIcon = (props) => (
  <Image
    src="/favicon.svg"
    alt="Intelevo AI"
    width={40}
    height={40}
    className="object-contain w-10 h-10"
    {...props}
  />
);
