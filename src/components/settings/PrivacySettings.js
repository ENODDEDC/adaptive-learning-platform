'use client';

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const PrivacySettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6" />
          Privacy & Data
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Control your data and privacy settings
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">
              Your Data is Protected
            </h3>
            <p className="text-sm text-green-800 mb-3">
              We take your privacy seriously. All your learning data is stored securely and used only to improve your learning experience.
            </p>
            <ul className="text-sm text-green-800 space-y-2">
              <li>• Your learning behavior data is used for ML personalization</li>
              <li>• We don't share your personal data with third parties</li>
              <li>• You can reset your learning profile at any time</li>
              <li>• All data is encrypted and stored securely</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Data Collection</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-gray-900">Learning Behavior</p>
              <p className="text-gray-600">We track which learning modes you use and for how long</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-gray-900">Content Interactions</p>
              <p className="text-gray-600">We track your interactions with learning materials</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-gray-900">ML Classification</p>
              <p className="text-gray-600">We use ML to determine your learning style preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
