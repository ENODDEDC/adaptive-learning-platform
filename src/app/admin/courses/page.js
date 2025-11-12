'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreateCourseModal from '@/components/CreateCourseModal';
import CourseScoresTab from '@/components/CourseScoresTab';

export default function AdminCourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    section: '',
    teacherName: '',
    coverColor: '',
    uniqueKey: '',
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnnouncements, setCourseAnnouncements] = useState([]);
  const [courseMembers, setCourseMembers] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [modalTab, setModalTab] = useState('feed');
  const [courseContent, setCourseContent] = useState([]);
  const [courseActivities, setCourseActivities] = useState([]);
  const [viewingContent, setViewingContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const router = useRouter();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/courses'); // Cookie will be sent automatically

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setCourses(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCourses();
    const fetchAdminName = async () => {
      try {
        const res = await fetch('/api/admin/profile'); // Cookie will be sent automatically
        if (res.ok) {
          const data = await res.json();
          setAdminName(data.name);
        }
      } catch (error) {
        console.error('Failed to fetch admin name:', error);
      }
    };
    fetchAdminName();
  }, [fetchCourses]);

  const handleEditClick = (course) => {
    setEditingCourse(course._id);
    setEditFormData({
      subject: course.subject,
      section: course.section,
      teacherName: course.teacherName,
      coverColor: course.coverColor,
      uniqueKey: course.uniqueKey,
    });
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (courseId) => {
    setActionLoading(prev => ({ ...prev, [`edit-${courseId}`]: true }));
    setError('');
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: courseId, ...editFormData }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      setEditingCourse(null);
      fetchCourses(); // Refresh the course list
      showNotification('Course updated successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to update course', 'error');
      console.error('Failed to update course:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit-${courseId}`]: false }));
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [`delete-${courseId}`]: true }));
    setError('');
    try {
      const res = await fetch(`/api/admin/courses?id=${courseId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      fetchCourses(); // Refresh the course list
      showNotification('Course deleted successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to delete course', 'error');
      console.error('Failed to delete course:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${courseId}`]: false }));
    }
  };

  const handleViewClick = async (courseId) => {
    setActionLoading(prev => ({ ...prev, [`view-${courseId}`]: true }));
    setError('');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setSelectedCourse(data);
      setModalTab('feed');
      setShowViewModal(true);
      // Fetch initial data for feed tab
      fetchCourseAnnouncements(courseId);
      fetchCourseContent(courseId);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course details:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`view-${courseId}`]: false }));
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCourse(null);
    setModalTab('feed');
    setCourseContent([]);
    setCourseActivities([]);
    setCourseAnnouncements([]);
  };

  const handleModalTabChange = (tab, courseId) => {
    setModalTab(tab);
    if (tab === 'feed' && courseId) {
      fetchCourseAnnouncements(courseId);
      fetchCourseContent(courseId);
    } else if (tab === 'activities' && courseId) {
      fetchCourseActivities(courseId);
    } else if (tab === 'members' && courseId) {
      fetchCourseMembers(courseId);
    }
  };

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 4000);
  };

  const handleCreateCourse = async (courseData) => {
    setError('');
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      setIsCreateCourseModalOpen(false);
      fetchCourses(); // Refresh the course list
    } catch (err) {
      setError(err.message);
      console.error('Failed to create course:', err);
    }
  };

  const fetchCourseAnnouncements = async (courseId) => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/admin/announcements?courseId=${courseId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setCourseAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to fetch course announcements:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchCourseMembers = async (courseId) => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/admin/course-members?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourseMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch course members:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchCourseContent = async (courseId) => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/content`);
      if (res.ok) {
        const data = await res.json();
        setCourseContent(data.content || []);
      }
    } catch (err) {
      console.error('Failed to fetch course content:', err);
      setCourseContent([]);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchCourseActivities = async (courseId) => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/classwork`);
      if (res.ok) {
        const data = await res.json();
        setCourseActivities(data.classwork || []);
      }
    } catch (err) {
      console.error('Failed to fetch course activities:', err);
      setCourseActivities([]);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab, courseId) => {
    setActiveTab(tab);
    if (tab === 'announcements' && courseId) {
      fetchCourseAnnouncements(courseId);
    } else if (tab === 'members' && courseId) {
      fetchCourseMembers(courseId);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`delete-${announcementId}`]: true }));
    setError('');

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcementId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      showNotification('Announcement deleted successfully!', 'success');
      // Refresh announcements for current course
      if (selectedCourse) {
        fetchCourseAnnouncements(selectedCourse);
      }
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to delete announcement', 'error');
      console.error('Failed to delete announcement:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${announcementId}`]: false }));
    }
  };

  const handleMemberAction = async (userId, action, newRole = null) => {
    if (!selectedCourse) return;

    setActionLoading(prev => ({ ...prev, [`${action}-${userId}`]: true }));
    setError('');

    try {
      const res = await fetch('/api/admin/course-members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          userId,
          action,
          newRole
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      showNotification('Action completed successfully!', 'success');
      // Refresh course members
      fetchCourseMembers(selectedCourse);
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to complete action', 'error');
      console.error('Failed to update member:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${action}-${userId}`]: false }));
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`delete-content-${contentId}`]: true }));
    setError('');

    console.log('🗑️ CLIENT: Starting delete operation...');
    console.log('🗑️ CLIENT: Course ID:', selectedCourse._id);
    console.log('🗑️ CLIENT: Content ID:', contentId);

    try {
      // Use query parameter instead of request body
      const url = `/api/courses/${selectedCourse._id}/content?contentId=${contentId}`;
      console.log('🗑️ CLIENT: Delete URL:', url);
      
      console.log('🗑️ CLIENT: Sending DELETE request...');
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      console.log('🗑️ CLIENT: Response status:', res.status);
      console.log('🗑️ CLIENT: Response status text:', res.statusText);

      // Try to get response body for better error messages
      let responseData;
      try {
        responseData = await res.json();
        console.log('🗑️ CLIENT: Response data:', responseData);
      } catch (jsonError) {
        console.error('❌ CLIENT: Failed to parse response JSON:', jsonError);
      }

      if (!res.ok) {
        if (res.status === 401) {
          console.error('❌ CLIENT: Unauthorized - redirecting to login');
          router.push('/admin/login');
          return;
        }
        
        const errorMessage = responseData?.error || responseData?.details || `${res.status} ${res.statusText}`;
        console.error('❌ CLIENT: Request failed:', errorMessage);
        throw new Error(`Error: ${errorMessage}`);
      }

      console.log('✅ CLIENT: Delete successful!');
      showNotification('Content deleted successfully!', 'success');
      // Refresh course content
      fetchCourseContent(selectedCourse._id);
      setShowContentModal(false);
      setViewingContent(null);
    } catch (err) {
      console.error('❌ CLIENT: Delete operation failed:', err);
      console.error('❌ CLIENT: Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message);
      showNotification(err.message || 'Failed to delete content', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-content-${contentId}`]: false }));
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Are you sure you want to delete this activity? This will also delete all student submissions.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`delete-activity-${activityId}`]: true }));
    setError('');

    try {
      // Use query parameter instead of request body
      const res = await fetch(`/api/courses/${selectedCourse._id}/classwork?classworkId=${activityId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      showNotification('Activity deleted successfully!', 'success');
      // Refresh course activities
      fetchCourseActivities(selectedCourse._id);
      setShowContentModal(false);
      setViewingContent(null);
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to delete activity', 'error');
      console.error('Failed to delete activity:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-activity-${activityId}`]: false }));
    }
  };

  const filteredCourses = courses.filter(course => {
    const subject = course.subject || '';
    const section = course.section || '';
    const createdBy = course.createdBy?.name || '';
    const teacherName = course.teacherName || '';

    const matchesSearch =
      subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && !course.isArchived) ||
      (filterStatus === 'inactive' && course.isArchived) ||
      (filterStatus === 'archived' && course.isArchived);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return (a.subject || '').localeCompare(b.subject || '');
      case 'enrollment':
        return (b.enrolledUsersCount || 0) - (a.enrolledUsersCount || 0);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="mt-4 lg:mt-0">
            <div className="w-48 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="w-full h-12 max-w-md bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Course Cards Skeleton */}
        <div className="masonry-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="masonry-item">
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                {/* Card Header Skeleton */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="ml-4 space-y-2">
                      <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>

                {/* Card Content Skeleton */}
                <div className="mb-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Skeleton */}
                <div className="flex items-center justify-end pt-4 space-x-2 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="border-b border-gray-100">
          <nav className="flex px-6 space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Courses ({filteredCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Course Feed
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Member Management
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'courses' && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg hover:-translate-y-1 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 animate-pulse-gentle">{courses.length}</p>
              </div>
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 animate-icon-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg hover:-translate-y-1 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-green-500/5 to-green-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 animate-pulse-gentle">
                  {courses.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 animate-icon-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg hover:-translate-y-1 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 animate-pulse-gentle">
                  {courses.reduce((acc, course) => acc + (course.enrolledUsersCount || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 animate-icon-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg hover:-translate-y-1 group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Enrollment</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 animate-pulse-gentle">
                  {courses.length > 0 ? Math.round(courses.reduce((acc, course) => acc + (course.enrolledUsersCount || 0), 0) / courses.length) : 0}
                </p>
              </div>
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 animate-icon-bounce">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search courses by name, instructor, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 text-sm sm:text-base leading-5 placeholder-gray-400 transition-all duration-200 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">By Name</option>
                  <option value="enrollment">By Enrollment</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg transition-all duration-200 ${
                  showFilters
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Export Button */}
              <button className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 transition-colors duration-200 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="pt-4 mt-4 border-t border-gray-100 animate-fade-in-down">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Enrollment Range</label>
                  <select className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>All Ranges</option>
                    <option>0-10 students</option>
                    <option>11-50 students</option>
                    <option>51+ students</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date Created</label>
                  <select className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>All Time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Instructor</label>
                  <input
                    type="text"
                    placeholder="Filter by instructor..."
                    className="w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters & Results Count */}
          <div className="flex flex-col mt-4 space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Showing {filteredCourses.length} of {courses.length} courses</span>
              {(searchTerm || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="font-medium text-purple-600 hover:text-purple-800"
                >
                  Clear all
                </button>
              )}
            </div>
            {filteredCourses.length > 0 && (
              <div className="text-sm text-gray-500">
                Sorted by: {sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : sortBy === 'name' ? 'Name' : 'Enrollment'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="masonry-grid">
        {filteredCourses.map((course, index) => (
          <div key={course._id} className="masonry-item">
            {editingCourse === course._id ? (
              /* Edit Mode Card */
              <div className="relative transition-all duration-300 bg-white border border-gray-200 shadow-sm group rounded-xl hover:shadow-lg animate-admin-card-entrance hover:scale-[1.02]">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-12 h-12">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg ${
                        editFormData.coverColor || 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {editFormData.subject?.charAt(0) || 'C'}
                      </div>
                    </div>
                    <div className="flex-1 ml-4">
                      <input
                        type="text"
                        name="subject"
                        value={editFormData.subject}
                        onChange={handleEditFormChange}
                        className="block w-full text-lg font-semibold transition-all duration-200 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Course name"
                      />
                      <textarea
                        name="section"
                        value={editFormData.section}
                        onChange={handleEditFormChange}
                        className="block w-full mt-2 text-sm transition-all duration-200 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Course description"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      name="teacherName"
                      value={editFormData.teacherName}
                      onChange={handleEditFormChange}
                      className="block w-full text-sm transition-all duration-200 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Instructor name"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">{course.enrolledUsersCount || 0}</span>
                        <span className="text-sm text-gray-500">students</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className={`w-5 h-5 ${course.isArchived ? 'text-amber-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">{course.isArchived ? 'Archived' : 'Active'}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 space-x-2 border-t border-gray-100">
                    <button
                      onClick={() => handleSaveEdit(course._id)}
                      disabled={actionLoading[`edit-${course._id}`]}
                      className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[`edit-${course._id}`] && (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      <span>{actionLoading[`edit-${course._id}`] ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => setEditingCourse(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode Card */
              <div className="relative transition-all duration-300 bg-white border border-gray-200 shadow-sm group rounded-xl hover:shadow-xl animate-admin-card-entrance hover:-translate-y-1 hover:scale-[1.02]">
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 group-hover:opacity-100 rounded-xl"></div>
                <div className="relative p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg bg-gradient-to-br transition-all duration-300 group-hover:scale-110 ${
                          course.coverColor || 'from-blue-500 to-blue-600'
                        }`}>
                          {course.subject?.charAt(0) || 'C'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate transition-colors duration-200 group-hover:text-purple-700">
                          {course.subject}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {course.section || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        course.isArchived
                          ? 'text-amber-800 bg-amber-100'
                          : 'text-green-800 bg-green-100'
                      }`}>
                        {course.isArchived ? 'Archived' : 'Active'}
                      </span>
                      {course.enrolledUsersCount > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Live</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mb-4 space-y-3">
                    {/* Instructor Info */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center min-w-0 space-x-2">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 truncate">
                            {course.teacherName || course.createdBy?.name || 'No instructor'}
                          </span>
                          <span className="text-xs text-gray-500">Instructor</span>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment & Date Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center p-2 space-x-2 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-100 rounded-lg">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-blue-900">{course.enrolledUsersCount || 0}</span>
                          <span className="block text-xs text-blue-700">Students</span>
                        </div>
                      </div>

                      <div className="flex items-center p-2 space-x-2 rounded-lg bg-green-50">
                        <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-green-100 rounded-lg">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m0 0v6m0-6h-6" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-green-900">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                          <span className="block text-xs text-green-700">Created</span>
                        </div>
                      </div>
                    </div>

                    {/* Unique Key Display */}
                    {course.uniqueKey && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-purple-100 rounded-lg">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-mono text-xs font-medium text-purple-900">{course.uniqueKey}</span>
                            <span className="block text-xs text-purple-700">Course Key</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(course.uniqueKey)}
                          className="p-1 text-purple-600 transition-colors duration-200 hover:text-purple-800"
                          title="Copy course key"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end pt-4 space-x-2 border-t border-gray-100">
                    <button
                      onClick={() => handleViewClick(course._id)}
                      disabled={actionLoading[`view-${course._id}`]}
                      className="flex items-center justify-center p-2 text-green-600 transition-all duration-200 rounded-lg hover:text-white hover:bg-green-600 animate-icon-bounce disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View course details"
                    >
                      {actionLoading[`view-${course._id}`] ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditClick(course)}
                      className="p-2 text-blue-600 transition-all duration-200 rounded-lg hover:text-white hover:bg-blue-600 animate-icon-bounce"
                      title="Edit course"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      disabled={actionLoading[`delete-${course._id}`]}
                      className="flex items-center justify-center p-2 text-red-600 transition-all duration-200 rounded-lg hover:text-white hover:bg-red-600 animate-icon-bounce disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete course"
                    >
                      {actionLoading[`delete-${course._id}`] ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCourses.length === 0 && (
          <div className="py-16 text-center col-span-full">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No courses found</h3>
              <p className="mb-6 text-gray-500">Try adjusting your search criteria or create a new course to get started.</p>
              <button
                onClick={() => setIsCreateCourseModalOpen(true)}
                className="inline-flex items-center px-6 py-3 space-x-2 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Course</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={handleCreateCourse}
        adminName={adminName}
      />

      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 sm:p-4 animate-admin-modal-backdrop-fade">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl animate-modal-appear">
            {/* Modal Header */}
            <div className="relative px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-white shadow-lg rounded-2xl">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br ${
                      selectedCourse.coverColor || 'from-blue-500 to-blue-600'
                    }`}>
                      {selectedCourse.subject?.charAt(0) || 'C'}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCourse.subject}</h2>
                    <p className="text-purple-100">Course Management</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseViewModal}
                  className="p-2 text-white transition-all duration-200 hover:bg-white hover:bg-opacity-20 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="bg-white border-b border-gray-200">
              <nav className="flex px-8 -mb-px space-x-8">
                <button
                  onClick={() => handleModalTabChange('feed', selectedCourse._id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    modalTab === 'feed'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span>Feed</span>
                </button>
                <button
                  onClick={() => handleModalTabChange('activities', selectedCourse._id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    modalTab === 'activities'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Activities</span>
                </button>
                <button
                  onClick={() => handleModalTabChange('members', selectedCourse._id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    modalTab === 'members'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Members</span>
                </button>
                <button
                  onClick={() => handleModalTabChange('scores', selectedCourse._id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    modalTab === 'scores'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Scores</span>
                </button>
              </nav>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6">
              {/* Feed Tab */}
              {modalTab === 'feed' && (
                <div className="space-y-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Course Feed & Announcements</h3>
                  
                  {tabLoading ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl">
                      <svg className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {/* Announcements Section */}
                      {courseAnnouncements.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 text-md">Announcements</h4>
                          {courseAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-md">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2 space-x-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                                      <span className="text-sm font-semibold text-purple-600">
                                        {announcement.postedBy?.charAt(0) || 'A'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{announcement.postedBy}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    {announcement.pinned && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                                        Pinned
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-700">{announcement.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content Section */}
                      {courseContent.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 text-md">Course Materials</h4>
                          {courseContent.map((content) => (
                            <div key={content._id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-md">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1 space-x-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{content.title}</h5>
                                    {content.description && (
                                      <p className="mt-1 text-sm text-gray-600">{content.description}</p>
                                    )}
                                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                      <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center ml-4 space-x-2">
                                  {content.fileUrl && (
                                    <button
                                      onClick={() => {
                                        setViewingContent({ ...content, type: 'content' });
                                        setShowContentModal(true);
                                      }}
                                      className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                      title="View"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteContent(content.id || content._id)}
                                    disabled={actionLoading[`delete-content-${content.id || content._id}`]}
                                    className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                                    title="Delete"
                                  >
                                    {actionLoading[`delete-content-${content.id || content._id}`] ? (
                                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Empty State */}
                      {courseAnnouncements.length === 0 && courseContent.length === 0 && (
                        <div className="p-8 text-center bg-gray-50 rounded-xl">
                          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <p className="text-gray-600">No announcements or materials posted yet</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {modalTab === 'activities' && (
                <div className="space-y-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Course Activities & Assignments</h3>
                  
                  {tabLoading ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl">
                      <svg className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : courseActivities.length > 0 ? (
                    <div className="space-y-4">
                      {courseActivities.map((activity) => (
                        <div key={activity._id} className="p-5 transition-shadow bg-white border border-gray-200 rounded-xl hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start flex-1 space-x-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                                activity.type === 'assignment' ? 'bg-orange-100' : 
                                activity.type === 'quiz' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                {activity.type === 'assignment' ? (
                                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : activity.type === 'quiz' ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-semibold text-gray-900">{activity.title}</h5>
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                    activity.type === 'assignment' ? 'bg-orange-100 text-orange-800' :
                                    activity.type === 'quiz' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {activity.type}
                                  </span>
                                </div>
                                {activity.description && (
                                  <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                                )}
                                <div className="flex items-center mt-3 space-x-4 text-xs text-gray-500">
                                  {activity.dueDate && (
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Due: {new Date(activity.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {activity.points && (
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                      {activity.points} points
                                    </span>
                                  )}
                                  <span>Created: {new Date(activity.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center ml-4 space-x-2">
                              <button
                                onClick={() => {
                                  setViewingContent({ ...activity, type: 'activity' });
                                  setShowContentModal(true);
                                }}
                                className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity._id)}
                                disabled={actionLoading[`delete-activity-${activity._id}`]}
                                className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                                title="Delete"
                              >
                                {actionLoading[`delete-activity-${activity._id}`] ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p className="text-gray-600">No activities or assignments created yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {modalTab === 'members' && (
                <div>
                  <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Enrolled Members ({selectedCourse.enrolledUsers ? selectedCourse.enrolledUsers.length : 0})
                  </h3>

                  {selectedCourse.enrolledUsers && selectedCourse.enrolledUsers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {selectedCourse.enrolledUsers.map(user => (
                        <div key={user._id} className="flex items-center p-4 space-x-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-center w-12 h-12 font-semibold text-white rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-gray-50 rounded-xl">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h4 className="mb-2 text-lg font-medium text-gray-900">No Students Enrolled</h4>
                      <p className="text-gray-500">Students will appear here once they join this course.</p>
                    </div>
                  )}

                  {/* Course Info Summary */}
                  <div className="mt-8">
                    <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Course Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">Course Name</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedCourse.subject}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">Instructor</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedCourse.teacherName || selectedCourse.createdBy?.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">Unique Key</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">{selectedCourse.uniqueKey}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">Created Date</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scores Tab */}
              {modalTab === 'scores' && (
                <div>
                  <CourseScoresTab 
                    courseId={selectedCourse._id}
                    isInstructor={true}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-8 py-4 space-x-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseViewModal}
                className="px-6 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content/Activity Viewing Modal */}
      {showContentModal && viewingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-admin-modal-backdrop-fade">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl animate-modal-appear">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {viewingContent.type === 'content' ? 'Course Material' : 'Activity Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setViewingContent(null);
                  }}
                  className="p-2 text-white transition-all duration-200 hover:bg-white hover:bg-opacity-20 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Title and Type */}
              <div className="mb-6">
                <div className="flex items-center mb-2 space-x-3">
                  <h4 className="text-2xl font-bold text-gray-900">{viewingContent.title}</h4>
                  {viewingContent.type === 'activity' && (
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                      viewingContent.type === 'assignment' ? 'bg-orange-100 text-orange-800' :
                      viewingContent.type === 'quiz' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {viewingContent.type}
                    </span>
                  )}
                </div>
                {viewingContent.description && (
                  <p className="text-gray-600">{viewingContent.description}</p>
                )}
              </div>

              {/* Activity Details */}
              {viewingContent.type === 'activity' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {viewingContent.dueDate && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-600">Due Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(viewingContent.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {viewingContent.points && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-600">Points</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingContent.points}</p>
                    </div>
                  )}
                </div>
              )}

              {/* File/Link Section */}
              {viewingContent.fileUrl && (
                <div className="mb-6">
                  <h5 className="mb-3 text-lg font-semibold text-gray-900">Attached File</h5>
                  <div className="p-4 border-2 border-gray-300 border-dashed rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">View File</p>
                          <p className="text-sm text-gray-500">Click to open in new tab</p>
                        </div>
                      </div>
                      <a
                        href={viewingContent.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Open File
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingContent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {viewingContent.updatedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingContent.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  if (viewingContent.type === 'content') {
                    handleDeleteContent(viewingContent.id || viewingContent._id);
                  } else {
                    handleDeleteActivity(viewingContent.id || viewingContent._id);
                  }
                }}
                disabled={actionLoading[`delete-${viewingContent.type}-${viewingContent.id || viewingContent._id}`]}
                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading[`delete-${viewingContent.type}-${viewingContent.id || viewingContent._id}`] ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => {
                  setShowContentModal(false);
                  setViewingContent(null);
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed z-50 space-y-2 top-4 right-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm w-full p-4 rounded-lg shadow-lg transition-all duration-300 animate-fade-in-down ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="inline-flex text-gray-400 rounded-md hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}