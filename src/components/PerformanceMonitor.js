'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, CpuChipIcon, BoltIcon, ExclamationTriangleIcon, InformationCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import cacheService from '@/services/cacheService';
import predictiveLoadingService from '@/services/predictiveLoadingService';

const PerformanceMonitor = ({ isOpen, onClose }) => {
  const [cacheStats, setCacheStats] = useState(null);
  const [predictiveStats, setPredictiveStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (isOpen) {
        refreshStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const cache = cacheService.getCacheStats();
      const predictive = predictiveLoadingService.getPerformanceMetrics();

      setCacheStats(cache);
      setPredictiveStats(predictive);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearCache = async () => {
    setIsRefreshing(true);
    try {
      await cacheService.clearAll();
      await refreshStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl transform transition-transform duration-300 overflow-visible">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">Performance Monitor</h2>
                  <div className="relative group">
                    <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] max-w-xs">
                      Monitor how the platform optimizes your learning experience through intelligent caching and predictive loading
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Smart caching and content prediction for faster learning</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Real-time optimization
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Predictive analytics
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshStats}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'cache', label: 'Cache Details', icon: CpuChipIcon },
              { id: 'predictive', label: 'Predictions', icon: BoltIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 overflow-x-visible">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Introduction/Help Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">What is Performance Monitoring?</h3>
                      <p className="text-gray-700 mb-3">
                        This dashboard shows how the platform intelligently optimizes your learning experience through advanced caching and predictive loading technologies.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Smart Caching:</span>
                            <span className="text-gray-600"> Stores frequently accessed content locally for instant loading</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Predictive Loading:</span>
                            <span className="text-gray-600"> Preloads content based on your learning patterns</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Memory Optimization:</span>
                            <span className="text-gray-600"> Efficiently manages system resources for smooth performance</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-gray-900">Real-time Analytics:</span>
                            <span className="text-gray-600"> Monitors and adapts to your usage patterns automatically</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Key Metrics */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
                    <div className="relative group">
                      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                        These metrics show how well the platform is optimizing your learning experience
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {cacheStats ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : '0%'}
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-blue-400 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            How often requested content is found in cache instead of being loaded from the server. Higher is better!
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 font-medium">Cache Hit Rate</div>
                      <div className="text-xs text-blue-600 mt-1">Content served instantly</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-green-600">
                          {cacheStats ? formatBytes(cacheStats.memorySize) : '0 B'}
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-green-400 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            Amount of memory used by cached content. This helps content load faster on future visits
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-green-700 font-medium">Memory Usage</div>
                      <div className="text-xs text-green-600 mt-1">Smart storage optimization</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-purple-600">
                          {predictiveStats ? predictiveStats.successfulPredictions : 0}
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-purple-400 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            How many times the system correctly predicted and preloaded content you needed
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-purple-700 font-medium">Successful Predictions</div>
                      <div className="text-xs text-purple-600 mt-1">AI-powered content loading</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold text-orange-600">
                          {predictiveStats ? formatTime(predictiveStats.averageLoadTime) : '0ms'}
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-orange-400 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            Average time it takes to load content. Lower values mean faster performance
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-orange-700 font-medium">Avg Load Time</div>
                      <div className="text-xs text-orange-600 mt-1">Faster learning experience</div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Performance charts would be displayed here</p>
                    <p className="text-sm text-gray-500">Real-time metrics visualization</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="space-y-6">
                {/* Cache Statistics */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
                    <div className="relative group">
                      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                        Detailed breakdown of how the caching system is performing
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  {cacheStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 border border-green-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Cache Hits</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-green-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Content found in cache and served instantly - this is what we want!
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-green-600">{cacheStats.hits}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Cache Misses</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-red-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Content not found in cache - had to be loaded from server
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-red-600">{cacheStats.misses}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Prefetches</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-blue-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Content loaded in advance based on predictions
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-blue-600">{cacheStats.prefetches}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Evictions</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-orange-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Old cached content removed to make room for new content
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-orange-600">{cacheStats.evictions}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-purple-50 border border-purple-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Memory Items</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-purple-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Number of individual pieces of content stored in cache
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-purple-600">{cacheStats.memoryItems}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-indigo-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Total size of all cached content
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{formatBytes(cacheStats.memorySize)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-teal-50 border border-teal-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Hit Rate</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-teal-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Percentage of cache requests that were successful
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-teal-600">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Efficiency</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-emerald-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Overall effectiveness of the caching system
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-emerald-600">
                            {cacheStats.hits > 0 ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No cache statistics available
                    </div>
                  )}
                </div>

                {/* Cache Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Management</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={clearCache}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Clear All Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predictive' && (
              <div className="space-y-6">
                {/* Predictive Loading Stats */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Predictive Loading</h3>
                    <div className="relative group">
                      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                        AI-powered system that anticipates what content you'll need next
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  {predictiveStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Total Predictions</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-blue-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Total number of content predictions made by the AI system
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-blue-600">{predictiveStats.totalPredictions}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-50 border border-green-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Successful</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-green-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Predictions that correctly anticipated content you actually needed
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-green-600">{predictiveStats.successfulPredictions}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-purple-50 border border-purple-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Success Rate</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-purple-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Percentage of predictions that were accurate
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-purple-600">
                            {predictiveStats.totalPredictions > 0
                              ? ((predictiveStats.successfulPredictions / predictiveStats.totalPredictions) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Active Predictions</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-orange-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Currently running predictions analyzing your behavior
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-orange-600">{predictiveStats.activePredictions}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Queued</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-indigo-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Predictions waiting to be processed
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{predictiveStats.queuedPredictions}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-teal-50 border border-teal-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Loading</span>
                            <div className="relative group">
                              <InformationCircleIcon className="w-4 h-4 text-teal-500 cursor-help" />
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                Content currently being loaded based on predictions
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-teal-600">{predictiveStats.loadingItems}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No predictive loading statistics available
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    <div className="relative group">
                      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                        Key performance indicators showing the overall system efficiency
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-blue-600">
                          {formatTime(predictiveStats?.averageLoadTime || 0)}
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-blue-500 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            How fast content loads on average - this affects your learning experience
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 font-medium">Average Load Time</div>
                      <div className="text-xs text-blue-600 mt-1">Lower is better</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-green-600">
                          {(predictiveStats?.cacheHitRate * 100 || 0).toFixed(1)}%
                        </div>
                        <div className="relative group">
                          <InformationCircleIcon className="w-4 h-4 text-green-500 cursor-help" />
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            How often the system finds content in cache instead of loading from server
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-green-700 font-medium">Cache Hit Rate</div>
                      <div className="text-xs text-green-600 mt-1">Higher is better</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-refreshing every 5 seconds
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">
                  Questions? Hover over metrics for details
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;