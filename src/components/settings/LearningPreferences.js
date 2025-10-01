'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, SwatchIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

const LearningPreferences = () => {
  const [preferences, setPreferences] = useState({
    cardSize: 'medium',
    gridColumns: 'auto',
    compactMode: false,
    showProgress: true,
    showStats: true,
    theme: 'auto',
    animationSpeed: 'normal',
    autoAdjustLayout: true,
    learningRate: 0.1,
    confidenceThreshold: 0.7
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences.layoutPreferences }));
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layoutPreferences: preferences
        }),
      });

      if (res.ok) {
        // Success feedback
        console.log('Preferences saved successfully');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Layout Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ViewfinderCircleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Layout Preferences</h3>
              <p className="text-sm text-gray-600">Customize how content is displayed</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Card Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Card Size
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['small', 'medium', 'large', 'featured'].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePreferenceChange('cardSize', size)}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    preferences.cardSize === size
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded ${
                    size === 'small' ? 'bg-gray-300' :
                    size === 'medium' ? 'bg-blue-400' :
                    size === 'large' ? 'bg-green-400' : 'bg-purple-400'
                  }`} />
                  <span className="text-xs font-medium capitalize">{size}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Columns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Grid Columns
            </label>
            <select
              value={preferences.gridColumns}
              onChange={(e) => handlePreferenceChange('gridColumns', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="auto">Auto</option>
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
              <option value="5">5 Columns</option>
            </select>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Compact Mode</p>
                <p className="text-xs text-gray-500">Show more content in less space</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('compactMode', !preferences.compactMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.compactMode ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Show Progress</p>
                <p className="text-xs text-gray-500">Display progress bars on course cards</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('showProgress', !preferences.showProgress)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.showProgress ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.showProgress ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Show Statistics</p>
                <p className="text-xs text-gray-500">Display course statistics and metrics</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('showStats', !preferences.showStats)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.showStats ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.showStats ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI & Adaptive Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI & Adaptive Settings</h3>
              <p className="text-sm text-gray-600">Configure how the AI learns from your behavior</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-Adjust Layout</p>
              <p className="text-xs text-gray-500">Let AI optimize your interface based on usage patterns</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('autoAdjustLayout', !preferences.autoAdjustLayout)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.autoAdjustLayout ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.autoAdjustLayout ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Learning Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Learning Rate: {preferences.learningRate}
            </label>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={preferences.learningRate}
              onChange={(e) => handlePreferenceChange('learningRate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Confidence Threshold: {Math.round(preferences.confidenceThreshold * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={preferences.confidenceThreshold}
              onChange={(e) => handlePreferenceChange('confidenceThreshold', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme & Animation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <SwatchIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Theme & Animation</h3>
              <p className="text-sm text-gray-600">Customize the visual appearance</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Animation Speed
            </label>
            <select
              value={preferences.animationSpeed}
              onChange={(e) => handlePreferenceChange('animationSpeed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default LearningPreferences;