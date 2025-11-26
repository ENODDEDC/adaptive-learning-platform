'use client';

import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellIcon className="w-6 h-6" />
          Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your notification preferences
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <BellIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Notification Settings
            </h3>
            <p className="text-sm text-blue-800">
              Notification preferences and email alerts will be available in future updates.
              Currently, you&apos;ll receive important system notifications through the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
