'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayout } from '../../context/LayoutContext';

// Lazy load the analytics component
const ClusterAnalytics = lazy(() => import('../../components/ClusterAnalytics'));

// Enhanced Cluster Card Component
const ClusterCard = React.memo(({ 
  cluster, 
  viewMode, 
  isSelected, 
  onSelect, 
  onManage, 
  onDuplicate, 
  onArchive, 
  onDelete 
}) => {
  const getStatusColor = (cluster) => {
    if (cluster.enrolledUsers?.length === 0) return 'bg-gray-500';
    if (cluster.courses?.length === 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (cluster) => {
    if (cluster.enrolledUsers?.length === 0) return 'Inactive';
    if (cluster.courses?.length === 0) return 'Empty';
    return 'Active';
  };

  const calculateProgress = (cluster) => {
    // This would need actual progress data from backend
    return Math.floor(Math.random() * 100);
  };

  if (viewMode === 'list') {
    return (
      <div className={`p-4 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-lg transition-shadow ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
      role="listitem"
      aria-selected={isSelected}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              aria-label={`Select cluster ${cluster.name}`}
            />
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: cluster.coverColor }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{cluster.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(cluster)}`}>
                  {getStatusText(cluster)}
                </span>
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                  {cluster.classCode}
                </span>
              </div>
              {cluster.section && <p className="text-sm text-gray-500">{cluster.section}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{cluster.courses?.length || 0}</div>
              <div className="text-xs text-gray-500">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{cluster.enrolledUsers?.length || 0}</div>
              <div className="text-xs text-gray-500">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{calculateProgress(cluster)}%</div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onManage}
                className="px-3 py-1 text-sm text-purple-600 bg-purple-100 rounded hover:bg-purple-200"
                aria-label={`Manage cluster ${cluster.name}`}
              >
                Manage
              </button>
              <div className="relative group">
                <button 
                  className="p-1 text-gray-400 hover:text-gray-600"
                  aria-label={`More actions for cluster ${cluster.name}`}
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10" role="menu">
                  <div className="py-1">
                    <button onClick={onDuplicate} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                      Duplicate
                    </button>
                    <button onClick={onArchive} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                      Archive
                    </button>
                    <button onClick={onDelete} className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left" role="menuitem">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className={`p-3 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-lg transition-shadow ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
      role="listitem"
      aria-selected={isSelected}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              aria-label={`Select cluster ${cluster.name}`}
            />
            <div className={`w-6 h-6 rounded`} style={{ backgroundColor: cluster.coverColor }}></div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{cluster.name}</h3>
          </div>
          <span className="text-xs text-gray-500">{cluster.classCode}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{cluster.courses?.length || 0} courses</span>
          <span>{cluster.enrolledUsers?.length || 0} members</span>
          <button
            onClick={onManage}
            className="text-purple-600 hover:text-purple-700"
            aria-label={`Manage cluster ${cluster.name}`}
          >
            Manage
          </button>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className={`overflow-hidden transition-all duration-200 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg ${
      isSelected ? 'ring-2 ring-purple-500' : ''
    }`}
    role="listitem"
    aria-selected={isSelected}
    >
      {/* Header with selection checkbox */}
      <div className="relative">
        <div className={`h-32 relative p-5 flex flex-col justify-between`} style={{ 
          background: `linear-gradient(135deg, ${cluster.coverColor}dd, ${cluster.coverColor}aa)`
        }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500"
                aria-label={`Select cluster ${cluster.name}`}
              />
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg bg-opacity-20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getStatusColor(cluster)}`}>
                {getStatusText(cluster)}
              </span>
              <span className="px-2 py-1 text-xs font-medium text-white bg-black rounded bg-opacity-20">
                {cluster.classCode}
              </span>
            </div>
          </div>
          <div className="text-white">
            <h3 className="text-lg font-bold">{cluster.name}</h3>
            {cluster.section && <p className="text-sm opacity-90">{cluster.section}</p>}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{calculateProgress(cluster)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProgress(cluster)}%` }}
            ></div>
          </div>
        </div>

        {/* Courses Preview */}
        <div className="mb-4">
          <h4 className="mb-2 font-semibold text-gray-900">Courses ({cluster.courses?.length || 0})</h4>
          <div className="space-y-2">
            {cluster.courses?.slice(0, 3).map((course) => (
              <div key={course._id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: course.coverColor || '#60a5fa' }}></div>
                <span className="text-sm text-gray-700 truncate">{course.subject}</span>
                {course.section && <span className="text-xs text-gray-500">({course.section})</span>}
              </div>
            ))}
            {cluster.courses?.length > 3 && (
              <p className="text-xs text-gray-500">+{cluster.courses.length - 3} more courses</p>
            )}
          </div>
        </div>

        {/* Footer with stats and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{cluster.enrolledUsers?.length || 0} members</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {new Date(cluster.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onManage}
              className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded hover:bg-purple-200"
              aria-label={`Manage cluster ${cluster.name}`}
            >
              Manage
            </button>
            <div className="relative group">
              <button 
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label={`More actions for cluster ${cluster.name}`}
                aria-haspopup="true"
                aria-expanded="false"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10" role="menu">
                <div className="py-1">
                  <button onClick={onDuplicate} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                    Duplicate
                  </button>
                  <button onClick={onArchive} className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                    Archive
                  </button>
                  <button onClick={onDelete} className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left" role="menuitem">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ClustersPage = () => {
  const { openCreateClusterModal, openJoinClusterModal } = useLayout();
  const router = useRouter();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sections: [],
    courseCount: { min: 0, max: 50 },
    memberCount: { min: 0, max: 100 },
    dateRange: 'all'
  });
  
  // Drag and drop state
  const [draggedCluster, setDraggedCluster] = useState(null);
  const [dragOverCluster, setDragOverCluster] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  
  // View state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    fetchClusters();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract unique sections for filtering
  useEffect(() => {
    const sections = [...new Set(clusters.map(cluster => cluster.section).filter(Boolean))];
    setFilterOptions(prev => ({ ...prev, sections }));
  }, [clusters]);

  // Filter and sort clusters
  const filteredAndSortedClusters = useMemo(() => {
    let filtered = clusters;

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(cluster =>
        cluster.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        cluster.section?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        cluster.classCode.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'my-clusters':
          filtered = filtered.filter(cluster => cluster.createdBy?._id);
          break;
        case 'joined':
          filtered = filtered.filter(cluster => !cluster.createdBy?._id);
          break;
        case 'active':
          filtered = filtered.filter(cluster => cluster.enrolledUsers?.length > 0);
          break;
        case 'empty':
          filtered = filtered.filter(cluster => !cluster.courses?.length);
          break;
        case 'archived':
          filtered = filtered.filter(cluster => cluster.archived === true);
          break;
      }
    }

    // Additional filters
    if (filterOptions.sections.length > 0) {
      filtered = filtered.filter(cluster => 
        filterOptions.sections.includes(cluster.section)
      );
    }

    filtered = filtered.filter(cluster => {
      const courseCount = cluster.courses?.length || 0;
      const memberCount = cluster.enrolledUsers?.length || 0;
      return courseCount >= filterOptions.courseCount.min && 
             courseCount <= filterOptions.courseCount.max &&
             memberCount >= filterOptions.memberCount.min && 
             memberCount <= filterOptions.memberCount.max;
    });

    // Sort clusters
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'courses':
          return (b.courses?.length || 0) - (a.courses?.length || 0);
        case 'members':
          return (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0);
        case 'activity':
          // This would need activity data from backend
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clusters, debouncedSearchQuery, selectedFilter, sortBy, filterOptions]);

  // Paginated clusters
  const paginatedClusters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredAndSortedClusters.slice(0, endIndex);
    
    setHasMore(endIndex < filteredAndSortedClusters.length);
    return paginated;
  }, [filteredAndSortedClusters, currentPage, itemsPerPage]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedFilter, sortBy, filterOptions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalClusters = clusters.length;
    const myClusters = clusters.filter(c => c.createdBy?._id).length;
    const joinedClusters = totalClusters - myClusters;
    const totalCourses = clusters.reduce((sum, c) => sum + (c.courses?.length || 0), 0);
    const totalMembers = clusters.reduce((sum, c) => sum + (c.enrolledUsers?.length || 0), 0);
    const activeClusters = clusters.filter(c => c.enrolledUsers?.length > 0).length;

    return {
      totalClusters,
      myClusters,
      joinedClusters,
      totalCourses,
      totalMembers,
      activeClusters
    };
  }, [clusters]);

  // Utility functions
  const toggleClusterSelection = useCallback((clusterId) => {
    setSelectedClusters(prev =>
      prev.includes(clusterId)
        ? prev.filter(id => id !== clusterId)
        : [...prev, clusterId]
    );
  }, []);

  const selectAllClusters = useCallback(() => {
    setSelectedClusters(filteredAndSortedClusters.map(c => c._id));
  }, [filteredAndSortedClusters]);

  const clearSelection = useCallback(() => {
    setSelectedClusters([]);
  }, []);

  const handleBulkAction = async (action) => {
    if (selectedClusters.length === 0) return;
    
    try {
      setLoading(true);
      
      switch (action) {
        case 'archive':
          const archiveResponse = await fetch('/api/clusters/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'archive', clusterIds: selectedClusters })
          });
          
          if (archiveResponse.ok) {
            await fetchClusters(); // Refresh the list
            alert(`Successfully archived ${selectedClusters.length} cluster(s)`);
          } else {
            throw new Error('Failed to archive clusters');
          }
          break;
          
        case 'unarchive':
          const unarchiveResponse = await fetch('/api/clusters/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unarchive', clusterIds: selectedClusters })
          });
          
          if (unarchiveResponse.ok) {
            await fetchClusters();
            alert(`Successfully unarchived ${selectedClusters.length} cluster(s)`);
          } else {
            throw new Error('Failed to unarchive clusters');
          }
          break;
          
        case 'duplicate':
          const duplicateResponse = await fetch('/api/clusters/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'duplicate', clusterIds: selectedClusters })
          });
          
          if (duplicateResponse.ok) {
            await fetchClusters();
            alert(`Successfully duplicated ${selectedClusters.length} cluster(s)`);
          } else {
            throw new Error('Failed to duplicate clusters');
          }
          break;
          
        case 'delete':
          if (confirm(`Are you sure you want to permanently delete ${selectedClusters.length} cluster(s)? This action cannot be undone.`)) {
            const deleteResponse = await fetch('/api/clusters/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'delete', clusterIds: selectedClusters })
            });
            
            if (deleteResponse.ok) {
              await fetchClusters();
              alert(`Successfully deleted ${selectedClusters.length} cluster(s)`);
            } else {
              throw new Error('Failed to delete clusters');
            }
          }
          break;
          
        case 'export':
          // Export clusters data as JSON
          const clustersToExport = clusters.filter(c => selectedClusters.includes(c._id));
          const exportData = {
            clusters: clustersToExport.map(cluster => ({
              name: cluster.name,
              section: cluster.section,
              classCode: cluster.classCode,
              description: cluster.description,
              courses: cluster.courses?.map(course => ({
                subject: course.subject,
                section: course.section
              })) || [],
              memberCount: cluster.enrolledUsers?.length || 0,
              createdAt: cluster.createdAt
            })),
            exportedAt: new Date().toISOString(),
            totalClusters: clustersToExport.length
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `clusters-export-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          break;
      }
      clearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert(`Failed to ${action} clusters: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSortBy('recent');
    setFilterOptions({
      sections: [],
      courseCount: { min: 0, max: 50 },
      memberCount: { min: 0, max: 100 },
      dateRange: 'all'
    });
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, clusterId) => {
    setDraggedCluster(clusterId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', clusterId);
  }, []);

  const handleDragOver = useCallback((e, clusterId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCluster(clusterId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCluster(null);
  }, []);

  const handleDrop = useCallback((e, targetClusterId) => {
    e.preventDefault();
    
    if (draggedCluster && draggedCluster !== targetClusterId) {
      // Reorder clusters
      const draggedIndex = clusters.findIndex(c => c._id === draggedCluster);
      const targetIndex = clusters.findIndex(c => c._id === targetClusterId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newClusters = [...clusters];
        const [draggedItem] = newClusters.splice(draggedIndex, 1);
        newClusters.splice(targetIndex, 0, draggedItem);
        setClusters(newClusters);
      }
    }
    
    setDraggedCluster(null);
    setDragOverCluster(null);
  }, [draggedCluster, clusters]);

  const handleDragEnd = useCallback(() => {
    setDraggedCluster(null);
    setDragOverCluster(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            selectAllClusters();
            break;
          case 'n':
            e.preventDefault();
            openCreateClusterModal();
            break;
          case 'j':
            e.preventDefault();
            openJoinClusterModal();
            break;
          case 'f':
            e.preventDefault();
            document.querySelector('input[type="text"]')?.focus();
            break;
          case 'Escape':
            clearSelection();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchClusters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clusters');
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="mb-8 space-y-6">
          {/* Loading skeleton for header */}
          <div className="p-4 md:p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          
          {/* Loading skeleton for statistics */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading skeleton for clusters */}
          <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen p-4 md:p-8 bg-gray-50">
      {/* Enhanced Header */}
      <div className="mb-8 space-y-6">
        {/* Main Header */}
        <div className="p-4 md:p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Clusters</h1>
                <p className="text-sm text-gray-500">Manage your course clusters</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-sm md:text-base transition-colors shadow-sm rounded-xl touch-manipulation ${
                  showAnalytics 
                    ? 'text-purple-700 bg-purple-100 border border-purple-200' 
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                onClick={openCreateClusterModal}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm md:text-base text-white transition-colors bg-purple-600 shadow-sm rounded-xl hover:bg-purple-700 active:bg-purple-800 touch-manipulation"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Create</span>
              </button>
              <button
                onClick={openJoinClusterModal}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm md:text-base text-white transition-colors bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 active:bg-indigo-800 touch-manipulation"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="hidden sm:inline">Join</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-6">
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-gray-900">{statistics.totalClusters}</div>
            <div className="text-xs md:text-sm text-gray-500">Total Clusters</div>
          </div>
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-purple-600">{statistics.myClusters}</div>
            <div className="text-xs md:text-sm text-gray-500">My Clusters</div>
          </div>
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-indigo-600">{statistics.joinedClusters}</div>
            <div className="text-xs md:text-sm text-gray-500">Joined</div>
          </div>
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-green-600">{statistics.totalCourses}</div>
            <div className="text-xs md:text-sm text-gray-500">Total Courses</div>
          </div>
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{statistics.totalMembers}</div>
            <div className="text-xs md:text-sm text-gray-500">Total Members</div>
          </div>
          <div className="p-3 md:p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="text-lg md:text-2xl font-bold text-orange-600">{statistics.activeClusters}</div>
            <div className="text-xs md:text-sm text-gray-500">Active</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 md:p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search clusters, sections, or class codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Search clusters"
                role="searchbox"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {/* Category Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Filter clusters by category"
              >
                <option value="all">All Clusters</option>
                <option value="my-clusters">My Clusters</option>
                <option value="joined">Joined</option>
                <option value="active">Active</option>
                <option value="empty">Empty</option>
                <option value="archived">Archived</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Sort clusters"
              >
                <option value="recent">Recently Created</option>
                <option value="name">Name A-Z</option>
                <option value="courses">Most Courses</option>
                <option value="members">Most Members</option>
                <option value="activity">Most Active</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 md:px-3 py-2 touch-manipulation ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 md:px-3 py-2 touch-manipulation ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                  aria-pressed={viewMode === 'list'}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2 md:px-3 py-2 touch-manipulation ${viewMode === 'compact' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                  aria-pressed={viewMode === 'compact'}
                  aria-label="Compact view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-2 md:px-3 py-2 text-sm md:text-base text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
                aria-label="Toggle advanced filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Reset Filters */}
              <button
                onClick={resetFilters}
                className="px-2 md:px-3 py-2 text-sm md:text-base text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
                aria-label="Reset all filters"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div id="advanced-filters" className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg" role="region" aria-label="Advanced filters">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Section Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sections</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterOptions.sections.map((section) => (
                      <label key={section} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filterOptions.sections.includes(section)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterOptions(prev => ({
                                ...prev,
                                sections: [...prev.sections, section]
                              }));
                            } else {
                              setFilterOptions(prev => ({
                                ...prev,
                                sections: prev.sections.filter(s => s !== section)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{section}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Course Count Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Count</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={filterOptions.courseCount.max}
                      onChange={(e) => setFilterOptions(prev => ({
                        ...prev,
                        courseCount: { ...prev.courseCount, max: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">
                      {filterOptions.courseCount.min} - {filterOptions.courseCount.max} courses
                    </div>
                  </div>
                </div>

                {/* Member Count Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Count</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterOptions.memberCount.max}
                      onChange={(e) => setFilterOptions(prev => ({
                        ...prev,
                        memberCount: { ...prev.memberCount, max: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">
                      {filterOptions.memberCount.min} - {filterOptions.memberCount.max} members
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedClusters.length > 0 && (
          <div className="p-3 md:p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-sm font-medium text-purple-700">
                  {selectedClusters.length} cluster{selectedClusters.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllClusters}
                    className="text-sm text-purple-600 hover:text-purple-700 touch-manipulation"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-purple-600 hover:text-purple-700 touch-manipulation"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200 active:bg-blue-300 touch-manipulation"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm text-green-700 bg-green-100 rounded hover:bg-green-200 active:bg-green-300 touch-manipulation"
                >
                  Export
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm text-purple-700 bg-purple-100 rounded hover:bg-purple-200 active:bg-purple-300 touch-manipulation"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm text-red-700 bg-red-100 rounded hover:bg-red-200 active:bg-red-300 touch-manipulation"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics View */}
      {showAnalytics && (
        <div className="mb-8">
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading analytics...</span>
              </div>
            }>
              <ClusterAnalytics clusters={clusters} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Clusters Display */}
      {filteredAndSortedClusters.length === 0 ? (
        <div className="col-span-full">
          <div className="p-8 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {clusters.length === 0 ? 'No clusters yet' : 'No clusters match your filters'}
            </h3>
            <p className="mb-4 text-gray-500">
              {clusters.length === 0 
                ? 'Create your first cluster to group related courses together.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {clusters.length === 0 && (
              <button
                onClick={openCreateClusterModal}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Create Cluster
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
        <div 
          className={`${
            viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3' :
            viewMode === 'list' ? 'space-y-3 md:space-y-4' :
            'grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4'
          }`}
          role="grid"
          aria-label="Clusters list"
        >
            {paginatedClusters.map((cluster) => (
              <div
                key={cluster._id}
                draggable
                onDragStart={(e) => handleDragStart(e, cluster._id)}
                onDragOver={(e) => handleDragOver(e, cluster._id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cluster._id)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 ${
                  draggedCluster === cluster._id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverCluster === cluster._id ? 'ring-2 ring-purple-300' : ''
                }`}
                role="gridcell"
                aria-label={`Cluster: ${cluster.name}`}
                tabIndex={0}
              >
                <ClusterCard
                  cluster={cluster}
                  viewMode={viewMode}
                  isSelected={selectedClusters.includes(cluster._id)}
                  onSelect={() => toggleClusterSelection(cluster._id)}
                  onManage={() => console.log('Manage cluster:', cluster._id)}
                  onDuplicate={() => handleBulkAction('duplicate')}
                  onArchive={() => handleBulkAction('archive')}
                  onDelete={() => handleBulkAction('delete')}
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 md:mt-8 text-center">
              <button
                onClick={loadMore}
                className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-purple-600 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 active:bg-purple-300 transition-colors touch-manipulation"
              >
                Load More Clusters ({filteredAndSortedClusters.length - paginatedClusters.length} remaining)
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
              <span className="text-center md:text-left">
                Showing {paginatedClusters.length} of {filteredAndSortedClusters.length} clusters
                {filteredAndSortedClusters.length !== clusters.length && (
                  <span className="ml-1">(filtered from {clusters.length} total)</span>
                )}
              </span>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span className="text-center">Page {currentPage} of {Math.ceil(filteredAndSortedClusters.length / itemsPerPage)}</span>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAndSortedClusters.length / itemsPerPage), prev + 1))}
                    disabled={!hasMore}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredAndSortedClusters.length / itemsPerPage))}
                    disabled={!hasMore}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClustersPage;