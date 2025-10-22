'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isPast } from 'date-fns';
import ContentViewer from './ContentViewer.client';
import FileUpload from './FileUpload';

const StudentAssignmentModal = ({ isOpen, onClose, assignment, courseId, onSubmissionSuccess }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [viewingContent, setViewingContent] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmission();
      setShowSubmitForm(false);
    }
  }, [isOpen, assignment]);

  const fetchSubmission = async () => {
    if (!assignment?._id || !courseId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/submissions?assignmentId=${assignment._id}`);
      if (res.ok) {
        const data = await res.json();
        const mySubmission = data.submissions?.[0] || null;
        setSubmission(mySubmission);
        
        if (mySubmission && mySubmission.status === 'draft') {
          setContent(mySubmission.content || '');
          setFiles(mySubmission.attachments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesReady = useCallback((newFiles) => {
    setFiles(newFiles);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignment?._id || !courseId) return;

    setSubmitting(true);
    try {
      // Extract only the MongoDB IDs from files
      const attachmentIds = files
        .filter(f => f._id) // Only include files that have been saved to MongoDB
        .map(f => f._id);

      // If submission exists, update it
      if (submission && submission._id) {
        const res = await fetch(`/api/submissions/${submission._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            attachments: attachmentIds,
            status: 'submitted',
            progress: 100
          })
        });

        if (!res.ok) throw new Error('Failed to submit assignment');
      } else {
        // Create new submission
        const res = await fetch(`/api/courses/${courseId}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: assignment._id,
            content,
            attachments: attachmentIds,
            status: 'submitted',
            progress: 100
          })
        });

        if (!res.ok) throw new Error('Failed to submit assignment');
      }

      // Refresh submission data
      await fetchSubmission();
      setShowSubmitForm(false);
      setContent('');
      setFiles([]);
      
      if (onSubmissionSuccess) onSubmissionSuccess();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!assignment?._id || !courseId) return;

    setSubmitting(true);
    try {
      // Extract only the MongoDB IDs from files
      const attachmentIds = files
        .filter(f => f._id) // Only include files that have been saved to MongoDB
        .map(f => f._id);

      if (submission && submission._id) {
        await fetch(`/api/submissions/${submission._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            attachments: attachmentIds,
            status: 'draft',
            progress: Math.min(100, Math.max(0, (content.length > 0 || attachmentIds.length > 0) ? 50 : 0))
          })
        });
      } else {
        await fetch(`/api/courses/${courseId}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: assignment._id,
            content,
            attachments: attachmentIds,
            status: 'draft',
            progress: Math.min(100, Math.max(0, (content.length > 0 || attachmentIds.length > 0) ? 50 : 0))
          })
        });
      }

      await fetchSubmission();
      setShowSubmitForm(false);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  const isOverdue = assignment.dueDate && isPast(new Date(assignment.dueDate));
  const canSubmit = !isOverdue && (!submission || submission.status !== 'submitted');
  const hasSubmitted = submission && submission.status === 'submitted';
  const hasGrade = submission && submission.grade !== null && submission.grade !== undefined;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">{assignment.title}</h2>
                  <div className="flex items-center space-x-4 mt-1">
                    {assignment.dueDate && (
                      <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy \'at\' h:mm a')}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    )}
                    {hasGrade && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Graded: {submission.grade}/100
                      </span>
                    )}
                    {hasSubmitted && !hasGrade && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : showSubmitForm ? (
              /* Submit Form */
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
                    Your Work (Optional)
                  </label>
                  <textarea
                    id="content"
                    rows="6"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Write your response here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Attach Files (Optional)
                  </label>
                  <FileUpload
                    onFilesReady={handleFilesReady}
                    initialFiles={files}
                    folder={`submissions/${courseId}/${assignment._id}`}
                    courseId={courseId}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            ) : (
              /* Assignment Details */
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {assignment.description || 'No instructions provided.'}
                  </p>
                </div>

                {/* Attachments */}
                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignment.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => setViewingContent(attachment)}
                          className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                        >
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.originalName || attachment.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Status */}
                {hasSubmitted && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Submission</h3>
                    
                    {/* Submission Content */}
                    {submission.content && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Work</label>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                        </div>
                      </div>
                    )}

                    {/* Submission Attachments */}
                    {submission.attachments && submission.attachments.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Files ({submission.attachments.length})
                        </label>
                        <div className="space-y-2">
                          {submission.attachments.map((attachment, index) => (
                            <button
                              key={index}
                              onClick={() => setViewingContent(attachment)}
                              className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all text-left group"
                            >
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Grade and Feedback */}
                    {hasGrade && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-green-900">Your Grade</span>
                          <span className="text-2xl font-bold text-green-700">{submission.grade}/100</span>
                        </div>
                        {submission.feedback && (
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">Teacher's Feedback</label>
                            <p className="text-sm text-green-800 whitespace-pre-wrap">{submission.feedback}</p>
                          </div>
                        )}
                        {submission.gradedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Graded on {format(new Date(submission.gradedAt), 'MMM dd, yyyy \'at\' h:mm a')}
                          </p>
                        )}
                      </div>
                    )}

                    {!hasGrade && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Your assignment has been submitted and is waiting to be graded by your teacher.
                        </p>
                        {submission.submittedAt && (
                          <p className="text-xs text-blue-600 mt-2">
                            Submitted on {format(new Date(submission.submittedAt), 'MMM dd, yyyy \'at\' h:mm a')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                {canSubmit && !showSubmitForm && (
                  <div className="border-t border-gray-200 pt-6">
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="w-full py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {submission && submission.status === 'draft' ? 'Continue Submission' : 'Submit Assignment'}
                    </button>
                  </div>
                )}

                {/* Overdue Message */}
                {isOverdue && !hasSubmitted && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      This assignment is overdue. You can no longer submit your work.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Viewer */}
      {viewingContent && (
        <ContentViewer
          content={viewingContent}
          onClose={() => setViewingContent(null)}
        />
      )}
    </>
  );
};

export default StudentAssignmentModal;
