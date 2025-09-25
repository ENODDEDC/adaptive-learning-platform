'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdaptiveLayoutContext = createContext();

export const useAdaptiveLayout = () => {
  const context = useContext(AdaptiveLayoutContext);
  if (!context) {
    throw new Error('useAdaptiveLayout must be used within an AdaptiveLayoutProvider');
  }
  return context;
};

// Database sync service
class AdaptiveSyncService {
  constructor() {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }

    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.isSyncing = false;
    this.lastSync = null;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncBehavior(interactionType, details) {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return { success: false, error: 'Server-side rendering' };
    }

    if (!this.isOnline) {
      this.queueSync('behavior', { interactionType, details });
      return { success: false, offline: true };
    }

    try {
      const response = await fetch('/api/user/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          interactionType,
          details,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }),
      });

      if (response.ok) {
        this.lastSync = new Date();
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sync failed:', response.status, errorData);
        this.queueSync('behavior', { interactionType, details });
        return { success: false, error: `Sync failed: ${response.status}` };
      }
    } catch (error) {
      console.error('Behavior sync error:', error);
      this.queueSync('behavior', { interactionType, details });
      return { success: false, error: error.message };
    }
  }

  async syncPreferences(preferences) {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return { success: false, error: 'Server-side rendering' };
    }

    if (!this.isOnline) {
      this.queueSync('preferences', { preferences });
      return { success: false, offline: true };
    }

    try {
      const response = await fetch('/api/user/adaptive-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clientData: preferences,
          lastSync: this.lastSync?.toISOString(),
          conflictResolution: 'client_wins'
        }),
      });

      if (response.ok) {
        this.lastSync = new Date();
        return { success: true, data: await response.json() };
      } else if (response.status === 409) {
        // Conflict detected
        const conflictData = await response.json();
        return { success: false, conflict: true, data: conflictData };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sync failed:', response.status, errorData);
        this.queueSync('preferences', { preferences });
        return { success: false, error: `Sync failed: ${response.status}` };
      }
    } catch (error) {
      console.error('Preferences sync error:', error);
      this.queueSync('preferences', { preferences });
      return { success: false, error: error.message };
    }
  }

  queueSync(type, data) {
    this.syncQueue.push({
      type,
      data,
      timestamp: new Date(),
      retryCount: 0
    });

    // Limit queue size
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-50);
    }

    // Try to process queue if online
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    while (this.syncQueue.length > 0 && this.isOnline) {
      const item = this.syncQueue.shift();

      try {
        if (item.type === 'behavior') {
          await this.syncBehavior(item.data.interactionType, item.data.details);
        } else if (item.type === 'preferences') {
          await this.syncPreferences(item.data.preferences);
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        item.retryCount++;

        // Re-queue if retry count is low
        if (item.retryCount < 3) {
          this.syncQueue.unshift(item);
        }
      }
    }

    this.isSyncing = false;
  }
}

export const AdaptiveLayoutProvider = ({ children }) => {
  // Initialize sync service only on client side
  const [syncService, setSyncService] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);

    // Sync service temporarily disabled to prevent 500 errors
    // TODO: Re-enable once API endpoints are properly configured
    // const service = new AdaptiveSyncService();
    // setSyncService(service);

    // Update sync status with default values
    setSyncStatus(prev => ({
      ...prev,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingChanges: 0
    }));
  }, []);

  // User behavior state
  const [userBehavior, setUserBehavior] = useState({
    interactionPatterns: {
      mostClickedCourses: [],
      favoriteActions: [],
      timeSpentOnFeatures: new Map(),
      navigationPatterns: [],
      preferredViewModes: new Map(),
      searchFrequency: 0,
      filterUsage: new Map(),
      dragDropFrequency: 0
    },
    layoutPreferences: {
      cardSize: 'medium', // small, medium, large, adaptive
      gridColumns: 'auto', // auto, 2, 3, 4
      sortOrder: 'custom', // custom, alphabetical, progress, recent
      showProgress: true,
      showThumbnails: true,
      compactMode: false,
      sidebarCollapsed: false
    },
    adaptiveSettings: {
      learningRate: 0.1,
      minInteractions: 5,
      adaptationThreshold: 0.7,
      resetInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  });

  const [behaviorHistory, setBehaviorHistory] = useState([]);
  const [lastAdaptation, setLastAdaptation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSync: null,
    hasConflicts: false,
    pendingChanges: 0
  });

  // Load behavior data from database and localStorage on mount
  useEffect(() => {
    loadAdaptiveData();
  }, []);

  // Monitor sync queue - temporarily disabled
  useEffect(() => {
    // Sync monitoring temporarily disabled to prevent errors
    // TODO: Re-enable once sync service is properly configured
    // if (!syncService) return;

    // const interval = setInterval(() => {
    //   setSyncStatus(prev => ({
    //     ...prev,
    //     pendingChanges: syncService.syncQueue.length,
    //     isOnline: syncService.isOnline
    //   }));
    // }, 1000);

    // return () => clearInterval(interval);
  }, [syncService]);

  const loadAdaptiveData = async () => {
    setIsLoading(true);
    try {
      // Try to load from database first
      const response = await fetch('/api/user/adaptive-preferences', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setUserBehavior({
            interactionPatterns: {
              mostClickedCourses: data.preferences.interactionPatterns.mostClickedCourses || [],
              favoriteActions: data.preferences.interactionPatterns.favoriteActions || [],
              timeSpentOnFeatures: new Map(Object.entries(data.preferences.interactionPatterns.timeSpentOnFeatures || {})),
              navigationPatterns: data.preferences.interactionPatterns.navigationPatterns || [],
              preferredViewModes: new Map(Object.entries(data.preferences.interactionPatterns.preferredViewModes || {})),
              searchFrequency: data.preferences.interactionPatterns.searchFrequency || 0,
              filterUsage: new Map(Object.entries(data.preferences.interactionPatterns.filterUsage || {})),
              dragDropFrequency: data.preferences.interactionPatterns.dragDropFrequency || 0
            },
            layoutPreferences: data.preferences.layoutPreferences,
            adaptiveSettings: data.preferences.adaptiveSettings
          });

          if (data.preferences.lastAdaptation) {
            setLastAdaptation(new Date(data.preferences.lastAdaptation));
          }

          syncService.lastSync = new Date();
        }
      } else {
        console.warn('Failed to load from database, falling back to localStorage');
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading adaptive data from database:', error);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedBehavior = localStorage.getItem('adaptiveLayoutBehavior');
      const savedHistory = localStorage.getItem('adaptiveLayoutHistory');
      const savedAdaptation = localStorage.getItem('lastAdaptation');

      if (savedBehavior) {
        const parsedBehavior = JSON.parse(savedBehavior);
        setUserBehavior(prev => ({
          ...prev,
          interactionPatterns: {
            ...prev.interactionPatterns,
            mostClickedCourses: parsedBehavior.interactionPatterns?.mostClickedCourses || [],
            favoriteActions: parsedBehavior.interactionPatterns?.favoriteActions || [],
            timeSpentOnFeatures: new Map(Object.entries(parsedBehavior.interactionPatterns?.timeSpentOnFeatures || {})),
            navigationPatterns: parsedBehavior.interactionPatterns?.navigationPatterns || [],
            preferredViewModes: new Map(Object.entries(parsedBehavior.interactionPatterns?.preferredViewModes || {})),
            searchFrequency: parsedBehavior.interactionPatterns?.searchFrequency || 0,
            filterUsage: new Map(Object.entries(parsedBehavior.interactionPatterns?.filterUsage || {})),
            dragDropFrequency: parsedBehavior.interactionPatterns?.dragDropFrequency || 0
          },
          layoutPreferences: parsedBehavior.layoutPreferences || prev.layoutPreferences,
          adaptiveSettings: parsedBehavior.adaptiveSettings || prev.adaptiveSettings
        }));
      }

      if (savedHistory) {
        setBehaviorHistory(JSON.parse(savedHistory));
      }

      if (savedAdaptation) {
        setLastAdaptation(new Date(savedAdaptation));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Save behavior data to localStorage only (sync disabled to prevent errors)
  const saveBehaviorData = useCallback(async (newBehavior) => {
    try {
      // Save to localStorage immediately
      localStorage.setItem('adaptiveLayoutBehavior', JSON.stringify(newBehavior));

      // Sync temporarily disabled to prevent 500 errors
      // TODO: Re-enable once API endpoints are properly configured
      // syncService.syncPreferences(newBehavior);
    } catch (error) {
      console.error('Error saving behavior data:', error);
    }
  }, [syncService]);

  const saveHistoryData = useCallback((newHistory) => {
    try {
      localStorage.setItem('adaptiveLayoutHistory', JSON.stringify(newHistory));
      setBehaviorHistory(newHistory);
    } catch (error) {
      console.error('Error saving history data:', error);
    }
  }, []);

  // Track user interactions
  const trackInteraction = useCallback(async (interactionType, details = {}) => {
    const timestamp = new Date().toISOString();
    const interaction = {
      type: interactionType,
      timestamp,
      details,
      sessionId: getSessionId()
    };

    // Sync temporarily disabled to prevent 500 errors
    // TODO: Re-enable once API endpoints are properly configured
    // if (syncService && isClient) {
    //   try {
    //     syncService.syncBehavior(interactionType, {
    //       ...details,
    //       sessionId: interaction.sessionId
    //     });
    //   } catch (error) {
    //     console.error('Failed to sync interaction:', error);
    //     // Don't throw error to avoid breaking the UI
    //   }
    // }

    // Update behavior patterns locally
    setUserBehavior(prev => {
      const newBehavior = { ...prev };

      switch (interactionType) {
        case 'course_click':
          const courseId = details.courseId;
          let courseName = details.courseName || 'Unknown Course';

          // If course name is still unknown, try to fetch it from the database
          if (courseName === 'Unknown Course' && courseId) {
            fetchCourseName(courseId).then(fetchedName => {
              if (fetchedName && fetchedName !== 'Unknown Course') {
                courseName = fetchedName;
                // Update the stored course name
                const existingCourse = newBehavior.interactionPatterns.mostClickedCourses.find(c => c.courseId === courseId);
                if (existingCourse) {
                  existingCourse.courseName = courseName;
                  saveBehaviorData(newBehavior);
                }
              }
            }).catch(err => {
              console.error('Failed to fetch course name:', err);
            });
          }

          if (courseId && !newBehavior.interactionPatterns.mostClickedCourses.find(c => c.courseId === courseId)) {
            newBehavior.interactionPatterns.mostClickedCourses.push({
              courseId,
              courseName,
              clickCount: 1,
              lastClicked: new Date()
            });
          } else if (courseId) {
            const existingCourse = newBehavior.interactionPatterns.mostClickedCourses.find(c => c.courseId === courseId);
            if (existingCourse) {
              existingCourse.clickCount += 1;
              existingCourse.lastClicked = new Date();
              // Update name if we have a better one
              if (details.courseName && details.courseName !== 'Unknown Course') {
                existingCourse.courseName = details.courseName;
              }
            }
          }
          // Keep only top 20 most clicked courses
          newBehavior.interactionPatterns.mostClickedCourses.sort((a, b) => b.clickCount - a.clickCount);
          newBehavior.interactionPatterns.mostClickedCourses =
            newBehavior.interactionPatterns.mostClickedCourses.slice(0, 20);
          break;

        case 'action_performed':
          const action = details.action;
          if (action && !newBehavior.interactionPatterns.favoriteActions.includes(action)) {
            newBehavior.interactionPatterns.favoriteActions.push(action);
          }
          break;

        case 'feature_usage':
          const feature = details.feature;
          const duration = details.duration || 0;
          if (feature) {
            const currentTime = newBehavior.interactionPatterns.timeSpentOnFeatures.get(feature) || 0;
            newBehavior.interactionPatterns.timeSpentOnFeatures.set(feature, currentTime + duration);
          }
          break;

        case 'navigation':
          const path = details.path;
          if (path) {
            newBehavior.interactionPatterns.navigationPatterns.push(path);
            // Keep only last 50 navigation events
            newBehavior.interactionPatterns.navigationPatterns =
              newBehavior.interactionPatterns.navigationPatterns.slice(-50);
          }
          break;

        case 'view_mode_change':
          const viewMode = details.viewMode;
          if (viewMode) {
            const currentCount = newBehavior.interactionPatterns.preferredViewModes.get(viewMode) || 0;
            newBehavior.interactionPatterns.preferredViewModes.set(viewMode, currentCount + 1);
          }
          break;

        case 'search':
          newBehavior.interactionPatterns.searchFrequency += 1;
          break;

        case 'filter_used':
          const filter = details.filter;
          if (filter) {
            const currentCount = newBehavior.interactionPatterns.filterUsage.get(filter) || 0;
            newBehavior.interactionPatterns.filterUsage.set(filter, currentCount + 1);
          }
          break;

        case 'drag_drop':
          newBehavior.interactionPatterns.dragDropFrequency += 1;
          break;

        default:
          break;
      }

      // Save to localStorage and sync with database
      saveBehaviorData(newBehavior);
      return newBehavior;
    });

    // Add to history
    setBehaviorHistory(prev => {
      const newHistory = [...prev, interaction];
      // Keep only last 1000 interactions
      const trimmedHistory = newHistory.slice(-1000);
      saveHistoryData(trimmedHistory);
      return trimmedHistory;
    });

    // Trigger layout adaptation if enough data
    triggerLayoutAdaptation();
  }, [saveBehaviorData, saveHistoryData, syncService]);

  // Generate session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('adaptiveSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('adaptiveSessionId', sessionId);
    }
    return sessionId;
  };

  // Fetch course name from database
  const fetchCourseName = async (courseId) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const courseData = await response.json();
        return courseData.course?.subject || courseData.course?.name || 'Unknown Course';
      }
    } catch (error) {
      console.error('Failed to fetch course name:', error);
    }
    return 'Unknown Course';
  };

  // Analyze behavior patterns and adapt layout
  const triggerLayoutAdaptation = useCallback(() => {
    const now = new Date();
    const timeSinceLastAdaptation = lastAdaptation ? now - lastAdaptation : Infinity;

    // Only adapt if enough time has passed and we have sufficient data
    if (timeSinceLastAdaptation < userBehavior.adaptiveSettings.resetInterval &&
        behaviorHistory.length < userBehavior.adaptiveSettings.minInteractions) {
      return;
    }

    const patterns = analyzeBehaviorPatterns();
    const adaptedLayout = adaptLayoutBasedOnPatterns(patterns);

    if (adaptedLayout) {
      setUserBehavior(prev => ({
        ...prev,
        layoutPreferences: { ...prev.layoutPreferences, ...adaptedLayout }
      }));

      setLastAdaptation(now);
      localStorage.setItem('lastAdaptation', now.toISOString());
    }
  }, [behaviorHistory, lastAdaptation, userBehavior.adaptiveSettings]);

  // Analyze behavior patterns
  const analyzeBehaviorPatterns = () => {
    const patterns = {
      courseEngagement: {},
      featureUsage: {},
      timeDistribution: {},
      interactionFrequency: {}
    };

    // Analyze course engagement
    userBehavior.interactionPatterns.mostClickedCourses.forEach(courseId => {
      patterns.courseEngagement[courseId] = (patterns.courseEngagement[courseId] || 0) + 1;
    });

    // Analyze feature usage
    Object.entries(userBehavior.interactionPatterns.timeSpentOnFeatures).forEach(([feature, time]) => {
      patterns.featureUsage[feature] = time;
    });

    // Analyze interaction frequency
    const recentInteractions = behaviorHistory.slice(-50); // Last 50 interactions
    patterns.interactionFrequency = recentInteractions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {});

    return patterns;
  };

  // Adapt layout based on analyzed patterns
  const adaptLayoutBasedOnPatterns = (patterns) => {
    const adaptations = {};

    // Adapt based on interaction frequency
    const totalInteractions = Object.values(patterns.interactionFrequency).reduce((sum, count) => sum + count, 0);

    if (totalInteractions > 20) {
      // High activity user - prefer compact mode
      if (patterns.interactionFrequency.course_click > patterns.interactionFrequency.navigation * 2) {
        adaptations.cardSize = 'large';
        adaptations.compactMode = false;
      } else if (patterns.interactionFrequency.drag_drop > 5) {
        adaptations.cardSize = 'medium';
        adaptations.compactMode = true;
      }
    }

    // Adapt based on feature usage
    const mostUsedFeature = Object.entries(patterns.featureUsage)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostUsedFeature && mostUsedFeature[1] > 300000) { // 5 minutes
      // User spends a lot of time on specific features
      switch (mostUsedFeature[0]) {
        case 'course_preview':
          adaptations.showProgress = true;
          adaptations.showThumbnails = true;
          break;
        case 'search':
          adaptations.gridColumns = '2';
          adaptations.compactMode = true;
          break;
        case 'filtering':
          adaptations.gridColumns = '3';
          adaptations.sortOrder = 'progress';
          break;
      }
    }

    // Adapt based on course engagement
    const mostEngagedCourse = Object.entries(patterns.courseEngagement)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostEngagedCourse && mostEngagedCourse[1] > 3) {
      // User has favorite courses - optimize for course discovery
      adaptations.cardSize = 'medium';
      adaptations.showProgress = true;
    }

    return adaptations;
  };

  // Manual layout preference updates
  const updateLayoutPreference = useCallback(async (key, value) => {
    setUserBehavior(prev => {
      const newBehavior = {
        ...prev,
        layoutPreferences: {
          ...prev.layoutPreferences,
          [key]: value
        }
      };

      // Save to localStorage and sync with database
      saveBehaviorData(newBehavior);
      return newBehavior;
    });
  }, [saveBehaviorData]);

  // Reset adaptive behavior
  const resetAdaptiveBehavior = useCallback(() => {
    const defaultBehavior = {
      interactionPatterns: {
        mostClickedCourses: [],
        favoriteActions: [],
        timeSpentOnFeatures: {},
        navigationPatterns: [],
        preferredViewModes: {},
        searchFrequency: 0,
        filterUsage: {},
        dragDropFrequency: 0
      },
      layoutPreferences: {
        cardSize: 'medium',
        gridColumns: 'auto',
        sortOrder: 'custom',
        showProgress: true,
        showThumbnails: true,
        compactMode: false,
        sidebarCollapsed: false
      },
      adaptiveSettings: userBehavior.adaptiveSettings
    };

    setUserBehavior(defaultBehavior);
    setBehaviorHistory([]);
    setLastAdaptation(null);

    localStorage.removeItem('adaptiveLayoutBehavior');
    localStorage.removeItem('adaptiveLayoutHistory');
    localStorage.removeItem('lastAdaptation');
    sessionStorage.removeItem('adaptiveSessionId');
  }, [userBehavior.adaptiveSettings]);

  const contextValue = {
    userBehavior,
    behaviorHistory,
    trackInteraction,
    updateLayoutPreference,
    resetAdaptiveBehavior,
    triggerLayoutAdaptation: () => triggerLayoutAdaptation(),
    isLoading,
    syncStatus,
    syncService,
    isClient,
    // Additional utility functions
    getSyncStatus: () => syncStatus,
    forceSync: async () => {
      // Sync temporarily disabled to prevent 500 errors
      // TODO: Re-enable once API endpoints are properly configured
      // if (syncService && syncService.isOnline) {
      //   await syncService.syncPreferences(userBehavior);
      //   await loadAdaptiveData(); // Reload from server
      // }
    },
    clearLocalData: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adaptiveLayoutBehavior');
        localStorage.removeItem('adaptiveLayoutHistory');
        localStorage.removeItem('lastAdaptation');
      }
      setBehaviorHistory([]);
      setLastAdaptation(null);
    }
  };

  return (
    <AdaptiveLayoutContext.Provider value={contextValue}>
      {children}
    </AdaptiveLayoutContext.Provider>
  );
};