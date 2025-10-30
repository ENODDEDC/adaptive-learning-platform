/**
 * Custom Hook for Learning Mode Time Tracking
 * Automatically tracks time spent in learning modes for ML classification
 */

import { useEffect, useRef } from 'react';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';

export function useLearningModeTracking(modeName, isActive) {
  const startTimeRef = useRef(null);
  const trackerRef = useRef(null);

  useEffect(() => {
    // Initialize tracker
    if (!trackerRef.current) {
      trackerRef.current = getLearningBehaviorTracker();
    }

    if (isActive && modeName) {
      // Start tracking when mode becomes active
      console.log(`⏱️ Starting time tracking for ${modeName}`);
      startTimeRef.current = Date.now();
      trackerRef.current.trackModeStart(modeName);

      // Cleanup: Stop tracking when component unmounts or becomes inactive
      return () => {
        if (startTimeRef.current) {
          const duration = Date.now() - startTimeRef.current;
          console.log(`⏱️ Stopping time tracking for ${modeName}: ${duration}ms`);
          trackerRef.current.trackModeEnd(modeName);
          startTimeRef.current = null;
        }
      };
    }
  }, [isActive, modeName]);

  return trackerRef.current;
}
