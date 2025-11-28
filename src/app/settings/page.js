'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  KeyIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import ProfileSettings from '@/components/settings/ProfileSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import LearningPreferences from '@/components/settings/LearningPreferences';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import AnalyticsSettings from '@/components/settings/AnalyticsSettings';
import { Toaster } from 'react-hot-toast';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Settings sections matching platform design
  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your personal information and profile',
      icon: UserIcon,
      color: 'blue',
      href: '#'
    },
    {
      id: 'account',
      title: 'Account & Security',
      description: 'Password, authentication, and security settings',
      icon: KeyIcon,
      color: 'red',
      href: '#'
    },
    {
      id: 'preferences',
      title: 'Learning Preferences',
      description: 'AI behavior and adaptive learning settings',
      icon: CogIcon,
      color: 'purple',
      href: '#'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure alerts and communication preferences',
      icon: BellIcon,
      color: 'amber',
      href: '#'
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      description: 'Control your data and privacy settings',
      icon: ShieldCheckIcon,
      color: 'green',
      href: '#'
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'View your learning analytics and progress',
      icon: ChartBarIcon,
      color: 'indigo',
      href: '#'
    }
  ];

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSettingsSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings user={user} onUpdate={fetchUserProfile} />;
      case 'account':
        return <AccountSettings />;
      case 'preferences':
        return <LearningPreferences />;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'analytics':
        return <AnalyticsSettings />;
      default:
        return <ProfileSettings user={user} onUpdate={fetchUserProfile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name} {user?.surname}
                </p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {(user?.name?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Navigation Sidebar */}
          <div className="w-80 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
              <ul className="space-y-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          activeSection === section.id
                            ? `bg-${section.color}-100 text-${section.color}-600`
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{section.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {section.description}
                          </div>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderSettingsSection()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;