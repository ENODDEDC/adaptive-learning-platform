'use client';

import React, { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';
import { UserPlusIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const JoinCourseModal = ({ isOpen, onClose, onJoinCourse }) => {
  const { refreshCourses } = useLayout();
  const [courseKey, setCourseKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseKey.trim()) {
      setError('Course key cannot be empty.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await onJoinCourse(courseKey.trim().toUpperCase()); // Ensure uppercase and trimmed
      refreshCourses(); // Refresh courses on the home page
      setCourseKey(''); // Clear the input on success
    } catch (error) {
      console.error('Error joining course:', error);
      setError(error.message || 'Failed to join course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first input
      setTimeout(() => {
        document.getElementById('courseKey')?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 id="join-modal-title" className="text-lg font-semibold text-gray-900">Join a Course</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enter the course key to join</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label htmlFor="courseKey" className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Key *
            </label>
            <input
              type="text"
              id="courseKey"
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="e.g., ABC123"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!courseKey.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinCourseModal;