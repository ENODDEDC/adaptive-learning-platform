'use client';

import { useState, useEffect } from 'react';

export default function TestClassification() {
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    checkStatus();
    fetchProfile();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/learning-style/classify');
      const data = await response.json();
      setStatus(data.data);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/learning-style/profile');
      const data = await response.json();
      setProfile(data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerClassification = async () => {
    setClassifying(true);
    try {
      const response = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Classification complete!');
        await fetchProfile();
        await checkStatus();
      } else {
        alert('❌ Classification failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error classifying:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setClassifying(false);
    }
  };

  const getScoreColor = (score) => {
    const abs = Math.abs(score);
    if (abs <= 1) return 'text-gray-600';
    if (abs <= 3) return 'text-blue-600';
    if (abs <= 5) return 'text-yellow-600';
    if (abs <= 7) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    const abs = Math.abs(score);
    if (abs <= 1) return 'Balanced';
    if (abs <= 3) return 'Mild';
    if (abs <= 5) return 'Moderate';
    if (abs <= 7) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧠 Learning Style Classification Test
        </h1>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Classification Status</h2>
          
          {status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Interactions</p>
                  <p className="text-2xl font-bold text-gray-900">{status.totalInteractions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Learning Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(status.totalLearningTime / 1000 / 60).toFixed(1)}m
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Data Completeness</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {status.dataQuality?.completeness || 0}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Ready for ML?</p>
                  <p className={`text-2xl font-bold ${status.readyForClassification ? 'text-green-600' : 'text-orange-600'}`}>
                    {status.readyForClassification ? '✅ Yes' : '⏳ Not Yet'}
                  </p>
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                status.readyForClassification 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={status.readyForClassification ? 'text-green-900' : 'text-blue-900'}>
                  {status.message}
                </p>
                {status.readyForClassification && (
                  <p className="text-green-800 mt-2 font-semibold">
                    ✨ ML will automatically classify your learning style when you interact with learning modes!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading status...</p>
          )}
        </div>

        {/* Profile Card */}
        {profile && profile.hasProfile && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Learning Style Profile</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Dominant Style:</span>
                <span className="text-lg font-bold text-blue-600">{profile.profile.dominantStyle}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Classification Method:</span>
                <span className="text-sm font-medium text-gray-900">{profile.profile.classificationMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm text-gray-900">
                  {new Date(profile.profile.lastPrediction).toLocaleString()}
                </span>
              </div>
            </div>

            {/* FSLSM Dimensions */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-800">FSLSM Dimension Scores</h3>
              
              {/* Active vs Reflective */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Active ↔ Reflective</span>
                  <span className={`font-bold ${getScoreColor(profile.profile.dimensions.activeReflective)}`}>
                    {profile.profile.dimensions.activeReflective}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ 
                      width: `${((profile.profile.dimensions.activeReflective + 11) / 22) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Reflective (-11)</span>
                  <span>{getScoreLabel(profile.profile.dimensions.activeReflective)}</span>
                  <span>Active (+11)</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Confidence: {(profile.profile.confidence.activeReflective * 100).toFixed(0)}%
                </div>
              </div>

              {/* Sensing vs Intuitive */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Sensing ↔ Intuitive</span>
                  <span className={`font-bold ${getScoreColor(profile.profile.dimensions.sensingIntuitive)}`}>
                    {profile.profile.dimensions.sensingIntuitive}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ 
                      width: `${((profile.profile.dimensions.sensingIntuitive + 11) / 22) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Intuitive (-11)</span>
                  <span>{getScoreLabel(profile.profile.dimensions.sensingIntuitive)}</span>
                  <span>Sensing (+11)</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Confidence: {(profile.profile.confidence.sensingIntuitive * 100).toFixed(0)}%
                </div>
              </div>

              {/* Visual vs Verbal */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Visual ↔ Verbal</span>
                  <span className={`font-bold ${getScoreColor(profile.profile.dimensions.visualVerbal)}`}>
                    {profile.profile.dimensions.visualVerbal}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ 
                      width: `${((profile.profile.dimensions.visualVerbal + 11) / 22) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Verbal (-11)</span>
                  <span>{getScoreLabel(profile.profile.dimensions.visualVerbal)}</span>
                  <span>Visual (+11)</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Confidence: {(profile.profile.confidence.visualVerbal * 100).toFixed(0)}%
                </div>
              </div>

              {/* Sequential vs Global */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Sequential ↔ Global</span>
                  <span className={`font-bold ${getScoreColor(profile.profile.dimensions.sequentialGlobal)}`}>
                    {profile.profile.dimensions.sequentialGlobal}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ 
                      width: `${((profile.profile.dimensions.sequentialGlobal + 11) / 22) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Global (-11)</span>
                  <span>{getScoreLabel(profile.profile.dimensions.sequentialGlobal)}</span>
                  <span>Sequential (+11)</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Confidence: {(profile.profile.confidence.sequentialGlobal * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {profile.profile.recommendedModes && profile.profile.recommendedModes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Recommended Learning Modes</h3>
                <div className="space-y-3">
                  {profile.profile.recommendedModes.map((rec, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-blue-900">
                          {index + 1}. {rec.mode}
                        </span>
                        <span className="text-sm text-blue-700">
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{rec.reason}</p>
                      {rec.dimension && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded">
                          {rec.dimension}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">🤖 Automatic ML Classification</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Generate behavior data at <a href="/test-ml-tracking" className="underline font-semibold">/test-ml-tracking</a></li>
            <li>Click at least 10 different mode buttons (each simulates 5 seconds of usage)</li>
            <li><strong>ML automatically classifies your style after 10+ interactions - no button needed!</strong></li>
            <li>Return here to view your detailed FSLSM dimension scores</li>
            <li>Or check /home to see your profile widget with recommendations</li>
            <li>Scores range from -11 to +11 (following original ILS scale)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
