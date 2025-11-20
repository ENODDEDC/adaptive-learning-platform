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
      // Fetch behavior stats
      const res = await fetch('/api/learning-behavior/track');
      if (res.ok) {
        const data = await res.json();
        
        // Also fetch ML confidence from profile (only if classified)
        const profileRes = await fetch('/api/learning-style/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const profile = profileData.data?.profile || profileData.profile;
          if (profile && profile.hasBeenClassified && profile.mlConfidenceScore !== undefined) {
            data.data.mlConfidenceScore = profile.mlConfidenceScore;
            data.data.hasBeenClassified = profile.hasBeenClassified;
          }
        }
        
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

      {/* Threshold Progress Banner */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">Classification Journey</h3>
              <p className="text-blue-100 text-sm">Track your progress toward research-validated accuracy</p>
            </div>
            <TrophyIcon className="w-12 h-12 text-yellow-300" />
          </div>
          
          {(() => {
            const totalInteractions = stats.totalInteractions || 0;
            const nextThreshold = totalInteractions < 50 ? 50 : totalInteractions < 100 ? 100 : totalInteractions < 200 ? 200 : Math.ceil(totalInteractions / 50) * 50 + 50;
            const progress = (totalInteractions / nextThreshold) * 100;
            
            return (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">
                      {totalInteractions} / {nextThreshold} interactions
                    </span>
                    <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                      {nextThreshold - totalInteractions} to go
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {[50, 100, 200].map((threshold) => {
                    const reached = totalInteractions >= threshold;
                    return (
                      <div
                        key={threshold}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                          reached
                            ? 'bg-green-400 text-green-900'
                            : 'bg-white/20 text-white/60'
                        }`}
                      >
                        {reached ? '✓' : ''} {threshold}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

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

      {/* AI Assistant Usage */}
      {stats?.aiAssistantUsage && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            AI Assistant Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Ask Mode */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Ask Mode</span>
                <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.aiAssistantUsage.askMode?.count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Quick questions</p>
            </div>

            {/* Research Mode */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Research Mode</span>
                <span className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded">Reflective</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.aiAssistantUsage.researchMode?.count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Deep exploration</p>
            </div>

            {/* Text to Docs Mode */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Text to Docs</span>
                <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">Sensing</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.aiAssistantUsage.textToDocsMode?.count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Practical outputs</p>
            </div>
          </div>

          {/* AI Assistant Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.aiAssistantUsage.totalInteractions || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Avg. Prompt Length</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.aiAssistantUsage.averagePromptLength || 0)} chars
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* ML Classification Confidence - Only show if classification has happened */}
      {stats?.hasBeenClassified && stats?.mlConfidenceScore !== undefined && stats.mlConfidenceScore > 0 && (
        <div className={`rounded-lg border-2 p-6 ${
          (stats.mlConfidenceScore || 0) >= 0.80 ? 'bg-green-50 border-green-300' :
          (stats.mlConfidenceScore || 0) >= 0.65 ? 'bg-yellow-50 border-yellow-300' :
          (stats.mlConfidenceScore || 0) >= 0.50 ? 'bg-orange-50 border-orange-300' :
          'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className={`w-6 h-6 ${
                (stats.mlConfidenceScore || 0) >= 0.80 ? 'text-green-600' :
                (stats.mlConfidenceScore || 0) >= 0.65 ? 'text-yellow-600' :
                (stats.mlConfidenceScore || 0) >= 0.50 ? 'text-orange-600' :
                'text-red-600'
              }`} />
              Real ML Model Confidence
            </h3>
            <span className={`px-4 py-2 rounded-full text-lg font-bold border-2 ${
              (stats.mlConfidenceScore || 0) >= 0.80 ? 'bg-green-100 text-green-800 border-green-400' :
              (stats.mlConfidenceScore || 0) >= 0.65 ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
              (stats.mlConfidenceScore || 0) >= 0.50 ? 'bg-orange-100 text-orange-800 border-orange-400' :
              'bg-red-100 text-red-800 border-red-400'
            }`}>
              {((stats.mlConfidenceScore || 0) * 100).toFixed(1)}%
            </span>
          </div>

          {/* ML Confidence Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
              <span>0% (Low)</span>
              <span>50% (Moderate)</span>
              <span>65% (Good)</span>
              <span>80%+ (High)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 flex items-center justify-center ${
                  (stats.mlConfidenceScore || 0) >= 0.80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  (stats.mlConfidenceScore || 0) >= 0.65 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  (stats.mlConfidenceScore || 0) >= 0.50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${((stats.mlConfidenceScore || 0) * 100).toFixed(1)}%` }}
              >
                <span className="text-xs font-bold text-white">
                  {((stats.mlConfidenceScore || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              (stats.mlConfidenceScore || 0) >= 0.80 ? 'bg-white border-green-200' :
              (stats.mlConfidenceScore || 0) >= 0.65 ? 'bg-white border-yellow-200' :
              (stats.mlConfidenceScore || 0) >= 0.50 ? 'bg-white border-orange-200' :
              'bg-white border-red-200'
            }`}>
              <p className="text-sm font-semibold text-gray-700 mb-2">ML Confidence Level</p>
              <p className={`text-2xl font-bold ${
                (stats.mlConfidenceScore || 0) >= 0.80 ? 'text-green-700' :
                (stats.mlConfidenceScore || 0) >= 0.65 ? 'text-yellow-700' :
                (stats.mlConfidenceScore || 0) >= 0.50 ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {(stats.mlConfidenceScore || 0) >= 0.80 && '✓ High'}
                {(stats.mlConfidenceScore || 0) >= 0.65 && (stats.mlConfidenceScore || 0) < 0.80 && '⚡ Good'}
                {(stats.mlConfidenceScore || 0) >= 0.50 && (stats.mlConfidenceScore || 0) < 0.65 && '📊 Moderate'}
                {(stats.mlConfidenceScore || 0) < 0.50 && '🌱 Low'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Real ML model confidence score
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Model Certainty</p>
              <p className="text-2xl font-bold text-blue-700">
                {(stats.mlConfidenceScore || 0) >= 0.80 ? '🎉 High Certainty' :
                 (stats.mlConfidenceScore || 0) >= 0.65 ? '⚡ Good Certainty' :
                 (stats.mlConfidenceScore || 0) >= 0.50 ? '📊 Moderate' :
                 '🌱 Low Certainty'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Based on {stats.dataQuality?.interactionCount || stats.dataQuality?.totalInteractions || 0} interactions. More data improves confidence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality */}
      {stats?.dataQuality && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Data Quality Metrics
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
                {stats.dataQuality.interactionCount || stats.dataQuality.totalInteractions}
              </p>
            </div>

            {/* Total Time */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatTime(stats.dataQuality.totalTime)}
              </p>
            </div>

            {/* Session Count */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Sessions</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.dataQuality.sessionCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSettings;
