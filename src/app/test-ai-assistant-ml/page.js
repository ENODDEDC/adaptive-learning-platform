'use client';

import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

/**
 * AI Assistant ML Integration Test Page
 * Verifies that AI Assistant interactions are being processed by ML system
 */
export default function TestAIAssistantML() {
  const [loading, setLoading] = useState(false);
  const [behaviorData, setBehaviorData] = useState(null);
  const [features, setFeatures] = useState(null);
  const [mlFeatures, setMLFeatures] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get raw behavior data
      const behaviorRes = await fetch('/api/learning-behavior/track');
      if (!behaviorRes.ok) throw new Error('Failed to fetch behavior data');
      const behaviorJson = await behaviorRes.json();
      setBehaviorData(behaviorJson.data);

      // 2. Get calculated features
      const featuresRes = await fetch('/api/test-features');
      if (!featuresRes.ok) throw new Error('Failed to fetch features');
      const featuresJson = await featuresRes.json();
      setFeatures(featuresJson.data);

      // 3. Get ML-formatted features
      const mlFeaturesRes = await fetch('/api/test-ml-features');
      if (!mlFeaturesRes.ok) throw new Error('Failed to fetch ML features');
      const mlFeaturesJson = await mlFeaturesRes.json();
      setMLFeatures(mlFeaturesJson.data);

      // 4. Get current profile
      const profileRes = await fetch('/api/learning-style/profile');
      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        setProfile(profileJson.data);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerClassification = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      
      if (!res.ok) throw new Error('Classification failed');
      
      const result = await res.json();
      alert('Classification successful! Check the results below.');
      
      // Refresh data
      await fetchAllData();
    } catch (err) {
      alert('Classification error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !behaviorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BeakerIcon className="w-8 h-8 text-blue-600" />
                AI Assistant → ML Integration Test
              </h1>
              <p className="mt-2 text-gray-600">
                Verify that AI Assistant interactions are being processed by the ML system
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Note:</strong> Classification happens <strong>automatically</strong> after 10 interactions 
                  (combining 8 learning modes + AI Assistant). The "Force Classification" button is only for manual testing.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={triggerClassification}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                title="Manual trigger for testing - Classification happens automatically after 10 interactions"
              >
                <SparklesIcon className="w-5 h-5" />
                Force Classification (Testing)
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Step 1: Raw Behavior Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Raw Behavior Data (What's Tracked)
          </h2>
          
          {behaviorData?.aiAssistantUsage ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <h3 className="font-bold text-green-900">AI Assistant Data Found!</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Ask Mode</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {behaviorData.aiAssistantUsage.askMode?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">interactions</p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Research Mode</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {behaviorData.aiAssistantUsage.researchMode?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">interactions</p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Text to Docs</p>
                    <p className="text-2xl font-bold text-green-600">
                      {behaviorData.aiAssistantUsage.textToDocsMode?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">interactions</p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white rounded">
                  <p className="text-sm text-gray-600">Total Interactions</p>
                  <p className="text-xl font-bold text-gray-900">
                    {behaviorData.aiAssistantUsage.totalInteractions || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg prompt length: {Math.round(behaviorData.aiAssistantUsage.averagePromptLength || 0)} chars
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircleIcon className="w-6 h-6 text-yellow-600" />
                <p className="text-yellow-900">No AI Assistant data found. Try using Ask, Research, or Text-to-Docs modes.</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Calculated Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Calculated Features (Feature Engineering)
          </h2>
          
          {features ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">AI Assistant Features for ML</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">AI Ask Mode Ratio</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(features.aiAskModeRatio || 0).toFixed(3)}
                    </p>
                    <p className="text-xs text-gray-500">→ Active Learning indicator</p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">AI Research Mode Ratio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(features.aiResearchModeRatio || 0).toFixed(3)}
                    </p>
                    <p className="text-xs text-gray-500">→ Reflective Learning indicator</p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">AI Text-to-Docs Ratio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(features.aiTextToDocsRatio || 0).toFixed(3)}
                    </p>
                    <p className="text-xs text-gray-500">→ Sensing Learning indicator</p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Data Quality</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {features.dataQuality?.completeness || 0}%
                    </p>
                    <p className="text-xs text-gray-500">
                      ML Ready: {features.dataQuality?.sufficientForML ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-mono text-gray-700">
                  <strong>Feature Vector (27 features sent to ML):</strong>
                </p>
                <pre className="mt-2 text-xs bg-white p-3 rounded overflow-x-auto">
                  {JSON.stringify(features, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Loading features...</p>
          )}
        </div>

        {/* Step 3: ML-Formatted Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            ML Service Format (What ML Model Receives)
          </h2>
          
          {mlFeatures ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900 mb-3">
                These features are sent to the Python ML service for prediction
              </p>
              <pre className="text-xs bg-white p-4 rounded overflow-x-auto font-mono">
                {JSON.stringify(mlFeatures, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">Loading ML features...</p>
          )}
        </div>

        {/* Step 4: Classification Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            Classification Results (ML Output)
          </h2>
          
          {profile ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <h3 className="font-bold text-green-900">Learning Style Classified!</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Active ↔ Reflective</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {profile.dimensions?.activeReflective?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.dimensions?.activeReflective > 0 ? '→ Active' : '→ Reflective'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Sensing ↔ Intuitive</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {profile.dimensions?.sensingIntuitive?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.dimensions?.sensingIntuitive > 0 ? '→ Sensing' : '→ Intuitive'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Visual ↔ Verbal</p>
                    <p className="text-2xl font-bold text-green-600">
                      {profile.dimensions?.visualVerbal?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.dimensions?.visualVerbal > 0 ? '→ Visual' : '→ Verbal'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Sequential ↔ Global</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {profile.dimensions?.sequentialGlobal?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.dimensions?.sequentialGlobal > 0 ? '→ Sequential' : '→ Global'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-600 mb-2">Classification Method</p>
                  <p className="text-lg font-bold text-gray-900">
                    {profile.classificationMethod || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {profile.lastPrediction ? new Date(profile.lastPrediction).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {profile.recommendedModes && profile.recommendedModes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">Recommended Learning Modes</h3>
                  <div className="space-y-2">
                    {profile.recommendedModes.slice(0, 3).map((mode, idx) => (
                      <div key={idx} className="bg-white rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{mode.mode}</span>
                          <span className="text-sm text-gray-600">Priority: {mode.priority}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{mode.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-900">
                No classification found. Click "Trigger Classification" to classify your learning style.
              </p>
            </div>
          )}
        </div>

        {/* Verification Summary */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7" />
            Verification Summary
          </h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {behaviorData?.aiAssistantUsage ? (
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-300" />
              )}
              <span>AI Assistant data is being tracked</span>
            </div>
            
            <div className="flex items-center gap-2">
              {features?.aiAskModeRatio !== undefined ? (
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-300" />
              )}
              <span>AI Assistant features are being calculated</span>
            </div>
            
            <div className="flex items-center gap-2">
              {mlFeatures ? (
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-300" />
              )}
              <span>Features are being formatted for ML service</span>
            </div>
            
            <div className="flex items-center gap-2">
              {profile ? (
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-300" />
              )}
              <span>ML classification is producing results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
