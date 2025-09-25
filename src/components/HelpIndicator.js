'use client';

import React, { useState, useEffect } from 'react';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Tooltip from './Tooltip';

const HelpIndicator = ({
  variant = 'floating',
  position = 'bottom-right',
  context = 'general',
  showTips = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // Context-specific help content
  const helpContent = {
    courses: {
      title: 'Course Management',
      tips: [
        {
          icon: <AcademicCapIcon className="w-5 h-5" />,
          title: 'Course Cards',
          content: 'Click any course card to preview its content, or drag to reorder your courses.',
          type: 'info'
        },
        {
          icon: <ChartBarIcon className="w-5 h-5" />,
          title: 'Progress Tracking',
          content: 'Monitor your learning progress with visual indicators and completion percentages.',
          type: 'tip'
        },
        {
          icon: <BookOpenIcon className="w-5 h-5" />,
          title: 'Course Preview',
          content: 'Hover over course cards to see quick previews without leaving the page.',
          type: 'info'
        }
      ]
    },
    navigation: {
      title: 'Navigation Help',
      tips: [
        {
          icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
          title: 'Quick Actions',
          content: 'Use the + button to create courses, join existing ones, or manage clusters.',
          type: 'help'
        },
        {
          icon: <CogIcon className="w-5 h-5" />,
          title: 'Settings',
          content: 'Access your profile, preferences, and account settings from the menu.',
          type: 'info'
        }
      ]
    },
    general: {
      title: 'Getting Started',
      tips: [
        {
          icon: <LightBulbIcon className="w-5 h-5" />,
          title: 'Welcome!',
          content: 'This is your personal learning dashboard. Start by creating or joining a course.',
          type: 'tip'
        },
        {
          icon: <AcademicCapIcon className="w-5 h-5" />,
          title: 'Course Organization',
          content: 'Organize your courses by dragging them to your preferred positions.',
          type: 'info'
        },
        {
          icon: <ChartBarIcon className="w-5 h-5" />,
          title: 'Track Progress',
          content: 'Your progress is automatically saved and synced across all devices.',
          type: 'success'
        }
      ]
    }
  };

  useEffect(() => {
    // Check if user has seen the intro
    const seenIntro = localStorage.getItem('hasSeenIntro');
    if (!seenIntro) {
      setHasSeenIntro(false);
      // Show intro after a short delay
      setTimeout(() => setIsExpanded(true), 2000);
    } else {
      setHasSeenIntro(true);
    }

    // Auto-rotate tips
    if (showTips && !isExpanded) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % helpContent[context].tips.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [context, showTips, isExpanded]);

  const handleCloseIntro = () => {
    setIsExpanded(false);
    setHasSeenIntro(true);
    localStorage.setItem('hasSeenIntro', 'true');
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const currentContext = helpContent[context] || helpContent.general;
  const currentTipData = currentContext.tips[currentTip];

  if (variant === 'inline') {
    return (
      <Tooltip
        content={
          <div className="max-w-xs">
            <div className="font-semibold mb-1">{currentContext.title}</div>
            <div className="text-sm opacity-90">
              {currentContext.tips[0].content}
            </div>
          </div>
        }
        type="help"
        position="top"
        className={className}
      >
        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      </Tooltip>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-40 ${className}`}>
      {/* Main Help Button */}
      <div className="relative">
        <button
          onClick={handleToggle}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
            isExpanded
              ? 'bg-blue-600 text-white shadow-xl scale-110'
              : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg'
          }`}
          aria-label="Help and tips"
        >
          <QuestionMarkCircleIcon className="w-6 h-6" />

          {/* Notification dot for new users */}
          {!hasSeenIntro && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Auto-rotating tip preview */}
        {showTips && !isExpanded && (
          <div className="absolute bottom-full right-0 mb-3">
            <div className="bg-gray-800 text-white px-5 py-4 rounded-xl shadow-lg max-w-lg animate-fade-in-down">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5 text-blue-400">
                  {currentTipData.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm leading-tight">{currentTipData.title}</div>
                  <div className="text-xs opacity-90 mt-2 leading-relaxed">{currentTipData.content}</div>
                </div>
              </div>
              <div className="absolute top-full right-8 w-3 h-3 bg-gray-800 transform rotate-45" />
            </div>
          </div>
        )}
      </div>

      {/* Expanded Help Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 max-h-96 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{currentContext.title}</h3>
              </div>
              <button
                onClick={handleCloseIntro}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-80 overflow-y-auto">
            <div className="space-y-5">
              {currentContext.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-5 p-5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    tip.type === 'tip'
                      ? 'bg-purple-100 text-purple-600'
                      : tip.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-600'
                      : tip.type === 'success'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {tip.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base leading-tight">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{tip.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentTip((prev) => (prev + 1) % currentContext.tips.length)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Next Tip
                </button>
                <button
                  onClick={handleCloseIntro}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpIndicator;