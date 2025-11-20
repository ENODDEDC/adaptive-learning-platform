'use client';

import { useEffect, useState } from 'react';

/**
 * Cache Status Indicator
 * Shows users when content is loaded from cache vs downloaded from cloud
 */
const CacheIndicator = ({ show, isCached, onHide }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) onHide();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Immediately hide when show becomes false
      setVisible(false);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slideInRight">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 ${
        isCached 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        {isCached ? (
          <>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <div className="font-semibold">📦 Loaded from Cache</div>
              <div className="text-xs">Instant access - No download!</div>
            </div>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <div className="font-semibold">⬇️ Downloading</div>
              <div className="text-xs">First time access</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CacheIndicator;
