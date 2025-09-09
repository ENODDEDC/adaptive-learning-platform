'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import UploadContentModal from '@/components/UploadContentModal';
import CourseContentTab from '@/components/CourseContentTab';
import StreamTab from '@/components/StreamTab';
import ClassworkTab from '@/components/ClassworkTab';

const ContentViewer = dynamic(() => import('@/components/ContentViewer.client'), { ssr: false });

const CourseDetailPage = ({ params }) => {
  const { slug } = React.use(params); // slug is now courseId
  const [activeTab, setActiveTab] = useState('stream'); // Default to 'Stream' tab
  const [isInstructor, setIsInstructor] = useState(true); // For demonstration, set to true for instructor view
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

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

            {/* Conditional Rendering based on activeTab */}
            {activeTab === 'stream' && (
              <StreamTab courseDetails={courseDetails} isInstructor={isInstructor} />
            )}

            {activeTab === 'classwork' && (
              <ClassworkTab courseDetails={courseDetails} isInstructor={isInstructor} />
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

      <UploadContentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        courseId={slug}
        onUploadSuccess={(newContent) => {
          // Check which modal should receive the upload
          // For now, let's assume it's for the announcement
          setAnnouncementAttachments(prev => [...prev, newContent]);
          setIsUploadModalOpen(false);
        }}
      />

      {selectedContent && (
        <ContentViewer
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          isModal={true}
        />
      )}
    </>
  );
};

export default CourseDetailPage;