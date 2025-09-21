'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import OfficeOnlineViewer from './OfficeOnlineViewer';
import MobilePowerPointViewer from './MobilePowerPointViewer';

// Dynamically import the enhanced PowerPoint viewer
const EnhancedPowerPointViewer = dynamic(() => import('./EnhancedPowerPointViewer'), {
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading enhanced viewer...</p>
      </div>
    </div>
  )
});

const PowerPointViewerWrapper = ({
  filePath,
  fileName,
  contentId,
  onClose,
  isModal = true,
  preferredViewer = 'auto' // 'auto', 'office-online', 'image-based', 'mobile'
}) => {
  const [currentViewer, setCurrentViewer] = useState('office-online');
  const [viewerError, setViewerError] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(navigator.userAgent) ||
                            (window.innerWidth <= 768 && window.innerHeight <= 1024);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine initial viewer based on preference and device capabilities
  useEffect(() => {
    if (preferredViewer === 'auto') {
      if (isMobile) {
        // Mobile devices use mobile-optimized viewer
        setCurrentViewer('mobile');
      } else {
        // Use enhanced image-based viewer by default for better text extraction
        setCurrentViewer('image-based');
      }
    } else {
      setCurrentViewer(preferredViewer);
    }
  }, [preferredViewer, isMobile]);

  // Handle fallback from Office Online to image-based viewer
  const handleOfficeOnlineFallback = useCallback(() => {
    setIsSwitching(true);
    setViewerError(null);
    setTimeout(() => {
      setCurrentViewer('image-based');
      setIsSwitching(false);
    }, 500);
  }, []);

  // Handle manual viewer switch
  const switchViewer = useCallback((viewerType) => {
    setIsSwitching(true);
    setViewerError(null);
    setTimeout(() => {
      setCurrentViewer(viewerType);
      setIsSwitching(false);
    }, 300);
  }, []);

  // Handle viewer errors
  const handleViewerError = useCallback((error) => {
    setViewerError(error);
  }, []);

  // Loading state during switching
  if (isSwitching) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Switching viewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Viewer Selection Header (only show if auto mode and not mobile) */}
      {preferredViewer === 'auto' && !isMobile && (
        <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 rounded-lg p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">
              {currentViewer === 'office-online' ? 'Office Online' :
               currentViewer === 'image-based' ? 'Image Viewer' : 'Mobile Viewer'}
            </span>
            <button
              onClick={() => switchViewer(
                currentViewer === 'office-online' ? 'image-based' : 'office-online'
              )}
              className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
              title={`Switch to ${currentViewer === 'office-online' ? 'image-based' : 'Office Online'} viewer`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {viewerError && (
        <div className="absolute top-2 left-2 right-16 z-10 bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-700">{viewerError}</span>
          </div>
        </div>
      )}

      {/* Office Online Viewer */}
      {currentViewer === 'office-online' && (
        <OfficeOnlineViewer
          filePath={filePath}
          fileName={fileName}
          contentId={contentId}
          onClose={onClose}
          isModal={isModal}
          fallbackComponent={EnhancedPowerPointViewer}
          onFallback={handleOfficeOnlineFallback}
        />
      )}

      {/* Enhanced Image-based Viewer */}
      {currentViewer === 'image-based' && (
        <EnhancedPowerPointViewer
          filePath={filePath}
          fileName={fileName}
          contentId={contentId}
          onClose={onClose}
          isModal={isModal}
        />
      )}

      {/* Mobile Viewer */}
      {currentViewer === 'mobile' && (
        <MobilePowerPointViewer
          filePath={filePath}
          fileName={fileName}
          contentId={contentId}
          onClose={onClose}
          isModal={isModal}
        />
      )}
    </div>
  );
};

export default PowerPointViewerWrapper;