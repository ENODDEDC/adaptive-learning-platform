'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import CoursePreviewModal from '@/components/CoursePreviewModal';
import Tooltip from '@/components/Tooltip';
import AdaptiveLayout from '@/components/AdaptiveLayout';
import CourseFilterSort from '@/components/CourseFilterSort';
import ProfessionalCourseCard from '@/components/ProfessionalCourseCard';
import HorizontalNav from '@/components/HorizontalNav';
import preferenceLearningService from '@/services/preferenceLearningService';
import cacheService from '@/services/cacheService';
import predictiveLoadingService from '@/services/predictiveLoadingService';
import { useLayout } from '../../context/LayoutContext';
import { useAdaptiveLayout } from '../../context/AdaptiveLayoutContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [coursePageIndex, setCoursePageIndex] = useState(0);
  const coursesPerPage = 3;

  const handleNextPage = () => {
    if ((coursePageIndex + 1) * coursesPerPage < filteredCourses.length) {
      setCoursePageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (coursePageIndex > 0) {
      setCoursePageIndex(prev => prev - 1);
    }
  };

  // Reset page index when filtered courses change
  useEffect(() => {
    setCoursePageIndex(0);
  }, [filteredCourses.length]);

  // Notification system
  useEffect(() => {
    const checkForAdaptations = () => {
      const recentInteractions = behaviorHistory.slice(-10);

      // Check for course priority adaptation
      if (recentInteractions.filter(i => i.type === 'course_click').length >= 5) {
        if (!notifications.find(n => n.type === 'course_priority')) {
          addNotification({
            type: 'course_priority',
            title: 'Layout Optimized! ðŸŽ¯',
            message: 'Course cards resized based on your usage patterns',
            icon: 'ðŸŽ¯',
            duration: 4000
          });
        }
      }

      // Check for search optimization
      if (recentInteractions.filter(i => i.type === 'search').length >= 3) {
        if (!notifications.find(n => n.type === 'search_optimization')) {
          addNotification({
            type: 'search_optimization',
            title: 'Search Optimized! ðŸ”',
            message: 'Consider compact layout for better search experience',
            icon: 'ðŸ”',
            duration: 4000
          });
        }
      }

      // Check for drag and drop patterns
      if (recentInteractions.filter(i => i.type === 'drag_drop').length >= 2) {
        if (!notifications.find(n => n.type === 'drag_optimization')) {
          addNotification({
            type: 'drag_optimization',
            title: 'Organization Detected! ðŸ“‚',
            message: 'System remembers your course organization preferences',
            icon: 'ðŸ“‚',
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
        instructorProfilePicture: course.instructorProfilePicture || null,
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

  // Show error state
  if (error) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">
        Error: {error}
      </div>
    );
  }

  // Default fallback - no slug provided, show all courses
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Horizontal Navigation */}
      <HorizontalNav />
      
      <div className="relative z-10 flex flex-col h-full">
      {/* Compact Header with Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setActiveTab('courses');
                  trackInteraction('navigation', { path: 'courses_tab' });
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'courses'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Courses
              </button>
              <button
                onClick={() => {
                  setActiveTab('clusters');
                  trackInteraction('navigation', { path: 'clusters_tab' });
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'clusters'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Clusters
              </button>
              <button
                onClick={() => router.push('/archive')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
              className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {isCourseMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => {
                      openCreateCourseModal();
                      setIsCourseMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="font-medium">Create Course</span>
                  </button>
                  <button
                    onClick={() => {
                      openJoinCourseModal();
                      setIsCourseMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="font-medium">Join Course</span>
                  </button>
                  <button
                    onClick={() => {
                      openCreateClusterModal();
                      setIsCourseMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="font-medium">Create Cluster</span>
                  </button>
                  <button
                    onClick={() => {
                      openJoinClusterModal();
                      setIsCourseMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Join Cluster</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative ${courses.length === 0 && activeTab === 'courses' ? 'p-0' : 'px-6 py-2'}`} style={{ overflowY: 'auto', overflowX: 'hidden' }}>


      {/* Smart Recommendations */}
      {(() => {
        const recommendations = [];
        if (userBehavior.interactionPatterns.mostClickedCourses.length > 5 && userBehavior.layoutPreferences.cardSize !== 'large') {
          recommendations.push({
            id: 'card_size',
            title: 'Optimize Card Size',
            message: 'You frequently access courses. Larger cards would improve visibility.',
            action: 'Switch to Large Cards',
            icon: 'ðŸ“'
          });
        }
        if (userBehavior.interactionPatterns.searchFrequency > 3 && !userBehavior.layoutPreferences.compactMode) {
          recommendations.push({
            id: 'compact_mode',
            title: 'Enable Compact Mode',
            message: 'You use search often. Compact mode shows more courses at once.',
            action: 'Try Compact Layout',
            icon: 'ðŸ”'
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
                        {rec.action} â†’
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

      {/* Enhanced Course/Cluster Grid with Pagination */}
      <div className="relative mb-8 mx-4 group">
        <div className="transition-all duration-500 ease-in-out overflow-hidden px-4">
          <AdaptiveLayout componentType="courses" trackInteractions={true} adaptiveMode={true}>
            <div className="flex gap-6 pb-6 pt-2">
          {activeTab === 'courses' ? (
          filteredCourses.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
              <p className="text-gray-500 mb-8 text-center max-w-md">Start your learning journey by creating your first course or joining an existing one.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => openCreateCourseModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Course
                </button>
                <button
                  onClick={() => openJoinCourseModal()}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Course
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full px-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={coursePageIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`grid gap-6 w-full ${
                    filteredCourses.length === 2 
                      ? 'grid-cols-2' 
                      : 'grid-cols-3'
                  }`}
                >
                  {filteredCourses.slice(coursePageIndex * coursesPerPage, (coursePageIndex + 1) * coursesPerPage).map((course, index) => {
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
                      className="group"
                      draggable
                      onDragStart={(e) => handleDragStart(e, course, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                  <div className={`relative flex flex-col h-full bg-white border-2 border-gray-300 cursor-pointer rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden shadow-lg ${
                    dragOverIndex === index ? 'border-blue-500 ring-4 ring-blue-50' : 'hover:border-gray-400'
                  }`}>
                    {/* Colored Header - Modern & Clean */}
                    <div className={`relative px-5 py-5 ${colorVariations.base}`}>
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
                    <div className="flex-1 px-5 py-5 flex flex-col bg-white">
                      {/* Instructor - Minimal Design */}
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className="relative flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-300">
                          {course.instructorProfilePicture ? (
                            <>
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
                        <div className="my-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
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
                      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto">
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <svg className="w-4 h-4 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.moduleCount || 0}</div>
                            <div className="text-[10px] font-medium text-gray-600">Materials</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <svg className="w-4 h-4 text-gray-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 leading-none mb-0.5">{course.studentCount || 0}</div>
                            <div className="text-[10px] font-medium text-gray-600">Students</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                  );
                })}

                {/* Placeholder Cards - Show when only 1 or 2 courses */}
                {filteredCourses.length === 1 && (
                  <>
                    <div className="relative flex flex-col h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-lg">
                      <div className="relative px-5 py-5 bg-gradient-to-br from-gray-100 to-gray-200 border-b-2 border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-md">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 px-5 py-5 flex flex-col items-center justify-center text-center bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Create or Join More Courses
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                          Expand your learning by creating new courses or joining existing ones
                        </p>
                        <div className="mt-auto pt-4 border-t border-gray-200 w-full">
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            <span className="font-medium">Build your course library</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex flex-col h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-lg">
                      <div className="relative px-5 py-5 bg-gradient-to-br from-gray-100 to-gray-200 border-b-2 border-gray-300">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-md">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 px-5 py-5 flex flex-col items-center justify-center text-center bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Organize with Clusters
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                          Group related courses together for better organization
                        </p>
                        <div className="mt-auto pt-4 border-t border-gray-200 w-full">
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            <span className="font-medium">Stay organized and focused</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {filteredCourses.length === 2 && (
                  <div className="relative flex flex-col h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-lg">
                    <div className="relative px-5 py-5 bg-gradient-to-br from-gray-100 to-gray-200 border-b-2 border-gray-300">
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-md">
                          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 px-5 py-5 flex flex-col items-center justify-center text-center bg-white">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Add More Courses
                      </h3>
                      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        Continue building your learning path
                      </p>
                      <div className="mt-auto pt-4 border-t border-gray-200 w-full">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                          <span className="font-medium">Keep learning and growing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
              {filteredCourses.length > coursesPerPage && (
                <>
                  <button
                    onClick={handlePrevPage}
                    disabled={coursePageIndex === 0}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full border transition-all ${
                      coursePageIndex === 0
                        ? 'border-gray-100 text-gray-200 cursor-not-allowed opacity-0'
                        : 'border-blue-200 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 shadow-md hover:scale-110 active:scale-95'
                    }`}
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={(coursePageIndex + 1) * coursesPerPage >= filteredCourses.length}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full border transition-all ${
                      (coursePageIndex + 1) * coursesPerPage >= filteredCourses.length
                        ? 'border-gray-100 text-gray-200 cursor-not-allowed opacity-0'
                        : 'border-blue-200 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 shadow-md hover:scale-110 active:scale-95'
                    }`}
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
      )
    ) : (
      /* Clusters Tab Content */
          clusters.length === 0 ? (
            <div className="col-span-full w-full py-20 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clusters Yet</h3>
              <p className="text-gray-500 mb-8 text-center max-w-md">Organize your courses into thematic clusters for better management.</p>
              <button
                onClick={() => openCreateClusterModal()}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Cluster
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {clusters.map((cluster, index) => (
                <div key={cluster._id} className={`group overflow-hidden transition-all duration-500 transform bg-white border border-gray-200 shadow-sm rounded-2xl hover:rounded-3xl hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-300 hover:-translate-y-2 animate-fade-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`h-32 relative p-5 flex flex-col justify-between ${cluster.coverColor} transition-all duration-300`}>
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
              ))}
            </div>
          )
        )}
            </div>

            {/* Page Indicator Dots */}
            {activeTab === 'courses' && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6 mb-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCoursePageIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      coursePageIndex === i ? 'w-10 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </AdaptiveLayout>
        </div>
      </div>
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
