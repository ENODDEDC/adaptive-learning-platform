'use client';

import React, { useState } from 'react';
import { useAdaptiveLayout } from '../context/AdaptiveLayoutContext';
import {
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AdaptiveBehaviorDashboard = ({ isOpen, onClose }) => {
  const { userBehavior, behaviorHistory, resetAdaptiveBehavior, trackInteraction } = useAdaptiveLayout();
  const [activeSection, setActiveSection] = useState('overview');
  const [refreshingNames, setRefreshingNames] = useState(false);

  if (!isOpen) return null;

  const getMostUsedFeature = () => {
    const features = Object.entries(userBehavior.interactionPatterns.timeSpentOnFeatures);
    if (features.length === 0) return { name: 'None', time: 0 };

    const mostUsed = features.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    return {
      name: mostUsed[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      time: Math.round(mostUsed[1] / 60000) // Convert to minutes
    };
  };

  const getInteractionStats = () => {
    const recentInteractions = behaviorHistory.slice(-100);
    const stats = {
      total: recentInteractions.length,
      courseClicks: recentInteractions.filter(i => i.type === 'course_click').length,
      navigation: recentInteractions.filter(i => i.type === 'navigation').length,
      featureUsage: recentInteractions.filter(i => i.type === 'feature_usage').length
    };
    return stats;
  };

  // Refresh course names from database
  const refreshCourseNames = async () => {
    setRefreshingNames(true);
    try {
      const coursesWithUnknownNames = userBehavior.interactionPatterns.mostClickedCourses.filter(
        course => course.courseName === 'Unknown Course' ||
                 course.courseName.startsWith('Course ') ||
                 course.courseName === 'New Course' ||
                 course.courseName === 'Untitled'
      );

      for (const course of coursesWithUnknownNames) {
        try {
          const response = await fetch(`/api/courses/${course.courseId}`, {
            credentials: 'include'
          });

          if (response.ok) {
            const courseData = await response.json();
            const realCourseName = courseData.course?.subject || courseData.course?.name;

            if (realCourseName && realCourseName !== 'Unknown Course') {
              course.courseName = realCourseName;
              trackInteraction('course_name_updated', {
                courseId: course.courseId,
                oldName: course.courseName,
                newName: realCourseName
              });
            }
          }
        } catch (error) {
          console.error(`Failed to refresh name for course ${course.courseId}:`, error);
        }
      }

      // Force a re-render by updating the component state
      setActiveSection('patterns');
      setTimeout(() => setActiveSection('overview'), 100);

    } catch (error) {
      console.error('Failed to refresh course names:', error);
    } finally {
      setRefreshingNames(false);
    }
  };

  const getLayoutRecommendations = () => {
    const preferences = userBehavior.layoutPreferences;
    const patterns = userBehavior.interactionPatterns;

    const recommendations = [];

    if (patterns.mostClickedCourses.length > 5) {
      recommendations.push({
        type: 'layout',
        title: 'Large Card Layout',
        description: 'You frequently interact with courses. Consider switching to larger cards for better visibility.',
        current: preferences.cardSize,
        suggested: 'large'
      });
    }

    if (patterns.searchFrequency > 10) {
      recommendations.push({
        type: 'feature',
        title: 'Compact Grid',
        description: 'You use search frequently. A more compact layout would show more courses at once.',
        current: preferences.compactMode,
        suggested: true
      });
    }

    if (patterns.dragDropFrequency > 3) {
      recommendations.push({
        type: 'behavior',
        title: 'Course Organization',
        description: 'You frequently reorganize courses. Consider using the custom sort order.',
        current: preferences.sortOrder,
        suggested: 'custom'
      });
    }

    return recommendations;
  };

  const stats = getInteractionStats();
  const mostUsedFeature = getMostUsedFeature();
  const recommendations = getLayoutRecommendations();

  const sections = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'patterns', name: 'Patterns', icon: EyeIcon },
    { id: 'recommendations', name: 'Suggestions', icon: LightBulbIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Adaptive Behavior</h2>
              <p className="text-sm text-gray-600">How the system learns from your interactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCourseNames}
              disabled={refreshingNames}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              title="Refresh course names from database"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshingNames ? 'animate-spin' : ''}`} />
              {refreshingNames ? 'Refreshing...' : 'Refresh Names'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4">
              <ul className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {section.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === 'overview' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-700">Total Interactions</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{stats.courseClicks}</div>
                    <div className="text-sm text-green-700">Course Clicks</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{stats.navigation}</div>
                    <div className="text-sm text-purple-700">Navigation</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{stats.featureUsage}</div>
                    <div className="text-sm text-orange-700">Feature Usage</div>
                  </div>
                </div>

                {/* Most Used Feature */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Most Used Feature</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{mostUsedFeature.name}</span>
                    <span className="text-sm text-gray-500">{mostUsedFeature.time} minutes</span>
                  </div>
                </div>

                {/* Current Preferences */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Current Layout Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Card Size:</span>
                      <span className="ml-2 font-medium text-gray-900 capitalize">
                        {userBehavior.layoutPreferences.cardSize}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Grid Columns:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {userBehavior.layoutPreferences.gridColumns}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Sort Order:</span>
                      <span className="ml-2 font-medium text-gray-900 capitalize">
                        {userBehavior.layoutPreferences.sortOrder}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Compact Mode:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {userBehavior.layoutPreferences.compactMode ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'patterns' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Patterns</h3>

                {/* Most Clicked Courses */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Most Clicked Courses</h4>
                  <div className="space-y-2">
                    {userBehavior.interactionPatterns.mostClickedCourses.slice(0, 5).map((course, index) => {
                      const courseId = course.courseId || course;
                      const idString = courseId.toString();

                      // Enhanced course name resolution
                      const getCourseDisplayName = (courseObj, courseId) => {
                        // If it's an object with metadata, try multiple fields
                        if (typeof courseObj === 'object' && courseObj.metadata) {
                          const name = courseObj.metadata.courseName || courseObj.metadata.courseSubject ||
                                      courseObj.metadata.courseTitle || courseObj.metadata.title ||
                                      courseObj.metadata.subject || courseObj.metadata.name;
                          if (name && name !== 'Unknown Course' && name !== 'New Course' && name !== 'Untitled' && name.trim() !== '') {
                            return name;
                          }
                        }

                        // If it's a direct object, try common name fields
                        if (typeof courseObj === 'object') {
                          const name = courseObj.courseName || courseObj.name || courseObj.title ||
                                      courseObj.subject || courseObj.courseSubject || courseObj.courseTitle;
                          if (name && name !== 'Unknown Course' && name !== 'New Course' && name !== 'Untitled' && name.trim() !== '') {
                            return name;
                          }
                        }

                        // If it's just a string, return it if it's meaningful
                        if (typeof courseObj === 'string') {
                          if (courseObj && courseObj !== 'Unknown Course' && courseObj !== 'New Course' && courseObj !== 'Untitled' && courseObj.trim() !== '') {
                            return courseObj;
                          }
                        }

                        // Generate meaningful fallback names based on course ID
                        if (courseId && courseId.length > 10) {
                          const shortId = courseId.substring(courseId.length - 4).toUpperCase();
                          return `Course ${shortId}`;
                        }

                        // Final fallback
                        return courseId || 'Unknown Course';
                      };

                      const displayName = getCourseDisplayName(course, courseId);

                      return (
                        <div key={idString} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                            </div>
                            <span className="text-gray-700 font-medium">{displayName}</span>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            ID: {idString.slice(-4)}
                          </div>
                        </div>
                      );
                    })}
                    {userBehavior.interactionPatterns.mostClickedCourses.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No course interactions recorded yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start clicking on courses to see your patterns here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Usage */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Feature Usage Time</h4>
                  <div className="space-y-2">
                    {Object.entries(userBehavior.interactionPatterns.timeSpentOnFeatures).map(([feature, time]) => (
                      <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 capitalize">{feature.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-500">{Math.round(time / 60000)}m</span>
                      </div>
                    ))}
                    {Object.keys(userBehavior.interactionPatterns.timeSpentOnFeatures).length === 0 && (
                      <p className="text-gray-500 text-sm">No feature usage recorded yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'recommendations' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Recommendations</h3>

                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            Current: {rec.current} → Suggested: {rec.suggested}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {recommendations.length === 0 && (
                    <div className="text-center py-8">
                      <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No recommendations available yet. Keep using the platform to get personalized suggestions!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adaptive Settings</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Learning Rate</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      How quickly the system adapts to your behavior patterns.
                    </p>
                    <div className="text-sm text-gray-500">
                      Current: {userBehavior.adaptiveSettings.learningRate}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Minimum Interactions</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Number of interactions needed before the system starts adapting.
                    </p>
                    <div className="text-sm text-gray-500">
                      Current: {userBehavior.adaptiveSettings.minInteractions}
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Reset Adaptive Behavior</h4>
                    <p className="text-sm text-red-700 mb-3">
                      This will clear all learned behavior patterns and reset to default settings.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all adaptive behavior? This cannot be undone.')) {
                          resetAdaptiveBehavior();
                          onClose();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Reset All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveBehaviorDashboard;