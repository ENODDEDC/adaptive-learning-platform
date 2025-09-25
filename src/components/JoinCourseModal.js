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
      await onJoinCourse(courseKey);
      refreshCourses(); // Refresh courses on the home page
    } catch (error) {
      console.error('Error joining course:', error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
              <UserPlusIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 id="join-modal-title" className="text-xl font-bold text-gray-900">Join a Course</h2>
              <p className="text-sm text-gray-500">Enter the course key to join</p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <input
              type="text"
              id="courseKey"
              className="w-full px-4 pt-6 pb-3 text-gray-900 placeholder-transparent border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent peer transition-all duration-200"
              placeholder="Course Key"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value)}
              required
            />
            <label
              htmlFor="courseKey"
              className="absolute left-4 top-4 text-gray-500 text-sm transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600 peer-valid:top-2 peer-valid:text-xs peer-valid:text-green-600"
            >
              Course Key *
            </label>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!courseKey.trim() || isLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
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