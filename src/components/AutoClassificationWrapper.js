'use client';

import { useEffect } from 'react';
import { initAutoClassificationChecker } from '@/utils/autoClassificationChecker';

/**
 * Auto-Classification Wrapper
 * Initializes the auto-classification checker on mount
 */
export default function AutoClassificationWrapper({ children }) {
  useEffect(() => {
    try {
      // Initialize the checker when component mounts
      initAutoClassificationChecker();
    } catch (error) {
      console.error('❌ Error in AutoClassificationWrapper:', error);
    }
  }, []);

  return <>{children}</>;
}
