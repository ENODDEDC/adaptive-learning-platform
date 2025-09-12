'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayout } from '../../context/LayoutContext';

const ClustersPage = () => {
  const { openCreateClusterModal, openJoinClusterModal } = useLayout();
  const router = useRouter();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clusters');
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">
        Loading clusters...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen p-8 bg-gray-50">
      {/* Header */}
      <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Clusters</h1>
              <p className="text-sm text-gray-500">Manage your course clusters</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openCreateClusterModal}
              className="flex items-center justify-center w-10 h-10 text-white transition-colors bg-purple-600 shadow-sm rounded-xl hover:bg-purple-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={openJoinClusterModal}
              className="flex items-center justify-center w-10 h-10 text-white transition-colors bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clusters.length === 0 ? (
          <div className="col-span-full">
            <div className="p-8 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No clusters yet</h3>
              <p className="mb-4 text-gray-500">Create your first cluster to group related courses together.</p>
              <button
                onClick={openCreateClusterModal}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Create Cluster
              </button>
            </div>
          </div>
        ) : (
          clusters.map((cluster) => (
            <div key={cluster._id} className="overflow-hidden transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg">
              <div className={`h-32 relative p-5 flex flex-col justify-between ${cluster.coverColor} bg-gradient-to-br from-current to-opacity-90`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="px-2 py-1 text-xs font-medium text-white bg-black rounded bg-opacity-20">
                    {cluster.classCode}
                  </div>
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-bold">{cluster.name}</h3>
                  {cluster.section && <p className="text-sm opacity-90">{cluster.section}</p>}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <h4 className="mb-2 font-semibold text-gray-900">Courses ({cluster.courses?.length || 0})</h4>
                  <div className="space-y-2">
                    {cluster.courses?.slice(0, 3).map((course) => (
                      <div key={course._id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <div className={`w-3 h-3 rounded-full ${course.coverColor || '#60a5fa'}`}></div>
                        <span className="text-sm text-gray-700">{course.subject}</span>
                        {course.section && <span className="text-xs text-gray-500">({course.section})</span>}
                      </div>
                    ))}
                    {cluster.courses?.length > 3 && (
                      <p className="text-xs text-gray-500">+{cluster.courses.length - 3} more courses</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{cluster.enrolledUsers?.length || 0} members</span>
                  </div>
                  <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClustersPage;