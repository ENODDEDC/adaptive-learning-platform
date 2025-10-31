'use client';

import React from 'react';
import { KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const AccountSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyIcon className="w-6 h-6" />
          Account & Security
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account security settings
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Account Security
            </h3>
            <p className="text-sm text-blue-800">
              Your account is secured with your current authentication method. 
              Password change and additional security features will be available in future updates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Account Status:</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Authentication:</span>
            <span className="font-medium text-gray-900">Email & Password</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
