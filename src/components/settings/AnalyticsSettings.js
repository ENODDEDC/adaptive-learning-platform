'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  AcademicCapIcon, 
  ArrowPathIcon,
  SparklesIcon,
  FireIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AnalyticsSettings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning-behavior/track');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            Analytics & Insights
          </h2>
          <p className="mt-2 text-gray-600">
            View your learning analytics and progress
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="font-medium">Refresh Data</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Interactions Card */}
        <div className="bg-blue-600 rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <AcademicCapIcon className="w-10 h-10" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {stats?.totalInteractions || 0}
          </p>
          <p className="text-blue-100 text-sm font-medium">Total Interactions</p>
        </div>

        {/* Total Learning Time Card */}
        <div className="bg-green-600 rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="w-10 h-10" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {stats?.totalLearningTime ? formatTime(stats.totalLearningTime) : '0m'}
          </p>
          <p className="text-green-100 text-sm font-medium">Total Learning Time</p>
        </div>

        {/* Learning Sessions Card */}
        <div className="bg-purple-600 rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <TrophyIcon className="w-10 h-10" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {stats?.totalSessions || 0}
          </p>
          <p className="text-purple-100 text-sm font-medium">Learning Sessions</p>
        </div>
      </div>

      {/* Mode Usage */}
      {stats?.modeUsageSummary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Learning Mode Usage
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.modeUsageSummary).map(([mode, data]) => {
              const modeNames = {
                aiNarrator: 'AI Narrator',
                visualLearning: 'Visual Learning',
                sequentialLearning: 'Sequential Learning',
                globalLearning: 'Global Learning',
                sensingLearning: 'Hands-On Lab',
                intuitiveLearning: 'Concept Constellation',
                activeLearning: 'Active Learning Hub',
                reflectiveLearning: 'Reflective Learning'
              };

              const modeColors = {
                aiNarrator: 'bg-blue-600',
                visualLearning: 'bg-purple-600',
                sequentialLearning: 'bg-indigo-600',
                globalLearning: 'bg-pink-600',
                sensingLearning: 'bg-green-600',
                intuitiveLearning: 'bg-yellow-600',
                activeLearning: 'bg-red-600',
                reflectiveLearning: 'bg-teal-600'
              };

              const maxCount = Math.max(...Object.values(stats.modeUsageSummary).map(m => m.count));
              const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;

              return (
                <div key={mode}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {modeNames[mode] || mode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {data.count} uses
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(data.totalTime)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-full ${modeColors[mode] || 'bg-blue-600'} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Quality */}
      {stats?.dataQuality && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Data Quality
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Completeness */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Completeness</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.dataQuality.completeness}%
              </p>
            </div>

            {/* Total Interactions */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Interactions</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.dataQuality.totalInteractions}
              </p>
            </div>

            {/* Total Time */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatTime(stats.dataQuality.totalTime)}
              </p>
            </div>

            {/* ML Ready */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">ML Ready</p>
              <p className="text-3xl font-bold">
                {stats.dataQuality.sufficientForML ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-orange-600">✗</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSettings;
