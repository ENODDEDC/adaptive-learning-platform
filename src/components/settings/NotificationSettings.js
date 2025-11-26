'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EnvelopeIcon, 
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    systemNotifications: true,
    emailNotifications: true,
    frequency: 'all', // 'all', 'important', 'digest'
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      courseUpdates: true,
      assignments: true,
      grades: true,
      announcements: true,
      comments: true,
      mentions: true,
      reminders: true
    },
    devices: {
      desktop: true,
      mobile: true
    }
  });

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showTestNotification, setShowTestNotification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCategoryToggle = (category) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  const handleDeviceToggle = (device) => {
    setSettings(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [device]: !prev.devices[device]
      }
    }));
  };

  const handleQuietHoursToggle = () => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const handleFrequencyChange = (frequency) => {
    setSettings(prev => ({
      ...prev,
      frequency
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // TODO: Implement API call to save settings
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = () => {
    setShowTestNotification(true);
    setTimeout(() => setShowTestNotification(false), 3000);
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from your Learning Management System',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from your Learning Management System',
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  const handleReset = () => {
    setSettings({
      systemNotifications: true,
      emailNotifications: true,
      frequency: 'all',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      categories: {
        courseUpdates: true,
        assignments: true,
        grades: true,
        announcements: true,
        comments: true,
        mentions: true,
        reminders: true
      },
      devices: {
        desktop: true,
        mobile: true
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BellIcon className="w-7 h-7 text-blue-600" />
          Notifications
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Success Messages */}
      {showSaveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">Settings saved successfully!</span>
        </div>
      )}

      {showTestNotification && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 animate-fade-in">
          <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="text-blue-800 font-medium">Test notification sent!</span>
        </div>
      )}

      {/* Main Toggles */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        
        <div className="space-y-3">
          {/* System Notifications */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3 flex-1">
              <BellIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">System Notifications</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  Receive in-app notifications for important updates
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('systemNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.systemNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle system notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.systemNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3 flex-1">
              <EnvelopeIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  Receive email updates for important events
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle email notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Frequency */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h3>
        
        <div className="space-y-2">
          <label className="flex items-start p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow">
            <input
              type="radio"
              name="frequency"
              value="all"
              checked={settings.frequency === 'all'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">All Notifications</span>
              <p className="text-sm text-gray-600">Receive every notification as it happens</p>
            </div>
          </label>

          <label className="flex items-start p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow">
            <input
              type="radio"
              name="frequency"
              value="important"
              checked={settings.frequency === 'important'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">Important Only</span>
              <p className="text-sm text-gray-600">Only receive critical notifications</p>
            </div>
          </label>

          <label className="flex items-start p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow">
            <input
              type="radio"
              name="frequency"
              value="digest"
              checked={settings.frequency === 'digest'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">Daily Digest</span>
              <p className="text-sm text-gray-600">Receive a summary once per day</p>
            </div>
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
          </div>
          <button
            onClick={handleQuietHoursToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle quiet hours"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Pause notifications during specific hours
        </p>

        {settings.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notification Categories */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Categories</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of notifications you want to receive
        </p>
        
        <div className="space-y-2">
          {Object.entries({
            courseUpdates: { label: 'Course Updates', desc: 'New content, schedule changes', icon: '📚' },
            assignments: { label: 'Assignments', desc: 'New assignments and due dates', icon: '📝' },
            grades: { label: 'Grades', desc: 'Grade postings and feedback', icon: '📊' },
            announcements: { label: 'Announcements', desc: 'Important course announcements', icon: '📢' },
            comments: { label: 'Comments', desc: 'Replies to your posts', icon: '💬' },
            mentions: { label: 'Mentions', desc: 'When someone mentions you', icon: '👤' },
            reminders: { label: 'Reminders', desc: 'Upcoming deadlines and events', icon: '⏰' }
          }).map(([key, { label, desc, icon }]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{label}</h4>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleCategoryToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.categories[key] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Toggle ${label}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.categories[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Device Settings */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Control notifications on different devices
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <ComputerDesktopIcon className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Desktop Notifications</h4>
                <p className="text-sm text-gray-600">Browser notifications on desktop</p>
              </div>
            </div>
            <button
              onClick={() => handleDeviceToggle('desktop')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.devices.desktop ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle desktop notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.devices.desktop ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Mobile Notifications</h4>
                <p className="text-sm text-gray-600">Push notifications on mobile devices</p>
              </div>
            </div>
            <button
              onClick={() => handleDeviceToggle('mobile')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.devices.mobile ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle mobile notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.devices.mobile ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Browser Permission Notice */}
      {'Notification' in window && Notification.permission === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Browser Notifications Blocked</h4>
              <p className="text-sm text-amber-800 mt-1">
                You've blocked notifications in your browser. To receive desktop notifications, 
                please enable them in your browser settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 min-w-[150px] px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
          
          <button
            onClick={handleTestNotification}
            className="flex-1 min-w-[150px] px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <BellIcon className="w-5 h-5" />
            Test Notification
          </button>
          
          <button
            onClick={handleReset}
            className="flex-1 min-w-[150px] px-4 py-2.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
