'use client';

import React, { useState } from 'react';
import { useLayout } from '../context/LayoutContext';

const JoinClusterModal = ({ isOpen, onClose, onJoinCluster }) => {
  const { refreshCourses } = useLayout();
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setError('Class code cannot be empty.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onJoinCluster(classCode);
      refreshCourses();
      onClose();
      setClassCode('');
    } catch (error) {
      setError('Failed to join cluster. Please check the class code.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Join a Cluster</h2>
        <p className="mb-4 text-sm text-gray-600">
          Enter the cluster class code to join and automatically enroll in all courses within the cluster.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="classCode" className="block mb-2 text-sm font-bold text-gray-700">
              Enter Cluster Class Code:
            </label>
            <input
              type="text"
              id="classCode"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              required
            />
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
            >
              {loading ? 'Joining...' : 'Join Cluster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinClusterModal;