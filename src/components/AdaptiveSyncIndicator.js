'use client';

import React, { useState, useEffect } from 'react';
import { useAdaptiveLayout } from '../context/AdaptiveLayoutContext';

const AdaptiveSyncIndicator = ({ variant = 'floating', position = 'bottom-right' }) => {
  const { syncStatus, isLoading, forceSync, getSyncStatus, isClient, syncService } = useAdaptiveLayout();
  const [showDetails, setShowDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    if (!syncService) return;

    setIsSyncing(true);
    try {
      await forceSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-500';
    if (syncStatus.hasConflicts) return 'bg-red-500';
    if (syncStatus.pendingChanges > 0) return 'bg-orange-500';
    if (syncStatus.isOnline) return 'bg-green-500';
    return 'bg-gray-400'; // More subtle gray when offline
  };

  const getStatusText = () => {
    if (isLoading) return 'Loading...';
    if (syncStatus.hasConflicts) return 'Conflicts';
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending`;
    if (syncStatus.isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isLoading) return '⏳';
    if (syncStatus.hasConflicts) return '⚠️';
    if (syncStatus.pendingChanges > 0) return '📤';
    if (syncStatus.isOnline) return '🌐';
    return '📴';
  };

  // Only render on client side
  if (!isClient) {
    return null;
  }

  if (variant === 'floating') {
    return (
      <>
        <div
          className={`fixed z-50 transition-all duration-300 ${
            position === 'bottom-right' ? 'bottom-20 right-4' :
            position === 'bottom-left' ? 'bottom-20 left-4' :
            position === 'top-right' ? 'top-4 right-4' :
            'top-4 left-4'
          }`}
        >
          <div className="relative">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`
                relative flex items-center gap-2 px-2 py-1.5 rounded-md shadow-md
                transition-all duration-300 hover:scale-105
                ${getStatusColor()} text-white text-xs font-medium
              `}
              title="System Status"
            >
              <span className="text-sm">{getStatusIcon()}</span>
              <span className="hidden sm:inline text-xs">{getStatusText()}</span>

              {/* Pulse animation for pending changes */}
              {syncStatus.pendingChanges > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full animate-ping"></div>
              )}

              {/* Conflict indicator */}
              {syncStatus.hasConflicts && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-bounce"></div>
              )}
            </button>

            {/* Expanded details */}
            {showDetails && (
              <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-3 animate-fade-in-up">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Sync Status</h4>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Connection:</span>
                      <span className={`font-medium ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                        {syncStatus.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium text-gray-900">
                        {syncStatus.lastSync ?
                          new Date(syncStatus.lastSync).toLocaleTimeString() :
                          'Never'
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending Changes:</span>
                      <span className={`font-medium ${
                        syncStatus.pendingChanges > 0 ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {syncStatus.pendingChanges}
                      </span>
                    </div>

                    {syncStatus.hasConflicts && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Conflicts:</span>
                        <span className="font-medium text-red-600">Needs Resolution</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={handleForceSync}
                      disabled={isSyncing || !syncStatus.isOnline || !syncService}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>

                    {syncStatus.hasConflicts && (
                      <button
                        onClick={() => {
                          // Trigger conflict resolution
                          console.log('Resolving conflicts...');
                        }}
                        className="px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Background overlay when details are shown */}
        {showDetails && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
        )}
      </>
    );
  }

  // Inline variant for status bars or headers
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md border border-gray-200">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-xs text-gray-600">{getStatusText()}</span>
      {syncStatus.pendingChanges > 0 && (
        <span className="text-xs text-orange-600 font-medium">
          ({syncStatus.pendingChanges} pending)
        </span>
      )}
    </div>
  );
};

export default AdaptiveSyncIndicator;