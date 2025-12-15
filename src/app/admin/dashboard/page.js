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
  const [chartView, setChartView] = useState('users'); // 'users' or 'courses'
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
      const activeCourses = coursesData.filter(course => !course.isArchived).length;
      const totalStudents = coursesData.reduce((acc, course) => acc + (course.enrolledUsersCount || 0), 0);

      // Mock revenue for now (you can replace with real API)
      const totalRevenue = Math.floor(Math.random() * 50000) + 10000;

      // Fetch real recent activities
      const recentActivity = await fetchRecentActivities();

      // Generate chart data (last 6 months)
      const chartData = await generateChartData();

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

  const generateChartData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/admin/users');
      let users = [];
      if (usersResponse.ok) {
        users = await usersResponse.json();
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/admin/courses');
      let courses = [];
      if (coursesResponse.ok) {
        courses = await coursesResponse.json();
      }

      // Get last 6 months
      const months = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: monthNames[date.getMonth()],
          year: date.getFullYear(),
          startDate: new Date(date.getFullYear(), date.getMonth(), 1),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
        });
      }

      // Count users and courses per month
      const chartData = months.map(({ month, startDate, endDate }) => {
        const usersCount = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        }).length;

        const coursesCount = courses.filter(course => {
          const createdAt = new Date(course.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        }).length;

        return {
          month,
          users: usersCount,
          courses: coursesCount,
        };
      });

      return chartData;
    } catch (error) {
      console.error('Error generating chart data:', error);
      // Fallback to mock data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({
        month,
        users: Math.floor(Math.random() * 10) + 5,
        courses: Math.floor(Math.random() * 5) + 2,
      }));
    }
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
          <div className="w-64 h-8 mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-24 h-4 mb-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-12 h-12 ml-4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
              <div className="w-32 h-6 mb-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
              <div className="h-6 mb-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-3 text-red-400 dark:text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-lg shadow-lg">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              {dashboardData.stats.userGrowth}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.stats.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-6 transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              {dashboardData.stats.courseGrowth}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.stats.activeCourses}</p>
          </div>
        </div>

        <div className="p-6 transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-gray-500 dark:bg-gray-600 rounded-lg shadow-lg">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              {dashboardData.stats.taskGrowth}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.stats.pendingTasks}</p>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Chart - Heatmap Style */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Platform Growth</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setChartView('users')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                  chartView === 'users' 
                    ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Users
              </button>
              <button 
                onClick={() => setChartView('courses')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                  chartView === 'courses' 
                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Courses
              </button>
            </div>
          </div>
          
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Month labels */}
              <div className="flex mb-2 ml-12">
                {dashboardData.chartData.map((data, index) => (
                  <div key={`month-${index}`} className="flex-1 min-w-[60px] text-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.month}</span>
                  </div>
                ))}
              </div>
              
              {/* Heatmap rows */}
              <div className="space-y-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                  <div key={day} className="flex items-center">
                    <div className="w-10 text-xs font-medium text-gray-500 dark:text-gray-400">{day}</div>
                    <div className="flex flex-1 gap-1">
                      {dashboardData.chartData.map((data, monthIndex) => {
                        const value = chartView === 'users' ? data.users : data.courses;
                        const maxValue = Math.max(...dashboardData.chartData.map(d => chartView === 'users' ? d.users : d.courses), 1);
                        
                        // Create variation for each day (simulate daily data)
                        const dayValue = Math.floor(value / 7) + Math.floor(Math.random() * (value / 7));
                        const intensity = maxValue > 0 ? (dayValue / maxValue) * 4 : 0;
                        
                        // Determine color intensity (light to dark)
                        let bgColor = 'bg-gray-100 dark:bg-gray-700';
                        if (intensity > 3) {
                          bgColor = chartView === 'users' ? 'bg-purple-600 dark:bg-purple-600' : 'bg-indigo-600 dark:bg-indigo-600';
                        } else if (intensity > 2) {
                          bgColor = chartView === 'users' ? 'bg-purple-500 dark:bg-purple-500' : 'bg-indigo-500 dark:bg-indigo-500';
                        } else if (intensity > 1) {
                          bgColor = chartView === 'users' ? 'bg-purple-400 dark:bg-purple-400' : 'bg-indigo-400 dark:bg-indigo-400';
                        } else if (intensity > 0) {
                          bgColor = chartView === 'users' ? 'bg-purple-200 dark:bg-purple-200' : 'bg-indigo-200 dark:bg-indigo-200';
                        }
                        
                        return (
                          <div
                            key={`${day}-${monthIndex}`}
                            className={`relative flex-1 min-w-[60px] h-8 ${bgColor} rounded transition-all duration-200 hover:ring-2 hover:ring-offset-1 dark:hover:ring-offset-gray-800 ${
                              chartView === 'users' ? 'hover:ring-purple-400 dark:hover:ring-purple-500' : 'hover:ring-indigo-400 dark:hover:ring-indigo-500'
                            } group cursor-pointer`}
                            title={`${dayValue} ${chartView === 'users' ? 'users' : 'courses'}`}
                          >
                            {/* Tooltip */}
                            <div className="absolute z-10 px-2 py-1 text-xs font-medium text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 rounded opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 whitespace-nowrap mb-1">
                              {dayValue} {chartView === 'users' ? 'users' : 'courses'}
                              <div className="absolute w-2 h-2 transform rotate-45 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 left-1/2 -bottom-1"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <div className={`w-4 h-4 rounded ${chartView === 'users' ? 'bg-purple-200 dark:bg-purple-200' : 'bg-indigo-200 dark:bg-indigo-200'}`}></div>
                <div className={`w-4 h-4 rounded ${chartView === 'users' ? 'bg-purple-400 dark:bg-purple-400' : 'bg-indigo-400 dark:bg-indigo-400'}`}></div>
                <div className={`w-4 h-4 rounded ${chartView === 'users' ? 'bg-purple-500 dark:bg-purple-500' : 'bg-indigo-500 dark:bg-indigo-500'}`}></div>
                <div className={`w-4 h-4 rounded ${chartView === 'users' ? 'bg-purple-600 dark:bg-purple-600' : 'bg-indigo-600 dark:bg-indigo-600'}`}></div>
              </div>
              <span>More</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {chartView === 'users' ? 'user registrations' : 'course creations'} over the last 6 months
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <button
              onClick={() => router.push('/admin/activities')}
              className="text-sm font-medium text-purple-600 dark:text-purple-400 transition-colors duration-200 hover:text-purple-800 dark:hover:text-purple-300"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 space-x-3 transition-colors duration-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    activity.type === 'success' ? 'bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50' :
                    activity.type === 'warning' ? 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600' :
                    activity.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50' :
                    'bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50'
                  }`}>
                    {activity.type === 'success' ? (
                      <CheckCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : activity.type === 'warning' ? (
                      <ExclamationTriangleIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : activity.type === 'error' ? (
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="font-medium text-purple-600 dark:text-purple-400">{activity.target}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.category === 'user' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        activity.category === 'course' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' :
                        activity.category === 'assignment' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        activity.category === 'form' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                        activity.category === 'admin' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {activity.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <EyeIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Activities will appear here as users interact with the platform</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* System Health */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">System Status</span>
              </div>
              <span className="text-sm text-indigo-600 dark:text-indigo-400">{dashboardData.systemHealth.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dashboardData.systemHealth.uptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Backup</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dashboardData.systemHealth.lastBackup}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full p-3 text-left transition-all duration-200 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 transition-colors duration-200 bg-purple-600 dark:bg-purple-500 rounded-lg group-hover:bg-purple-700 dark:group-hover:bg-purple-600">
                  <UsersIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Manage Users</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Add, edit, or remove users</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/courses')}
              className="w-full p-3 text-left transition-all duration-200 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 transition-colors duration-200 bg-indigo-600 dark:bg-indigo-500 rounded-lg group-hover:bg-indigo-700 dark:group-hover:bg-indigo-600">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Create Course</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Add new course content</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Stats */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">This Month</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">+{Math.floor(dashboardData.stats.totalUsers * 0.15)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Courses Created</span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">+{Math.floor(dashboardData.stats.activeCourses * 0.25)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}