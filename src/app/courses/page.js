'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import CourseCardSkeleton from '@/components/CourseCardSkeleton';
import CoursePreviewModal from '@/components/CoursePreviewModal';
import Tooltip from '@/components/Tooltip';
import AdaptiveLayout from '@/components/AdaptiveLayout';
import CourseFilterSort from '@/components/CourseFilterSort';
import ProfessionalCourseCard from '@/components/ProfessionalCourseCard';
import preferenceLearningService from '@/services/preferenceLearningService';
import cacheService from '@/services/cacheService';
import predictiveLoadingService from '@/services/predictiveLoadingService';
import { useLayout } from '../../context/LayoutContext';
import { useAdaptiveLayout } from '../../context/AdaptiveLayoutContext';

const CourseContent = () => {
  const { openCreateCourseModal, openJoinCourseModal, openCreateClusterModal, openJoinClusterModal } = useLayout();
  const { userBehavior, trackInteraction, behaviorHistory, updateLayoutPreference } = useAdaptiveLayout();

  // Track user interactions for smart indicators
  const trackUserInteraction = async (type, courseId = null, metadata = {}) => {
    try {
      await fetch('/api/user/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          courseId,
          metadata,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };
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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState(null);
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dragFeedback, setDragFeedback] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [sortBy, setSortBy] = useState('name-asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    instructor: [],
    code: [],
    progress: [],
    enrollment: [],
    difficulty: []
  });
  const [expandedSchedules, setExpandedSchedules] = useState({});

  // Notification system
  useEffect(() => {
    const checkForAdaptations = () => {
      const recentInteractions = behaviorHistory.slice(-10);

      // Check for course priority adaptation
      if (recentInteractions.filter(i => i.type === 'course_click').length >= 5) {
        if (!notifications.find(n => n.type === 'course_priority')) {
          addNotification({
            type: 'course_priority',
            title: 'Layout Optimized! 🎯',
            message: 'Course cards resized based on your usage patterns',
            icon: '🎯',
            duration: 4000
          });
        }
      }

      // Check for search optimization
      if (recentInteractions.filter(i => i.type === 'search').length >= 3) {
        if (!notifications.find(n => n.type === 'search_optimization')) {
          addNotification({
            type: 'search_optimization',
            title: 'Search Optimized! 🔍',
            message: 'Consider compact layout for better search experience',
            icon: '🔍',
            duration: 4000
          });
        }
      }

      // Check for drag and drop patterns
      if (recentInteractions.filter(i => i.type === 'drag_drop').length >= 2) {
        if (!notifications.find(n => n.type === 'drag_optimization')) {
          addNotification({
            type: 'drag_optimization',
            title: 'Organization Detected! 📂',
            message: 'System remembers your course organization preferences',
            icon: '📂',
            duration: 4000
          });
        }
      }
    };

    const addNotification = (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 2)]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.type !== notification.type));
      }, notification.duration);
    };

    checkForAdaptations();
  }, [behaviorHistory, notifications]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !slug) {
      fetchUserCourses();
      fetchUserClusters();
    }
  }, [isMounted, slug]);

  // Initialize filtered courses when courses are loaded
  useEffect(() => {
    if (courses.length > 0) {
      setFilteredCourses(courses);
    }
  }, [courses]);

  // Initialize services
  useEffect(() => {
    if (isMounted) {
      // Initialize preference learning service
      preferenceLearningService.initialize();

      // Start predictive loading for current user context
      predictiveLoadingService.startPredictivePrefetch('current_user', {
        page: 'courses',
        timestamp: Date.now()
      });

      // Cache initial course data
      if (courses.length > 0) {
        courses.forEach(course => {
          cacheService.set(`course_${course.id}`, course, {
            ttl: 10 * 60 * 1000 // 10 minutes
          });
        });
      }
    }

    return () => {
      preferenceLearningService.stopLearning();
      predictiveLoadingService.stopPredictivePrefetch();
    };
  }, [isMounted, courses]);

  // Track search interactions
  useEffect(() => {
    if (searchTerm) {
      preferenceLearningService.trackInteraction('search', {
        searchTerm,
        resultCount: filteredCourses.length
      });
    }
  }, [searchTerm, filteredCourses.length]);

  // Track filter interactions
  useEffect(() => {
    const filterCount = Object.values(activeFilters).reduce((count, values) =>
      count + (Array.isArray(values) ? values.length : 0), 0
    );

    if (filterCount > 0) {
      preferenceLearningService.trackInteraction('filter', {
        activeFilters,
        filterCount,
        resultCount: filteredCourses.length
      });
    }
  }, [activeFilters, filteredCourses.length]);

  // Track sort interactions
  useEffect(() => {
    if (sortBy) {
      preferenceLearningService.trackInteraction('sort', {
        sortBy,
        resultCount: filteredCourses.length
      });
    }
  }, [sortBy, filteredCourses.length]);

  const formatSlugToTitle = (s) => {
    if (!s) return '';
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fetchUserCourses = async () => {
    setLoading(true);
    setError('');
    try {
      // Try to get from cache first
      const cacheKey = 'user_courses';
      let cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        console.log('Loaded courses from cache');
        setCourses(cachedData.courses);
        setLoading(false);

        // Background refresh
        fetchUserCoursesFromAPI(cacheKey);
        return;
      }

      // Fetch from API
      await fetchUserCoursesFromAPI(cacheKey);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCoursesFromAPI = async (cacheKey) => {
    const res = await fetch('/api/courses', {
      credentials: 'include'
    }); // Include credentials to send httpOnly cookie

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Map fetched courses to the expected format for display
    const formattedCourses = data.courses.map(course => {
      // Generate meaningful course names if subject is empty or placeholder
      let courseTitle = course.subject;
      if (!courseTitle || courseTitle === 'New Course' || courseTitle === 'Untitled' || courseTitle.trim() === '') {
        const courseNumber = course._id.toString().slice(-4).toUpperCase();
        courseTitle = `Course ${courseNumber}`;
      }

      return {
        id: course._id,
        title: courseTitle,
        code: course.section || 'SEC-001',
        instructor: course.teacherName || 'Instructor Name',
        progress: 0, // Start with 0% progress - will increase as users engage
        color: course.coverColor || '#60a5fa',
        progressColor: course.coverColor || '#60a5fa',
        studentCount: course.enrolledUsers?.length || 0, // Use actual enrolled students only (no +1 for creator)
        moduleCount: course.moduleCount || 0,   // Use real module count from API
        schedules: course.schedules || [],
      };
    });

    // Sort courses by custom order if available, otherwise maintain original order
    const sortedCourses = formattedCourses.sort((a, b) => {
      const aOrder = data.courses.find(c => c._id === a.id)?.customOrder ?? Infinity;
      const bOrder = data.courses.find(c => c._id === b.id)?.customOrder ?? Infinity;
      return aOrder - bOrder;
    });

    setCourses(sortedCourses);

    // Cache the data
    await cacheService.set(cacheKey, {
      courses: sortedCourses,
      timestamp: Date.now()
    }, {
      ttl: 5 * 60 * 1000 // 5 minutes
    });

    // Start predictive loading for course details
    predictiveLoadingService.startPredictivePrefetch('current_user', {
      page: 'courses',
      courseCount: sortedCourses.length,
      timestamp: Date.now()
    });
  };

  const fetchUserClusters = async () => {
    try {
      const res = await fetch('/api/clusters', {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (err) {
      console.error('Failed to fetch user clusters:', err);
    }
  };

  const handleCoursePreview = (course) => {
    setSelectedCourseForPreview(course);
    setPreviewModalOpen(true);

    // Track interaction for preference learning
    preferenceLearningService.trackInteraction('preview', {
      courseId: course.id,
      courseTitle: course.title
    });
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setSelectedCourseForPreview(null);
  };

  const handleViewCourse = (course) => {
    handleClosePreview();
    router.push(`/courses/${course.id}`);

    // Track course view interaction
    preferenceLearningService.trackInteraction('course_click', {
      courseId: course.id,
      courseTitle: course.title,
      courseCode: course.code,
      instructor: course.instructor
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, course, index) => {
    setDraggedCourse({ course, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);

    // Add visual feedback
    const card = e.target.closest('.masonry-item');
    if (card) {
      card.style.opacity = '0.5';
      card.style.transform = 'rotate(5deg) scale(1.05)';
    }

    // Track drag start interaction
    preferenceLearningService.trackInteraction('drag_drop', {
      courseId: course.id,
      courseTitle: course.title,
      action: 'drag_start',
      position: index
    });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = (e) => {
    // Reset visual feedback
    const card = e.target.closest('.masonry-item');
    if (card) {
      card.style.opacity = '1';
      card.style.transform = 'rotate(0deg) scale(1)';
    }

    setDraggedCourse(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (!draggedCourse) return;

    const { course: draggedCourseData, index: dragIndex } = draggedCourse;

    if (dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    // Create new courses array with reordered items
    const newCourses = [...courses];
    const [removed] = newCourses.splice(dragIndex, 1);
    newCourses.splice(dropIndex, 0, removed);

    setCourses(newCourses);
    setDragOverIndex(null);
    setDraggedCourse(null);

    // Save the new course order to the backend
    saveCourseOrder(newCourses);

    // Track drag drop interaction
    trackUserInteraction('drag_drop', draggedCourseData.id, {
      fromPosition: dragIndex,
      toPosition: dropIndex,
      direction: dropIndex > dragIndex ? 'down' : 'up'
    });

    // Track with preference learning service
    preferenceLearningService.trackInteraction('drag_drop', {
      courseId: draggedCourseData.id,
      courseTitle: draggedCourseData.title,
      action: 'drop',
      fromPosition: dragIndex,
      toPosition: dropIndex
    });
  };

  const saveCourseOrder = async (orderedCourses) => {
    try {
      const courseIds = orderedCourses.map(course => course.id);
      const response = await fetch('/api/courses/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ courseIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to save course order');
      }

      console.log('Course order saved successfully');
    } catch (error) {
      console.error('Error saving course order:', error);
      // Optionally show user feedback here
    }
  };

  // Keyboard shortcuts for drag and drop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && draggedCourse) {
        setDraggedCourse(null);
        setDragOverIndex(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [draggedCourse]);

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

  // Show loading state with skeleton screens
  if (loading) {
    return (
      <div className="flex-1 h-screen p-2 sm:p-4 lg:p-6 bg-gray-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Enhanced Header Skeleton */}
        <div className="relative mx-4 mt-4 mb-8 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-gray-50/30 to-gray-50/50"></div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="skeleton-avatar w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl"></div>
                </div>
                <div className="animate-fade-in-up min-w-0 flex-1">
                  <div className="skeleton-text w-48 h-6 sm:w-56 sm:h-7 lg:w-64 lg:h-8 mb-2"></div>
                  <div className="skeleton-text w-64 h-4 sm:w-72 sm:h-5 lg:w-80 lg:h-6"></div>
                </div>
              </div>
              <div className="skeleton-button w-12 h-12 rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="relative mx-4 mb-8 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 sm:gap-3 min-w-max">
                <div className="skeleton-button w-24 h-10 rounded-2xl"></div>
                <div className="skeleton-button w-24 h-10 rounded-2xl"></div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-gray-200 mx-2"></div>
              <div className="flex gap-2 sm:gap-3 min-w-max">
                <div className="skeleton-button w-20 h-10 rounded-2xl"></div>
                <div className="skeleton-button w-20 h-10 rounded-2xl"></div>
                <div className="skeleton-button w-20 h-10 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid Skeleton with Staggered Animation */}
        <div className="w-full flex justify-center">
          <div className="masonry-grid w-full max-w-none">
            {[...Array(6)].map((_, index) => {
              // Simulate different card priorities for variety
              const priorities = ['normal', 'normal', 'high', 'normal', 'featured', 'normal'];
              const priority = priorities[index % priorities.length];

              return (
                <CourseCardSkeleton
                  key={`skeleton-${index}`}
                  index={index}
                  priority={priority}
                />
              );
            })}
          </div>
        </div>
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
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* Enhanced Header */}
      <div className="relative mx-4 mt-4 mb-8 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 animate-pulse"></div>

        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-12 w-3 h-3 bg-blue-200/40 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-16 right-20 w-2 h-2 bg-indigo-200/50 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-12 left-1/4 w-2.5 h-2.5 bg-purple-200/40 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-12 w-1.5 h-1.5 bg-blue-300/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl animate-fade-in-up">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse border-2 sm:border-3 border-white"></div>
              </div>
              <div className="animate-fade-in-up min-w-0 flex-1" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  All <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Courses</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">Manage and explore your learning journey</p>
                <div className="mt-2 sm:mt-3 h-1 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full animate-expand-width" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          
            <div className="animate-fade-in-up flex items-center gap-3" style={{ animationDelay: '0.2s' }}>
              <Tooltip
                content={
                  <div>
                    <div className="font-semibold mb-1">Quick Actions</div>
                    <div className="text-sm opacity-90">
                      Create new courses, join existing ones, or manage clusters
                    </div>
                  </div>
                }
                type="help"
                position="left"
              >
                <button
                  onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
                  className="group relative flex items-center justify-center w-12 h-12 text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl rounded-2xl hover:shadow-2xl hover:scale-110 active:scale-95 overflow-hidden"
                  data-action="main_menu"
                  data-feature="course_actions"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <PlusIcon className="relative w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </Tooltip>


              {isCourseMenuOpen && (
                <div className="absolute right-16 top-0 z-[99999] w-64 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl animate-fade-in-left dropdown-menu">
                  <div className="p-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          openCreateCourseModal();
                          setIsCourseMenuOpen(false);
                        }}
                        className="group flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-gray-700 transition-all duration-200 rounded-lg hover:bg-green-50 hover:text-green-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span className="text-center">Create Course</span>
                      </button>
                      <button
                        onClick={() => {
                          openJoinCourseModal();
                          setIsCourseMenuOpen(false);
                        }}
                        className="group flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-gray-700 transition-all duration-200 rounded-lg hover:bg-blue-50 hover:text-blue-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <span className="text-center">Join Course</span>
                      </button>
                      <button
                        onClick={() => {
                          openCreateClusterModal();
                          setIsCourseMenuOpen(false);
                        }}
                        className="group flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-gray-700 transition-all duration-200 rounded-lg hover:bg-purple-50 hover:text-purple-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-center">Create Cluster</span>
                      </button>
                      <button
                        onClick={() => {
                          openJoinClusterModal();
                          setIsCourseMenuOpen(false);
                        }}
                        className="group flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-gray-700 transition-all duration-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-200">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-center">Join Cluster</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="relative mx-4 mb-8 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl z-10">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30 animate-pulse"></div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 sm:gap-3 min-w-max">
              <Tooltip
                content={
                  <div>
                    <div className="font-semibold mb-1">Your Courses</div>
                    <div className="text-sm opacity-90">
                      View and manage all your enrolled courses. Click cards to preview content.
                    </div>
                  </div>
                }
                type="info"
                position="bottom"
              >
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    trackInteraction('navigation', { path: 'courses_tab' });
                    trackUserInteraction('tab_switch', null, {
                      tabName: 'courses',
                      previousTab: activeTab
                    });
                  }}
                  className={`group relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-2xl overflow-hidden ${
                    activeTab === 'courses'
                      ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/80 backdrop-blur-sm border border-gray-200/50 hover:border-blue-200/70'
                  }`}
                  data-action="tab_switch"
                  data-feature="navigation"
                >
                  <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl transition-all duration-300 ${
                    activeTab === 'courses'
                      ? 'bg-white/20'
                      : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors duration-300 ${
                      activeTab === 'courses' ? 'text-white' : 'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="relative whitespace-nowrap">Courses</span>
                  {activeTab === 'courses' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 animate-pulse"></div>
                  )}
                </button>
              </Tooltip>

              <Tooltip
                content={
                  <div>
                    <div className="font-semibold mb-1">Course Clusters</div>
                    <div className="text-sm opacity-90">
                      Group related courses together for better organization and collaboration.
                    </div>
                  </div>
                }
                type="info"
                position="bottom"
              >
                <button
                  onClick={() => {
                    setActiveTab('clusters');
                    trackInteraction('navigation', { path: 'clusters_tab' });
                    trackUserInteraction('tab_switch', null, {
                      tabName: 'clusters',
                      previousTab: activeTab
                    });
                  }}
                  className={`group relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-2xl overflow-hidden ${
                    activeTab === 'clusters'
                      ? 'text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50/80 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200/70'
                  }`}
                  data-action="tab_switch"
                  data-feature="navigation"
                >
                  <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl transition-all duration-300 ${
                    activeTab === 'clusters'
                      ? 'bg-white/20'
                      : 'bg-purple-100 group-hover:bg-purple-200'
                  }`}>
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors duration-300 ${
                      activeTab === 'clusters' ? 'text-white' : 'text-purple-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="relative whitespace-nowrap">Clusters</span>
                  {activeTab === 'clusters' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 animate-pulse"></div>
                  )}
                </button>
              </Tooltip>
            </div>

            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2"></div>

            <div className="flex gap-2 sm:gap-3 min-w-max">
              <button className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-500 transition-all duration-300 rounded-2xl hover:text-gray-700 hover:bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/70">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors duration-300">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="hidden sm:inline whitespace-nowrap">Documents</span>
                <span className="sm:hidden">Docs</span>
                <div className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                  Soon
                </div>
              </button>

              <button className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-500 transition-all duration-300 rounded-2xl hover:text-gray-700 hover:bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/70">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors duration-300">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="hidden sm:inline whitespace-nowrap">Videos</span>
                <span className="sm:hidden">Video</span>
                <div className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                  Soon
                </div>
              </button>

              <button className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-500 transition-all duration-300 rounded-2xl hover:text-gray-700 hover:bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/70">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors duration-300">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <span className="hidden sm:inline whitespace-nowrap">Audio</span>
                <span className="sm:hidden">Audio</span>
                <div className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                  Soon
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Filter and Sort Component */}
      <div className="mx-4">
        <CourseFilterSort
          courses={courses}
          onFilteredCoursesChange={setFilteredCourses}
          onSortChange={setSortBy}
          initialFilters={activeFilters}
          initialSort={sortBy}
        />
      </div>



      {/* Smart Recommendations */}
      {(() => {
        const recommendations = [];
        if (userBehavior.interactionPatterns.mostClickedCourses.length > 5 && userBehavior.layoutPreferences.cardSize !== 'large') {
          recommendations.push({
            id: 'card_size',
            title: 'Optimize Card Size',
            message: 'You frequently access courses. Larger cards would improve visibility.',
            action: 'Switch to Large Cards',
            icon: '📏'
          });
        }
        if (userBehavior.interactionPatterns.searchFrequency > 3 && !userBehavior.layoutPreferences.compactMode) {
          recommendations.push({
            id: 'compact_mode',
            title: 'Enable Compact Mode',
            message: 'You use search often. Compact mode shows more courses at once.',
            action: 'Try Compact Layout',
            icon: '🔍'
          });
        }

        if (recommendations.length > 0) {
          return (
            <div className="mb-6 space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{rec.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 text-sm">{rec.title}</h4>
                      <p className="text-xs text-blue-700 mt-1">{rec.message}</p>
                      <button
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => {
                          if (rec.id === 'card_size') {
                            updateLayoutPreference('cardSize', 'large');
                          } else if (rec.id === 'compact_mode') {
                            updateLayoutPreference('compactMode', true);
                          }
                        }}
                      >
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* Enhanced Course/Cluster Grid with Masonry Layout */}
      <div className="relative mb-8 ml-4 mr-4">
        <div className="w-full transition-all duration-500 ease-in-out">
          <AdaptiveLayout componentType="courses" trackInteractions={true} adaptiveMode={true}>
            <div className="masonry-grid">
          {activeTab === 'courses' ? (
          filteredCourses.length === 0 ? (
            <div className="col-span-full animate-fade-in-up">
              <div className="p-6 sm:p-8 lg:p-12 text-center bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl mx-4 sm:mx-0">
                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold text-gray-900">No courses yet</h3>
                <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-600 max-w-md mx-auto px-4">Start your learning journey by creating your first course or joining an existing one.</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                  <button
                    onClick={() => openCreateCourseModal()}
                    className="group relative flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden text-sm sm:text-base"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="relative w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="relative">Create Course</span>
                  </button>
                  <button
                    onClick={() => openJoinCourseModal()}
                    className="group flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Join Course</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            filteredCourses.map((course, index) => {
              // Utility function to normalize and ensure proper color format
              const normalizeColor = (colorValue) => {
                if (colorValue && colorValue.startsWith('bg-')) {
                  return colorValue;
                }
                
                const hexToTailwindMap = {
                  '#60a5fa': 'bg-blue-400',
                  '#a78bfa': 'bg-purple-400',
                  '#f472b6': 'bg-pink-400',
                  '#34d399': 'bg-emerald-400',
                  '#fb923c': 'bg-orange-400',
                  '#f87171': 'bg-red-400',
                  '#2dd4bf': 'bg-teal-400',
                  '#818cf8': 'bg-indigo-400',
                };
                
                if (colorValue && colorValue.startsWith('#')) {
                  const lowerHex = colorValue.toLowerCase();
                  if (hexToTailwindMap[lowerHex]) {
                    return hexToTailwindMap[lowerHex];
                  }
                }
                
                return 'bg-blue-500';
              };

              const getColorVariations = (colorClass) => {
                const normalizedColor = normalizeColor(colorClass);
                
                const colorMap = {
                  'bg-blue-500': { lighter: 'bg-blue-50', darker: 'bg-blue-600', text: 'text-blue-700' },
                  'bg-blue-400': { lighter: 'bg-blue-50', darker: 'bg-blue-600', text: 'text-blue-700' },
                  'bg-indigo-500': { lighter: 'bg-indigo-50', darker: 'bg-indigo-600', text: 'text-indigo-700' },
                  'bg-indigo-400': { lighter: 'bg-indigo-50', darker: 'bg-indigo-600', text: 'text-indigo-700' },
                  'bg-purple-500': { lighter: 'bg-purple-50', darker: 'bg-purple-600', text: 'text-purple-700' },
                  'bg-purple-400': { lighter: 'bg-purple-50', darker: 'bg-purple-600', text: 'text-purple-700' },
                  'bg-pink-500': { lighter: 'bg-pink-50', darker: 'bg-pink-600', text: 'text-pink-700' },
                  'bg-pink-400': { lighter: 'bg-pink-50', darker: 'bg-pink-600', text: 'text-pink-700' },
                  'bg-red-500': { lighter: 'bg-red-50', darker: 'bg-red-600', text: 'text-red-700' },
                  'bg-red-400': { lighter: 'bg-red-50', darker: 'bg-red-600', text: 'text-red-700' },
                  'bg-orange-500': { lighter: 'bg-orange-50', darker: 'bg-orange-600', text: 'text-orange-700' },
                  'bg-orange-400': { lighter: 'bg-orange-50', darker: 'bg-orange-600', text: 'text-orange-700' },
                  'bg-emerald-500': { lighter: 'bg-emerald-50', darker: 'bg-emerald-600', text: 'text-emerald-700' },
                  'bg-emerald-400': { lighter: 'bg-emerald-50', darker: 'bg-emerald-600', text: 'text-emerald-700' },
                  'bg-teal-500': { lighter: 'bg-teal-50', darker: 'bg-teal-600', text: 'text-teal-700' },
                  'bg-teal-400': { lighter: 'bg-teal-50', darker: 'bg-teal-600', text: 'text-teal-700' },
                };
                
                return {
                  base: normalizedColor,
                  ...colorMap[normalizedColor]
                };
              };

              const colorVariations = getColorVariations(course.color);
              
              return (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.id}`} 
                  className="masonry-item group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className={`relative flex flex-col h-full bg-white border-2 cursor-pointer rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${
                    dragOverIndex === index ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    {/* Colored Header */}
                    <div className={`relative px-5 py-6 overflow-hidden ${colorVariations.base} transition-all duration-300`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/15"></div>
                      <div className="absolute inset-0 opacity-[0.06]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
                      </div>

                      <div className="relative z-10 space-y-3.5">
                        {/* Section Badge */}
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-800 shadow-sm border border-white/50">
                            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">Section</span>
                            <span className="text-gray-900">{course.code}</span>
                          </span>
                        </div>

                        {/* Course Title */}
                        <h3 className="text-xl font-bold text-white leading-snug line-clamp-2 pr-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.5)' }}>
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 px-5 py-5 flex flex-col">
                      {/* Instructor */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
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

                      {/* Metrics */}
                      <div className="flex items-stretch gap-2.5 pt-4 border-t border-gray-200 mt-auto">
                        <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-purple-50 rounded-xl border border-purple-100 transition-all hover:bg-purple-100">
                          <svg className="w-5 h-5 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.moduleCount || 0}</div>
                            <div className="text-xs font-medium text-gray-600">Materials</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 px-3 py-3 bg-blue-50 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
                          <svg className="w-5 h-5 text-blue-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900 leading-none mb-1">{course.studentCount || 0}</div>
                            <div className="text-xs font-medium text-gray-600">Students</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
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
            clusters.map((cluster, index) => (
              <div key={cluster._id} className={`group overflow-hidden transition-all duration-500 transform bg-white border border-gray-200 shadow-sm rounded-2xl hover:rounded-3xl hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-300 hover:-translate-y-2 animate-fade-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`h-32 relative p-5 flex flex-col justify-between ${cluster.coverColor} bg-gradient-to-br from-current to-opacity-90 transition-all duration-300 group-hover:from-current group-hover:to-black/20`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20 transition-all duration-300 group-hover:bg-opacity-30 group-hover:scale-110">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-300 group-hover:bg-black/40">
                      {cluster.classCode}
                    </div>
                  </div>
                  <div className="text-white">
                    <h3 className="text-lg font-bold transition-transform duration-300 group-hover:scale-105">{cluster.name}</h3>
                    {cluster.section && <p className="text-sm opacity-90 transition-opacity duration-300 group-hover:opacity-100">{cluster.section}</p>}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <h4 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Courses ({cluster.courses?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {cluster.courses?.slice(0, 3).map((course, courseIndex) => (
                        <div key={course._id} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 backdrop-blur-sm border border-gray-100/50 transition-all duration-300 hover:bg-white hover:shadow-sm hover:scale-102 animate-fade-in-up`} style={{ animationDelay: `${(index * 0.1) + (courseIndex * 0.05)}s` }}>
                          <div className={`w-3 h-3 rounded-full ${course.coverColor || '#60a5fa'} transition-transform duration-300 hover:scale-125`}></div>
                          <span className="text-sm font-medium text-gray-700">{course.subject}</span>
                          {course.section && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{course.section}</span>}
                        </div>
                      ))}
                      {cluster.courses?.length > 3 && (
                        <div className="text-center py-2">
                          <span className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full transition-all duration-300 hover:bg-gray-200 hover:scale-105">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M5 12h.01M5 12h.01M12 12h.01M12 12h.01M12 12h.01M19 12h.01M19 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            +{cluster.courses.length - 3} more courses
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {/* <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> */}
                      <span className="font-medium">{cluster.enrolledUsers?.length || 0} members</span>
                    </div>
                    <Link href={`/clusters/${cluster._id}`} className="group/btn inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-all duration-300 hover:scale-105">
                      <span>View Details</span>
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )
        )}
        </div>

      {/* Course Preview Modal */}
      <CoursePreviewModal
        course={selectedCourseForPreview}
        isOpen={previewModalOpen}
        onClose={handleClosePreview}
        onViewCourse={handleViewCourse}
      />

      {/* Drag Feedback */}
      {draggedCourse && (
        <div className="drag-feedback">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Drag to reorder courses</span>
          </div>
        </div>
      )}



      {/* Real-time Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.type}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{notification.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.type !== notification.type))}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Drag Feedback */}
      {dragFeedback && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          {dragFeedback}
        </div>
      )}



      {/* Adaptive Sync Indicator - Hidden to reduce clutter */}
      {/* <AdaptiveSyncIndicator
        variant="floating"
        position="bottom-left"
      /> */}
          </AdaptiveLayout>
        </div>
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