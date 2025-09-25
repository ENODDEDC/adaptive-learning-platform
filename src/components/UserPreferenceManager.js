'use client';

import React, { useState, useEffect } from 'react';
import { CogIcon, ChartBarIcon, LightBulbIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import preferenceLearningService from '@/services/preferenceLearningService';

const UserPreferenceManager = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(null);
  const [learningStats, setLearningStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      loadLearningStats();
      loadRecommendations();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    const prefs = preferenceLearningService.getPreferences();
    setPreferences(prefs);
  };

  const loadLearningStats = () => {
    const stats = preferenceLearningService.getLearningStats();
    setLearningStats(stats);
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/user/preferences/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          interactions: [],
          currentLayout: {},
          timeContext: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handlePreferenceChange = async (category, key, value) => {
    setIsLoading(true);
    try {
      const updatedPreferences = {
        ...preferences.layoutPreferences,
        [key]: value
      };

      await preferenceLearningService.savePreferences(updatedPreferences, true);

      // Update local state
      setPreferences(prev => ({
        ...prev,
        layoutPreferences: updatedPreferences
      }));

      // Trigger layout change event
      window.dispatchEvent(new CustomEvent('layoutChange', {
        detail: { [key]: value }
      }));
    } catch (error) {
      console.error('Failed to update preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationApply = async (recommendation) => {
    setIsLoading(true);
    try {
      await preferenceLearningService.applyRecommendation(recommendation);

      // Reload preferences
      await loadPreferences();
      await loadRecommendations();

      // Show success feedback
      setShowRecommendations(false);
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (type) => {
    window.dispatchEvent(new CustomEvent('preferenceFeedback', {
      detail: { type }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <CogIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preference Learning</h2>
                <p className="text-sm text-gray-600">Customize your learning experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'preferences', label: 'Layout Settings', icon: CogIcon },
              { id: 'learning', label: 'Learning Insights', icon: ChartBarIcon },
              { id: 'recommendations', label: 'Recommendations', icon: LightBulbIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Size
                      </label>
                      <select
                        value={preferences?.layoutPreferences?.cardSize || 'medium'}
                        onChange={(e) => handlePreferenceChange('layout', 'cardSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="featured">Featured</option>
                      </select>
                    </div>

                    {/* Grid Columns */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grid Columns
                      </label>
                      <select
                        value={preferences?.layoutPreferences?.gridColumns || 'auto'}
                        onChange={(e) => handlePreferenceChange('layout', 'gridColumns', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        <option value="2">2 Columns</option>
                        <option value="3">3 Columns</option>
                        <option value="4">4 Columns</option>
                        <option value="5">5 Columns</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    {/* Compact Mode */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="compactMode"
                        checked={preferences?.layoutPreferences?.compactMode || false}
                        onChange={(e) => handlePreferenceChange('layout', 'compactMode', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="compactMode" className="ml-2 text-sm font-medium text-gray-700">
                        Compact Mode
                      </label>
                    </div>

                    {/* Show Progress */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showProgress"
                        checked={preferences?.layoutPreferences?.showProgress || false}
                        onChange={(e) => handlePreferenceChange('layout', 'showProgress', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="showProgress" className="ml-2 text-sm font-medium text-gray-700">
                        Show Progress Indicators
                      </label>
                    </div>

                    {/* Show Stats */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showStats"
                        checked={preferences?.layoutPreferences?.showStats || false}
                        onChange={(e) => handlePreferenceChange('layout', 'showStats', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="showStats" className="ml-2 text-sm font-medium text-gray-700">
                        Show Statistics
                      </label>
                    </div>

                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences?.layoutPreferences?.theme || 'auto'}
                        onChange={(e) => handlePreferenceChange('layout', 'theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'learning' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
                  {learningStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {learningStats.totalInteractions}
                        </div>
                        <div className="text-sm text-blue-700">Total Interactions</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {learningStats.satisfactionScore}%
                        </div>
                        <div className="text-sm text-green-700">Satisfaction Score</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {learningStats.learningProgress}%
                        </div>
                        <div className="text-sm text-purple-700">Learning Progress</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {learningStats.manualOverrides}
                        </div>
                        <div className="text-sm text-orange-700">Manual Overrides</div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">
                          {learningStats.adaptationsCount}
                        </div>
                        <div className="text-sm text-indigo-700">Auto Adaptations</div>
                      </div>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">
                          {learningStats.currentLearningRate}
                        </div>
                        <div className="text-sm text-pink-700">Learning Rate</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No learning data available yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
                  <button
                    onClick={loadRecommendations}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
                    disabled={isLoading}
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                              <span className="font-medium text-gray-900 capitalize">
                                {recommendation.type.replace('_', ' ')} Recommendation
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                recommendation.confidence > 80 ? 'bg-green-100 text-green-800' :
                                recommendation.confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {recommendation.confidence.toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{recommendation.reason}</p>
                            <div className="text-sm text-gray-500">
                              Suggested: <strong>{recommendation.value}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRecommendationApply(recommendation)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recommendations available. Keep using the platform to get personalized suggestions!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleFeedback('positive')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700"
                >
                  👍 Good
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  👎 Needs Work
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferenceManager;