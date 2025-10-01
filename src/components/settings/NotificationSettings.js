'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    assignmentReminders: true,
    newMessages: true,
    systemAnnouncements: false,
    weeklyDigest: true,
    achievementUnlocked: true,
    emailNotifications: true,
    pushNotifications: false,
    desktopNotifications: true,
    soundEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuietHoursChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Course Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course Notifications</h3>
              <p className="text-sm text-gray-600">Stay updated with your courses and assignments</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {[
            { key: 'courseUpdates', label: 'Course Updates', description: 'New content, announcements, and changes' },
            { key: 'assignmentReminders', label: 'Assignment Reminders', description: 'Due date reminders and submissions' },
            { key: 'newMessages', label: 'New Messages', description: 'Messages from instructors and classmates' },
            { key: 'systemAnnouncements', label: 'System Announcements', description: 'Platform updates and maintenance notices' },
            { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary of your learning progress' },
            { key: 'achievementUnlocked', label: 'Achievements', description: 'When you unlock new achievements' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <button
                onClick={() => handleNotificationChange(item.key, !notifications[item.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notification Methods</h3>
              <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                <p className="text-xs text-gray-500">Browser push notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange('pushNotifications', !notifications.pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Desktop Notifications</p>
                <p className="text-xs text-gray-500">Native desktop notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleNotificationChange('desktopNotifications', !notifications.desktopNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.desktopNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
          <p className="text-sm text-gray-600">Set times when you don't want to receive notifications</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Quiet Hours</p>
              <p className="text-xs text-gray-500">Pause notifications during specific hours</p>
            </div>
            <button
              onClick={() => handleQuietHoursChange('enabled', !notifications.quietHours.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {notifications.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={notifications.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={notifications.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;