'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';
import ContentViewer from '@/components/ContentViewer.client';

const CourseDetailPage = ({
  params,
  upcomingTasksExpanded: propUpcomingTasksExpanded,
  setUpcomingTasksExpanded: propSetUpcomingTasksExpanded,
  sidebarCollapsed: propSidebarCollapsed,
  setSidebarCollapsed: propSetSidebarCollapsed
}) => {
  const { slug } = React.use(params); // slug is now courseId
  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [isInstructor, setIsInstructor] = useState(true); // For demonstration, set to true for instructor view
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const setUpcomingTasksExpanded = propSetUpcomingTasksExpanded || (() => {});

  const fetchCourseDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${slug}`); // No need for manual token header, cookie is sent automatically

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setCourseDetails(data.course);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course details:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const fetchStreamItems = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const [announcementsRes, classworkRes] = await Promise.all([
        fetch(`/api/courses/${courseDetails._id}/announcements`), // No need for manual token header
        fetch(`/api/courses/${courseDetails._id}/classwork`), // No need for manual token header
      ]);

      if (!announcementsRes.ok) {
        throw new Error(`Error fetching announcements: ${announcementsRes.status} ${announcementsRes.statusText}`);
      }
      if (!classworkRes.ok) {
        throw new Error(`Error fetching classwork: ${classworkRes.status} ${classworkRes.statusText}`);
      }

      const announcementsData = await announcementsRes.json();
      const classworkData = await classworkRes.json();

      const combinedItems = [
        ...announcementsData.announcements.map(item => ({ ...item, type: 'announcement' })),
        ...classworkData.classwork.map(item => ({ ...item, type: item.type || 'assignment' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date, newest first

      // Fetch comments for each item
      const commentsPromises = combinedItems.map(async (item) => {
        // Assuming comments API is structured as /api/courses/:courseId/:itemType/:itemId/comments
        const commentsRes = await fetch(`/api/courses/${courseDetails._id}/${item.type === 'announcement' ? 'announcements' : 'classwork'}/${item._id}/comments`);
        if (!commentsRes.ok) {
          console.error(`Failed to fetch comments for item ${item._id}:`, commentsRes.statusText);
          return { itemId: item._id, comments: [] };
        }
        const commentsData = await commentsRes.json();
        return { itemId: item._id, comments: commentsData.comments };
      });

      const fetchedComments = await Promise.all(commentsPromises);
      const commentsMap = fetchedComments.reduce((acc, { itemId, comments }) => {
        acc[itemId] = comments;
        return acc;
      }, {});

      setStreamItems(combinedItems.map(item => ({ ...item, comments: commentsMap[item._id] || [] })));
      setItemComments(commentsMap);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch stream items:', err);
    }
  }, [courseDetails]);

  useEffect(() => {
    if (courseDetails) {
      fetchStreamItems();
    }
  }, [courseDetails, fetchStreamItems]);

  const handlePostAnnouncement = useCallback(async () => {
    if (!newAnnouncementContent.trim() || !courseDetails?._id) {
      setError('Announcement content cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newAnnouncementContent }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setNewAnnouncementContent('');
      fetchStreamItems(); // Refresh stream items
    } catch (err) {
      setError(err.message);
      console.error('Failed to post announcement:', err);
    }
  }, [newAnnouncementContent, courseDetails, fetchStreamItems]);

  const handlePostComment = useCallback(async (itemId, itemType) => {
    const content = newCommentContent[itemId]?.trim();
    if (!content || !courseDetails?._id) {
      setError('Comment content cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/${itemType}/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setNewCommentContent(prev => ({ ...prev, [itemId]: '' }));
      fetchStreamItems(); // Refresh stream items to show new comment
    } catch (err) {
      setError(err.message);
      console.error('Failed to post comment:', err);
    }
  }, [newCommentContent, courseDetails, fetchStreamItems]);

  useEffect(() => {
    // Reset expanded activities when tab changes
    setExpandedActivities({});
  }, [activeTab]);

  const fetchAssignments = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/classwork`); // No need for manual token header

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setAssignments(data.classwork);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch assignments:', err);
    }
  }, [courseDetails]);

  // Ensure assignments are fetched for Ongoing Task sidebar
  useEffect(() => {
    if (courseDetails) {
      fetchAssignments();
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

      fetchAssignments(); // Refresh classwork list
      fetchStreamItems(); // Also refresh stream to reflect changes
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete classwork:', err);
    }
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
        <script dangerouslySetInnerHTML={{ __html: `
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
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Course</p>
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

              <div className="hidden sm:flex items-center gap-4 ml-6">
                <div className="flex items-center -space-x-2">
                  {teachers.slice(0, 3).map((teacher, index) => (
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
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  People
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-1 gap-6">
          {/* Left Sidebar - Course Modules */}
          <div className={`bg-white border border-gray-200 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-16' : 'w-80'
          }`}>
            {!sidebarCollapsed ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Class Code</h2>
                  <button
                    onClick={() => {
                      setSidebarCollapsed(true);
                      setUpcomingTasksExpanded(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                    title="Collapse sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 min-w-[120px] text-center">
                      <span className="text-lg font-bold tracking-widest text-gray-800 block">
                        C-45567
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        const code = 'C-45567';
                        if (navigator?.clipboard?.writeText) {
                          navigator.clipboard.writeText(code);
                        }
                      } catch {}
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <button
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setUpcomingTasksExpanded(false);
                  }}
                  className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                  title="Expand sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-300 rounded-lg mb-2">
                    <span className="text-xs font-bold text-gray-800">C</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Hidden button to open content viewer from custom events */}
            <button id="__openContentViewerBtn" type="button" className="hidden" />
            {/* Enhanced Navigation Tabs */}
            <div className="flex justify-between mb-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <button
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'stream'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'classwork'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'people'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'marks'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'stream' && (
              <StreamTab
                courseDetails={courseDetails}
                isInstructor={isInstructor}
                newAnnouncementContent={newAnnouncementContent}
                setNewAnnouncementContent={setNewAnnouncementContent}
                handlePostAnnouncement={handlePostAnnouncement}
                newCommentContent={newCommentContent}
                setNewCommentContent={setNewCommentContent}
                handlePostComment={handlePostComment}
                onOpenContent={(content) => {
                  try {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('collapseSidebar'));
                    }
                  } catch {}
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
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('collapseSidebar'));
                    }
                  } catch {}
                  // Slight delay to let the sidebar collapse animate smoothly
                  setTimeout(() => setSelectedContent(content), 180);
                }}
              />
            )}
            {activeTab === 'people' && (
              <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" placeholder="Search people..." className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white w-56" />
                    {isInstructor && (
                      <>
                        <button className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Invite Student</button>
                        <button className="px-4 py-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700">Invite Co-teacher</button>
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
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full">
                                <span className="text-sm font-semibold text-white">{teacher.name ? teacher.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">{teacher.name || 'Unknown Teacher'}</p>
                                <p className="text-xs text-gray-500 truncate">Teacher</p>
                              </div>
                            </div>
                            {isInstructor && (
                              <button className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100" aria-label="Remove teacher">
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
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full">
                                <span className="text-sm font-semibold text-white">{student.name ? student.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">{student.name || 'Unknown Student'}</p>
                                <p className="text-xs text-gray-500 truncate">Student</p>
                              </div>
                            </div>
                            {isInstructor && (
                              <button className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100" aria-label="Remove student">
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
              <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Scores</h2>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                      <option>All assignments</option>
                      <option>Quizzes</option>
                      <option>Materials</option>
                    </select>
                    <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Assignment</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {[1,2,3].map((i) => (
                        <tr key={i} className="hover:bg-gray-50">
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

          {/* Right Sidebar - Upcoming Tasks */}
          <div className={`bg-white border border-gray-200 rounded-xl shadow-sm min-w-[280px] max-w-[320px] w-full h-fit sticky top-6 overflow-hidden ${
            upcomingTasksExpanded ? 'opacity-100 max-h-screen' : 'opacity-60 max-h-16 hover:opacity-100'
          }`}>
            <div className="px-4 py-4 border-b border-gray-100">
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
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-md transition-colors duration-200 group-hover:bg-blue-200">
                    <svg className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Upcoming Tasks</h3>
                  <svg className={`w-4 h-4 text-gray-400 ml-1 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setTimelineView(false)}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                        !timelineView 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Card View"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setTimelineView(true)}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                        timelineView 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Timeline View"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </button>
                  </div>
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:bg-blue-50 px-2 py-1 rounded">
                    View All
                  </button>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden ${
              upcomingTasksExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
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
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">No upcoming tasks</p>
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
                      {upcoming.map((item, index) => {
                        const daysLeft = Math.ceil((item._due - now) / (1000 * 60 * 60 * 24));
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
                            
                            // Progress calculation
                            const progress = Math.random() * 100;
                            const isCompleted = progress >= 100;
                            const isStarted = progress > 0;
                            
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
                                  <span className="text-white text-lg">{taskType.icon}</span>
                                </div>
                                
                                {/* Task content */}
                                <div className={`flex-1 p-4 ${config.bgColor} ${config.borderColor} border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer`}>
                                  {/* Task header */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-600">{taskType.label}</span>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {format(new Date(item._due), 'MMM dd')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                {/* Task title */}
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 leading-tight">
                                  {item.title}
                                </h4>

                                  {/* Smart notification */}
                                  <div className={`text-xs ${config.textColor} mb-3 p-2 rounded-md ${config.bgColor} border ${config.borderColor}`}>
                                    {getNotificationMessage()}
                                  </div>
                                  
                                  {/* Task details */}
                                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
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
                                        <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors">
                                          ✓ Completed
                                        </button>
                                      ) : isStarted ? (
                                        <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors">
                                          Continue
                                        </button>
                                      ) : (
                                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                          Start
                                        </button>
                                      )}
                                      <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors">
                                        View
                                      </button>
                                    </div>
                                    
                                    {/* Drag handle for prioritization */}
                                    <div className="flex items-center gap-1 text-gray-400 cursor-move" title="Drag to prioritize">
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
                      {upcoming.map((item, index) => {
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
                        
                        // Progress calculation (mock data - in real app, this would come from submission status)
                        const progress = Math.random() * 100; // Random progress for demo
                        const isCompleted = progress >= 100;
                        const isStarted = progress > 0;
                        
                        // Quick action buttons
                        const getActionButton = () => {
                          if (isCompleted) {
                            return (
                              <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors">
                                ✓ Completed
                              </button>
                            );
                          } else if (isStarted) {
                            return (
                              <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors">
                                Continue
                              </button>
                            );
                          } else {
                            return (
                              <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                Start
                              </button>
                            );
                          }
                        };

                        return (
                          <div key={item._id} className={`group p-4 border ${config.borderClass} rounded-xl ${config.bgClass} hover:shadow-md transition-all duration-200 cursor-pointer`}>
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
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 leading-tight" title={item.title}>
                                  {item.title}
                                </h4>

                                {/* Task details */}
                                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
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
        </div>
      </div>

      
    </>
  );
};

export default CourseDetailPage;