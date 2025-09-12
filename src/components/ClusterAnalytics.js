import React, { useState, useEffect } from 'react';

const ClusterAnalytics = ({ clusters }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate analytics data
  const analyticsData = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter clusters based on time range
    let filteredClusters = clusters;
    if (timeRange === '7d') {
      filteredClusters = clusters.filter(c => new Date(c.createdAt) >= sevenDaysAgo);
    } else if (timeRange === '30d') {
      filteredClusters = clusters.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
    }

    // Basic metrics
    const totalClusters = clusters.length;
    const activeClusters = clusters.filter(c => c.enrolledUsers?.length > 0).length;
    const myClusters = clusters.filter(c => c.createdBy?._id).length;
    const joinedClusters = totalClusters - myClusters;
    const totalCourses = clusters.reduce((sum, c) => sum + (c.courses?.length || 0), 0);
    const totalMembers = clusters.reduce((sum, c) => sum + (c.enrolledUsers?.length || 0), 0);
    const averageCoursesPerCluster = totalClusters > 0 ? (totalCourses / totalClusters).toFixed(1) : 0;
    const averageMembersPerCluster = totalClusters > 0 ? (totalMembers / totalClusters).toFixed(1) : 0;

    // Growth metrics
    const clustersThisWeek = clusters.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const clustersThisMonth = clusters.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;
    const clustersLastWeek = clusters.filter(c => {
      const created = new Date(c.createdAt);
      const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return created >= lastWeekStart && created < lastWeekEnd;
    }).length;

    const weekOverWeekGrowth = lastWeekClusters > 0 
      ? (((clustersThisWeek - lastWeekClusters) / lastWeekClusters) * 100).toFixed(1)
      : 0;

    // Most active clusters
    const mostActiveClusters = clusters
      .sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0))
      .slice(0, 5);

    // Course distribution
    const courseDistribution = clusters.reduce((acc, cluster) => {
      const count = cluster.courses?.length || 0;
      const range = count === 0 ? '0' : count <= 2 ? '1-2' : count <= 5 ? '3-5' : '6+';
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    // Member distribution
    const memberDistribution = clusters.reduce((acc, cluster) => {
      const count = cluster.enrolledUsers?.length || 0;
      const range = count === 0 ? '0' : count <= 5 ? '1-5' : count <= 10 ? '6-10' : '11+';
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (mock data - would need actual activity tracking)
    const recentActivity = clusters
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map(cluster => ({
        id: cluster._id,
        name: cluster.name,
        type: 'updated',
        timestamp: cluster.updatedAt,
        description: 'Cluster was updated'
      }));

    return {
      overview: {
        totalClusters,
        activeClusters,
        myClusters,
        joinedClusters,
        totalCourses,
        totalMembers,
        averageCoursesPerCluster,
        averageMembersPerCluster
      },
      growth: {
        clustersThisWeek,
        clustersThisMonth,
        weekOverWeekGrowth
      },
      mostActiveClusters,
      courseDistribution,
      memberDistribution,
      recentActivity
    };
  }, [clusters, timeRange]);

  const renderOverview = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalClusters}</div>
        <div className="text-sm text-gray-500">Total Clusters</div>
        <div className="text-xs text-green-600 mt-1">
          +{analyticsData.growth.clustersThisMonth} this month
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{analyticsData.overview.activeClusters}</div>
        <div className="text-sm text-gray-500">Active Clusters</div>
        <div className="text-xs text-gray-500 mt-1">
          {((analyticsData.overview.activeClusters / analyticsData.overview.totalClusters) * 100).toFixed(1)}% of total
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{analyticsData.overview.totalCourses}</div>
        <div className="text-sm text-gray-500">Total Courses</div>
        <div className="text-xs text-gray-500 mt-1">
          {analyticsData.overview.averageCoursesPerCluster} avg per cluster
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{analyticsData.overview.totalMembers}</div>
        <div className="text-sm text-gray-500">Total Members</div>
        <div className="text-xs text-gray-500 mt-1">
          {analyticsData.overview.averageMembersPerCluster} avg per cluster
        </div>
      </div>
    </div>
  );

  const renderGrowth = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{analyticsData.growth.clustersThisWeek}</div>
          <div className="text-sm text-gray-500">This Week</div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{analyticsData.growth.clustersThisMonth}</div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className={`text-2xl font-bold ${analyticsData.growth.weekOverWeekGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analyticsData.growth.weekOverWeekGrowth >= 0 ? '+' : ''}{analyticsData.growth.weekOverWeekGrowth}%
          </div>
          <div className="text-sm text-gray-500">Week over Week</div>
        </div>
      </div>
    </div>
  );

  const renderMostActive = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Most Active Clusters</h3>
      <div className="space-y-2">
        {analyticsData.mostActiveClusters.map((cluster, index) => (
          <div key={cluster._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600">#{index + 1}</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{cluster.name}</div>
                <div className="text-sm text-gray-500">{cluster.courses?.length || 0} courses</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{cluster.enrolledUsers?.length || 0}</div>
              <div className="text-sm text-gray-500">members</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDistribution = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analyticsData.courseDistribution).map(([range, count]) => (
            <div key={range} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{range} courses</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(count / analyticsData.overview.totalClusters) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analyticsData.memberDistribution).map(([range, count]) => (
            <div key={range} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{range} members</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / analyticsData.overview.totalClusters) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecentActivity = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <div className="space-y-2">
        {analyticsData.recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">{activity.description}</div>
              <div className="text-xs text-gray-500">{activity.name}</div>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(activity.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="overview">Overview</option>
            <option value="growth">Growth</option>
            <option value="activity">Most Active</option>
            <option value="distribution">Distribution</option>
            <option value="recent">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {selectedMetric === 'overview' && renderOverview()}
      {selectedMetric === 'growth' && renderGrowth()}
      {selectedMetric === 'activity' && renderMostActive()}
      {selectedMetric === 'distribution' && renderDistribution()}
      {selectedMetric === 'recent' && renderRecentActivity()}
    </div>
  );
};

export default ClusterAnalytics;
