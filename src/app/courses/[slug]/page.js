'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import CreateClassworkModal from '@/components/CreateClassworkModal';
import UploadContentModal from '@/components/UploadContentModal';
import CourseContentTab from '@/components/CourseContentTab';

const ContentViewer = dynamic(() => import('@/components/ContentViewer.client'), { ssr: false });

const CourseDetailPage = ({ params }) => {
  const { slug } = React.use(params); // slug is now courseId
  const [expandedActivities, setExpandedActivities] = useState({});
  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [isInstructor, setIsInstructor] = useState(true); // For demonstration, set to true for instructor view
  const [courseDetails, setCourseDetails] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [courseContent, setCourseContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentFilter, setContentFilter] = useState('all');

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

  const fetchAnnouncements = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch announcements:', err);
    }
  }, [courseDetails]);

  useEffect(() => {
    if (courseDetails) {
      fetchAnnouncements();
    }
  }, [courseDetails, fetchAnnouncements]);

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
      fetchAnnouncements(); // Refresh announcements
    } catch (err) {
      setError(err.message);
      console.error('Failed to post announcement:', err);
    }
  }, [newAnnouncementContent, courseDetails, fetchAnnouncements]);

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

  return (
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
            <div className="flex items-center gap-4 p-3 transition-colors rounded-lg hover:bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
              </div>
              <span className="text-sm font-medium text-gray-800">Intro to Programming I</span>
            </div>
            
            {/* Module 2 */}
            <div className="flex items-center gap-4 p-3 transition-colors rounded-lg hover:bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
              </div>
              <span className="text-sm font-medium text-gray-800">Intro to Programming II</span>
            </div>
            
            {/* Module 3 - Current */}
            <div className="flex items-center gap-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
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
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'content' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('content')}
            >
              Content
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

          {/* Tab Content */}
          {activeTab === 'stream' && (
            <div className="space-y-6">
              {/* Post Announcement Section */}
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

              {/* Announcements Section */}
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Announcements</h2>
                {announcements.length === 0 ? (
                  <p className="text-gray-600">No announcements yet.</p>
                ) : (
                  <div className="space-y-6">
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="pb-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="text-sm font-semibold text-white">
                              {announcement.postedBy?.name ? announcement.postedBy.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{announcement.postedBy?.name || 'Unknown User'}</span>
                              {isInstructor && (
                                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Instructor</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <p className="leading-relaxed text-gray-700">{announcement.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'classwork' && (
            <div className="space-y-6">
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Classwork</h2>
                <p className="text-gray-600">Classwork management coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <CourseContentTab 
                courseId={slug} 
                isInstructor={isInstructor}
              />
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">People</h2>
                <p className="text-gray-600">People management coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'marks' && (
            <div className="space-y-6">
              <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Marks</h2>
                <p className="text-gray-600">Marks management coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateClassworkModal
        isOpen={isCreateClassworkModalOpen}
        onClose={() => setIsCreateClassworkModalOpen(false)}
        courseId={slug}
        editingClasswork={editingClasswork}
      />

      <UploadContentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        courseId={slug}
        onUploadSuccess={(newContent) => {
          setCourseContent(prev => [newContent, ...prev]);
        }}
      />

      {selectedContent && (
        <ContentViewer
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          isModal={true}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;