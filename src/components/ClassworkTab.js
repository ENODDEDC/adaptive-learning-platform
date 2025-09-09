'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import CreateClassworkModal from '@/components/CreateClassworkModal';
import SubmitAssignmentModal from '@/components/SubmitAssignmentModal';

const ClassworkTab = ({ courseDetails, isInstructor }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  const [isClassworkMenuOpen, setIsClassworkMenuOpen] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState(null);
  const [classworkType, setClassworkType] = useState('assignment');
  const [isSubmitAssignmentModalOpen, setIsSubmitAssignmentModalOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
      let classwork = data.classwork;

      if (sortBy === 'newest') {
        classwork.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        classwork.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setAssignments(classwork);

      const submissionsRes = await fetch(`/api/courses/${courseDetails._id}/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions);
      }

    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch assignments:', err);
    }
  }, [courseDetails, sortBy]);

  useEffect(() => {
    if (courseDetails) {
      fetchAssignments();
    }
  }, [courseDetails, fetchAssignments, sortBy]);

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

      fetchAssignments();
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete classwork:', err);
    }
  }, [fetchAssignments]);

  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Manage Classwork</h2>
          <div className="relative inline-block text-left">
            <div>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                onClick={() => setIsClassworkMenuOpen(!isClassworkMenuOpen)}
              >
                Create New Classwork
                <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div id="classwork-menu" className={`absolute left-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${isClassworkMenuOpen ? '' : 'hidden'}`}>
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

      <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>All</button>
              <button onClick={() => setFilter('assignment')} className={`px-3 py-1 text-sm rounded-full ${filter === 'assignment' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Assignments</button>
              <button onClick={() => setFilter('quiz')} className={`px-3 py-1 text-sm rounded-full ${filter === 'quiz' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Quizzes</button>
              <button onClick={() => setFilter('material')} className={`px-3 py-1 text-sm rounded-full ${filter === 'material' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Materials</button>
            </div>
            <select onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 text-sm bg-gray-200 border-none rounded-full">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-gray-600">No assignments yet.</p>
          ) : (
            assignments.filter(item => filter === 'all' || item.type === filter).map((assignment) => {
              const submission = submissions.find(s => s.assignment === assignment._id);
              return (
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
                  ) : submission ? (
                    <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                      Submitted
                    </span>
                  ) : (
                    <button
                      onClick={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                      className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
                    >
                      Submit
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateClassworkModal
        isOpen={isCreateClassworkModalOpen}
        onClose={() => {
          setIsCreateClassworkModalOpen(false);
          setEditingClasswork(null);
        }}
        courseId={courseDetails?._id}
        onClassworkCreated={fetchAssignments}
        initialData={editingClasswork}
        type={classworkType}
      />

      <SubmitAssignmentModal
        isOpen={isSubmitAssignmentModalOpen}
        onClose={() => setIsSubmitAssignmentModalOpen(false)}
        assignmentId={submittingAssignmentId}
        courseId={courseDetails?._id}
        onSubmissionSuccess={fetchAssignments}
      />
    </div>
  );
};

export default ClassworkTab;