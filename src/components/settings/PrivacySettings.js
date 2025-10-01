'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, EyeSlashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const PrivacySettings = () => {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    showProgress: false,
    allowAnalytics: true,
    dataCollection: true,
    thirdPartySharing: false,
    cookiePreferences: 'necessary',
    dataRetention: '1year'
  });

  const handlePrivacyChange = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/user/data-export', {
        method: 'POST',
      });

      if (res.ok) {
        // Trigger download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'intelevo-data-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      console.log('Account deletion requested');
    }
  };

  return (
    <div className="space-y-8">
      {/* Privacy Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy Controls</h3>
              <p className="text-sm text-gray-600">Manage your privacy and data sharing preferences</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Visibility
            </label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="friends">Friends - Visible to enrolled courses only</option>
              <option value="private">Private - Visible to you only</option>
            </select>
          </div>

          {/* Progress Visibility */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Show Learning Progress</p>
              <p className="text-xs text-gray-500">Display your progress on public profiles</p>
            </div>
            <button
              onClick={() => handlePrivacyChange('showProgress', !privacySettings.showProgress)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.showProgress ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings.showProgress ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Collection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <EyeSlashIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data & Analytics</h3>
              <p className="text-sm text-gray-600">Control how your data is collected and used</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Usage Analytics</p>
              <p className="text-xs text-gray-500">Help improve the platform with anonymous usage data</p>
            </div>
            <button
              onClick={() => handlePrivacyChange('allowAnalytics', !privacySettings.allowAnalytics)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.allowAnalytics ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings.allowAnalytics ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Data Collection</p>
              <p className="text-xs text-gray-500">Collect learning behavior data for personalization</p>
            </div>
            <button
              onClick={() => handlePrivacyChange('dataCollection', !privacySettings.dataCollection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.dataCollection ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings.dataCollection ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Third-Party Sharing</p>
              <p className="text-xs text-gray-500">Share anonymized data with educational partners</p>
            </div>
            <button
              onClick={() => handlePrivacyChange('thirdPartySharing', !privacySettings.thirdPartySharing)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.thirdPartySharing ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings.thirdPartySharing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-600">Export, download, or delete your data</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportData}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900 mb-1">Export Data</h4>
              <p className="text-sm text-gray-600">Download all your data in JSON format</p>
            </button>

            <button
              onClick={() => console.log('Data download requested')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900 mb-1">Request Data Report</h4>
              <p className="text-sm text-gray-600">Get a detailed report of your data usage</p>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Danger Zone</p>
                <p className="text-xs text-gray-500">Irreversible actions</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;