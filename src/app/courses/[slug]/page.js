'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';
import ContentViewer from '@/components/ContentViewer.client';
import InviteModal from '@/components/InviteModal';
import SidePanelDocumentViewer from '@/components/SidePanelDocumentViewer';
import ConfirmationModal from '@/components/ConfirmationModal';
import CourseDetailTour from '@/components/CourseDetailTour';
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

  const { slug } = React.use(params); // slug is now courseId

  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState('');

  const setError = (message) => {
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

  // Create Classwork panel state
  const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState(null);
  const [classworkType, setClassworkType] = useState('assignment');

  // Tour state
  const [showTour, setShowTour] = useState(false);
  
  // Edit Visibility Modal state
  const [showEditVisibilityModal, setShowEditVisibilityModal] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

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
        window.dispatchEvent(new CustomEvent('collapseMainSidebar'));
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

  const fetchedSubmissionsCourseRef = useRef(null);

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
      console.error('🔍 DEBUG: Failed to fetch course details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/profile');

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        console.error('🔍 DEBUG: Failed to fetch user profile, status:', res.status);
      }
    } catch (err) {
      console.error('🔍 DEBUG: Error fetching user profile:', err);
    }
  }, []);

  useEffect(() => {
    fetchCourseDetails();
    fetchCurrentUser();
  }, [fetchCourseDetails, fetchCurrentUser]);

  // Determine if current user is the instructor (course creator)
  useEffect(() => {
    if (courseDetails && user) {
      // Handle case where createdBy might be null
      if (!courseDetails.createdBy) {
        setIsInstructor(false);
        return;
      }

      // Handle both cases: createdBy as object with _id or direct ID string
      const courseCreatorId = courseDetails.createdBy._id || courseDetails.createdBy;
      const currentUserId = user._id || user.id;

      const userIsInstructor = courseCreatorId === currentUserId;
      setIsInstructor(userIsInstructor);
    }
  }, [courseDetails, user]);

  const fetchStreamItems = useCallback(async () => {
    if (!courseDetails) {
      return;
    }

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
    } catch (err) {
      console.error('🔍 DEBUG: Failed to fetch stream items:', err);
      setError(err.message);
    }
  }, [courseDetails]);

  useEffect(() => {
    if (courseDetails) {
      fetchStreamItems();
    }
  }, [courseDetails, fetchStreamItems]);

  const handlePostAnnouncement = useCallback(async () => {

    if (!newAnnouncementContent?.trim() || !courseDetails?._id) {
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

      const responseData = await res.json();
      setNewAnnouncementContent('');
      fetchStreamItems(); // Refresh stream items
    } catch (err) {
      console.error('🔍 DEBUG: Failed to post announcement:', err);
      setError(err.message);
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

      const responseData = await res.json();
      setNewCommentContent(prev => {
        const newState = { ...prev, [itemId]: '' };
        return newState;
      });
      fetchStreamItems(); // Refresh stream items to show new comment
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

  // Ensure assignments are fetched for Ongoing Task sidebar
  useEffect(() => {
    if (courseDetails) {
      fetchAssignments();
      fetchPeople();
    }
  }, [courseDetails, fetchAssignments, fetchPeople]);

  const calculateStatistics = useCallback((submissionsData) => {
    
    // Calculate average grade
    const gradedSubmissions = submissionsData.filter(s => s.grade !== null && s.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(1)
      : null;
    
    // Calculate submission rate
    const submittedCount = submissionsData.filter(s => s.status === 'submitted').length;
    const totalCount = submissionsData.length;
    const submissionRate = totalCount > 0
      ? Math.round((submittedCount / totalCount) * 100)
      : null;
    
    setStatistics({ averageGrade, submissionRate });
  }, []);

  const fetchScoresData = useCallback(async () => {
    if (!courseDetails?._id) return;
    setScoresLoading(true);
    setScoresError('');
    
    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/submissions`);
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setSubmissions(data.submissions || []);
      calculateStatistics(data.submissions || []);
    } catch (err) {
      console.error('🔍 SCORES: Failed to fetch scores:', err);
      setScoresError(err.message);
    } finally {
      setScoresLoading(false);
    }
  }, [calculateStatistics, courseDetails]);

  function calculateStatisticsLegacy(submissionsData) {
    
    // Calculate average grade
    const gradedSubmissions = submissionsData.filter(s => s.grade !== null && s.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(1)
      : null;
    
    // Calculate submission rate
    const submittedCount = submissionsData.filter(s => s.status === 'submitted').length;
    const totalCount = submissionsData.length;
    const submissionRate = totalCount > 0
      ? Math.round((submittedCount / totalCount) * 100)
      : null;
    
    setStatistics({ averageGrade, submissionRate });
  }

  const handleRetryScores = useCallback(() => {
    fetchScoresData();
  }, [fetchScoresData]);

  const handleAssignmentFilterChange = useCallback((e) => {
    const value = e.target.value;
    setAssignmentFilter(value);
  }, []);

  const handleSortOrderChange = useCallback((e) => {
    const value = e.target.value;
    setSortOrder(value);
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    console.log('🔍 MEMBERS: Search query changed to:', value);
    setSearchQuery(value);
  }, []);

  const handleAssignmentClick = useCallback((assignment) => {
    setSelectedAssignment(assignment);
  }, []);

  const handleBackToAssignments = useCallback(() => {
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
    if (!courseDetails) return;
    
    try {
      setScoresLoading(true);
      
      const res = await fetch(`/api/courses/${courseDetails._id}/submissions`);
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const fetchedSubmissions = data.submissions || [];
      setSubmissions(fetchedSubmissions);
      calculateStatistics(fetchedSubmissions);
      setScoresError('');
    } catch (err) {
      console.error('🔍 SCORES: Failed to fetch submissions:', err);
      setScoresError(err.message);
      setSubmissions([]);
      fetchedSubmissionsCourseRef.current = null;
    } finally {
      setScoresLoading(false);
    }
  }, [calculateStatistics, courseDetails]);

  useEffect(() => {
    fetchedSubmissionsCourseRef.current = null;
  }, [courseDetails?._id, isInstructor]);

  // Fetch submissions for instructor overview on course load, and for students when activity state needs it.
  useEffect(() => {
    if (!courseDetails || scoresLoading) return;
    
    let shouldFetch = false;
    
    if (isInstructor && submissions.length === 0) {
      shouldFetch = true;
    } else if (!isInstructor && user && (activeTab === 'classwork' || activeTab === 'stream') && submissions.length === 0) {
      shouldFetch = true;
    }
    
    if (shouldFetch && fetchedSubmissionsCourseRef.current !== courseDetails._id) {
      fetchedSubmissionsCourseRef.current = courseDetails._id;
      fetchSubmissionsData();
    }
  }, [activeTab, courseDetails, fetchSubmissionsData, isInstructor, scoresLoading, submissions.length, user]);

  // Filter and sort submissions
  useEffect(() => {
    let filtered = [...submissions];
    
    // Apply assignment type filter
    if (assignmentFilter !== 'all') {
      filtered = filtered.filter(s => s.assignmentId?.type === assignmentFilter);
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

  const handleUpdateVisibility = useCallback(async (isPrivate) => {
    setVisibilityLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPrivate }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update visibility');
      }

      // Update local state
      setCourseDetails(prev => ({ ...prev, isPrivate }));
      setShowEditVisibilityModal(false);
    } catch (err) {
      console.error('Failed to update visibility:', err);
      setError(err.message);
    } finally {
      setVisibilityLoading(false);
    }
  }, [slug]);

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

  const isCompactClassworkView =
    activeTab === 'classwork' &&
    !documentPanelOpen &&
    !isCreateClassworkModalOpen;

  const showRightSidebar =
    !documentPanelOpen &&
    !isCreateClassworkModalOpen &&
    (!isInstructor || activeTab === 'stream' || activeTab === 'classwork');

  const now = new Date();
  const upcomingAssignments = (assignments || [])
    .filter((assignment) => assignment?.dueDate)
    .map((assignment) => ({ ...assignment, _due: new Date(assignment.dueDate) }))
    .filter((assignment) => assignment._due >= now)
    .sort((a, b) => a._due - b._due);

  const pendingReviewSubmissions = submissions.filter(
    (submission) =>
      submission?.status === 'submitted' &&
      (submission?.grade === null || submission?.grade === undefined)
  );

  const dueThisWeekCount = upcomingAssignments.filter((assignment) => {
    const daysLeft = Math.ceil((assignment._due - now) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const teachingOverviewStats = [
    {
      label: 'Deadlines',
      value: upcomingAssignments.length,
      accent: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      label: 'To grade',
      value: pendingReviewSubmissions.length,
      accent: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      label: 'Students',
      value: students.length,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      label: 'This week',
      value: dueThisWeekCount,
      accent: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    }
  ];

  if (loading) {
    return (
      <div className="h-screen overflow-y-auto bg-gray-50">
        <div className="sticky top-0 z-50">
          <div className="h-1 w-full bg-blue-100/80">
            <div className="h-full w-full bg-blue-500 animate-pulse animate-progress-shine"></div>
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
      <div className={`${isCompactClassworkView ? 'h-screen p-4 overflow-hidden bg-gray-50' : 'h-screen p-5 overflow-y-auto bg-gray-50'}`}>
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
        <div className="mb-5 bg-white border border-gray-200 shadow-sm rounded-xl" data-tour="course-header">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase animate-fadeInLeft">Course</p>
                    <div className="flex items-center gap-3">
                      <h1 className="text-[2rem] font-bold text-gray-900 animate-subtleFloat leading-tight">{courseDetails.subject}</h1>
                      {/* Visibility Status Pill */}
                      {isInstructor && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                          courseDetails.isPrivate 
                            ? 'bg-gray-100 text-gray-700 border border-gray-300' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${courseDetails.isPrivate ? 'bg-gray-500' : 'bg-emerald-500'}`}></span>
                          {courseDetails.isPrivate ? 'Private' : 'Public'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Course Access Code */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg animate-shimmer">
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-xs font-medium text-indigo-700">Class Code:</span>
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

              <div className="items-center hidden gap-3 ml-5 sm:flex">
                <div className="flex items-center -space-x-2">
                  {teachers.filter(teacher => teacher != null).slice(0, 3).map((teacher) => (
                    <div key={teacher._id} className="flex items-center justify-center w-9 h-9 overflow-hidden bg-blue-600 border-2 border-white rounded-full shadow-sm">
                      {teacher?.profilePicture ? (
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
                <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  People
                </button>

                {/* Take a Tour Button */}
                <button 
                  onClick={() => setShowTour(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-blue-700 transition-all duration-200 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Take a Tour
                </button>

                {/* Course Actions */}
                {isInstructor ? (
                  <>
                    <button
                      onClick={() => setShowEditVisibilityModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Edit Visibility
                    </button>
                    <button
                      onClick={handleArchiveCourse}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white transition-all duration-200 border rounded-lg bg-amber-600 border-amber-600 hover:bg-amber-700 hover:border-amber-700 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Delete Course
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLeaveCourse}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        <div className="flex flex-1 gap-3">
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

          {/* Classwork Sidebar - Shows when create classwork panel is open */}
          {isCreateClassworkModalOpen && (
            <div className="w-[60%] bg-white border border-gray-200/60 rounded-xl shadow-sm h-fit sticky top-6 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden">
                  <ClassworkTab
                    courseDetails={courseDetails}
                    isInstructor={isInstructor}
                    onOpenContent={(content) => {
                      try {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('collapseSidebar'));
                        }
                      } catch (error) {
                        console.log('Error dispatching event:', error);
                      }
                      setTimeout(() => setSelectedContent(content), 180);
                    }}
                    onClassworkCreated={handleClassworkCreated}
                    isCreateClassworkModalOpen={isCreateClassworkModalOpen}
                    setIsCreateClassworkModalOpen={setIsCreateClassworkModalOpen}
                    editingClasswork={editingClasswork}
                    setEditingClasswork={setEditingClasswork}
                    classworkType={classworkType}
                    setClassworkType={setClassworkType}
                    compactMode={true}
                  />
                </div>
              </div>
            </div>
          )}



          {/* Main Content Area - Enhanced Layout - Hidden when document panel or create classwork panel is open */}
          {!documentPanelOpen && !isCreateClassworkModalOpen && (
            <div className={`flex-1 min-w-0 ${isCompactClassworkView ? 'space-y-4' : 'space-y-5'}`}>
              {/* Hidden button to open content viewer from custom events */}
              <button id="__openContentViewerBtn" type="button" className="hidden" />
              {/* Enhanced Navigation Tabs - Hidden when document panel or create classwork panel is open */}
              {!documentPanelOpen && !isCreateClassworkModalOpen && (
                <div className="flex justify-between mb-6 overflow-hidden transition-shadow duration-200 bg-white border shadow-sm border-gray-200/60 rounded-xl hover:shadow-md">
                  <button
                    data-tour="stream-tab"
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'stream'
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
                    data-tour="classwork-tab"
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'classwork'
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
                    data-tour="people-tab"
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'people'
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
                      data-tour="scores-tab"
                      className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative group ${activeTab === 'marks'
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
                  compactMode={true}
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
                  isCreateClassworkModalOpen={isCreateClassworkModalOpen}
                  setIsCreateClassworkModalOpen={setIsCreateClassworkModalOpen}
                  editingClasswork={editingClasswork}
                  setEditingClasswork={setEditingClasswork}
                  classworkType={classworkType}
                  setClassworkType={setClassworkType}
                  compactMode={true}
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
                        {(isInstructor ? filteredMembers.teachers : teachers).filter(teacher => teacher != null).map((teacher) => (
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
                                    {courseDetails?.createdBy?._id && teacher._id === courseDetails.createdBy._id && (
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
                              {isInstructor && courseDetails?.createdBy?._id && teacher._id !== courseDetails.createdBy._id && (
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
                        {(isInstructor ? filteredMembers.students : students).filter(student => student != null).map((student) => (
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
                  ) : assignments.filter(a => a.type !== 'material').length === 0 ? (
                    <div className="py-12 text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">No gradable assignments yet</h3>
                      <p className="text-gray-500">Create assignments or quizzes to start tracking student submissions and grades.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments
                        .filter(a => a.type !== 'material') // Exclude materials from scores tab
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
                            <p className="text-gray-500">Students haven&apos;t submitted any work for this assignment yet.</p>
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

          {/* Right Sidebar - Upcoming Tasks - Hidden when document panel or create classwork panel is open */}
          {showRightSidebar && (
            <div data-tour="upcoming-tasks" className={`flex-shrink-0 bg-white border border-gray-200/60 rounded-xl shadow-sm min-w-[260px] max-w-[300px] w-full h-fit sticky top-6 overflow-hidden transition-all duration-300 hover:shadow-md ${upcomingTasksExpanded ? 'opacity-100 max-h-screen' : 'opacity-60 max-h-16 hover:opacity-100'
              }`}>
              <div className="px-4 py-3.5 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
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
                      <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {isInstructor ? 'Teaching Overview' : 'Upcoming Tasks'}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {isInstructor ? 'Deadlines, submissions, and grading' : 'Due dates & assignments'}
                      </p>
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
                    <button
                      onClick={() => setActiveTab('classwork')}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 transition-all duration-200 rounded-lg hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                    >
                      {isInstructor ? 'Open Classwork' : 'View All'}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden ${upcomingTasksExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="p-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  {(() => {
                    const upcoming = upcomingAssignments
                      .slice(0, upcomingTasksExpanded ? 6 : 4);

                    const openAssignmentInScores = (assignment) => {
                      setSelectedAssignment(assignment);
                      setActiveTab('marks');
                    };

                    const openAssignmentInClasswork = () => {
                      setActiveTab('classwork');
                    };

                    if (upcoming.length === 0) {
                      return (
                        <div className="py-12 text-center">
                          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="mb-2 text-base font-semibold text-gray-900">
                            {isInstructor ? 'No active deadlines' : 'All caught up!'}
                          </h4>
                          <p className="text-sm leading-relaxed text-gray-600">
                            {isInstructor
                              ? 'There are no upcoming classwork deadlines to monitor right now.'
                              : 'No upcoming tasks. Great job staying on top of your assignments!'}
                          </p>
                          {isInstructor && (
                            <div className="mt-4 flex justify-center">
                              <button
                                onClick={() => setActiveTab('classwork')}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Open Classwork
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (isInstructor) {
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {teachingOverviewStats.map((stat) => (
                              <div
                                key={stat.label}
                                className={`rounded-xl border px-3 py-2.5 ${stat.accent}`}
                              >
                                <div className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-80">
                                  {stat.label}
                                </div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                  {stat.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setActiveTab('classwork')}
                              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              Manage Classwork
                            </button>
                            <button
                              onClick={() => setActiveTab('marks')}
                              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                            >
                              Open Scores
                            </button>
                          </div>

                          <div className="space-y-3">
                            {upcoming.map((item) => {
                              const daysLeft = Math.ceil((item._due - now) / (1000 * 60 * 60 * 24));
                              const urgency = daysLeft <= 0 ? 'overdue' : daysLeft <= 2 ? 'soon' : daysLeft <= 7 ? 'upcoming' : 'normal';
                              const assignmentSubs = submissions.filter((submission) => {
                                const submissionAssignmentId =
                                  submission.assignment ||
                                  submission.assignmentId?._id ||
                                  submission.assignmentId;
                                return String(submissionAssignmentId) === String(item._id);
                              });
                              const submittedCount = assignmentSubs.filter((submission) => submission.status === 'submitted').length;
                              const gradedCount = assignmentSubs.filter(
                                (submission) => submission.grade !== null && submission.grade !== undefined
                              ).length;
                              const ungradedCount = Math.max(submittedCount - gradedCount, 0);

                              const urgencyStyles = {
                                overdue: 'border-red-200 bg-red-50/80',
                                soon: 'border-amber-200 bg-amber-50/80',
                                upcoming: 'border-blue-200 bg-blue-50/80',
                                normal: 'border-gray-200 bg-white'
                              };

                              const pillStyles = {
                                overdue: 'bg-red-100 text-red-700',
                                soon: 'bg-amber-100 text-amber-700',
                                upcoming: 'bg-blue-100 text-blue-700',
                                normal: 'bg-gray-100 text-gray-600'
                              };

                              return (
                                <div
                                  key={item._id}
                                  className={`rounded-xl border p-3.5 shadow-sm transition hover:shadow-md ${urgencyStyles[urgency]}`}
                                >
                                  <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="mb-1 flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${pillStyles[urgency]}`}>
                                          {daysLeft <= 0 ? 'Needs attention' : daysLeft === 1 ? 'Due tomorrow' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                                        </span>
                                      </div>
                                      <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">
                                        {item.title}
                                      </h4>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      <div className="font-semibold text-gray-900">{format(new Date(item._due), 'MMM dd')}</div>
                                      <div>{format(new Date(item._due), 'h:mm a')}</div>
                                    </div>
                                  </div>

                                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div className="rounded-lg bg-white/70 px-2.5 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400">Submitted</div>
                                      <div className="mt-1 font-semibold text-gray-900">{submittedCount}</div>
                                    </div>
                                    <div className="rounded-lg bg-white/70 px-2.5 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-gray-400">Ungraded</div>
                                      <div className="mt-1 font-semibold text-gray-900">{ungradedCount}</div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openAssignmentInScores(item)}
                                      className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                                    >
                                      Review
                                    </button>
                                    <button
                                      onClick={openAssignmentInClasswork}
                                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                                    >
                                      Open
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
                              const assignmentSubs = submissions.filter(s => {
                                const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                                return String(submissionAssignmentId) === String(item._id);
                              });
                              const submittedCount = assignmentSubs.filter(s => s.status === 'submitted').length;
                              const gradedCount = assignmentSubs.filter(s => s.grade !== null && s.grade !== undefined).length;
                              const ungradedCount = Math.max(submittedCount - gradedCount, 0);

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
                                if (isInstructor) {
                                  if (daysLeft <= 0) return 'Deadline reached. Review submissions and grading status.';
                                  if (ungradedCount > 0) return `${ungradedCount} submission${ungradedCount > 1 ? 's' : ''} waiting for grading.`;
                                  if (daysLeft === 1) return 'Due tomorrow. Monitor student progress closely.';
                                  if (daysLeft <= 3) return 'Due soon. Good time to remind students.';
                                  return 'Upcoming classwork on your teaching timeline.';
                                }
                                if (daysLeft <= 0) return 'This task is overdue!';
                                if (daysLeft === 1) return 'Due tomorrow - time to focus!';
                                if (daysLeft <= 3) return 'Due soon - consider starting today';
                                if (daysLeft <= 7) return 'Coming up this week';
                                return 'You have plenty of time';
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
                                        <span className="text-xs font-medium text-gray-600">
                                          {isInstructor ? 'Classwork' : taskType.label}
                                        </span>
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
                                      {isInstructor ? (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{submittedCount} submitted</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>{ungradedCount} ungraded</span>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                          </svg>
                                          <span>{taskType.estimatedTime}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-2">
                                        {isInstructor ? (
                                          <button className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-md hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2">
                                            Review
                                          </button>
                                        ) : isCompleted ? (
                                          <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-gradient-to-r from-green-100 to-green-200 border border-green-200 rounded-md hover:from-green-200 hover:to-green-300 hover:border-green-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2">
                                            Completed
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
                                          {isInstructor ? 'Open' : 'View'}
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

      {/* Course Detail Tour */}
      <CourseDetailTour show={showTour} onComplete={() => setShowTour(false)} isInstructor={isInstructor} />
      {/* Edit Visibility Modal */}
{showEditVisibilityModal && (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Edit Course Visibility</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => handleUpdateVisibility(false)}
          disabled={visibilityLoading}
          style={{ padding: '12px', border: courseDetails.isPrivate ? '2px solid #e5e7eb' : '2px solid #3b82f6', borderRadius: '8px', backgroundColor: courseDetails.isPrivate ? 'white' : '#eff6ff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Public</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Anyone can join with course key</div>
          </div>
        </button>
        <button
          onClick={() => handleUpdateVisibility(true)}
          disabled={visibilityLoading}
          style={{ padding: '12px', border: courseDetails.isPrivate ? '2px solid #3b82f6' : '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: courseDetails.isPrivate ? '#eff6ff' : 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Private</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Invite only</div>
          </div>
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowEditVisibilityModal(false)}
          disabled={visibilityLoading}
          style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default CourseDetailPage;

