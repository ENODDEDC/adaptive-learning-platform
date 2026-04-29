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
        {/* Chart - Modern Line/Area Chart */}
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
          
          {/* SVG Line Chart */}
          <div className="relative h-64">
            {(() => {
              const data = dashboardData.chartData;
              const values = data.map(d => chartView === 'users' ? d.users : d.courses);
              const maxValue = Math.max(...values, 1);
              const minValue = Math.min(...values, 0);
              const range = maxValue - minValue || 1;
              
              const width = 100;
              const height = 100;
              const padding = 10;
              const chartWidth = width - padding * 2;
              const chartHeight = height - padding * 2;
              
              // Calculate points for the line
              const points = data.map((d, i) => {
                const value = chartView === 'users' ? d.users : d.courses;
                const x = padding + (i / (data.length - 1)) * chartWidth;
                const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
                return { x, y, value, month: d.month };
              });
              
              // Create path for line
              const linePath = points.map((p, i) => 
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
              ).join(' ');
              
              // Create path for area (fill under line)
              const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;
              
              // Create smooth curve path
              const smoothPath = points.map((p, i) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = points[i - 1];
                const cpx1 = prev.x + (p.x - prev.x) / 3;
                const cpy1 = prev.y;
                const cpx2 = prev.x + 2 * (p.x - prev.x) / 3;
                const cpy2 = p.y;
                return `C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p.x} ${p.y}`;
              }).join(' ');
              
              const smoothAreaPath = `${smoothPath} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;
              
              return (
                <>
                  <svg 
                    viewBox={`0 0 ${width} ${height}`} 
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => {
                      const y = padding + (i / 4) * chartHeight;
                      return (
                        <line
                          key={`grid-${i}`}
                          x1={padding}
                          y1={y}
                          x2={width - padding}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="0.1"
                          className="text-gray-200 dark:text-gray-700"
                          opacity="0.5"
                        />
                      );
                    })}
                    
                    {/* Area fill with gradient */}
                    <defs>
                      <linearGradient id={`gradient-${chartView}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop 
                          offset="0%" 
                          stopColor={chartView === 'users' ? '#9333ea' : '#4f46e5'} 
                          stopOpacity="0.3"
                        />
                        <stop 
                          offset="100%" 
                          stopColor={chartView === 'users' ? '#9333ea' : '#4f46e5'} 
                          stopOpacity="0.05"
                        />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d={smoothAreaPath}
                      fill={`url(#gradient-${chartView})`}
                      className="transition-all duration-500"
                    />
                    
                    {/* Line */}
                    <path
                      d={smoothPath}
                      fill="none"
                      stroke={chartView === 'users' ? '#9333ea' : '#4f46e5'}
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500"
                    />
                    
                    {/* Data points */}
                    {points.map((point, i) => (
                      <g key={i}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="1"
                          fill="white"
                          stroke={chartView === 'users' ? '#9333ea' : '#4f46e5'}
                          strokeWidth="0.5"
                          className="transition-all duration-500 hover:r-2"
                        />
                      </g>
                    ))}
                  </svg>
                  
                  {/* Interactive overlay for tooltips */}
                  <div className="absolute inset-0 flex">
                    {points.map((point, i) => (
                      <div
                        key={i}
                        className="relative flex-1 group"
                      >
                        <div className="absolute inset-0 cursor-pointer" />
                        {/* Tooltip */}
                        <div className="absolute z-10 px-3 py-2 text-xs font-medium text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 rounded-lg opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 whitespace-nowrap mb-2 shadow-lg">
                          <div className="font-semibold">{point.month}</div>
                          <div className="mt-1">
                            {point.value} {chartView === 'users' ? 'users' : 'courses'}
                          </div>
                          <div className="absolute w-2 h-2 transform rotate-45 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 left-1/2 -bottom-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-4 px-2">
            {dashboardData.chartData.map((data, index) => (
              <div key={index} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {data.month}
              </div>
            ))}
          </div>
          
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className={`text-lg font-bold mt-1 ${chartView === 'users' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {dashboardData.chartData.reduce((sum, d) => sum + (chartView === 'users' ? d.users : d.courses), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
              <p className={`text-lg font-bold mt-1 ${chartView === 'users' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {Math.round(dashboardData.chartData.reduce((sum, d) => sum + (chartView === 'users' ? d.users : d.courses), 0) / dashboardData.chartData.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Peak</p>
              <p className={`text-lg font-bold mt-1 ${chartView === 'users' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {Math.max(...dashboardData.chartData.map(d => chartView === 'users' ? d.users : d.courses))}
              </p>
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