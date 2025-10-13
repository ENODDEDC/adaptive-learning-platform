'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      activeCourses: 0,
      totalRevenue: 0,
      pendingTasks: 0,
      userGrowth: '+0%',
      courseGrowth: '+0%',
      revenueGrowth: '+0%',
      taskGrowth: '+0%',
    },
    recentActivity: [],
    chartData: [],
    systemHealth: {
      status: 'healthy',
      uptime: '99.9%',
      lastBackup: '2 hours ago',
    }
  });

  const fetchDashboardData = useCallback(async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      // Fetch users data
      const usersResponse = await fetch('/api/admin/users');
      let usersData = [];
      if (usersResponse.ok) {
        usersData = await usersResponse.json();
      }

      // Fetch courses data
      const coursesResponse = await fetch('/api/admin/courses');
      let coursesData = [];
      if (coursesResponse.ok) {
        coursesData = await coursesResponse.json();
      }

      // Calculate real stats
      const totalUsers = usersData.length;
      const activeCourses = coursesData.filter(course => course.status === 'active').length;
      const totalStudents = coursesData.reduce((acc, course) => acc + (course.enrolledUsersCount || 0), 0);

      // Mock revenue for now (you can replace with real API)
      const totalRevenue = Math.floor(Math.random() * 50000) + 10000;

      // Fetch real recent activities
      const recentActivity = await fetchRecentActivities();

      // Generate chart data (last 6 months)
      const chartData = generateChartData();

      setDashboardData({
        stats: {
          totalUsers,
          activeCourses,
          totalRevenue,
          pendingTasks: Math.floor(Math.random() * 20) + 5,
          userGrowth: '+12.5%',
          courseGrowth: '+4.2%',
          revenueGrowth: '+8.1%',
          taskGrowth: '-2.4%',
        },
        recentActivity,
        chartData,
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          lastBackup: '2 hours ago',
        }
      });

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities?limit=6');
      if (response.ok) {
        const activities = await response.json();
        return activities;
      }
      return [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  };

  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      users: Math.floor(Math.random() * 1000) + 500,
      courses: Math.floor(Math.random() * 30) + 20,
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="w-64 h-8 mb-6 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-24 h-4 mb-2 bg-gray-200 rounded"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-12 h-12 ml-4 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="w-32 h-6 mb-4 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="h-6 mb-4 bg-gray-200 rounded w-36"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Error Alert */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-3 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative p-6 overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg group">
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                {dashboardData.stats.userGrowth}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardData.stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg group">
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-green-500/5 to-green-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                {dashboardData.stats.courseGrowth}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardData.stats.activeCourses}</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg group">
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-purple-600">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                {dashboardData.stats.revenueGrowth}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 overflow-hidden transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-lg group">
          <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 group-hover:opacity-100"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-orange-600">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm text-red-600">
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                {dashboardData.stats.taskGrowth}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardData.stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Chart */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Platform Growth</h3>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-purple-700 bg-purple-100 rounded-lg">
                Users
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 rounded-lg hover:bg-gray-100">
                Courses
              </button>
            </div>
          </div>
          <div className="flex items-end justify-between h-64 space-x-2">
            {dashboardData.chartData.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center flex-1">
                <div className="relative flex flex-col-reverse w-full">
                  <div
                    className="mx-1 rounded-t-sm bg-gradient-to-t from-purple-500 to-purple-400"
                    style={{ height: `${Math.max((data.users / Math.max(...dashboardData.chartData.map(d => d.users))) * 100, 10)}%` }}
                  ></div>
                  <div
                    className="mx-1 mt-1 rounded-t-sm bg-gradient-to-t from-blue-500 to-blue-400"
                    style={{ height: `${Math.max((data.courses / Math.max(...dashboardData.chartData.map(d => d.courses))) * 100, 10)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{data.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => router.push('/admin/activities')}
              className="text-sm font-medium text-purple-600 transition-colors duration-200 hover:text-purple-800"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 space-x-3 transition-colors duration-200 rounded-lg hover:bg-gray-50 group">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    activity.type === 'success' ? 'bg-green-100 group-hover:bg-green-200' :
                    activity.type === 'warning' ? 'bg-orange-100 group-hover:bg-orange-200' :
                    activity.type === 'error' ? 'bg-red-100 group-hover:bg-red-200' :
                    'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    {activity.type === 'success' ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : activity.type === 'warning' ? (
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                    ) : activity.type === 'error' ? (
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="font-medium text-purple-600">{activity.target}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.category === 'user' ? 'bg-blue-100 text-blue-800' :
                        activity.category === 'course' ? 'bg-green-100 text-green-800' :
                        activity.category === 'assignment' ? 'bg-purple-100 text-purple-800' :
                        activity.category === 'form' ? 'bg-orange-100 text-orange-800' :
                        activity.category === 'admin' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <EyeIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No recent activity</p>
                <p className="mt-1 text-sm text-gray-400">Activities will appear here as users interact with the platform</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* System Health */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">System Status</span>
              </div>
              <span className="text-sm text-green-600">{dashboardData.systemHealth.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">{dashboardData.systemHealth.uptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium text-gray-900">{dashboardData.systemHealth.lastBackup}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full p-3 text-left transition-all duration-200 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 transition-colors duration-200 bg-blue-500 rounded-lg group-hover:bg-blue-600">
                  <UsersIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-600">Add, edit, or remove users</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/courses')}
              className="w-full p-3 text-left transition-all duration-200 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 transition-colors duration-200 bg-green-500 rounded-lg group-hover:bg-green-600">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Create Course</p>
                  <p className="text-xs text-gray-600">Add new course content</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Stats */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">This Month</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Users</span>
              <span className="text-sm font-medium text-green-600">+{Math.floor(dashboardData.stats.totalUsers * 0.15)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Courses Created</span>
              <span className="text-sm font-medium text-blue-600">+{Math.floor(dashboardData.stats.activeCourses * 0.25)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-medium text-purple-600">{formatCurrency(dashboardData.stats.totalRevenue * 0.12)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}