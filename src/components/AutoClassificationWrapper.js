'use client';

import { useEffect } from 'react';
import { initAutoClassificationChecker } from '@/utils/autoClassificationChecker';

/**
 * Auto-Classification Wrapper
 * Initializes the auto-classification checker on mount
 */
export default function AutoClassificationWrapper({ children }) {
  useEffect(() => {
    // Initialize the checker when component mounts
    initAutoClassificationChecker();
  }, []);

  return <>{children}</>;
}
