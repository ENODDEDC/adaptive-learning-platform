'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';
import ContentViewer from '@/components/ContentViewer.client';
import InviteModal from '@/components/InviteModal';
import SidePanelDocumentViewer from '@/components/SidePanelDocumentViewer';
import ConfirmationModal from '@/components/ConfirmationModal';
import { 
  ArchiveBoxIcon, 
  ArrowRightOnRectangleIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

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

  // Scores Tab State
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statistics, setStatistics] = useState({
    averageGrade: null,
    submissionRate: null
  });

  // Members Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState({ teachers: [], students: [] });

  // Selected assignment for viewing submissions
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState(''); // 'student' or 'coTeacher'

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null,
    data: null
  });

  // Confirmation modal configurations
  const CONFIRMATION_CONFIGS = {
    'leave-course': {
      title: 'Leave Course',
      message: 'Are you sure you want to leave this course?',
      confirmText: 'Leave Course',
      variant: 'warning',
      icon: <ArrowRightOnRectangleIcon className="w-6 h-6" />
    },
    'delete-course': {
      title: 'Delete Course',
      message: 'Are you sure you want to archive this course? Archived courses can be restored by administrators and will be hidden from students.',
      confirmText: 'Delete Course',
      variant: 'danger',
      icon: <ArchiveBoxIcon className="w-6 h-6" />
    },
    'delete-classwork': {
      title: 'Delete Classwork',
      message: 'Are you sure you want to delete this classwork? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      icon: <TrashIcon className="w-6 h-6" />
    }
  };

  // Confirmation modal helpers
  const openConfirmation = useCallback((type, data = null) => {
    setConfirmationModal({ isOpen: true, type, data });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmationModal({ isOpen: false, type: null, data: null });
  }, []);

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

  const fetchScoresData = useCallback(async () => {
    if (!courseDetails?._id) return;
    
    console.log('🔍 SCORES: Fetching submissions for course:', courseDetails._id);
    setScoresLoading(true);
    setScoresError('');
    
    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/submissions`);
      
      console.log('🔍 SCORES: API response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('🔍 SCORES: Received submissions:', data.submissions?.length || 0);
      setSubmissions(data.submissions || []);
      calculateStatistics(data.submissions || []);
    } catch (err) {
      console.error('🔍 SCORES: Failed to fetch scores:', err);
      setScoresError(err.message);
    } finally {
      setScoresLoading(false);
    }
  }, [courseDetails]);

  const calculateStatistics = useCallback((submissionsData) => {
    console.log('🔍 SCORES: Calculating statistics for', submissionsData.length, 'submissions');
    
    // Calculate average grade
    const gradedSubmissions = submissionsData.filter(s => s.grade !== null && s.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(1)
      : null;
    
    console.log('🔍 SCORES: Graded submissions:', gradedSubmissions.length, 'Average grade:', averageGrade);
    
    // Calculate submission rate
    const submittedCount = submissionsData.filter(s => s.status === 'submitted').length;
    const totalCount = submissionsData.length;
    const submissionRate = totalCount > 0
      ? Math.round((submittedCount / totalCount) * 100)
      : null;
    
    console.log('🔍 SCORES: Submitted:', submittedCount, 'Total:', totalCount, 'Rate:', submissionRate + '%');
    
    setStatistics({ averageGrade, submissionRate });
  }, []);

  const handleRetryScores = useCallback(() => {
    console.log('🔍 SCORES: Retrying to fetch scores data');
    fetchScoresData();
  }, [fetchScoresData]);

  const handleAssignmentFilterChange = useCallback((e) => {
    const value = e.target.value;
    console.log('🔍 SCORES: Assignment filter changed to:', value);
    setAssignmentFilter(value);
  }, []);

  const handleSortOrderChange = useCallback((e) => {
    const value = e.target.value;
    console.log('🔍 SCORES: Sort order changed to:', value);
    setSortOrder(value);
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    console.log('🔍 MEMBERS: Search query changed to:', value);
    setSearchQuery(value);
  }, []);

  const handleAssignmentClick = useCallback((assignment) => {
    console.log('🔍 SCORES: Assignment clicked:', assignment.title);
    setSelectedAssignment(assignment);
  }, []);

  const handleBackToAssignments = useCallback(() => {
    console.log('🔍 SCORES: Going back to assignments list');
    setSelectedAssignment(null);
  }, []);

  // Get submissions for selected assignment
  const getAssignmentSubmissions = useCallback((assignmentId) => {
    return submissions.filter(s => s.assignmentId?._id === assignmentId);
  }, [submissions]);

  const handleExportToExcel = useCallback(() => {
    if (!selectedAssignment) return;
    
    const assignmentSubs = getAssignmentSubmissions(selectedAssignment._id);
    
    // Create CSV content
    let csvContent = 'Student Name,Email,Submitted Date,Grade,Status,Feedback\n';
    
    assignmentSubs.forEach(submission => {
      const studentName = submission.studentId?.name || 'Unknown';
      const email = submission.studentId?.email || '';
      const submittedDate = submission.submittedAt 
        ? format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm:ss')
        : 'Not submitted';
      const grade = submission.grade !== null && submission.grade !== undefined 
        ? submission.grade 
        : 'Not graded';
      const status = submission.status === 'submitted' ? 'Submitted' : 'Draft';
      const feedback = submission.feedback ? `"${submission.feedback.replace(/"/g, '""')}"` : '';
      
      csvContent += `"${studentName}","${email}","${submittedDate}","${grade}","${status}",${feedback}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedAssignment.title}_grades_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('🔍 SCORES: Exported grades to CSV');
  }, [selectedAssignment, getAssignmentSubmissions]);

  // Calculate assignment statistics
  const getAssignmentStats = useCallback((assignmentId) => {
    const assignmentSubs = getAssignmentSubmissions(assignmentId);
    const gradedSubs = assignmentSubs.filter(s => s.grade !== null && s.grade !== undefined);
    const submittedSubs = assignmentSubs.filter(s => s.status === 'submitted');
    
    const avgGrade = gradedSubs.length > 0
      ? (gradedSubs.reduce((sum, s) => sum + s.grade, 0) / gradedSubs.length).toFixed(1)
      : null;
    
    const submissionRate = students.length > 0
      ? Math.round((submittedSubs.length / students.length) * 100)
      : 0;
    
    return {
      totalSubmissions: assignmentSubs.length,
      submittedCount: submittedSubs.length,
      gradedCount: gradedSubs.length,
      averageGrade: avgGrade,
      submissionRate
    };
  }, [getAssignmentSubmissions, students.length]);

  // Fetch submissions data
  const fetchSubmissionsData = useCallback(async () => {
    if (!courseDetails || scoresLoading) return;
    
    try {
      setScoresLoading(true);
      console.log('🔍 SCORES: Fetching submissions for course:', courseDetails._id);
      
      const res = await fetch(`/api/courses/${courseDetails._id}/submissions`);
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const fetchedSubmissions = data.submissions || [];
      console.log('🔍 SCORES: Fetched submissions:', fetchedSubmissions.length, 'items');
      setSubmissions(fetchedSubmissions);
      setScoresError('');
    } catch (err) {
      console.error('🔍 SCORES: Failed to fetch submissions:', err);
      setScoresError(err.message);
      setSubmissions([]);
    } finally {
      setScoresLoading(false);
    }
  }, [courseDetails, scoresLoading]);

  // Fetch scores data when Scores tab becomes active (instructors) or when course loads (students for their own grades)
  useEffect(() => {
    if (!courseDetails) return;
    
    if (isInstructor && activeTab === 'marks' && submissions.length === 0 && !scoresLoading) {
      // Instructors fetch when Scores tab is active
      console.log('🔍 SCORES: Scores tab activated, fetching data');
      fetchSubmissionsData();
    } else if (!isInstructor && user && (activeTab === 'classwork' || activeTab === 'stream') && submissions.length === 0 && !scoresLoading) {
      // Students fetch their own submissions for activity cards when viewing classwork or stream
      console.log('🔍 SCORES: Fetching student submissions for activity status');
      fetchSubmissionsData();
    }
  }, [activeTab, courseDetails, submissions.length, scoresLoading, fetchSubmissionsData, isInstructor, user]);

  // Filter and sort submissions
  useEffect(() => {
    console.log('🔍 SCORES: Filtering and sorting submissions');
    let filtered = [...submissions];
    
    // Apply assignment type filter
    if (assignmentFilter !== 'all') {
      filtered = filtered.filter(s => s.assignmentId?.type === assignmentFilter);
      console.log('🔍 SCORES: Filtered by type', assignmentFilter, ':', filtered.length, 'submissions');
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
        case 'oldest':
          return new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt);
        case 'highest':
          // Put ungraded at the end
          if (a.grade === null || a.grade === undefined) return 1;
          if (b.grade === null || b.grade === undefined) return -1;
          return b.grade - a.grade;
        case 'lowest':
          // Put ungraded at the end
          if (a.grade === null || a.grade === undefined) return 1;
          if (b.grade === null || b.grade === undefined) return -1;
          return a.grade - b.grade;
        default:
          return 0;
      }
    });
    
    console.log('🔍 SCORES: Sorted by', sortOrder, ':', filtered.length, 'submissions');
    setFilteredSubmissions(filtered);
  }, [submissions, assignmentFilter, sortOrder]);

  // Filter members by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers({ teachers, students });
      return;
    }
    
    const query = searchQuery.toLowerCase();
    console.log('🔍 MEMBERS: Filtering members by query:', query);
    
    const filteredTeachers = teachers.filter(t => 
      t.name?.toLowerCase().includes(query) || 
      t.email?.toLowerCase().includes(query)
    );
    const filteredStudents = students.filter(s => 
      s.name?.toLowerCase().includes(query) || 
      s.email?.toLowerCase().includes(query)
    );
    
    console.log('🔍 MEMBERS: Filtered teachers:', filteredTeachers.length, 'students:', filteredStudents.length);
    setFilteredMembers({ teachers: filteredTeachers, students: filteredStudents });
  }, [teachers, students, searchQuery]);


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

  const handleDeleteClasswork = useCallback((classworkId) => {
    openConfirmation('delete-classwork', { classworkId });
  }, [openConfirmation]);

  const executeDeleteClasswork = useCallback(async (classworkId) => {
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

  const handleArchiveCourse = useCallback(() => {
    openConfirmation('delete-course');
  }, [openConfirmation]);

  const executeArchiveCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${slug}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      // Redirect to courses list or home page
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to archive course:', err);
      setError(err.message);
    }
  }, [slug]);

  const handleLeaveCourse = useCallback(() => {
    openConfirmation('leave-course');
  }, [openConfirmation]);

  const executeLeaveCourse = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${slug}/people`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id || user.id, role: 'student' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      // Redirect to courses list or home page
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to leave course:', err);
      setError(err.message);
    }
  }, [slug, user]);

  // Handle confirmation action - must be defined after execute functions
  const handleConfirmAction = useCallback(async () => {
    const { type, data } = confirmationModal;
    
    closeConfirmation();
    
    switch (type) {
      case 'leave-course':
        await executeLeaveCourse();
        break;
      case 'delete-course':
        await executeArchiveCourse();
        break;
      case 'delete-classwork':
        await executeDeleteClasswork(data.classworkId);
        break;
      default:
        console.warn('Unknown confirmation type:', type);
    }
  }, [confirmationModal, executeLeaveCourse, executeArchiveCourse, executeDeleteClasswork, closeConfirmation]);

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
    return (
      <div className="flex items-center justify-center flex-1 min-h-screen p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          {/* Animated spinner with gradient */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 border-r-blue-500 animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent rounded-full border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          
          {/* Loading text with animation */}
          <h2 className="mb-2 text-xl font-semibold text-gray-800 animate-pulse">Loading Course Details</h2>
          <p className="text-sm text-gray-600">Please wait while we prepare your content...</p>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
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
      <div className="h-screen bg-gray-50">
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
      <div className="min-h-screen p-8 overflow-y-auto bg-gray-50">
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
                    <p className="text-sm font-medium tracking-wide text-gray-500 uppercase animate-fadeInLeft">Course</p>
                    <h1 className="text-3xl font-bold text-gray-900 animate-subtleFloat">{courseDetails.subject}</h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg animate-subtlePulse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">{teachers.length} Teacher{teachers.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg animate-subtlePulse" style={{ animationDelay: '0.2s' }}>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">{students.length} Student{students.length === 1 ? '' : 's'}</span>
                  </div>

                  {/* Course Access Code - Moved from sidebar */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg animate-shimmer" style={{ animationDelay: '0.4s' }}>
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-700">Class Code:</span>
                    <span className="text-sm font-bold tracking-wider text-indigo-800">{courseDetails.uniqueKey}</span>
                    <button
                      onClick={() => {
                        console.log('🔍 CLIPBOARD: Attempting to copy code to clipboard');
                        if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.clipboard) {
                          console.log('🔍 CLIPBOARD: Cannot access clipboard - not on client or API not available');
                          return;
                        }
                        try {
                          const code = courseDetails.uniqueKey;
                          navigator.clipboard.writeText(code);
                          console.log('🔍 CLIPBOARD: Successfully copied to clipboard');
                        } catch (error) {
                          console.log('🔍 CLIPBOARD: Error copying to clipboard:', error);
                        }
                      }}
                      className="p-1 ml-1 text-indigo-600 transition-all duration-200 rounded hover:text-indigo-800 hover:bg-indigo-100"
                      title="Copy class code"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="items-center hidden gap-4 ml-6 sm:flex">
                <div className="flex items-center -space-x-2">
                  {teachers.slice(0, 3).map((teacher) => (
                    <div key={teacher._id} className="flex items-center justify-center w-10 h-10 overflow-hidden bg-blue-600 border-2 border-white rounded-full shadow-sm">
                      {teacher.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={teacher.profilePicture} 
                          alt={teacher.name || 'Teacher'} 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={`text-sm font-semibold text-white ${teacher.profilePicture ? 'hidden' : ''}`}>
                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                      </span>
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

                {/* Course Actions */}
                {isInstructor ? (
                  <button
                    onClick={handleArchiveCourse}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 border rounded-lg bg-amber-600 border-amber-600 hover:bg-amber-700 hover:border-amber-700 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Delete Course
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveCourse}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Leave Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout - Optimized Proportions */}
        <div className="flex flex-1 gap-4">
          {/* Feed Sidebar - Shows when document panel is open */}
          {documentPanelOpen && (
            <div className="w-[60%] bg-white border border-gray-200/60 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Feed</h2>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden">
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



          {/* Main Content Area - Enhanced Layout - Hidden when document panel is open */}
          {!documentPanelOpen && (
            <div className="flex-1 space-y-8">
              {/* Hidden button to open content viewer from custom events */}
              <button id="__openContentViewerBtn" type="button" className="hidden" />
              {/* Enhanced Navigation Tabs - Hidden when document panel is open */}
              {!documentPanelOpen && (
                <div className="flex justify-between mb-10 overflow-hidden transition-shadow duration-200 bg-white border shadow-sm border-gray-200/60 rounded-xl hover:shadow-md">
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
                  {isInstructor && (
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
                  )}
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
                  submissions={submissions}
                  currentUser={user}
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
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
                  {/* Simple Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Members</h2>
                      <p className="mt-1 text-sm text-gray-500">{teachers.length + students.length} total members</p>
                    </div>

                    {isInstructor && (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-64 py-2 pr-4 text-sm border border-gray-300 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <svg className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <button
                          onClick={() => {
                            setInviteRole('student');
                            setInviteModalOpen(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Invite Student
                        </button>
                        <button
                          onClick={() => {
                            setInviteRole('coTeacher');
                            setInviteModalOpen(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Invite Co-teacher
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Members Table */}
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Joined
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Teachers */}
                        {(isInstructor ? filteredMembers.teachers : teachers).map((teacher) => (
                          <tr key={teacher._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10">
                                  <div className="flex items-center justify-center w-10 h-10 overflow-hidden bg-blue-600 rounded-full">
                                    {teacher.profilePicture ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src={teacher.profilePicture} 
                                        alt={teacher.name || 'Teacher'} 
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <span className={`text-sm font-medium text-white ${teacher.profilePicture ? 'hidden' : ''}`}>
                                      {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-gray-900">
                                      {teacher.name || 'Unknown Teacher'}
                                    </div>
                                    {teacher._id === courseDetails.createdBy._id && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {teacher.email || 'No email provided'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Teacher
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center">
                                <div className="w-2 h-2 mr-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm text-gray-900">Active</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {teacher.createdAt ? format(new Date(teacher.createdAt), 'MMM d, yyyy') : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                              {isInstructor && teacher._id !== courseDetails.createdBy._id && (
                                <button
                                  onClick={() => handleRemoveUser(teacher._id, 'coTeacher')}
                                  className="text-red-600 transition-colors hover:text-red-900"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {/* Students */}
                        {(isInstructor ? filteredMembers.students : students).map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10">
                                  <div className="flex items-center justify-center w-10 h-10 overflow-hidden bg-green-600 rounded-full">
                                    {student.profilePicture ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src={student.profilePicture} 
                                        alt={student.name || 'Student'} 
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <span className={`text-sm font-medium text-white ${student.profilePicture ? 'hidden' : ''}`}>
                                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.name || 'Unknown Student'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.email || 'No email provided'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Student
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center">
                                <div className="w-2 h-2 mr-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm text-gray-900">Active</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {student.createdAt ? format(new Date(student.createdAt), 'MMM d, yyyy') : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                              {isInstructor && (
                                <button
                                  onClick={() => handleRemoveUser(student._id, 'student')}
                                  className="text-red-600 transition-colors hover:text-red-900"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {/* Empty State */}
                        {(isInstructor ? (filteredMembers.teachers.length === 0 && filteredMembers.students.length === 0) : (teachers.length === 0 && students.length === 0)) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No members yet</h3>
                                <p className="mb-4 text-gray-500">Start by inviting teachers and students to your course.</p>
                                {isInstructor && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setInviteRole('student');
                                        setInviteModalOpen(true);
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                      Invite Student
                                    </button>
                                    <button
                                      onClick={() => {
                                        setInviteRole('coTeacher');
                                        setInviteModalOpen(true);
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                      Invite Co-teacher
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'marks' && isInstructor && !selectedAssignment && (
                <div className="p-8 transition-all duration-200 bg-white border shadow-sm border-gray-200/60 sm:p-10 rounded-2xl hover:shadow-lg">
                  <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Scores</h2>
                      <p className="mt-1 text-sm text-gray-500">Select an assignment to view student submissions and grades</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={assignmentFilter}
                        onChange={handleAssignmentFilterChange}
                        className="px-3 py-2 text-sm transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:shadow-sm"
                      >
                        <option value="all">All types</option>
                        <option value="assignment">Assignments</option>
                        <option value="quiz">Quizzes</option>
                        <option value="material">Materials</option>
                      </select>
                    </div>
                  </div>

                  {scoresLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
                      </div>
                    </div>
                  ) : scoresError ? (
                    <div className="py-12 text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">Failed to load scores</h3>
                      <p className="mb-4 text-gray-500">{scoresError}</p>
                      <button
                        onClick={handleRetryScores}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="py-12 text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">No assignments yet</h3>
                      <p className="text-gray-500">Create assignments to start tracking student submissions and grades.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments
                        .filter(a => assignmentFilter === 'all' || a.type === assignmentFilter)
                        .map((assignment) => {
                          const stats = getAssignmentStats(assignment._id);
                          return (
                            <div
                              key={assignment._id}
                              onClick={() => handleAssignmentClick(assignment)}
                              className="p-6 transition-all duration-200 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 cursor-pointer bg-gradient-to-r from-white to-gray-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                      assignment.type === 'quiz' ? 'bg-purple-100 text-purple-700' :
                                      assignment.type === 'material' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {assignment.type || 'assignment'}
                                    </span>
                                  </div>
                                  {assignment.description && (
                                    <p className="mb-4 text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div className="p-3 rounded-lg bg-blue-50">
                                      <p className="text-xs text-gray-600">Submissions</p>
                                      <p className="text-lg font-bold text-blue-700">{stats.submittedCount}/{students.length}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-50">
                                      <p className="text-xs text-gray-600">Graded</p>
                                      <p className="text-lg font-bold text-green-700">{stats.gradedCount}/{stats.submittedCount}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-50">
                                      <p className="text-xs text-gray-600">Avg Grade</p>
                                      <p className="text-lg font-bold text-purple-700">{stats.averageGrade ? `${stats.averageGrade}%` : '—'}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-amber-50">
                                      <p className="text-xs text-gray-600">Rate</p>
                                      <p className="text-lg font-bold text-amber-700">{stats.submissionRate}%</p>
                                    </div>
                                  </div>
                                </div>
                                <svg className="w-6 h-6 ml-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'marks' && isInstructor && selectedAssignment && (
                <div className="p-8 transition-all duration-200 bg-white border shadow-sm border-gray-200/60 sm:p-10 rounded-2xl hover:shadow-lg">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handleBackToAssignments}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Assignments
                      </button>
                      <button
                        onClick={handleExportToExcel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export to Excel
                      </button>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                        <p className="mt-1 text-sm text-gray-500 capitalize">{selectedAssignment.type || 'assignment'}</p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const assignmentSubs = getAssignmentSubmissions(selectedAssignment._id);
                    const stats = getAssignmentStats(selectedAssignment._id);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-4">
                          <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                            <p className="text-sm text-gray-600">Submissions</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.submittedCount}/{students.length}</p>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                            <p className="text-sm text-gray-600">Graded</p>
                            <p className="text-2xl font-bold text-green-700">{stats.gradedCount}</p>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
                            <p className="text-sm text-gray-600">Average Grade</p>
                            <p className="text-2xl font-bold text-purple-700">{stats.averageGrade ? `${stats.averageGrade}%` : '—'}</p>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-lg bg-amber-50">
                            <p className="text-sm text-gray-600">Submission Rate</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.submissionRate}%</p>
                          </div>
                        </div>

                        {assignmentSubs.length === 0 ? (
                          <div className="py-12 text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No submissions yet</h3>
                            <p className="text-gray-500">Students haven't submitted any work for this assignment yet.</p>
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-gray-200 rounded-xl">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Student</th>
                                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Submitted</th>
                                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Score</th>
                                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Status</th>
                                  <th className="px-4 py-3 font-semibold text-left text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {assignmentSubs.map((submission) => (
                                  <tr key={submission._id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 w-8 h-8 mr-3">
                                          <div className="flex items-center justify-center w-8 h-8 overflow-hidden bg-blue-600 rounded-full">
                                            {submission.studentId?.profilePicture ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img 
                                                src={submission.studentId.profilePicture} 
                                                alt={submission.studentId.name || 'Student'} 
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextElementSibling.style.display = 'flex';
                                                }}
                                              />
                                            ) : null}
                                            <span className={`text-xs font-medium text-white ${submission.studentId?.profilePicture ? 'hidden' : ''}`}>
                                              {submission.studentId?.name ? submission.studentId.name.charAt(0).toUpperCase() : 'S'}
                                            </span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {submission.studentId?.name || 'Unknown Student'}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {submission.studentId?.email || ''}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      {submission.submittedAt ? (
                                        <div className="text-sm text-gray-900">
                                          {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                                          <div className="text-xs text-gray-500">
                                            {format(new Date(submission.submittedAt), 'h:mm a')}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-sm text-gray-400">Not submitted</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {submission.grade !== null && submission.grade !== undefined ? (
                                        <span className={`text-lg font-semibold ${
                                          submission.grade >= 90 ? 'text-green-600' :
                                          submission.grade >= 70 ? 'text-blue-600' :
                                          submission.grade >= 50 ? 'text-yellow-600' :
                                          'text-red-600'
                                        }`}>
                                          {submission.grade}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {submission.status === 'submitted' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                          Submitted
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                          Draft
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <a
                                        href={`/submissions/${submission._id}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="inline-block px-3 py-1 text-xs font-medium text-blue-600 transition-colors rounded-lg hover:bg-blue-50 hover:text-blue-700"
                                      >
                                        View & Grade
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'archive' && isInstructor && (
                <div className="p-8 transition-all duration-200 bg-white border shadow-sm border-gray-200/60 sm:p-10 rounded-2xl hover:shadow-lg">
                  <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Archived Courses</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Manage your archived courses</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {archivedCourses.length > 0 ? (
                      archivedCourses.map((course) => (
                        <div key={course._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{course.subject}</h3>
                              <p className="text-sm text-gray-600">
                                Archived on {format(new Date(course.updatedAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestoreCourse(course._id)}
                                className="px-3 py-1 text-sm text-blue-600 transition-colors rounded hover:text-blue-700 hover:bg-blue-50"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handleDeleteCoursePermanently(course._id)}
                                className="px-3 py-1 text-sm text-red-600 transition-colors rounded hover:text-red-700 hover:bg-red-50"
                              >
                                Delete Permanently
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <p>No archived courses yet</p>
                        <p className="text-sm">Courses you archive will appear here</p>
                      </div>
                    )}
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
                    className="flex items-center flex-1 gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 transition-colors duration-200 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                      <svg className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-700">Upcoming Tasks</h3>
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
                          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="mb-2 text-base font-semibold text-gray-900">All caught up!</h4>
                          <p className="text-sm leading-relaxed text-gray-600">No upcoming tasks. Great job staying on top of your assignments!</p>
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
                                      <div className="flex items-center gap-1 p-1 text-gray-400 transition-all duration-200 rounded cursor-move hover:text-gray-600 hover:bg-gray-100" title="Drag to prioritize">
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
        courseId={courseDetails?._id}
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

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && CONFIRMATION_CONFIGS[confirmationModal.type] && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmation}
          onConfirm={handleConfirmAction}
          title={CONFIRMATION_CONFIGS[confirmationModal.type].title}
          message={CONFIRMATION_CONFIGS[confirmationModal.type].message}
          confirmText={CONFIRMATION_CONFIGS[confirmationModal.type].confirmText}
          cancelText="Cancel"
          variant={CONFIRMATION_CONFIGS[confirmationModal.type].variant}
          icon={CONFIRMATION_CONFIGS[confirmationModal.type].icon}
        />
      )}

    </>
  );
};

export default CourseDetailPage;