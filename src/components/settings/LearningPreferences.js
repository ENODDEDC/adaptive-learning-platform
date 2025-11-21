'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CogIcon, ChartBarIcon, ArrowPathIcon, CheckCircleIcon, SparklesIcon, AcademicCapIcon, LightBulbIcon, EyeIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const LearningPreferences = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning-style/profile');
      if (res.ok) {
        const data = await res.json();
        // API returns data.data.profile and data.data.dataQuality separately
        const profileData = data.data?.profile || data.profile;

        // Merge dataQuality into profile for easier access
        if (data.data?.dataQuality && profileData) {
          profileData.dataQuality = data.data.dataQuality;
        }

        // ALWAYS fetch fresh data from behavior tracking for accurate interaction count
        try {
          const behaviorRes = await fetch('/api/learning-behavior/track');
          if (behaviorRes.ok) {
            const behaviorData = await behaviorRes.json();
            if (behaviorData.success && behaviorData.data) {
              // Override with fresh behavior data (same source as Analytics)
              profileData.dataQuality = {
                totalInteractions: behaviorData.data.totalInteractions || 0,
                dataCompleteness: behaviorData.data.dataQuality?.completeness || 0,
                sufficientForML: behaviorData.data.hasSufficientData || false
              };
              // Remove aggregatedStats to prevent using stale data
              delete profileData.aggregatedStats;
            }
          }
        } catch (error) {
          console.log('Could not fetch behavior data:', error);
        }

        setProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setShowResetModal(false);
    setResetting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/reset-learning-profile', {
        method: 'DELETE'  // Use DELETE method like test-ml-tracking
      });

      if (res.ok) {
        // Clear the profile to show "not classified" message
        // Don't fetch again - there's nothing to show after reset
        setProfile({ lastPrediction: null, dimensions: null });
        setMessage({ type: 'success', text: 'Learning profile reset successfully! Your data has been cleared.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to reset profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setResetting(false);
    }
  };

  const getDimensionLabel = (value) => {
    if (value === null || value === undefined) return 'Not classified yet';
    const abs = Math.abs(value);
    if (abs <= 3) return 'Balanced';
    if (abs <= 7) return 'Moderate';
    return 'Strong';
  };

  const getDimensionPreference = (dimension, value) => {
    if (value === null || value === undefined) return 'Not determined';

    const preferences = {
      activeReflective: value > 0 ? 'Active' : 'Reflective',
      sensingIntuitive: value > 0 ? 'Sensing' : 'Intuitive',
      visualVerbal: value > 0 ? 'Visual' : 'Verbal',
      sequentialGlobal: value > 0 ? 'Sequential' : 'Global'
    };

    return preferences[dimension] || 'Unknown';
  };

  // Convert database mode names to button display names
  const getModeDisplayName = (modeName) => {
    const nameMap = {
      'Active Learning Hub': 'Practice',
      'Reflective Learning': 'Reflect',
      'Hands-On Lab': 'Hands-On',
      'Concept Constellation': 'Theory',
      'Sequential Learning': 'Step-by-Step',
      'Global Learning': 'Big Picture',
      'Visual Learning': 'Visual Learning',
      'AI Narrator': 'AI Narrator'
    };
    return nameMap[modeName] || modeName;
  };

  // Create segmented bar visualization
  const renderSegmentedBar = (value, leftColor, rightColor) => {
    const percentage = ((value + 11) / 22) * 100;
    const segments = 22;
    const activeSegment = Math.round((percentage / 100) * segments);

    return (
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeSegment;
          const isLeft = i < segments / 2;
          return (
            <div
              key={i}
              className={`h-8 flex-1 rounded transition-all duration-300 ${isActive
                  ? isLeft
                    ? `${leftColor} shadow-sm`
                    : `${rightColor} shadow-sm`
                  : 'bg-gray-200'
                }`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading your learning profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CogIcon className="w-8 h-8 text-blue-600" />
            Learning Preferences
          </h2>
          <p className="mt-2 text-gray-600">
            Your personalized learning style based on ML analysis
          </p>
        </div>
        {profile && profile.dimensions && (
          profile.predictionCount > 0 || 
          profile.dimensions.activeReflective !== 0 || 
          profile.dimensions.sensingIntuitive !== 0 || 
          profile.dimensions.visualVerbal !== 0 || 
          profile.dimensions.sequentialGlobal !== 0
        ) && (
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {profile.classificationMethod === 'ml-prediction' ? 'ML Classified' : 'Rule-Based'}
              </span>
            </div>
          </div>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border-2 ${message.type === 'success'
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-red-50 border-red-300 text-red-800'
          }`}>
          <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Threshold Progress Section */}
      {profile && (profile.aggregatedStats || profile.dataQuality) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            Classification Progress
          </h3>
          
          {(() => {
            const totalInteractions = profile.aggregatedStats?.totalInteractionsProcessed || profile.dataQuality?.totalInteractions || 0;
            const nextThreshold = totalInteractions < 50 ? 50 : totalInteractions < 100 ? 100 : totalInteractions < 200 ? 200 : Math.ceil(totalInteractions / 50) * 50 + 50;
            const progress = (totalInteractions / nextThreshold) * 100;
            const stage = totalInteractions < 50 ? 'building' : totalInteractions < 100 ? 'initial' : totalInteractions < 200 ? 'refined' : 'stable';
            const stageEmoji = totalInteractions < 50 ? '🌱' : totalInteractions < 100 ? '📊' : totalInteractions < 200 ? '⚡' : '✅';
            
            return (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {stageEmoji} {totalInteractions} / {nextThreshold} interactions
                    </span>
                    <span className="text-sm font-bold text-blue-700">
                      {nextThreshold - totalInteractions} more needed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      {progress > 15 && (
                        <span className="text-xs font-bold text-white">
                          {Math.round(progress)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Milestone Badges */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { threshold: 50, label: 'Initial', emoji: '📊', stage: 'preliminary' },
                    { threshold: 100, label: 'Refined', emoji: '⚡', stage: 'moderate' },
                    { threshold: 200, label: 'Stable', emoji: '✅', stage: 'high' },
                    { threshold: nextThreshold > 200 ? nextThreshold : 250, label: 'Next', emoji: '🎯', stage: 'update' }
                  ].map((milestone, idx) => {
                    const reached = totalInteractions >= milestone.threshold;
                    const isCurrent = !reached && milestone.threshold === nextThreshold;
                    
                    return (
                      <div
                        key={idx}
                        className={`text-center p-3 rounded-lg border-2 transition-all ${
                          reached
                            ? 'bg-green-100 border-green-400'
                            : isCurrent
                            ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{reached ? '✓' : milestone.emoji}</div>
                        <div className="text-xs font-bold text-gray-900">{milestone.threshold}</div>
                        <div className="text-xs text-gray-600">{milestone.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Current Stage:</strong> {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    {stage === 'building' && ' - Keep interacting to reach your first classification at 50 interactions!'}
                    {stage === 'initial' && ' - Your learning style is emerging. Reach 100 for refined classification.'}
                    {stage === 'refined' && ' - Almost there! 200 interactions provides research-validated accuracy.'}
                    {stage === 'stable' && ' - Your learning style is confirmed with high confidence!'}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Learning Style Dimensions */}
      {profile && profile.dimensions && (
        profile.predictionCount > 0 || 
        profile.dimensions.activeReflective !== 0 || 
        profile.dimensions.sensingIntuitive !== 0 || 
        profile.dimensions.visualVerbal !== 0 || 
        profile.dimensions.sequentialGlobal !== 0
      ) ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b-2 border-gray-200">
            <ChartBarIcon className="w-6 h-6 text-gray-700" />
            <h3 className="text-xl font-bold text-gray-900">FSLSM Learning Style Dimensions</h3>
          </div>

          {/* Active/Reflective */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Active / Reflective</h4>
                  <p className="text-sm text-gray-600">How you process information</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-300">
                {getDimensionLabel(profile.dimensions.activeReflective)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Active</span>
                <span>Reflective</span>
              </div>
              {renderSegmentedBar(profile.dimensions.activeReflective, 'bg-blue-500', 'bg-blue-700')}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-sm font-bold text-blue-700">
                  Your preference: {getDimensionPreference('activeReflective', profile.dimensions.activeReflective)}
                </p>
              </div>
            </div>
          </div>

          {/* Sensing/Intuitive */}
          <div className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <LightBulbIcon className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Sensing / Intuitive</h4>
                  <p className="text-sm text-gray-600">How you perceive information</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-300">
                {getDimensionLabel(profile.dimensions.sensingIntuitive)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Sensing</span>
                <span>Intuitive</span>
              </div>
              {renderSegmentedBar(profile.dimensions.sensingIntuitive, 'bg-green-500', 'bg-green-700')}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <p className="text-sm font-bold text-green-700">
                  Your preference: {getDimensionPreference('sensingIntuitive', profile.dimensions.sensingIntuitive)}
                </p>
              </div>
            </div>
          </div>

          {/* Visual/Verbal */}
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Visual / Verbal</h4>
                  <p className="text-sm text-gray-600">How you receive information</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold border border-purple-300">
                {getDimensionLabel(profile.dimensions.visualVerbal)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Visual</span>
                <span>Verbal</span>
              </div>
              {renderSegmentedBar(profile.dimensions.visualVerbal, 'bg-purple-500', 'bg-purple-700')}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <p className="text-sm font-bold text-purple-700">
                  Your preference: {getDimensionPreference('visualVerbal', profile.dimensions.visualVerbal)}
                </p>
              </div>
            </div>
          </div>

          {/* Sequential/Global */}
          <div className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 text-orange-700" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Sequential / Global</h4>
                  <p className="text-sm text-gray-600">How you understand information</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold border border-orange-300">
                {getDimensionLabel(profile.dimensions.sequentialGlobal)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Sequential</span>
                <span>Global</span>
              </div>
              {renderSegmentedBar(profile.dimensions.sequentialGlobal, 'bg-orange-500', 'bg-orange-700')}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <p className="text-sm font-bold text-orange-700">
                  Your preference: {getDimensionPreference('sequentialGlobal', profile.dimensions.sequentialGlobal)}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Modes */}
          {profile.recommendedModes && profile.recommendedModes.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-indigo-600" />
                Recommended Learning Modes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.recommendedModes.map((mode, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-center gap-3 border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{getModeDisplayName(mode.mode)}</p>
                      {mode.confidence && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${mode.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium w-12 text-right">
                            {Math.round(mode.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Level Banner - Only show after classification */}
          {profile.hasBeenClassified && profile.dataQuality && (
            <div className={`border-2 rounded-xl p-6 ${profile.dataQuality.confidenceLevel === 'high' ? 'bg-green-50 border-green-300' :
                profile.dataQuality.confidenceLevel === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                  profile.dataQuality.confidenceLevel === 'low-medium' ? 'bg-orange-50 border-orange-300' :
                    'bg-red-50 border-red-300'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className={`w-6 h-6 ${profile.dataQuality.confidenceLevel === 'high' ? 'text-green-600' :
                      profile.dataQuality.confidenceLevel === 'medium' ? 'text-yellow-600' :
                        profile.dataQuality.confidenceLevel === 'low-medium' ? 'text-orange-600' :
                          'text-red-600'
                    }`} />
                  Classification Confidence
                </h3>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${(profile.mlConfidenceScore || 0) >= 0.80 ? 'bg-green-100 text-green-800 border-green-400' :
                    (profile.mlConfidenceScore || 0) >= 0.65 ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                      (profile.mlConfidenceScore || 0) >= 0.50 ? 'bg-orange-100 text-orange-800 border-orange-400' :
                        'bg-red-100 text-red-800 border-red-400'
                  }`}>
                  {((profile.mlConfidenceScore || 0) * 100).toFixed(1)}% ML Confidence
                </span>
              </div>

              {/* Confidence Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${(profile.mlConfidenceScore || 0) >= 0.80 ? 'bg-green-600' :
                        (profile.mlConfidenceScore || 0) >= 0.65 ? 'bg-yellow-500' :
                          (profile.mlConfidenceScore || 0) >= 0.50 ? 'bg-orange-500' :
                            'bg-red-500'
                      }`}
                    style={{ width: `${((profile.mlConfidenceScore || 0) * 100).toFixed(1)}%` }}
                  ></div>
                </div>
              </div>

              <p className={`text-sm ${(profile.mlConfidenceScore || 0) >= 0.80 ? 'text-green-800' :
                  (profile.mlConfidenceScore || 0) >= 0.65 ? 'text-yellow-800' :
                    (profile.mlConfidenceScore || 0) >= 0.50 ? 'text-orange-800' :
                      'text-red-800'
                }`}>
                <strong>
                  {(profile.mlConfidenceScore || 0) >= 0.80 && '✓ High ML Confidence - '}
                  {(profile.mlConfidenceScore || 0) >= 0.65 && (profile.mlConfidenceScore || 0) < 0.80 && '⚡ Good ML Confidence - '}
                  {(profile.mlConfidenceScore || 0) >= 0.50 && (profile.mlConfidenceScore || 0) < 0.65 && '📊 Moderate ML Confidence - '}
                  {(profile.mlConfidenceScore || 0) < 0.50 && '🌱 Low ML Confidence - '}
                </strong>
                The ML model is {((profile.mlConfidenceScore || 0) * 100).toFixed(1)}% confident in this classification based on {profile.dataQuality.interactionCount || profile.dataQuality.totalInteractions || 0} interactions.
                {profile.dataQuality.confidenceLevel !== 'high' && ` Keep learning to reach ${profile.dataQuality.confidenceLevel === 'medium' ? '30' :
                    profile.dataQuality.confidenceLevel === 'low-medium' ? '15' : '5'
                  } interactions for ${profile.dataQuality.confidenceLevel === 'medium' ? 'high' :
                    profile.dataQuality.confidenceLevel === 'low-medium' ? 'medium' : 'low-medium'
                  } confidence.`}
                {profile.dataQuality.confidenceLevel === 'high' && ' Your profile is highly accurate!'}
              </p>
            </div>
          )}

          {/* Classification Info */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Classification Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.classificationMethod === 'ml-prediction' ? '🤖' : '📋'}
                </p>
                <p className="text-xs text-gray-600">Method</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {profile.classificationMethod === 'ml-prediction' ? 'ML' : 'Rule-Based'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-900 mb-1">📅</p>
                <p className="text-xs text-gray-600">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {profile.lastPrediction
                    ? new Date(profile.lastPrediction).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  {profile.dataQuality?.interactionCount || profile.dataQuality?.totalInteractions || 0}
                </p>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">Interactions</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {profile.dataQuality?.completeness || profile.dataQuality?.dataCompleteness || 0}%
                </p>
                <p className="text-xs text-gray-600">Data</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">Completeness</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <ChartBarIcon className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-800 font-semibold mb-2 text-lg">
            Your learning style hasn't been classified yet
          </p>
          <p className="text-gray-600 mb-1">
            Reach 50 interactions to unlock ML classification!
          </p>
          <p className="text-sm text-gray-500">
            Use learning modes to build your profile. Classification happens automatically at 50 interactions.
          </p>
        </div>
      )}

      {/* Reset Button */}
      <div className="border-t-2 border-gray-200 pt-6">
        <button
          onClick={() => setShowResetModal(true)}
          disabled={resetting}
          className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
        >
          <ArrowPathIcon className={`w-5 h-5 ${resetting ? 'animate-spin' : ''}`} />
          <span className="font-semibold">{resetting ? 'Resetting...' : 'Reset Learning Profile'}</span>
        </button>
        <p className="mt-3 text-sm text-gray-600">
          This will clear all your learning behavior data and start fresh
        </p>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ArrowPathIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reset Learning Profile?</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to reset your learning profile? This action will:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Clear all your learning behavior data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Remove your ML learning style classification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Reset all interaction tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Start your learning profile from scratch</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Reset Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LearningPreferences;
