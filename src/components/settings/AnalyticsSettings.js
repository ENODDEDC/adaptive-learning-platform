'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';

const AnalyticsSettings = () => {
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalStudyTime: 0,
    averageScore: 0,
    streakDays: 0,
    achievements: [],
    weeklyProgress: [],
    monthlyProgress: []
  });
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData = {
        totalCourses: 12,
        completedCourses: 8,
        totalStudyTime: 156, // hours
        averageScore: 87,
        streakDays: 15,
        achievements: [
          { id: 1, title: 'First Course Completed', description: 'Completed your first course', date: '2024-01-15' },
          { id: 2, title: 'Week Streak', description: '7-day learning streak', date: '2024-02-01' },
          { id: 3, title: 'Speed Learner', description: 'Completed 5 courses in a month', date: '2024-02-15' }
        ],
        weeklyProgress: [65, 70, 75, 80, 85, 90, 95],
        monthlyProgress: [400, 450, 380, 520, 490, 550, 580, 620, 680, 720, 750, 800]
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${Math.round(remainingHours)}h`;
  };

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Learning Analytics</h3>
              <p className="text-sm text-gray-600">Track your learning progress and achievements</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{analytics.totalCourses}</div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{analytics.completedCourses}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{formatTime(analytics.totalStudyTime)}</div>
              <div className="text-sm text-gray-600">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{analytics.averageScore}%</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Progress Over Time</h3>
                <p className="text-sm text-gray-600">Your learning activity and progress</p>
              </div>
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="h-64 flex items-end justify-between space-x-2">
            {(timeframe === 'week' ? analytics.weeklyProgress : analytics.monthlyProgress).map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                  style={{ height: `${(value / 1000) * 100}%` }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {timeframe === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
              <p className="text-sm text-gray-600">Your latest milestones and accomplishments</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {analytics.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(achievement.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Learning Insights</h3>
          <p className="text-sm text-gray-600">AI-powered analysis of your learning patterns</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Best Study Time</h4>
              <p className="text-sm text-blue-700">You perform best between 2-4 PM</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Learning Streak</h4>
              <p className="text-sm text-green-700">{analytics.streakDays} days current streak</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Preferred Subjects</h4>
              <p className="text-sm text-purple-700">Computer Science, Mathematics</p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Study Style</h4>
              <p className="text-sm text-orange-700">Visual Learner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;