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
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) onHide();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slideInRight">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-900 shadow-lg">
        {isCached ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <span className="text-xs font-medium text-gray-200">Loaded from cache</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-200">Downloading...</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CacheIndicator;
