/**
 * Research-Based Cold Start Interest Tracking Hook
 * Uses multiple behavioral indicators to detect genuine student interest
 * Based on Cognitive Load Theory and Educational Psychology research
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

export function useColdStartInterestTracking(currentMode, isActive) {
  const [interestData, setInterestData] = useState({});
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);
  const [overlayTriggeredFor, setOverlayTriggeredFor] = useState(null);
  
  // Tracking refs for current session
  const sessionData = useRef({});
  const startTime = useRef(null);
  const scrollData = useRef({ maxDepth: 0, scrollEvents: 0 });
  const mouseData = useRef({ hoverTime: 0, selections: 0, movements: 0 });
  const focusData = useRef({ hasFocus: true, focusLossCount: 0 });
  const returnData = useRef({ visits: 0, switches: 0 });

  // Initialize session tracking for current mode
  useEffect(() => {
    if (!isActive || !currentMode) return;

    const mode = currentMode;
    
    // Initialize or get existing data for this mode
    if (!sessionData.current[mode]) {
      sessionData.current[mode] = {
        totalTime: 0,
        visits: 1,
        maxScrollDepth: 0,
        textSelections: 0,
        mouseHoverTime: 0,
        mouseMoveEvents: 0,
        focusRetentionRate: 1,
        returnVisits: 0,
        deepEngagementEvents: 0,
        lastVisitTime: Date.now(),
        interestScore: 0
      };
    } else {
      // Increment visit count for returning to this mode
      sessionData.current[mode].visits += 1;
      sessionData.current[mode].returnVisits += 1;
    }

    startTime.current = Date.now();
    scrollData.current = { maxDepth: 0, scrollEvents: 0 };
    mouseData.current = { hoverTime: 0, selections: 0, movements: 0 };
    focusData.current = { hasFocus: true, focusLossCount: 0 };

    return () => {
      // Save session data when switching modes
      if (startTime.current && sessionData.current[mode]) {
        const sessionTime = Date.now() - startTime.current;
        sessionData.current[mode].totalTime += sessionTime;
        
        // Calculate interest score
        const score = calculateInterestScore(mode);
        sessionData.current[mode].interestScore = score;
        
        // Update state
        setInterestData(prev => ({
          ...prev,
          [mode]: { ...sessionData.current[mode] }
        }));

        // Check if we should trigger overlay
        checkOverlayTrigger(mode, score);
      }
    };
  }, [currentMode, isActive]);

  // Scroll tracking
  const handleScroll = useCallback((e) => {
    if (!isActive || !currentMode) return;
    
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    const scrollDepth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    
    scrollData.current.scrollEvents += 1;
    scrollData.current.maxDepth = Math.max(scrollData.current.maxDepth, scrollDepth);
    
    // Update session data
    if (sessionData.current[currentMode]) {
      sessionData.current[currentMode].maxScrollDepth = Math.max(
        sessionData.current[currentMode].maxScrollDepth,
        scrollDepth
      );
    }
  }, [currentMode, isActive]);

  // Mouse movement and hover tracking
  const handleMouseMove = useCallback((e) => {
    if (!isActive || !currentMode) return;
    
    mouseData.current.movements += 1;
    
    if (sessionData.current[currentMode]) {
      sessionData.current[currentMode].mouseMoveEvents += 1;
    }
  }, [currentMode, isActive]);

  const handleMouseEnter = useCallback(() => {
    if (!isActive || !currentMode) return;
    mouseData.current.hoverStartTime = Date.now();
  }, [currentMode, isActive]);

  const handleMouseLeave = useCallback(() => {
    if (!isActive || !currentMode || !mouseData.current.hoverStartTime) return;
    
    const hoverDuration = Date.now() - mouseData.current.hoverStartTime;
    mouseData.current.hoverTime += hoverDuration;
    
    if (sessionData.current[currentMode]) {
      sessionData.current[currentMode].mouseHoverTime += hoverDuration;
    }
  }, [currentMode, isActive]);

  // Text selection tracking
  const handleTextSelection = useCallback(() => {
    if (!isActive || !currentMode) return;
    
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      mouseData.current.selections += 1;
      
      if (sessionData.current[currentMode]) {
        sessionData.current[currentMode].textSelections += 1;
        sessionData.current[currentMode].deepEngagementEvents += 1;
      }
    }
  }, [currentMode, isActive]);

  // Focus tracking
  const handleFocus = useCallback(() => {
    focusData.current.hasFocus = true;
  }, []);

  const handleBlur = useCallback(() => {
    focusData.current.hasFocus = false;
    focusData.current.focusLossCount += 1;
  }, []);

  // Calculate research-based interest score
  const calculateInterestScore = useCallback((mode) => {
    const data = sessionData.current[mode];
    if (!data) return 0;

    // Get average metrics across all modes for comparison
    const allModes = Object.values(sessionData.current);
    const avgTime = allModes.reduce((sum, m) => sum + m.totalTime, 0) / allModes.length || 1;
    const avgScrollDepth = allModes.reduce((sum, m) => sum + m.maxScrollDepth, 0) / allModes.length || 1;

    // Research-based scoring weights
    const scores = {
      // Time-based indicators (30% weight)
      dwellTime: Math.min(data.totalTime / Math.max(avgTime * 1.5, 3000), 1) * 0.3,
      
      // Behavioral indicators (25% weight)
      returnVisits: Math.min(data.returnVisits / 2, 1) * 0.1,
      deepScroll: Math.min(data.maxScrollDepth / 70, 1) * 0.15,
      
      // Engagement indicators (20% weight)
      textSelection: Math.min(data.textSelections / 2, 1) * 0.1,
      mouseActivity: Math.min(data.mouseMoveEvents / 50, 1) * 0.05,
      hoverTime: Math.min(data.mouseHoverTime / 5000, 1) * 0.05,
      
      // Comparative indicators (15% weight)
      relativeEngagement: Math.min(data.totalTime / Math.max(avgTime * 1.2, 1), 1) * 0.15,
      
      // Attention indicators (10% weight)
      focusRetention: Math.max(1 - (focusData.current.focusLossCount / 5), 0) * 0.05,
      deepEngagement: Math.min(data.deepEngagementEvents / 3, 1) * 0.05
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    console.log(`🧠 Interest Score for ${mode}:`, {
      totalScore: totalScore.toFixed(3),
      breakdown: scores,
      rawData: data
    });

    return totalScore;
  }, []);

  // Check if overlay should be triggered
  const checkOverlayTrigger = useCallback((mode, score) => {
    // DEVELOPER MODE: Force overlay to show for testing (remove this in production)
    const DEVELOPER_MODE = false; // Set to false for production
    
    console.log(`🔍 Checking overlay trigger for ${mode}:`, {
      score: score.toFixed(3),
      threshold: 0.7,
      alreadyTriggered: overlayTriggeredFor === mode,
      shouldTrigger: score >= 0.7 && overlayTriggeredFor !== mode,
      developerMode: DEVELOPER_MODE
    });
    
    // Don't trigger if already shown for this mode (unless developer mode)
    if (overlayTriggeredFor === mode && !DEVELOPER_MODE) {
      console.log(`⏸️ Overlay already triggered for ${mode}, skipping`);
      return;
    }
    
    // Research-backed threshold: 0.7 indicates genuine interest
    // OR developer mode is enabled
    if (score >= 0.7 || DEVELOPER_MODE) {
      console.log(`🎯 Triggering overlay for ${mode} with score: ${score.toFixed(3)} ${DEVELOPER_MODE ? '(DEVELOPER MODE)' : ''}`);
      setShouldShowOverlay(true);
      setOverlayTriggeredFor(mode);
      
      // Log overlay state after setting
      setTimeout(() => {
        console.log(`📊 Overlay state after trigger:`, {
          shouldShowOverlay: true,
          overlayTriggeredFor: mode
        });
      }, 100);
    }
  }, [overlayTriggeredFor]);

  // Reset overlay trigger when mode changes (allow re-trigger for different modes)
  useEffect(() => {
    if (currentMode && overlayTriggeredFor && currentMode !== overlayTriggeredFor) {
      // User switched to a different mode, allow overlay to trigger again
      console.log(`🔄 Mode switched from ${overlayTriggeredFor} to ${currentMode}, resetting overlay state`);
      setShouldShowOverlay(false);
    }
  }, [currentMode, overlayTriggeredFor]);

  // Real-time interest monitoring (every 2 seconds)
  useEffect(() => {
    if (!isActive || !currentMode) return;

    const interval = setInterval(() => {
      if (startTime.current && sessionData.current[currentMode]) {
        const currentSessionTime = Date.now() - startTime.current;
        const tempData = {
          ...sessionData.current[currentMode],
          totalTime: sessionData.current[currentMode].totalTime + currentSessionTime
        };
        
        // Calculate current interest score
        const currentScore = calculateInterestScore(currentMode);
        
        // Check for overlay trigger
        checkOverlayTrigger(currentMode, currentScore);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentMode, isActive, calculateInterestScore, checkOverlayTrigger]);

  // Event listeners setup
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('selectionchange', handleTextSelection);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('selectionchange', handleTextSelection);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive, handleTextSelection, handleFocus, handleBlur]);

  // Dismiss overlay
  const dismissOverlay = useCallback(() => {
    setShouldShowOverlay(false);
  }, []);

  // Get current mode's interest data
  const getCurrentModeData = useCallback(() => {
    return interestData[currentMode] || sessionData.current[currentMode] || null;
  }, [currentMode, interestData]);

  return {
    // State
    shouldShowOverlay,
    overlayTriggeredFor,
    interestData,
    
    // Event handlers for components to use
    handleScroll,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    
    // Actions
    dismissOverlay,
    getCurrentModeData,
    
    // Debug info
    getDebugInfo: () => ({
      sessionData: sessionData.current,
      currentMode,
      isActive
    })
  };
}