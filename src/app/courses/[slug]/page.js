'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import CreateClassworkModal from '@/components/CreateClassworkModal';
import SubmitAssignmentModal from '@/components/SubmitAssignmentModal';

const CourseDetailPage = ({ params }) => {
  const { slug } = React.use(params); // slug is now courseId
  const [expandedActivities, setExpandedActivities] = useState({});
  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [isInstructor, setIsInstructor] = useState(true); // For demonstration, set to true for instructor view
  const [courseDetails, setCourseDetails] = useState(null);
  const [streamItems, setStreamItems] = useState([]);
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState({}); // State to hold new comment content for each item
  const [itemComments, setItemComments] = useState({}); // State to hold comments for each item
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState(null);
  const [classworkType, setClassworkType] = useState('assignment');
  const [isSubmitAssignmentModalOpen, setIsSubmitAssignmentModalOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);

  const fetchCourseDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/courses/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const [announcementsRes, classworkRes] = await Promise.all([
        fetch(`/api/courses/${courseDetails._id}/announcements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/courses/${courseDetails._id}/classwork`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
        const commentsRes = await fetch(`/api/courses/${courseDetails._id}/${item.type === 'announcement' ? 'announcements' : 'classwork'}/${item._id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/${itemType}/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/classwork`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const fetchPeople = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/people`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/classwork/${classworkId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const courseTitle = courseDetails.subject;

  return (
    <>
      <div className="h-full p-8 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="p-6 mb-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{courseDetails.subject}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">People</span>
              <div className="flex items-center -space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 border-2 border-white rounded-full">
                  <span className="text-xs font-semibold text-white">U1</span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-green-500 border-2 border-white rounded-full">
                  <span className="text-xs font-semibold text-white">U2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-1 gap-6">
          {/* Left Sidebar - Course Modules */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm w-80 rounded-2xl">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Course Modules</h2>
            <div className="space-y-4">
              {/* Module 1 */}
              <div key="module-1" className="flex items-center gap-4 p-3 transition-colors rounded-lg hover:bg-gray-50">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                </div>
                <span className="text-sm font-medium text-gray-800">Intro to Programming I</span>
              </div>
              
              {/* Module 2 */}
              <div key="module-2" className="flex items-center gap-4 p-3 transition-colors rounded-lg hover:bg-gray-50">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                </div>
                <span className="text-sm font-medium text-gray-800">Intro to Programming II</span>
              </div>
              
              {/* Module 3 - Current */}
              <div key="module-3" className="flex items-center gap-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full ring-2 ring-blue-200"></div>
                </div>
                <span className="text-sm font-semibold text-blue-700">Intro to Programming III</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Navigation Tabs */}
            <div className="flex justify-around p-4 mb-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'stream' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('stream')}
              >
                Stream
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'classwork' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('classwork')}
              >
                Classwork
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'people' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('people')}
              >
                People
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'marks' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('marks')}
              >
                Marks
              </button>
            </div>

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'stream' && (
              <>
                {/* Show full-screen document if any activity is expanded */}
                {expandedActivities['activity1'] && (
                  <div className="relative min-h-screen p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    {/* AI Enhancement Icon - Bottom Right Corner */}
                    <div className="absolute z-20 bottom-6 right-6">
                      <div className="p-3 transition-colors duration-200 bg-blue-600 rounded-full shadow-lg cursor-pointer hover:bg-blue-700">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Document Header with Zoom and Close */}
                    <div className="absolute z-10 flex items-center gap-3 top-6 right-6">
                      <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg">
                        25%
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActivityExpansion('activity1');
                        }}
                        className="flex items-center justify-center w-8 h-8 font-bold text-gray-600 transition-colors bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Document Content */}
                    <div className="max-w-4xl pt-4 mx-auto">
                      <h3 className="mb-8 text-3xl font-bold text-center text-gray-900">Background of the Study</h3>
                      <div className="space-y-6 leading-relaxed text-justify text-gray-700">
                        <p className="text-lg leading-8">
                          To meet the demands of a fast-changing technological landscape, educational
                          systems must integrate technological tools and online learning opportunities.
                          The integration of technology in education has opened new frontiers in academic
                          for engagement and learner achievement, allowing learners to explore new ideas
                          from global and local science, and hence creating and measuring educational
                          behaviours in a pathway to Academic and develop educational materials.
                        </p>
                        <p className="text-lg leading-8">
                          One of 2022(22) defined artificial intelligence as the combination of computers,
                          computational technologies, heuristics, and educational mechanisms and technology
                          aimed at enabling computers to perform these human-like functions.
                        </p>
                        <p className="text-lg leading-8">
                          Several days therefore, he said with any use of his technology, artificial intelligence has
                          he been connected adapted to the education sector, artificial intelligence has a lot of
                          application, including adaptive learning. Papadopoulos et al., 2022() note that
                          adaptive learning provides students with the means to explore educational according to
                          their individual needs and cognitive differences.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show full-screen document for Activity 2 */}
                {expandedActivities['activity2'] && (
                  <div className="relative min-h-screen p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    {/* AI Enhancement Icon - Bottom Right Corner */}
                    <div className="absolute z-20 bottom-6 right-6">
                      <div className="p-3 transition-colors duration-200 bg-green-600 rounded-full shadow-lg cursor-pointer hover:bg-green-700">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Document Header with Zoom and Close */}
                    <div className="absolute z-10 flex items-center gap-3 top-6 right-6">
                      <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg">
                        25%
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActivityExpansion('activity2');
                        }}
                        className="flex items-center justify-center w-8 h-8 font-bold text-gray-600 transition-colors bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Document Content */}
                    <div className="max-w-4xl pt-4 mx-auto">
                      <h3 className="mb-8 text-3xl font-bold text-center text-gray-900">Activity 3 - Programming Fundamentals</h3>
                      <div className="space-y-6 leading-relaxed text-justify text-gray-700">
                        <p className="text-lg leading-8">
                          This activity focuses on understanding the core concepts of programming languages
                          and their applications in modern software development. Students will explore
                          various programming paradigms and learn how to implement basic algorithms.
                        </p>
                        <p className="text-lg leading-8">
                          Programming fundamentals include understanding variables, data types, control
                          structures, functions, and object-oriented programming principles. These concepts
                          form the foundation for more advanced programming topics.
                        </p>
                        <p className="text-lg leading-8">
                          Through practical exercises and hands-on coding activities, students will develop
                          problem-solving skills and learn to write clean, efficient, and maintainable code.
                          The activity emphasizes best practices in software development and debugging techniques.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Stream Content */}
                {!expandedActivities['activity1'] && !expandedActivities['activity2'] && (
                  <div className="space-y-6">
                    {isInstructor && (
                      <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Post Announcement</h2>
                        <textarea
                          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Write a new announcement..."
                          value={newAnnouncementContent}
                          onChange={(e) => setNewAnnouncementContent(e.target.value)}
                        ></textarea>
                        <button
                          onClick={handlePostAnnouncement}
                          className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Post Announcement
                        </button>
                      </div>
                    )}

                    {/* Stream Items Section */}
                    <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                      <h2 className="mb-4 text-2xl font-bold text-gray-900">Stream</h2>
                      {streamItems.length === 0 ? (
                        <p className="text-gray-600">No recent activity.</p>
                      ) : (
                        <div className="space-y-6">
                          {streamItems.map((item) => (
                            <div key={item._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex items-start gap-4 mb-3">
                                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                  <span className="text-sm font-semibold text-white">
                                    {item.postedBy?.name ? item.postedBy.name.charAt(0).toUpperCase() : 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">{item.postedBy?.name || 'Unknown User'}</span>
                                    {isInstructor && (
                                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Instructor</span>
                                    )}
                                    <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                                      {item.type === 'announcement' ? 'Announcement' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                              <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                              <p className="leading-relaxed text-gray-700">{item.content || item.description}</p>
                              {item.attachments && item.attachments.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="mb-2 text-sm font-medium text-gray-700">Attachments:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {item.attachments.map((attachment, index) => {
                                      const fileExtension = attachment?.fileName?.split('.').pop().toLowerCase();
                                      const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);

                                      return (
                                        <a
                                          key={index}
                                          href={attachment.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                                        >
                                          {isImage ? (
                                            <img src={attachment.fileUrl} alt={attachment.fileName} className="object-cover w-12 h-12 rounded-md" />
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md">
                                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-800">{attachment.fileName}</span>
                                                {fileExtension && (
                                                  <span className="text-xs text-gray-500 uppercase">{fileExtension} File</span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {/* Comments Section */}
                              <div className="pt-4 mt-6 border-t border-gray-200">
                                <h4 className="mb-3 text-lg font-semibold text-gray-900">Comments</h4>
                                <div className="space-y-4">
                                  {itemComments[item._id]?.length === 0 ? (
                                    <p className="text-sm text-gray-600">No comments yet.</p>
                                  ) : (
                                    itemComments[item._id]?.map((comment) => (
                                      <div key={comment._id} className="flex items-start gap-3">
                                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full">
                                          <span className="text-xs font-semibold text-gray-700">{comment.postedBy?.name ? comment.postedBy.name.charAt(0).toUpperCase() : 'U'}</span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">{comment.postedBy?.name || 'Unknown User'}</span>
                                            <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM dd, yyyy')}</span>
                                          </div>
                                          <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                  <input
                                    type="text"
                                    placeholder="Add class comment..."
                                    className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newCommentContent[item._id] || ''}
                                    onChange={(e) => setNewCommentContent(prev => ({ ...prev, [item._id]: e.target.value }))}
                                  />
                                  <button
                                    onClick={() => handlePostComment(item._id, item.type === 'announcement' ? 'announcements' : 'classwork')}
                                    className="p-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'classwork' && (
              <div className="space-y-6">
                {isInstructor && (
                  <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Manage Classwork</h2>
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                          onClick={() => document.getElementById('classwork-menu').classList.toggle('hidden')}
                        >
                          Create New Classwork
                          <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div id="classwork-menu" className="absolute left-0 hidden w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('assignment'); setIsCreateClassworkModalOpen(true); }}>Assignment</a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('quiz assignment'); setIsCreateClassworkModalOpen(true); }}>Quiz assignment</a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('question'); setIsCreateClassworkModalOpen(true); }}>Question</a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('material'); setIsCreateClassworkModalOpen(true); }}>Material</a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('reuse post'); setIsCreateClassworkModalOpen(true); }}>Reuse post</a>
                          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setClassworkType('topic'); setIsCreateClassworkModalOpen(true); }}>Topic</a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignments Section */}
                <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">Assignments</h2>
                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <p className="text-gray-600">No assignments yet.</p>
                    ) : (
                      assignments.map((assignment) => (
                        <div key={assignment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                            <p className="text-sm text-gray-600">Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'No due date'}</p>
                          </div>
                          {isInstructor ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">Assigned</span>
                              <button
                                onClick={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                                className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteClasswork(assignment._id)} className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quizzes Section */}
                <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">Quizzes</h2>
                  <div className="space-y-4">
                    {assignments.filter(a => a.type === 'quiz').length === 0 ? (
                      <p className="text-gray-600">No quizzes yet.</p>
                    ) : (
                      assignments.filter(a => a.type === 'quiz').map((quiz) => (
                        <div key={quiz._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                            <p className="text-sm text-gray-600">Due: {quiz.dueDate ? format(new Date(quiz.dueDate), 'MMM dd, yyyy') : 'No due date'}</p>
                          </div>
                          {isInstructor ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">Completed</span>
                              <button
                                onClick={() => { setEditingClasswork(quiz); setIsCreateClassworkModalOpen(true); }}
                                className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteClasswork(quiz._id)} className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ) : (
                            <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">Completed</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Materials Section */}
                <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">Materials</h2>
                  <div className="space-y-4">
                    {assignments.filter(a => a.type === 'material').length === 0 ? (
                      <p className="text-gray-600">No materials yet.</p>
                    ) : (
                      assignments.filter(a => a.type === 'material').map((material) => (
                        <div key={material._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{material.title}</h3>
                            <p className="text-sm text-gray-600">Posted: {format(new Date(material.createdAt), 'MMM dd, yyyy')}</p>
                          </div>
                          {isInstructor ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingClasswork(material); setIsCreateClassworkModalOpen(true); }}
                                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
                              >
                                View
                              </button>
                              <button className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteClasswork(material._id)} className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200">View</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'people' && (
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">People</h2>
                {isInstructor && (
                  <div className="mb-6">
                    <button className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                      Add Student
                    </button>
                    <button className="px-4 py-2 ml-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700">
                      Add Co-teacher
                    </button>
                  </div>
                )}
                <div className="space-y-6">
                  {/* Teachers Section */}
                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900">Teachers</h3>
                    <div className="space-y-3">
                      {teachers.length === 0 ? (
                        <p className="text-gray-600">No teachers found.</p>
                      ) : (
                        teachers.map((teacher) => (
                          <div key={teacher._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full">
                                <span className="text-sm font-semibold text-white">{teacher.name ? teacher.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <span className="font-medium text-gray-800">{teacher.name || 'Unknown Teacher'}</span>
                            </div>
                            {isInstructor && (
                              <button className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Students Section */}
                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900">Students</h3>
                    <div className="space-y-3">
                      {students.length === 0 ? (
                        <p className="text-gray-600">No students enrolled.</p>
                      ) : (
                        students.map((student) => (
                          <div key={student._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full">
                                <span className="text-sm font-semibold text-white">{student.name ? student.name.charAt(0).toUpperCase() : 'U'}</span>
                              </div>
                              <span className="font-medium text-gray-800">{student.name || 'Unknown Student'}</span>
                            </div>
                            {isInstructor && (
                              <button className="p-2 text-red-600 transition-colors rounded-lg hover:bg-red-100">
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
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Marks (Grades)</h2>
                {isInstructor ? (
                  <div className="space-y-6">
                    {/* Overall Class Performance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                        <p className="text-sm text-gray-600">Average Class Grade</p>
                        <p className="text-2xl font-bold text-blue-700">82%</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                        <p className="text-sm text-gray-600">Submissions Rate</p>
                        <p className="text-2xl font-bold text-green-700">90%</p>
                      </div>
                    </div>

                    {/* All Students' Grades */}
                    <div>
                      <h3 className="mb-3 text-xl font-semibold text-gray-900">Student Grades Overview</h3>
                      <div className="space-y-3">
                        {/* Student 1 Grades */}
                        <div key="student-grade-1" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">User 1</h4>
                            <p className="text-sm text-gray-600">Overall: 88%</p>
                          </div>
                          <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200">View Details</button>
                        </div>
                        {/* Student 2 Grades */}
                        <div key="student-grade-2" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">User 2</h4>
                            <p className="text-sm text-gray-600">Overall: 75%</p>
                          </div>
                          <button className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200">View Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Performance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                        <p className="text-sm text-gray-600">Overall Grade</p>
                        <p className="text-2xl font-bold text-blue-700">85%</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                        <p className="text-sm text-gray-600">Assignments Completed</p>
                        <p className="text-2xl font-bold text-green-700">8/10</p>
                      </div>
                    </div>

                    {/* Individual Assignment Grades */}
                    <div>
                      <h3 className="mb-3 text-xl font-semibold text-gray-900">Assignment Grades</h3>
                      <div className="space-y-3">
                        {/* Assignment 1 Grade */}
                        <div key="assignment-grade-1" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Homework 1: Introduction to Algorithms</h4>
                            <p className="text-sm text-gray-600">Feedback: Good effort, but review recursion.</p>
                          </div>
                          <span className="px-3 py-1 text-lg font-bold text-blue-700 bg-blue-100 rounded-full">88%</span>
                        </div>
                        {/* Assignment 2 Grade */}
                        <div key="assignment-grade-2" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Quiz 1: Basic Syntax</h4>
                            <p className="text-sm text-gray-600">Feedback: Excellent!</p>
                          </div>
                          <span className="px-3 py-1 text-lg font-bold text-green-700 bg-green-100 rounded-full">95%</span>
                        </div>
                        {/* Assignment 3 Grade */}
                        <div key="assignment-grade-3" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Project: Simple Calculator App</h4>
                            <p className="text-sm text-gray-600">Status: Pending Review</p>
                          </div>
                          <span className="px-3 py-1 text-lg font-bold text-gray-700 bg-gray-100 rounded-full">--</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Ongoing Tasks */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm w-80 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ongoing Task</h3>
              <button className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
                View All
              </button>
            </div>
            
            {/* Empty state for tasks */}
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="mb-2 font-semibold text-gray-900">No Recent Activity</h4>
              <p className="text-sm leading-relaxed text-gray-500">You don't have any recent activity to show here.</p>
            </div>
          </div>
        </div>
      </div>

      <CreateClassworkModal
        isOpen={isCreateClassworkModalOpen}
        onClose={() => setIsCreateClassworkModalOpen(false)}
        courseId={courseDetails?._id}
        onClassworkCreated={() => { fetchAssignments(); fetchStreamItems(); }}
        initialData={editingClasswork}
        type={classworkType}
      />

      <SubmitAssignmentModal
        isOpen={isSubmitAssignmentModalOpen}
        onClose={() => setIsSubmitAssignmentModalOpen(false)}
        assignmentId={submittingAssignmentId}
        courseId={courseDetails?._id}
        onSubmissionSuccess={fetchAssignments} // Refresh assignments to show submission status if needed
      />
    </>
  );
};

export default CourseDetailPage;