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

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/submissions/${id}`);
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
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
    fetchSubmission();
  }, [fetchSubmission]);

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

              {submission.content ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{submission.content}</p>
                </div>
              ) : (
                <p className="text-gray-500">No content submitted</p>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Attachments</h3>
                  <div className="space-y-2">
                    {submission.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-700">{attachment.name || `Attachment ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-1">
            <div className="sticky p-6 bg-white border border-gray-200 top-8 rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Grading</h2>
              
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

              {/* Grade Input */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionGradingPage;
