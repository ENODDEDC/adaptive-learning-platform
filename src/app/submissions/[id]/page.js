'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const SubmissionGradingPage = ({ params }) => {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/submissions/${id}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setSubmission(data.submission);
      setGrade(data.submission.grade !== null && data.submission.grade !== undefined ? data.submission.grade.toString() : '');
      setFeedback(data.submission.feedback || '');
    } catch (err) {
      console.error('Failed to fetch submission:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    
    fetchUser();
    fetchSubmission();
  }, [fetchSubmission]);

  // Check if user is instructor
  useEffect(() => {
    if (submission && user) {
      // Check if user is the course creator or co-teacher
      const courseCreatorId = submission.assignmentId?.courseId?.createdBy?._id || submission.assignmentId?.courseId?.createdBy;
      const currentUserId = user._id || user.id;
      const coTeachers = submission.assignmentId?.courseId?.coTeachers || [];
      
      console.log('🔍 Instructor Check:', {
        courseCreatorId,
        currentUserId,
        coTeachers,
        hasCourseData: !!submission.assignmentId?.courseId
      });
      
      const userIsInstructor = courseCreatorId === currentUserId || 
        coTeachers.some(t => (t._id || t) === currentUserId);
      
      console.log('👨‍🏫 Is Instructor:', userIsInstructor);
      setIsInstructor(userIsInstructor);
    }
  }, [submission, user]);

  const handleSaveGrade = async () => {
    if (!grade || isNaN(grade) || grade < 0 || grade > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: parseFloat(grade),
          feedback: feedback.trim()
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      alert('Grade saved successfully!');
      fetchSubmission();
    } catch (err) {
      console.error('Failed to save grade:', err);
      alert('Failed to save grade: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error Loading Submission</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Submission not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scores
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Grade Submission</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Student Info */}
            <div className="p-6 mb-6 bg-white border border-gray-200 rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden bg-blue-600 rounded-full">
                  {submission.studentId?.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={submission.studentId.profilePicture} 
                      alt={submission.studentId.name || 'Student'} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-white">
                      {submission.studentId?.name ? submission.studentId.name.charAt(0).toUpperCase() : 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{submission.studentId?.name || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-600">{submission.studentId?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="p-6 mb-6 bg-white border border-gray-200 rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Assignment</h2>
              <h3 className="text-xl font-semibold text-gray-900">{submission.assignmentId?.title || 'Unknown Assignment'}</h3>
              <p className="mt-2 text-sm text-gray-600 capitalize">{submission.assignmentId?.type || 'assignment'}</p>
              {submission.assignmentId?.description && (
                <p className="mt-4 text-gray-700">{submission.assignmentId.description}</p>
              )}
            </div>

            {/* Submission Content */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Submission</h2>
              
              {submission.submittedAt && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Submitted on: </span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(submission.submittedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}

              {/* Text Content */}
              {submission.content && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Written Response</h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {submission.attachments && submission.attachments.length > 0 && (
                <div className={submission.content ? 'mt-4' : ''}>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Attachments ({submission.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {submission.attachments.map((attachment, index) => {
                      const fileUrl = attachment.cloudStorage?.url || attachment.url || attachment.fileUrl || `/api/files/${attachment.cloudStorage?.key || attachment._id}`;
                      return (
                        <a
                          key={index}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all group"
                        >
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {attachment.originalName || attachment.title || attachment.name || `Attachment ${index + 1}`}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No submission message - only show if both content and attachments are missing */}
              {!submission.content && (!submission.attachments || submission.attachments.length === 0) && (
                <div className="p-8 text-center bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
                  <svg className="w-12 h-12 mx-auto mb-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-yellow-800 font-semibold text-lg mb-2">Empty Submission</p>
                  <p className="text-yellow-700 text-sm mb-3">
                    The student marked this assignment as submitted but did not include any written response or file attachments.
                  </p>
                  <p className="text-yellow-600 text-xs">
                    You can still grade this submission or contact the student to resubmit with proper content.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grading Panel - Only for Instructors */}
          <div className="lg:col-span-1">
            <div className="sticky p-6 bg-white border border-gray-200 top-8 rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {submission.studentId?._id === user?._id ? 'Your Grade' : 'Grading'}
              </h2>
              
              {/* Current Status */}
              <div className="mb-4">
                <span className="text-sm text-gray-600">Status: </span>
                {submission.status === 'submitted' ? (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                    Draft
                  </span>
                )}
              </div>

              {/* Grade Input - Only for Instructors */}
              {isInstructor ? (
                <>
                  {/* Warning for empty submissions */}
                  {!submission.content && (!submission.attachments || submission.attachments.length === 0) && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ This is an empty submission. Consider giving a low grade or 0, or ask the student to resubmit.
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter grade"
                    />
                  </div>

                  {/* Feedback */}
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Feedback
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Provide feedback to the student..."
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveGrade}
                    disabled={saving}
                    className="w-full px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Grade'}
                  </button>
                </>
              ) : (
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-800">
                    You can view your submission and grade here. Only instructors can modify grades.
                  </p>
                </div>
              )}

              {/* Current Grade Display */}
              {submission.grade !== null && submission.grade !== undefined && (
                <div className="p-4 mt-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">Current Grade</p>
                  <p className={`text-3xl font-bold ${
                    submission.grade >= 90 ? 'text-green-600' :
                    submission.grade >= 70 ? 'text-blue-600' :
                    submission.grade >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {submission.grade}%
                  </p>
                  {submission.gradedAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Graded on {format(new Date(submission.gradedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Display for Students */}
              {!isInstructor && submission.feedback && (
                <div className="p-4 mt-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="mb-2 text-sm font-medium text-gray-700">Teacher Feedback</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionGradingPage;
