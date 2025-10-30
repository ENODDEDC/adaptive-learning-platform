'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function TrackingDebugPage() {
  const [behaviorData, setBehaviorData] = useState(null);
  const [rawBehaviors, setRawBehaviors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      // Get aggregated stats
      const statsRes = await fetch('/api/learning-behavior/track');
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setBehaviorData(statsData.data);
      }

      // Get raw behavior records
      const rawRes = await fetch('/api/test-tracking-debug/raw');
      if (rawRes.ok) {
        const rawData = await rawRes.json();
        setRawBehaviors(rawData.behaviors || []);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchTrackingData, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatTime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Tracking Debug Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time view of learning behavior tracking data
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={fetchTrackingData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Auto-refresh (2s)</span>
            </label>
          </div>

          {behaviorData && (
            <div className="flex items-center gap-2">
              {behaviorData.hasSufficientData ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircleIcon className="w-5 h-5" />
                  Ready for ML
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-600 font-semibold">
                  <XCircleIcon className="w-5 h-5" />
                  Need more data
                </span>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {behaviorData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Total Interactions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{behaviorData.totalInteractions}</p>
              <p className="text-sm text-gray-500 mt-1">
                Need 10+ for ML
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <ClockIcon className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-700">Total Time</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatTime(behaviorData.totalLearningTime)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {behaviorData.totalLearningTime}ms raw
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <EyeIcon className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-700">Sessions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{behaviorData.totalSessions}</p>
              <p className="text-sm text-gray-500 mt-1">
                Unique learning sessions
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-gray-700">Data Quality</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {behaviorData.dataQuality?.completeness || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Completeness score
              </p>
            </div>
          </div>
        )}

        {/* Mode Usage Breakdown */}
        {behaviorData?.modeUsageSummary && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mode Usage Summary</h2>
            <div className="space-y-3">
              {Object.entries(behaviorData.modeUsageSummary).map(([mode, data]) => (
                <div key={mode} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {mode.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {data.count} interactions • {formatTime(data.totalTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{data.count}</div>
                    <div className="text-xs text-gray-500">{data.totalTime}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Behavior Records */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Raw Behavior Records ({rawBehaviors.length})
          </h2>
          
          {rawBehaviors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No behavior records found. Start using learning modes to see tracking data.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rawBehaviors.map((behavior, index) => (
                <div key={behavior._id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(behavior.timestamp)}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        Session {behavior.sessionId?.slice(-8)}
                      </h4>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {behavior.totalInteractions} interactions
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(behavior.modeUsage).map(([mode, usage]) => {
                      if (usage.count > 0) {
                        return (
                          <div key={mode} className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-700 capitalize text-xs">
                              {mode.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-gray-600">
                              {usage.count}x • {formatTime(usage.totalTime)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use This Page</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open a document in /courses and use learning modes (AI Narrator, Visual Learning, etc.)</li>
            <li>Come back here and click "Refresh Data" or enable "Auto-refresh"</li>
            <li>Watch the metrics update in real-time as you use different modes</li>
            <li>Verify that time is being tracked correctly (should show actual seconds/minutes)</li>
            <li>Check "Raw Behavior Records" to see individual session data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
