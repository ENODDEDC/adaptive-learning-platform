'use client';

import React, { useState } from 'react';

const JoinCourseModal = ({ isOpen, onClose, onJoinCourse }) => {
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Join a Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="courseKey" className="block text-gray-700 text-sm font-bold mb-2">
              Enter Course Key:
            </label>
            <input
              type="text"
              id="courseKey"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2 focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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