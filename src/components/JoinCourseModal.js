'use client';

import React, { useState } from 'react';
import { useLayout } from '../context/LayoutContext';

const JoinCourseModal = ({ isOpen, onClose, onJoinCourse }) => {
  const { refreshCourses } = useLayout();
  const [courseKey, setCourseKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseKey.trim()) {
      setError('Course key cannot be empty.');
      return;
    }
    setError('');
    onJoinCourse(courseKey);
    refreshCourses(); // Refresh courses on the home page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Join a Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="courseKey" className="block mb-2 text-sm font-bold text-gray-700">
              Enter Course Key:
            </label>
            <input
              type="text"
              id="courseKey"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value)}
              required
            />
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
            >
              Join Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinCourseModal;