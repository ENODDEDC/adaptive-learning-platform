'use client';

import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';
import CourseScoresTab from '@/components/CourseScoresTab';
import ContentViewer from '@/components/ContentViewer.client';
import InviteModal from '@/components/InviteModal';
import SidePanelDocumentViewer from '@/components/SidePanelDocumentViewer';
import ConfirmationModal from '@/components/ConfirmationModal';
import CourseDetailTour from '@/components/CourseDetailTour';
import { Menu, Transition } from '@headlessui/react';
import { 
  ArchiveBoxIcon, 
  ArrowRightOnRectangleIcon, 
  TrashIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
  InformationCircleIcon,
  Cog6ToothIcon
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

  // Storage state
  const [storageInfo, setStorageInfo] = useState(null);

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
      const res = await fetch(`/api/courses/${slug}`);
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setCourseDetails(data.course);
    } catch (err) {
      console.error('🔍 DEBUG: Failed to fetch course details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchStorageInfo = useCallback(async (courseId) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/storage`);
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch {
      // Non-critical — silently fail
    }
  }, []);

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
      const [announcementsRes, classworkRes, formsRes] = await Promise.all([
        fetch(`/api/courses/${courseDetails._id}/announcements`),
        fetch(`/api/courses/${courseDetails._id}/classwork`),
        fetch(`/api/courses/${courseDetails._id}/forms`),
      ]);

      if (!announcementsRes.ok) {
        throw new Error(`Error fetching announcements: ${announcementsRes.status} ${announcementsRes.statusText}`);
      }
      if (!classworkRes.ok) {
        throw new Error(`Error fetching classwork: ${classworkRes.status} ${classworkRes.statusText}`);
      }
      if (!formsRes.ok) {
        throw new Error(`Error fetching forms: ${formsRes.status} ${formsRes.statusText}`);
      }

      const announcementsData = await announcementsRes.json();
      const classworkData = await classworkRes.json();
      const formsData = await formsRes.json();

      console.log('🔍 DEBUG: Stream data counts:', {
        announcements: announcementsData.announcements?.length || 0,
        classwork: classworkData.classwork?.length || 0,
        forms: formsData.forms?.length || 0
      });

      const combinedItems = [
        ...announcementsData.announcements.map(item => ({ ...item, type: 'announcement' })),
        ...classworkData.classwork.map(item => ({ ...item, type: item.type || 'assignment' })),
        ...formsData.forms.map(item => ({ ...item, type: 'form' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('🔍 DEBUG: Combined items details:', combinedItems.map(item => ({
        id: item._id,
        type: item.type,
        title: item.title || 'No title',
        createdAt: item.createdAt
      })));

      setStreamItems(combinedItems.map(item => ({ ...item, comments: [] })));
      setItemComments({});
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
      fetchStorageInfo(courseDetails._id);
    }
  }, [courseDetails, fetchAssignments, fetchPeople, fetchStorageInfo]);

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
    console.log('🔍 CLASSWORK: handleClassworkCreated called - refreshing assignments, forms, and stream items');
    await Promise.all([
      fetchAssignments(),
      fetchStreamItems()
    ]);
    console.log('🔍 CLASSWORK: All items refreshed successfully');
  }, [fetchAssignments, fetchStreamItems]);

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

  const showRightSidebar = !documentPanelOpen && !isCreateClassworkModalOpen && (isInstructor && (activeTab === 'stream' || activeTab === 'classwork'));

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
      <div className="h-screen p-5 bg-gray-50 flex flex-col overflow-hidden">
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
        {/* Compact Professional Header */}
        <div className="mb-5 bg-white border border-gray-200 shadow-sm rounded-lg flex-shrink-0" data-tour="course-header">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left Section - Course Info */}
              <div className="flex items-center gap-4">
                {/* Course Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                
                {/* Course Title & Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">COURSE</span>
                    {isInstructor && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        courseDetails.isPrivate 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${courseDetails.isPrivate ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                        {courseDetails.isPrivate ? 'Private' : 'Public'}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 truncate">
                    {courseDetails.subject}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Taught by {teachers.length > 0 ? teachers[0]?.name || 'Instructor' : 'Instructor'}
                  </p>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-3">
                {/* Teacher Avatar */}
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full overflow-hidden">
                  {teachers[0]?.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={teachers[0].profilePicture} 
                      alt={teachers[0].name || 'Teacher'} 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`text-sm font-medium text-white ${teachers[0]?.profilePicture ? 'hidden' : ''}`}>
                    {teachers[0]?.name ? teachers[0].name.charAt(0).toUpperCase() : 'T'}
                  </span>
                </div>

                {/* Single Actions Menu Button */}
                <Menu as="div" className="relative">
                  <Menu.Button className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-colors">
                    <span className="sr-only">Open course actions</span>
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Course actions</p>
                        <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">
                          {courseDetails.subject}
                        </p>
                        {/* Storage info */}
                        {storageInfo && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            <span className="text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{storageInfo.formatted}</span>
                              {' '}used · {storageInfo.fileCount} file{storageInfo.fileCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={() => setActiveTab('people')}
                              className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                            >
                              <UserGroupIcon className="w-4 h-4 text-gray-400" />
                              <span>People</span>
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={() => setShowTour(true)}
                              className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                            >
                              <InformationCircleIcon className="w-4 h-4 text-blue-500" />
                              <span>Take a Tour</span>
                            </button>
                          )}
                        </Menu.Item>
                      </div>

                      <div className="py-1 border-t border-gray-100">
                        {isInstructor ? (
                          <>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => setShowEditVisibilityModal(true)}
                                  className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                                >
                                  <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
                                  <span>Edit Visibility</span>
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={handleArchiveCourse}
                                  className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} flex w-full items-center gap-2 px-4 py-2 text-sm`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  <span>Delete Course</span>
                                </button>
                              )}
                            </Menu.Item>
                          </>
                        ) : (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={handleLeaveCourse}
                                className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} flex w-full items-center gap-2 px-4 py-2 text-sm`}
                              >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                <span>Leave Course</span>
                              </button>
                            )}
                          </Menu.Item>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
          
          {/* Class Code Section - Separate Row */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">CLASS CODE</span>
              <span className="text-sm font-bold text-gray-900 tracking-wider">{courseDetails.uniqueKey}</span>
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
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="Copy class code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout - Optimized Proportions */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">
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
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
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
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Hidden button to open content viewer from custom events */}
              <button id="__openContentViewerBtn" type="button" className="hidden" />
              {/* Enhanced Navigation Tabs - Sticky */}
              <div className="flex justify-between mb-6 overflow-hidden transition-shadow duration-200 bg-white border shadow-sm border-gray-200/60 rounded-xl hover:shadow-md flex-shrink-0">
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

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin">
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

              {activeTab === 'marks' && isInstructor && (
                <CourseScoresTab 
                  courseId={courseDetails?._id} 
                  isInstructor={isInstructor} 
                />
              )}
              </div>
            </div>
          )}

          {/* Right Sidebar - Teaching Overview - Hidden when document panel or create classwork panel is open */}
          {showRightSidebar && (
            <div data-tour="upcoming-tasks" className="flex-shrink-0 w-80 sticky top-6" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
              {/* Professional Teaching Overview */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                {/* Clean Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-semibold text-sm">Teaching Overview</h3>
                        <p className="text-gray-500 text-xs">Course management</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUpcomingTasksExpanded(!upcomingTasksExpanded)}
                      className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${upcomingTasksExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Professional Stats Grid */}
                <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { 
                        label: 'Active', 
                        value: upcomingAssignments.length, 
                        description: 'assignments'
                      },
                      { 
                        label: 'To Grade', 
                        value: pendingReviewSubmissions.length, 
                        description: 'submissions'
                      },
                      { 
                        label: 'Students', 
                        value: students.length, 
                        description: 'enrolled'
                      },
                      { 
                        label: 'This Week', 
                        value: dueThisWeekCount, 
                        description: 'due soon'
                      }
                    ].map((stat, index) => (
                      <div
                        key={stat.label}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {stat.value}
                        </div>
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                          {stat.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stat.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Professional Action Buttons */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                    <button
                      onClick={() => setActiveTab('classwork')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Manage Classwork</div>
                        <div className="text-xs text-gray-500">Create and organize assignments</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveTab('marks')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Review Grades</div>
                        <div className="text-xs text-gray-500">Grade submissions and feedback</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Upcoming Deadlines - Professional Style */}
                  {upcomingTasksExpanded && upcomingAssignments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Upcoming Deadlines</h4>
                      <div className="space-y-2">
                        {upcomingAssignments.slice(0, 4).map((item, index) => {
                          const daysLeft = Math.ceil((item._due - now) / (1000 * 60 * 60 * 24));
                          const isUrgent = daysLeft <= 2;
                          
                          return (
                            <div
                              key={item._id}
                              className="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                    <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                                      {daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-medium text-gray-900 truncate mb-1">
                                    {item.title}
                                  </h5>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(item._due), 'MMM dd, h:mm a')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedAssignment(item);
                                    setActiveTab('marks');
                                  }}
                                  className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Professional Empty State */}
                  {upcomingAssignments.length === 0 && (
                    <div className="text-center py-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">All caught up</h4>
                      <p className="text-xs text-gray-500">No upcoming deadlines</p>
                    </div>
                  )}
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

