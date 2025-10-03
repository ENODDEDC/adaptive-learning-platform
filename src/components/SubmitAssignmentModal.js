import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from './FileUpload';

const SubmitAssignmentModal = ({ isOpen, onClose, assignmentId, onSubmissionSuccess, initialContent = '', initialAttachments = [] }) => {
  const [content, setContent] = useState(initialContent);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFilesReady = useCallback((newFiles) => {
    setFiles(newFiles);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setAttachments(initialAttachments);
      setError('');
    }
  }, [isOpen, initialContent, initialAttachments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/courses/${assignmentId}/submissions`, { // Note: assignmentId is used as courseId in the API route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          content,
          attachments: [...attachments, ...files],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      onSubmissionSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Failed to submit assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">Submit Assignment</h2>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="block mb-2 text-sm font-medium text-gray-700">Your Work (Optional)</label>
            <textarea
              id="content"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Attach Files</label>
            <FileUpload onFilesReady={handleFilesReady} />
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;