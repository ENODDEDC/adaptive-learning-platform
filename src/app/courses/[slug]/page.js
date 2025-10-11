'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';
import ContentViewer from '@/components/ContentViewer.client';
import InviteModal from '@/components/InviteModal';
import SidePanelDocumentViewer from '@/components/SidePanelDocumentViewer';

const CourseDetailPage = ({
  params,
  upcomingTasksExpanded: propUpcomingTasksExpanded,
  setUpcomingTasksExpanded: propSetUpcomingTasksExpanded,
  sidebarCollapsed: propSidebarCollapsed,
  setSidebarCollapsed: propSetSidebarCollapsed
}) => {
  console.log('🔍 DEBUG: CourseDetailPage component is loading...');
  console.log('🔍 DEBUG: Current timestamp:', new Date().toISOString());
  console.log('🔍 DEBUG: Is server-side rendering:', typeof window === 'undefined');
  console.log('🔍 DEBUG: Window object available:', typeof window !== 'undefined');
  console.log('🔍 DEBUG: Navigator available:', typeof navigator !== 'undefined');
  console.log('🔍 DEBUG: localStorage available:', typeof localStorage !== 'undefined');

  const { slug } = React.use(params); // slug is now courseId
  console.log('🔍 DEBUG: Extracted slug from params:', slug);

  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState('');

  const setError = (message) => {
    console.log('🔍 DEBUG: setError called with:', message);
    setErrorState(message);
  };
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [streamItems, setStreamItems] = useState([]);
  const [itemComments, setItemComments] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [timelineView, setTimelineView] = useState(false);

  // Use local state for course page sidebar (independent of main layout sidebar)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const upcomingTasksExpanded = propUpcomingTasksExpanded !== undefined ? propUpcomingTasksExpanded : true;
  const setUpcomingTasksExpanded = propSetUpcomingTasksExpanded || (() => { });

  // Document preview panel state
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [sidePanelDocument, setSidePanelDocument] = useState(null);

  // Auto-collapse course sidebar when document panel opens
  useEffect(() => {
    if (documentPanelOpen) {
      setSidebarCollapsed(true);
    }
  }, [documentPanelOpen]);

  // Auto-collapse main platform sidebar when document panel opens
  useEffect(() => {
    if (documentPanelOpen) {
      // Dispatch event to collapse main platform sidebar
      if (typeof window !== 'undefined') {
        console.log('🔍 SIDEBAR: Dispatching collapseMainSidebar event');
        window.dispatchEvent(new CustomEvent('collapseMainSidebar'));
        console.log('🔍 SIDEBAR: Event dispatched successfully');
      }
    }
  }, [documentPanelOpen]);

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState(''); // 'student' or 'coTeacher'

  const fetchCourseDetails = useCallback(async () => {
    console.log('🔍 DEBUG: fetchCourseDetails function called');
    console.log('🔍 DEBUG: Fetching course details for slug:', slug);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${slug}`); // No need for manual token header, cookie is sent automatically
      console.log('🔍 DEBUG: fetchCourseDetails API response status:', res.status);

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('🔍 DEBUG: fetchCourseDetails received data:', data);
      console.log('🔍 DEBUG: Course details:', data.course);
      console.log('🔍 DEBUG: Course createdBy field:', data.course.createdBy);
      console.log('🔍 DEBUG: Course createdBy type:', typeof data.course.createdBy);
      setCourseDetails(data.course);
      console.log('🔍 DEBUG: fetchCourseDetails completed successfully');
    } catch (err) {
      console.error('🔍 DEBUG: Failed to fetch course details:', err);
      setError(err.message);
    } finally {
      console.log('🔍 DEBUG: fetchCourseDetails finally block - setting loading to false');
      setLoading(false);
    }
  }, [slug]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log('🔍 DEBUG: Fetching current user profile...');
      const res = await fetch('/api/auth/profile');
      console.log('🔍 DEBUG: User profile API response status:', res.status);

      if (res.ok) {
        const userData = await res.json();
        console.log('🔍 DEBUG: User profile data received:', userData);
        console.log('🔍 DEBUG: User ID:', userData._id || userData.id);
        console.log('🔍 DEBUG: User name:', userData.name || userData.fullname);
        setUser(userData);
      } else {
        console.error('🔍 DEBUG: Failed to fetch user profile, status:', res.status);
      }
    } catch (err) {
      console.error('🔍 DEBUG: Error fetching user profile:', err);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 DEBUG: useEffect for fetchCourseDetails triggered');
    fetchCourseDetails();
    fetchCurrentUser();
  }, [fetchCourseDetails, fetchCurrentUser]);

  // Hydration tracking
  useEffect(() => {
    console.log('🔍 HYDRATION: Component mounted on client');
    console.log('🔍 HYDRATION: Client timestamp:', new Date().toISOString());
    console.log('🔍 HYDRATION: Window available:', typeof window !== 'undefined');
    console.log('🔍 HYDRATION: Navigator available:', typeof navigator !== 'undefined');
    console.log('🔍 HYDRATION: localStorage available:', typeof localStorage !== 'undefined');

    // Test navigator.clipboard access
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      console.log('🔍 HYDRATION: Clipboard API available');
    } else {
      console.log('🔍 HYDRATION: Clipboard API NOT available');
    }
  }, []);

  const fetchStreamItems = useCallback(async () => {
    console.log('🔍 DEBUG: fetchStreamItems called');
    if (!courseDetails) {
      console.log('🔍 DEBUG: No courseDetails, returning early');
      return;
    }

    try {
      console.log('🔍 DEBUG: Fetching announcements and classwork for course:', courseDetails._id);
      const [announcementsRes, classworkRes] = await Promise.all([
        fetch(`/api/courses/${courseDetails._id}/announcements`), // No need for manual token header
        fetch(`/api/courses/${courseDetails._id}/classwork`), // No need for manual token header
      ]);

      console.log('🔍 DEBUG: Announcements response status:', announcementsRes.status);
      console.log('🔍 DEBUG: Classwork response status:', classworkRes.status);

      if (!announcementsRes.ok) {
        throw new Error(`Error fetching announcements: ${announcementsRes.status} ${announcementsRes.statusText}`);
      }
      if (!classworkRes.ok) {
        throw new Error(`Error fetching classwork: ${classworkRes.status} ${classworkRes.statusText}`);
      }

      const announcementsData = await announcementsRes.json();
      const classworkData = await classworkRes.json();

      console.log('🔍 DEBUG: Announcements data received:', {
        count: announcementsData.announcements?.length || 0,
        announcements: announcementsData.announcements?.map(a => ({
          id: a._id,
          content: a.content?.substring(0, 50) + '...',
          postedBy: a.postedBy?.name || 'Unknown',
          createdAt: a.createdAt
        })) || []
      });
      console.log('🔍 DEBUG: Classwork data received:', {
        count: classworkData.classwork?.length || 0,
        classwork: classworkData.classwork?.map(c => ({
          id: c._id,
          title: c.title,
          type: c.type,
          createdAt: c.createdAt
        })) || []
      });

      const combinedItems = [
        ...announcementsData.announcements.map(item => ({ ...item, type: 'announcement' })),
        ...classworkData.classwork.map(item => ({ ...item, type: item.type || 'assignment' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date, newest first

      console.log('🔍 DEBUG: Combined items count:', combinedItems.length);
      console.log('🔍 DEBUG: Combined items details:', combinedItems.map(item => ({
        id: item._id,
        type: item.type,
        title: item.title || 'No title',
        content: item.content?.substring(0, 30) + '...' || item.description?.substring(0, 30) + '...' || 'No content',
        createdAt: item.createdAt
      })));

      // Don't fetch comments upfront to improve performance - lazy load them when needed
      setStreamItems(combinedItems.map(item => ({ ...item, comments: [] })));
      setItemComments({}); // Clear comments cache
      console.log('🔍 DEBUG: fetchStreamItems completed successfully - streamItems updated');
    } catch (err) {
      console.error('🔍 DEBUG: Failed to fetch stream items:', err);
      setError(err.message);
    }
  }, [courseDetails]);

  useEffect(() => {
    console.log('🔍 DEBUG: useEffect for fetchStreamItems triggered');
    console.log('🔍 DEBUG: courseDetails available:', !!courseDetails);
    if (courseDetails) {
      fetchStreamItems();
    }
  }, [courseDetails, fetchStreamItems]);

  // Determine if current user is the instructor (course creator)
  useEffect(() => {
    if (courseDetails && user) {
      // Handle both cases: createdBy as object with _id or direct ID string
      const courseCreatorId = courseDetails.createdBy._id || courseDetails.createdBy;
      const currentUserId = user._id || user.id;

      const userIsInstructor = courseCreatorId === currentUserId;
      console.log('🔍 DEBUG: User is instructor:', userIsInstructor);
      console.log('🔍 DEBUG: Course created by:', courseCreatorId);
      console.log('🔍 DEBUG: Current user ID:', currentUserId);
      console.log('🔍 DEBUG: Course createdBy type:', typeof courseDetails.createdBy);
      console.log('🔍 DEBUG: Course createdBy value:', courseDetails.createdBy);
      setIsInstructor(userIsInstructor);
    }
  }, [courseDetails, user]);

  const handlePostAnnouncement = useCallback(async () => {
    console.log('🔍 DEBUG: handlePostAnnouncement called');
    console.log('🔍 DEBUG: newAnnouncementContent:', newAnnouncementContent);
    console.log('🔍 DEBUG: newAnnouncementContent type:', typeof newAnnouncementContent);
    console.log('🔍 DEBUG: newAnnouncementContent length:', newAnnouncementContent?.length);
    console.log('🔍 DEBUG: newAnnouncementContent.trim():', newAnnouncementContent?.trim());
    console.log('🔍 DEBUG: newAnnouncementContent.trim() length:', newAnnouncementContent?.trim()?.length);
    console.log('🔍 DEBUG: courseDetails._id:', courseDetails?._id);
    console.log('🔍 DEBUG: courseDetails exists:', !!courseDetails);

    if (!newAnnouncementContent?.trim() || !courseDetails?._id) {
      console.log('🔍 DEBUG: Validation failed - content empty or no course');
      console.log('🔍 DEBUG: !newAnnouncementContent?.trim():', !newAnnouncementContent?.trim());
      console.log('🔍 DEBUG: !courseDetails?._id:', !courseDetails?._id);
      setError('Announcement content cannot be empty.');
      return;
    }

    console.log('🔍 DEBUG: Starting announcement post...');
    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newAnnouncementContent }),
      });

      console.log('🔍 DEBUG: API response status:', res.status);
      console.log('🔍 DEBUG: API response ok:', res.ok);

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('🔍 DEBUG: API response data:', responseData);

      console.log('🔍 DEBUG: Clearing announcement content...');
      setNewAnnouncementContent('');

      console.log('🔍 DEBUG: Refreshing stream items...');
      fetchStreamItems(); // Refresh stream items

      console.log('🔍 DEBUG: Announcement posted successfully!');
    } catch (err) {
      console.error('🔍 DEBUG: Failed to post announcement:', err);
      setError(err.message);
    }
  }, [newAnnouncementContent, courseDetails, fetchStreamItems]);

  const handlePostComment = useCallback(async (itemId, itemType) => {
    console.log('🔍 DEBUG: handlePostComment called');
    console.log('🔍 DEBUG: itemId:', itemId);
    console.log('🔍 DEBUG: itemType:', itemType);
    console.log('🔍 DEBUG: newCommentContent state:', newCommentContent);
    console.log('🔍 DEBUG: newCommentContent[itemId]:', newCommentContent[itemId]);

    const content = newCommentContent[itemId]?.trim();
    console.log('🔍 DEBUG: content after trim:', content);
    console.log('🔍 DEBUG: content length:', content?.length);

    if (!content || !courseDetails?._id) {
      console.log('🔍 DEBUG: Validation failed - content empty or no courseDetails');
      console.log('🔍 DEBUG: !content:', !content);
      console.log('🔍 DEBUG: !courseDetails?._id:', !courseDetails?._id);
      setError('Comment content cannot be empty.');
      return;
    }

    console.log('🔍 DEBUG: Starting API call...');
    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/${itemType}/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      console.log('🔍 DEBUG: API response status:', res.status);
      console.log('🔍 DEBUG: API response ok:', res.ok);

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('🔍 DEBUG: API response data:', responseData);

      console.log('🔍 DEBUG: Clearing comment content...');
      setNewCommentContent(prev => {
        console.log('🔍 DEBUG: setNewCommentContent callback - prev state:', prev);
        const newState = { ...prev, [itemId]: '' };
        console.log('🔍 DEBUG: setNewCommentContent callback - new state:', newState);
        return newState;
      });

      console.log('🔍 DEBUG: Refreshing stream items...');
      fetchStreamItems(); // Refresh stream items to show new comment

      console.log('🔍 DEBUG: Comment posted successfully!');
    } catch (err) {
      console.error('🔍 DEBUG: Failed to post comment:', err);
      setError(err.message);
    }
  }, [newCommentContent, courseDetails, fetchStreamItems]);

  const handleDeleteAnnouncement = useCallback(async (announcementId) => {
    console.log('Starting announcement deletion for ID:', announcementId);
    if (!courseDetails?._id) {
      setError('Course details not available.');
      return;
    }

    try {
      console.log('Sending DELETE request to:', `/api/courses/${courseDetails._id}/announcements`);
      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcementId }),
      });

      console.log('DELETE response status:', res.status, res.statusText);
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('DELETE response data:', responseData);
      console.log('Calling fetchStreamItems after successful deletion');
      fetchStreamItems(); // Refresh stream items to remove deleted announcement
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError(err.message);
    }
  }, [courseDetails, fetchStreamItems]);

  useEffect(() => {
    // Reset expanded activities when tab changes
    setExpandedActivities({});
  }, [activeTab]);

  const fetchAssignments = useCallback(async () => {
    if (!courseDetails) return;

    try {
      console.log('🔍 ASSIGNMENTS: Fetching assignments for course:', courseDetails._id);
      const res = await fetch(`/api/courses/${courseDetails._id}/classwork`);

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const classwork = data.classwork || [];
      console.log('🔍 ASSIGNMENTS: Fetched assignments:', classwork.length, 'items');
      setAssignments(classwork);
    } catch (err) {
      console.error('🔍 ASSIGNMENTS: Failed to fetch assignments:', err);
      setError(err.message);
      setAssignments([]);
    }
  }, [courseDetails]);

  // Ensure assignments are fetched for Ongoing Task sidebar
  useEffect(() => {
    if (courseDetails) {
      fetchAssignments();
      fetchPeople();
    }
  }, [courseDetails, fetchAssignments]);

  const fetchPeople = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/people`); // No need for manual token header

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setTeachers(data.coTeachers ? [courseDetails.createdBy, ...data.coTeachers] : [courseDetails.createdBy]);
      setStudents(data.enrolledUsers || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch people:', err);
    }
  }, [courseDetails]);

  const handleInviteUser = useCallback(async (email, role) => {
    if (!courseDetails?._id) {
      throw new Error('Course details not available');
    }

    const res = await fetch(`/api/courses/${courseDetails._id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to invite user');
    }

    const data = await res.json();

    // Refresh the people list
    fetchPeople();

    return data;
  }, [courseDetails, fetchPeople]);

  const handleRemoveUser = useCallback(async (userId, role) => {
    if (!courseDetails?._id) {
      setError('Course details not available');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove this ${role === 'student' ? 'student' : 'co-teacher'} from the course?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/people`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove user');
      }

      // Refresh the people list
      fetchPeople();
    } catch (err) {
      setError(err.message);
      console.error('Failed to remove user:', err);
    }
  }, [courseDetails, fetchPeople]);

  const handleDeleteClasswork = useCallback(async (classworkId) => {
    if (!window.confirm('Are you sure you want to delete this classwork?')) {
      return;
    }

    try {
      const res = await fetch(`/api/classwork/${classworkId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      console.log('🔍 CLASSWORK: Classwork deleted successfully, refreshing data');
      fetchAssignments(); // Refresh classwork list
      fetchStreamItems(); // Also refresh stream to reflect changes
    } catch (err) {
      console.error('🔍 CLASSWORK: Failed to delete classwork:', err);
      setError(err.message);
    }
  }, [fetchAssignments, fetchStreamItems]);

  // Callback function to refresh both assignments and stream items when new classwork is created
  const handleClassworkCreated = useCallback(async () => {
    console.log('🔍 CLASSWORK: handleClassworkCreated called - refreshing both assignments and stream items');
    await Promise.all([
      fetchAssignments(),
      fetchStreamItems()
    ]);
    console.log('🔍 CLASSWORK: Both assignments and stream items refreshed successfully');
  }, [fetchAssignments, fetchStreamItems]);

  // Toggle activity expansion
  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  if (loading) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Loading course details...</div>;
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  if (!courseDetails) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Course not found.</div>;
  }

  // If a content item is selected for viewing, show fullscreen viewer within the page and hide the rest
  if (selectedContent) {
    return (
      <div className="h-full p-6 bg-gray-50">
        <ContentViewer
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          isModal={false}
        />
      </div>
    );
  }

  return (
    <>
      <div className="h-full p-8 overflow-y-auto bg-gray-50">
        {/* Global event listener to open viewer from child components (e.g., Stream attachments) */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            if(typeof window !== 'undefined'){
              window.__openContentViewerHandler = function(e){
                // Dispatch a custom event that React can intercept via a hidden button click
              };
            }
          })();
        `}} />
        {/* Professional Header */}
        <div className="mb-8 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-wide text-gray-500 uppercase">Course</p>
                    <h1 className="text-3xl font-bold text-gray-900">{courseDetails.subject}</h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">{teachers.length} Teacher{teachers.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">{students.length} Student{students.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>

              <div className="items-center hidden gap-4 ml-6 sm:flex">
                <div className="flex items-center -space-x-2">
                  {teachers.slice(0, 3).map((teacher) => (
                    <div key={teacher._id} className="flex items-center justify-center w-10 h-10 bg-blue-600 border-2 border-white rounded-full shadow-sm">
                      <span className="text-sm font-semibold text-white">{teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}</span>
                    </div>
                  ))}
                  {teachers.length > 3 && (
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-200 border-2 border-white rounded-full shadow-sm">
                      <span className="text-xs font-semibold text-gray-600">+{teachers.length - 3}</span>
                    </div>
                  )}
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  People
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout - Optimized Proportions */}
        <div className="flex flex-1 gap-4">
          {/* Feed Sidebar - Shows when document panel is open */}
          {documentPanelOpen && (
            <div className="w-[45%] bg-white border border-gray-200/60 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Feed</h2>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <StreamTab
                    courseDetails={courseDetails}
                    isInstructor={isInstructor}
                    streamItems={streamItems}
                    newAnnouncementContent={newAnnouncementContent}
                    setNewAnnouncementContent={setNewAnnouncementContent}
                    handlePostAnnouncement={handlePostAnnouncement}
                    handleDeleteAnnouncement={handleDeleteAnnouncement}
                    newCommentContent={newCommentContent}
                    setNewCommentContent={setNewCommentContent}
                    handlePostComment={handlePostComment}
                    documentPanelOpen={documentPanelOpen}
                    setDocumentPanelOpen={setDocumentPanelOpen}
                    setSidePanelDocument={setSidePanelDocument}
                    compactMode={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Left Sidebar - Course Code - Hidden when document panel is open */}
          {!documentPanelOpen && (
            <div className={`bg-white border border-gray-200/60 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md ${sidebarCollapsed ? 'w-16' : 'w-80'
              }`}>
              {!sidebarCollapsed ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-md">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Course Access</h2>
                    </div>
                    <button
                      onClick={() => {
                        setSidebarCollapsed(true);
                        setUpcomingTasksExpanded(true);
                      }}
                      className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-sm hover:scale-105 active:scale-95"
                      title="Collapse sidebar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Course Code Section */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-xl px-6 py-5 mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-700">Class Code</span>
                        </div>
                        <div className="bg-white border border-blue-200 rounded-lg px-4 py-3">
                          <span className="block text-xl font-bold tracking-wider text-gray-800">
                            {courseDetails.uniqueKey}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          console.log('🔍 CLIPBOARD: Attempting to copy code to clipboard');
                          console.log('🔍 CLIPBOARD: Navigator available:', typeof navigator !== 'undefined');
                          console.log('🔍 CLIPBOARD: Clipboard API available:', navigator?.clipboard?.writeText ? 'yes' : 'no');
                          console.log('🔍 CLIPBOARD: Window available:', typeof window !== 'undefined');
                          if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.clipboard) {
                            console.log('🔍 CLIPBOARD: Cannot access clipboard - not on client or API not available');
                            return;
                          }
                          try {
                            const code = courseDetails.uniqueKey;
                            navigator.clipboard.writeText(code);
                            console.log('🔍 CLIPBOARD: Successfully copied to clipboard');
                            // Could add toast notification here
                          } catch (error) {
                            console.log('🔍 CLIPBOARD: Error copying to clipboard:', error);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 border border-blue-600 rounded-lg bg-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Code
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{teachers.length}</div>
                          <div className="text-xs text-gray-600">Teachers</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{students.length}</div>
                          <div className="text-xs text-gray-600">Students</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <button
                    onClick={() => {
                      setSidebarCollapsed(false);
                      setUpcomingTasksExpanded(false);
                    }}
                    className="flex items-center justify-center w-full p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-sm hover:scale-105 active:scale-95"
                    title="Expand sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-blue-700 tracking-wider">
                          {courseDetails.uniqueKey}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Course</div>
                      <div className="text-xs text-gray-500">Access</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Content Area - Enhanced Layout - Hidden when document panel is open */}
          {!documentPanelOpen && (
            <div className="flex-1 space-y-8">
              {/* Hidden button to open content viewer from custom events */}
              <button id="__openContentViewerBtn" type="button" className="hidden" />
              {/* Enhanced Navigation Tabs - Hidden when document panel is open */}
              {!documentPanelOpen && (
                <div className="flex justify-between mb-10 overflow-hidden bg-white border border-gray-200/60 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200">
                  <button
                    className={`flex-1 px-8 py-5 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'stream'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    onClick={() => setActiveTab('stream')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Feed
                    </div>
                    {activeTab === 'stream' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"></div>
                    )}
                  </button>
                  <button
                    className={`flex-1 px-8 py-5 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'classwork'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    onClick={() => setActiveTab('classwork')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Activities
                    </div>
                    {activeTab === 'classwork' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"></div>
                    )}
                  </button>
                  <button
                    className={`flex-1 px-8 py-5 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'people'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    onClick={() => setActiveTab('people')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Members
                    </div>
                    {activeTab === 'people' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"></div>
                    )}
                  </button>
                  <button
                    className={`flex-1 px-8 py-5 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'marks'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    onClick={() => setActiveTab('marks')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Scores
                    </div>
                    {activeTab === 'marks' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"></div>
                    )}
                  </button>
                </div>
              )}

              {/* Conditional Rendering based on activeTab */}
              {(activeTab === 'stream' || documentPanelOpen) && (
                <StreamTab
                  courseDetails={courseDetails}
                  isInstructor={isInstructor}
                  streamItems={streamItems}
                  newAnnouncementContent={newAnnouncementContent}
                  setNewAnnouncementContent={setNewAnnouncementContent}
                  handlePostAnnouncement={handlePostAnnouncement}
                  handleDeleteAnnouncement={handleDeleteAnnouncement}
                  newCommentContent={newCommentContent}
                  setNewCommentContent={setNewCommentContent}
                  handlePostComment={handlePostComment}
                  documentPanelOpen={documentPanelOpen}
                  setDocumentPanelOpen={setDocumentPanelOpen}
                  setSidePanelDocument={setSidePanelDocument}
                  onOpenContent={(content) => {
                    try {
                      console.log('🔍 WINDOW: Dispatching collapseSidebar event');
                      console.log('🔍 WINDOW: Window available:', typeof window !== 'undefined');
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('collapseSidebar'));
                        console.log('🔍 WINDOW: Event dispatched successfully');
                      } else {
                        console.log('🔍 WINDOW: Cannot dispatch event - not on client');
                      }
                    } catch (error) {
                      console.log('🔍 WINDOW: Error dispatching event:', error);
                    }
                    setSelectedContent(content);
                  }}
                />
              )}

              {activeTab === 'classwork' && (
                <ClassworkTab
                  courseDetails={courseDetails}
                  isInstructor={isInstructor}
                  onOpenContent={(content) => {
                    try {
                      console.log('🔍 WINDOW: Dispatching collapseSidebar event for classwork');
                      console.log('🔍 WINDOW: Window available:', typeof window !== 'undefined');
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('collapseSidebar'));
                        console.log('🔍 WINDOW: Event dispatched successfully');
                      } else {
                        console.log('🔍 WINDOW: Cannot dispatch event - not on client');
                      }
                    } catch (error) {
                      console.log('🔍 WINDOW: Error dispatching event:', error);
                    }
                    // Slight delay to let the sidebar collapse animate smoothly
                    setTimeout(() => setSelectedContent(content), 180);
                  }}
                  onClassworkCreated={handleClassworkCreated}
                />
              )}
              {activeTab === 'people' && (
                <div className="p-8 bg-white border border-gray-200/60 shadow-sm sm:p-10 rounded-2xl hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" placeholder="Search people..." className="w-56 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:shadow-sm" />
                      {isInstructor && (
                        <>
                          <button
                            onClick={() => {
                              setInviteRole('student');
                              setInviteModalOpen(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                          >
                            Invite Student
                          </button>
                          <button
                            onClick={() => {
                              setInviteRole('coTeacher');
                              setInviteModalOpen(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2"
                          >
                            Invite Co-teacher
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Teachers</h3>
                        <span className="px-2 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">{teachers.length}</span>
                      </div>
                      <div className="space-y-3">
                        {teachers.length === 0 ? (
                          <p className="text-gray-600">No teachers found.</p>
                        ) : (
                          teachers.map((teacher) => (
                            <div key={teacher._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center min-w-0 gap-4">
                                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full">
                                  <span className="text-sm font-semibold text-white">{teacher.name ? teacher.name.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 truncate">{teacher.name || 'Unknown Teacher'}</p>
                                  <p className="text-xs text-gray-500 truncate">Teacher</p>
                                </div>
                              </div>
                              {isInstructor && teacher._id !== courseDetails.createdBy._id && (
                                <button
                                  onClick={() => handleRemoveUser(teacher._id, 'coTeacher')}
                                  className="p-2 text-red-600 transition-all duration-200 rounded-lg hover:bg-red-100 hover:shadow-sm hover:scale-110 active:scale-95"
                                  aria-label="Remove teacher"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Students</h3>
                        <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">{students.length}</span>
                      </div>
                      <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
                        {students.length === 0 ? (
                          <p className="text-gray-600">No students enrolled.</p>
                        ) : (
                          students.map((student) => (
                            <div key={student._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center min-w-0 gap-4">
                                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full">
                                  <span className="text-sm font-semibold text-white">{student.name ? student.name.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 truncate">{student.name || 'Unknown Student'}</p>
                                  <p className="text-xs text-gray-500 truncate">Student</p>
                                </div>
                              </div>
                              {isInstructor && (
                                <button
                                  onClick={() => handleRemoveUser(student._id, 'student')}
                                  className="p-2 text-red-600 transition-all duration-200 rounded-lg hover:bg-red-100 hover:shadow-sm hover:scale-110 active:scale-95"
                                  aria-label="Remove student"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'marks' && (
                <div className="p-8 bg-white border border-gray-200/60 shadow-sm sm:p-10 rounded-2xl hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Scores</h2>
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:shadow-sm">
                        <option>All assignments</option>
                        <option>Quizzes</option>
                        <option>Materials</option>
                      </select>
                      <select className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:shadow-sm">
                        <option>Sort: Newest</option>
                        <option>Sort: Oldest</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <p className="text-sm text-gray-600">Average Grade</p>
                      <p className="text-2xl font-bold text-blue-700">—</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                      <p className="text-sm text-gray-600">Submission Rate</p>
                      <p className="text-2xl font-bold text-green-700">—</p>
                    </div>
                  </div>
                  <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-left text-gray-700">Student</th>
                          <th className="px-4 py-3 font-semibold text-left text-gray-700">Assignment</th>
                          <th className="px-4 py-3 font-semibold text-left text-gray-700">Score</th>
                          <th className="px-4 py-3 font-semibold text-left text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                          <tr key={`sample-row-${i}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3">User {i}</td>
                            <td className="px-4 py-3">Sample Assignment {i}</td>
                            <td className="px-4 py-3 font-medium">—</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Pending</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Sidebar - Upcoming Tasks - Hidden when document panel is open */}
          {!documentPanelOpen && (
            <div className={`bg-white border border-gray-200/60 rounded-xl shadow-sm min-w-[280px] max-w-[320px] w-full h-fit sticky top-6 overflow-hidden transition-all duration-300 hover:shadow-md ${upcomingTasksExpanded ? 'opacity-100 max-h-screen' : 'opacity-60 max-h-16 hover:opacity-100'
              }`}>
              <div className="px-5 py-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const willExpand = !upcomingTasksExpanded;
                      setUpcomingTasksExpanded(willExpand);
                      // When expanding upcoming tasks, collapse the sidebar
                      if (willExpand && !sidebarCollapsed) {
                        setSidebarCollapsed(true);
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1"
                  >
                    <div className="flex items-center justify-center w-8 h-8 transition-colors duration-200 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                      <svg className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Upcoming Tasks</h3>
                      <p className="text-xs text-gray-600">Due dates & assignments</p>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 ml-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setTimelineView(false)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${!timelineView
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        title="Card View"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setTimelineView(true)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${timelineView
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        title="Timeline View"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-blue-600 transition-all duration-200 rounded-lg hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                      View All
                    </button>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden ${upcomingTasksExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="p-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  {(() => {
                    const now = new Date();
                    const upcoming = (assignments || [])
                      .filter(a => a?.dueDate)
                      .map(a => ({ ...a, _due: new Date(a.dueDate) }))
                      .filter(a => a._due >= now)
                      .sort((a, b) => a._due - b._due)
                      .slice(0, upcomingTasksExpanded ? 6 : 4);

                    if (upcoming.length === 0) {
                      return (
                        <div className="py-12 text-center">
                          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="mb-2 text-base font-semibold text-gray-900">All caught up!</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">No upcoming tasks. Great job staying on top of your assignments!</p>
                        </div>
                      );
                    }

                    // Timeline View
                    if (timelineView) {
                      return (
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>

                          <div className="space-y-6">
                            {upcoming.map((item) => {
                              console.log('🔍 DATE: Processing upcoming task:', item.title);
                              console.log('🔍 DATE: Item due date:', item._due);
                              console.log('🔍 DATE: Current time (now):', now);
                              console.log('🔍 DATE: Time difference:', item._due - now);
                              const daysLeft = Math.ceil((item._due - now) / (1000 * 60 * 60 * 24));
                              console.log('🔍 DATE: Days left calculation:', daysLeft);
                              const urgency = daysLeft <= 0 ? 'overdue' : daysLeft <= 2 ? 'soon' : daysLeft <= 7 ? 'upcoming' : 'normal';

                              // Timeline priority colors
                              const timelineConfig = {
                                overdue: {
                                  dotColor: 'bg-red-500',
                                  ringColor: 'ring-red-200',
                                  bgColor: 'bg-red-50',
                                  borderColor: 'border-red-200',
                                  textColor: 'text-red-700',
                                  priorityText: 'Urgent'
                                },
                                soon: {
                                  dotColor: 'bg-amber-500',
                                  ringColor: 'ring-amber-200',
                                  bgColor: 'bg-amber-50',
                                  borderColor: 'border-amber-200',
                                  textColor: 'text-amber-700',
                                  priorityText: 'Due Soon'
                                },
                                upcoming: {
                                  dotColor: 'bg-blue-500',
                                  ringColor: 'ring-blue-200',
                                  bgColor: 'bg-blue-50',
                                  borderColor: 'border-blue-200',
                                  textColor: 'text-blue-700',
                                  priorityText: 'Upcoming'
                                },
                                normal: {
                                  dotColor: 'bg-green-500',
                                  ringColor: 'ring-green-200',
                                  bgColor: 'bg-green-50',
                                  borderColor: 'border-green-200',
                                  textColor: 'text-green-700',
                                  priorityText: 'Normal'
                                }
                              };

                              const config = timelineConfig[urgency];

                              // Task type detection
                              const getTaskType = (title, type) => {
                                const titleLower = title.toLowerCase();
                                if (titleLower.includes('quiz') || titleLower.includes('test') || type === 'quiz') {
                                  return { icon: '📝', label: 'Quiz', estimatedTime: '15-30 min' };
                                } else if (titleLower.includes('assignment') || titleLower.includes('homework') || type === 'assignment') {
                                  return { icon: '📋', label: 'Assignment', estimatedTime: '1-2 hours' };
                                } else if (titleLower.includes('reading') || titleLower.includes('chapter') || type === 'material') {
                                  return { icon: '📖', label: 'Reading', estimatedTime: '30-45 min' };
                                } else if (titleLower.includes('video') || titleLower.includes('watch') || type === 'video') {
                                  return { icon: '🎥', label: 'Video', estimatedTime: '20-40 min' };
                                } else if (titleLower.includes('project') || titleLower.includes('presentation')) {
                                  return { icon: '🎯', label: 'Project', estimatedTime: '2-4 hours' };
                                } else {
                                  return { icon: '📄', label: 'Task', estimatedTime: '30-60 min' };
                                }
                              };

                              const taskType = getTaskType(item.title, item.type);

                              // Progress calculation (simplified to avoid random calls on every render)
                              const progress = 0; // Default to 0, can be updated with real data later
                              const isCompleted = false; // Default to false
                              const isStarted = false; // Default to false

                              // Smart notifications
                              const getNotificationMessage = () => {
                                if (daysLeft <= 0) return "⚠️ This task is overdue!";
                                if (daysLeft === 1) return "🔥 Due tomorrow - time to focus!";
                                if (daysLeft <= 3) return "⚡ Due soon - consider starting today";
                                if (daysLeft <= 7) return "📅 Coming up this week";
                                return "✅ You have plenty of time";
                              };

                              return (
                                <div key={item._id} className="relative flex items-start gap-4">
                                  {/* Timeline dot */}
                                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 ${config.dotColor} ${config.ringColor} ring-4 rounded-full flex items-center justify-center`}>
                                    <span className="text-lg text-white">{taskType.icon}</span>
                                  </div>

                                  {/* Task content */}
                                  <div className={`flex-1 p-4 ${config.bgColor} ${config.borderColor} border rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}>
                                    {/* Task header */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-600">{taskType.label}</span>
                                      </div>
                                      <div className="text-right whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {(() => {
                                            const formattedDate = format(new Date(item._due), 'MMM dd');
                                            console.log('🔍 DATE_FORMAT: Formatting date for timeline:', item.title, '->', formattedDate);
                                            return formattedDate;
                                          })()}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Task title */}
                                    <h4 className="mb-2 text-sm font-semibold leading-tight text-gray-900">
                                      {item.title}
                                    </h4>

                                    {/* Smart notification */}
                                    <div className={`text-xs ${config.textColor} mb-3 p-2 rounded-md ${config.bgColor} border ${config.borderColor}`}>
                                      {getNotificationMessage()}
                                    </div>

                                    {/* Task details */}
                                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>{taskType.estimatedTime}</span>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-2">
                                        {isCompleted ? (
                                          <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-gradient-to-r from-green-100 to-green-200 border border-green-200 rounded-md hover:from-green-200 hover:to-green-300 hover:border-green-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2">
                                            ✓ Completed
                                          </button>
                                        ) : isStarted ? (
                                          <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200 rounded-md hover:from-blue-200 hover:to-blue-300 hover:border-blue-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                                            Continue
                                          </button>
                                        ) : (
                                          <button className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-md hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                                            Start
                                          </button>
                                        )}
                                        <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-100 hover:border-gray-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2">
                                          View
                                        </button>
                                      </div>

                                      {/* Drag handle for prioritization */}
                                      <div className="flex items-center gap-1 text-gray-400 cursor-move hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-all duration-200" title="Drag to prioritize">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Card View (existing implementation)
                    return (
                      <div className="space-y-4">
                        {upcoming.map((item) => {
                          const daysLeft = Math.ceil((item._due - now) / (1000 * 60 * 60 * 24));
                          const urgency = daysLeft <= 0 ? 'overdue' : daysLeft <= 2 ? 'soon' : daysLeft <= 7 ? 'upcoming' : 'normal';

                          // Priority colors and styles
                          const priorityConfig = {
                            overdue: {
                              color: 'red',
                              bgClass: 'bg-red-50',
                              borderClass: 'border-red-200',
                              textClass: 'text-red-700',
                              ringColor: 'stroke-red-500',
                              priorityText: 'Urgent'
                            },
                            soon: {
                              color: 'amber',
                              bgClass: 'bg-amber-50',
                              borderClass: 'border-amber-200',
                              textClass: 'text-amber-700',
                              ringColor: 'stroke-amber-500',
                              priorityText: 'Due Soon'
                            },
                            upcoming: {
                              color: 'blue',
                              bgClass: 'bg-blue-50',
                              borderClass: 'border-blue-200',
                              textClass: 'text-blue-700',
                              ringColor: 'stroke-blue-500',
                              priorityText: 'Upcoming'
                            },
                            normal: {
                              color: 'green',
                              bgClass: 'bg-green-50',
                              borderClass: 'border-green-200',
                              textClass: 'text-green-700',
                              ringColor: 'stroke-green-500',
                              priorityText: 'Normal'
                            }
                          };

                          const config = priorityConfig[urgency];

                          // Task type detection and icon
                          const getTaskType = (title, type) => {
                            const titleLower = title.toLowerCase();
                            if (titleLower.includes('quiz') || titleLower.includes('test') || type === 'quiz') {
                              return { icon: '📝', label: 'Quiz', estimatedTime: '15-30 min' };
                            } else if (titleLower.includes('assignment') || titleLower.includes('homework') || type === 'assignment') {
                              return { icon: '📋', label: 'Assignment', estimatedTime: '1-2 hours' };
                            } else if (titleLower.includes('reading') || titleLower.includes('chapter') || type === 'material') {
                              return { icon: '📖', label: 'Reading', estimatedTime: '30-45 min' };
                            } else if (titleLower.includes('video') || titleLower.includes('watch') || type === 'video') {
                              return { icon: '🎥', label: 'Video', estimatedTime: '20-40 min' };
                            } else if (titleLower.includes('project') || titleLower.includes('presentation')) {
                              return { icon: '🎯', label: 'Project', estimatedTime: '2-4 hours' };
                            } else {
                              return { icon: '📄', label: 'Task', estimatedTime: '30-60 min' };
                            }
                          };

                          const taskType = getTaskType(item.title, item.type);

                          // Progress calculation (simplified to avoid performance issues)
                          const progress = 0; // Default to 0, can be updated with real data later
                          const isCompleted = false; // Default to false
                          const isStarted = false; // Default to false

                          // Quick action buttons
                          const getActionButton = () => {
                            if (isCompleted) {
                              return (
                                <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-gradient-to-r from-green-100 to-green-200 border border-green-200 rounded-md hover:from-green-200 hover:to-green-300 hover:border-green-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2">
                                  ✓ Completed
                                </button>
                              );
                            } else if (isStarted) {
                              return (
                                <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200 rounded-md hover:from-blue-200 hover:to-blue-300 hover:border-blue-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                                  Continue
                                </button>
                              );
                            } else {
                              return (
                                <button className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-md hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                                  Start
                                </button>
                              );
                            }
                          };

                          return (
                            <div key={item._id} className={`group p-4 border ${config.borderClass} rounded-xl ${config.bgClass} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}>
                              <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Task header with type */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{taskType.icon}</span>
                                      <span className="text-xs font-medium text-gray-600">{taskType.label}</span>
                                    </div>
                                  </div>

                                  {/* Task title */}
                                  <h4 className="mb-2 text-sm font-semibold leading-tight text-gray-900" title={item.title}>
                                    {item.title}
                                  </h4>

                                  {/* Task details */}
                                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{format(new Date(item._due), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      <span>{taskType.estimatedTime}</span>
                                    </div>
                                  </div>

                                  {/* Action button */}
                                  <div className="flex justify-end">
                                    {getActionButton()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
        role={inviteRole}
        courseName={courseDetails?.subject || 'this course'}
      />

      {/* Side Panel Document Viewer */}
      <SidePanelDocumentViewer
        isOpen={documentPanelOpen}
        onClose={() => {
          setDocumentPanelOpen(false);
          setSidePanelDocument(null);
        }}
        document={sidePanelDocument}
      />

    </>
  );
};

export default CourseDetailPage;