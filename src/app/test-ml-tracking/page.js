'use client';

import { useState, useEffect } from 'react';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';

export default function TestMLTracking() {
  const [tracker, setTracker] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const behaviorTracker = getLearningBehaviorTracker();
    setTracker(behaviorTracker);
  }, []);

  const testModeTracking = (modeName) => {
    if (!tracker) return;
    
    tracker.trackModeStart(modeName);
    
    // Simulate usage for 5 seconds
    setTimeout(async () => {
      tracker.trackModeEnd(modeName);
      console.log(`✅ Tracked ${modeName} for 5 seconds`);
      
      // Auto-fetch stats after each interaction
      await fetchStats();
    }, 5000);
  };

  const testDiscussion = () => {
    if (!tracker) return;
    tracker.trackDiscussionParticipation();
    alert('Discussion participation tracked!');
  };

  const testReflection = () => {
    if (!tracker) return;
    tracker.trackReflectionEntry();
    alert('Reflection entry tracked!');
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/learning-behavior/track');
      const data = await response.json();
      setStats(data.data);
      
      // Auto-trigger classification if sufficient data
      if (data.data?.hasSufficientData && data.data?.totalInteractions >= 10) {
        console.log('✅ Sufficient data detected! Auto-triggering ML classification...');
        await autoClassify();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('Error fetching stats. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const autoClassify = async () => {
    try {
      console.log('🤖 Running ML classification...');
      const response = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ ML Classification complete!', data);
        alert('🎉 Your learning style has been automatically identified! Check /home or /my-learning-style');
      }
    } catch (error) {
      console.error('Error auto-classifying:', error);
    }
  };

  const resetProfile = async () => {
    if (!confirm('⚠️ This will delete your learning profile and all behavior data. Continue?')) {
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/reset-learning-profile', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Profile reset! You can now test ML classification from scratch.');
        setStats(null);
        await fetchStats();
      } else {
        alert('❌ Reset failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 ML Tracking Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Mode Tracking</h2>
          <p className="text-gray-600 mb-4">
            Click a button to simulate 5 seconds of usage in that learning mode.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => testModeTracking('activeLearning')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Active Learning
            </button>
            <button
              onClick={() => testModeTracking('reflectiveLearning')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reflective Learning
            </button>
            <button
              onClick={() => testModeTracking('visualLearning')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Visual Learning
            </button>
            <button
              onClick={() => testModeTracking('aiNarrator')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              AI Narrator
            </button>
            <button
              onClick={() => testModeTracking('sensingLearning')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sensing Learning
            </button>
            <button
              onClick={() => testModeTracking('intuitiveLearning')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Intuitive Learning
            </button>
            <button
              onClick={() => testModeTracking('sequentialLearning')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Sequential Learning
            </button>
            <button
              onClick={() => testModeTracking('globalLearning')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Global Learning
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Activity Tracking</h2>
          
          <div className="flex gap-4">
            <button
              onClick={testDiscussion}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Track Discussion
            </button>
            <button
              onClick={testReflection}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Track Reflection
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Behavior Stats</h2>
            <div className="flex gap-2">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fetch Stats'}
              </button>
              <button
                onClick={resetProfile}
                disabled={resetting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : '🗑️ Reset Profile'}
              </button>
            </div>
          </div>

          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Interactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInteractions}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Sufficient Data for ML?</p>
                <p className={`text-lg font-semibold ${stats.hasSufficientData ? 'text-green-600' : 'text-orange-600'}`}>
                  {stats.hasSufficientData ? '✅ Yes (10+ interactions)' : '⏳ Not yet (need 10+ interactions)'}
                </p>
              </div>

              {stats.modeUsageSummary && (
                <div>
                  <h3 className="font-semibold mb-2">Mode Usage Summary</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.modeUsageSummary).map(([mode, data]) => (
                      <div key={mode} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-sm font-medium capitalize">
                          {mode.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">
                            {data.count} times, {(data.totalTime / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!stats && !loading && (
            <p className="text-gray-500 text-center py-8">
              Click "Fetch Stats" to see your behavior data
            </p>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🤖 Automatic ML Classification</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click buttons to simulate learning mode usage (each = 5 seconds)</li>
            <li>• Data is automatically sent to the backend in batches</li>
            <li>• <strong>After 10+ interactions, ML automatically classifies your learning style!</strong></li>
            <li>• No manual button needed - the system detects and classifies automatically</li>
            <li>• Check browser console for real-time tracking logs</li>
            <li>• View results on /home or /my-learning-style</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
