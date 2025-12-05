'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import ContentViewer from './ContentViewer.client';

const TeacherAssignmentModal = ({ isOpen, onClose, assignment, courseId, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);

  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmissions();
      setActiveTab('details');
    }
  }, [isOpen, assignment]);

  const fetchSubmissions = async () => {
    if (!assignment?._id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignment._id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    if (!submissionId || gradeInput === '') return;

    setSavingGrade(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseFloat(gradeInput),
          feedback: feedbackInput
        })
      });

      if (res.ok) {
        await fetchSubmissions();
        setSelectedSubmission(null);
        setGradeInput('');
        setFeedbackInput('');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Failed to save grade:', error);
    } finally {
      setSavingGrade(false);
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeInput(submission.grade?.toString() || '');
    setFeedbackInput(submission.feedback || '');
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const graded = submissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    const notSubmitted = total - submitted;

    return { total, submitted, graded, notSubmitted };
  };

  if (!isOpen || !assignment) return null;

  const stats = getSubmissionStats();

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{assignment.title}</h2>
                {assignment.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Due {format(new Date(assignment.dueDate), 'MMM dd, yyyy \'at\' h:mm a')}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2.5 font-medium text-sm transition-all relative ${
                  activeTab === 'details'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2.5 font-medium text-sm transition-all relative flex items-center gap-2 ${
                  activeTab === 'submissions'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Submissions
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                  {stats.submitted}/{stats.total}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {assignment.description || 'No description provided.'}
                  </p>
                </div>

                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Attachments</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignment.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => setViewingContent(attachment)}
                          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-lg transition-all text-left"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.originalName || attachment.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Document'}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600 mt-1.5">Total Students</p>
                  </div>
                  <div className="p-5 bg-white border border-green-200 rounded-lg hover:border-green-300 transition-colors">
                    <p className="text-3xl font-bold text-green-600">{stats.submitted}</p>
                    <p className="text-sm text-gray-600 mt-1.5">Submitted</p>
                  </div>
                  <div className="p-5 bg-white border border-purple-200 rounded-lg hover:border-purple-300 transition-colors">
                    <p className="text-3xl font-bold text-purple-600">{stats.graded}</p>
                    <p className="text-sm text-gray-600 mt-1.5">Graded</p>
                  </div>
                  <div className="p-5 bg-white border border-orange-200 rounded-lg hover:border-orange-300 transition-colors">
                    <p className="text-3xl font-bold text-orange-600">{stats.notSubmitted}</p>
                    <p className="text-sm text-gray-600 mt-1.5">Not Submitted</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading submissions...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission, index) => (
                      <div
                        key={submission._id || index}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {submission.studentId?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {submission.studentId?.name || 'Unknown Student'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {submission.studentId?.email || ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {/* Status */}
                            <div className="text-right">
                              {submission.status === 'submitted' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  Not Submitted
                                </span>
                              )}
                              {submission.submittedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(new Date(submission.submittedAt), 'MMM dd, h:mm a')}
                                </p>
                              )}
                            </div>

                            {/* Grade */}
                            {submission.status === 'submitted' && (
                              <div className="flex items-center space-x-3">
                                {/* View Attachments Button */}
                                {submission.attachments && submission.attachments.length > 0 && (
                                  <button
                                    onClick={() => openGradeModal(submission)}
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span>{submission.attachments.length}</span>
                                  </button>
                                )}
                                
                                {/* Grade Display/Button */}
                                <div className="text-right">
                                  {submission.grade !== null && submission.grade !== undefined ? (
                                    <div>
                                      <p className="text-lg font-bold text-blue-600">{submission.grade}/100</p>
                                      <p className="text-xs text-gray-500">Graded</p>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => openGradeModal(submission)}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Grade
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Submission Content Preview */}
                        {submission.status === 'submitted' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {submission.content && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-600 mb-1">Student Response:</p>
                                <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded">
                                  {submission.content}
                                </p>
                              </div>
                            )}
                            {submission.attachments && submission.attachments.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-600 mb-2">Attached Files:</p>
                                <div className="space-y-1.5">
                                  {submission.attachments.map((attachment, attIndex) => (
                                    <button
                                      key={attIndex}
                                      onClick={() => setViewingContent(attachment)}
                                      className="w-full flex items-center space-x-2 p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left group"
                                    >
                                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-900 truncate">
                                          {attachment.originalName || attachment.title || 'Attachment'}
                                        </p>
                                        {attachment.fileSize && (
                                          <p className="text-xs text-blue-600">
                                            {Math.round(attachment.fileSize / 1024)} KB
                                          </p>
                                        )}
                                      </div>
                                      <svg className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {submission.grade !== null && submission.grade !== undefined && submission.feedback && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <p className="font-medium text-blue-900 mb-1">Feedback:</p>
                                <p className="text-blue-700">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grade Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Grade Submission</h3>
              <p className="text-sm text-gray-600 mt-1">
                Student: {selectedSubmission.studentId?.name}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Submission Content */}
              {selectedSubmission.content && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Student's Work</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Attachments ({selectedSubmission.attachments.length})
                  </label>
                  <div className="space-y-2">
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <button
                        key={index}
                        onClick={() => setViewingContent(attachment)}
                        className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all text-left group"
                      >
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {attachment.originalName || attachment.title || 'Attachment'}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            {attachment.fileSize && (
                              <span className="text-xs text-gray-600">
                                {Math.round(attachment.fileSize / 1024)} KB
                              </span>
                            )}
                            {attachment.mimeType && (
                              <span className="text-xs text-gray-500">
                                {attachment.mimeType.split('/')[1]?.toUpperCase() || 'File'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view
                          </span>
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Input */}
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-900 mb-2">
                  Grade (0-100)
                </label>
                <input
                  type="number"
                  id="grade"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter grade"
                />
              </div>

              {/* Feedback */}
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-900 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Provide feedback to the student..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeInput('');
                  setFeedbackInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={savingGrade}
              >
                Cancel
              </button>
              <button
                onClick={() => handleGradeSubmission(selectedSubmission._id)}
                disabled={savingGrade || gradeInput === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingGrade ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer */}
      {viewingContent && (
        <ContentViewer
          content={viewingContent}
          onClose={() => setViewingContent(null)}
        />
      )}
    </>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default TeacherAssignmentModal;
