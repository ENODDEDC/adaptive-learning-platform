'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  XMarkIcon,
  DocumentIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

const OfficeOnlineViewer = ({
  filePath,
  fileName,
  contentId,
  onClose,
  isModal = true,
  fallbackComponent: FallbackComponent,
  onFallback
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewerConfig, setViewerConfig] = useState({
    embed: 'true', // Enable embed mode
    wdAr: '1.33333333333333', // Aspect ratio
    wdEaa: '1', // Enable advanced authoring
    wdEmbedFS: '0', // Full screen button (0=hide, 1=show)
    wdHideGridlines: '1', // Hide gridlines
    wdHideHeaders: '1', // Hide headers
    wdDownloadButton: '0', // Download button (0=hide, 1=show)
    wdInConfigurator: '0' // In configurator mode
  });

  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Build Office Online embed URL
  const buildEmbedUrl = useCallback((fileUrl) => {
    if (!fileUrl) return null;

    const baseUrl = 'https://view.officeapps.live.com/op/embed.aspx';
    const params = new URLSearchParams({
      src: fileUrl,
      ...viewerConfig
    });

    return `${baseUrl}?${params.toString()}`;
  }, [viewerConfig]);

  // Check if file URL is accessible
  const checkFileAccessibility = useCallback(async (fileUrl) => {
    try {
      const response = await fetch(fileUrl, {
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for simple check
      });
      return true; // If no error, assume accessible
    } catch (error) {
      console.warn('File accessibility check failed:', error);
      return false;
    }
  }, []);

  // Generate full file URL
  const getFileUrl = useCallback(() => {
    if (!filePath) return null;

    // Handle different filePath types
    let filePathString = '';
    if (typeof filePath === 'string') {
      filePathString = filePath;
    } else if (filePath && typeof filePath === 'object' && filePath.path) {
      filePathString = filePath.path;
    } else if (filePath && typeof filePath === 'object' && filePath.toString) {
      filePathString = filePath.toString();
    } else {
      filePathString = String(filePath || '');
    }

    // If it's already a full URL, use it
    if (filePathString.startsWith('http')) {
      return filePathString;
    }

    // If it's a relative path, make it absolute
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanPath = filePathString.startsWith('/') ? filePathString : `/${filePathString}`;

    return `${baseUrl}${cleanPath}`;
  }, [filePath]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIsLoading(false);
    setError(null);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setError('Failed to load Office Online viewer. The file may not be accessible or the service may be unavailable.');
    setIsLoading(false);
    setIframeLoaded(false);
  }, []);

  // Initialize viewer
  useEffect(() => {
    let isMounted = true;

    const initializeViewer = async () => {
      if (!filePath) {
        setError('No file path provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setIframeLoaded(false);

        const fileUrl = getFileUrl();
        if (!fileUrl) {
          throw new Error('Unable to generate file URL');
        }

        // Check file accessibility
        const isAccessible = await checkFileAccessibility(fileUrl);
        if (!isAccessible) {
          throw new Error('File is not publicly accessible');
        }

        // Set timeout for iframe loading
        timeoutRef.current = setTimeout(() => {
          if (isMounted && !iframeLoaded) {
            handleIframeError();
          }
        }, 15000); // 15 second timeout

      } catch (err) {
        if (isMounted) {
          console.error('Office Online viewer initialization error:', err);
          setError(err.message || 'Failed to initialize Office Online viewer');
          setIsLoading(false);
        }
      }
    };

    initializeViewer();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filePath, getFileUrl, checkFileAccessibility, handleIframeError, iframeLoaded]);

  // Handle fallback to image-based viewer
  const handleFallback = useCallback(() => {
    if (onFallback) {
      onFallback();
    }
  }, [onFallback]);

  // Update viewer configuration
  const updateViewerConfig = useCallback((key, value) => {
    setViewerConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const fileUrl = getFileUrl();
  const embedUrl = buildEmbedUrl(fileUrl);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-lg p-8 bg-white rounded-2xl shadow-xl">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CloudIcon className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 -m-4">
              <div className="w-28 h-28 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Office Online Viewer</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Connecting to Microsoft Office Online to display your presentation...
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <span className="text-sm text-blue-700 font-medium">Checking file accessibility</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce animation-delay-500"></div>
              <span className="text-sm text-purple-700 font-medium">Initializing Office Online connection</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce animation-delay-1000"></div>
              <span className="text-sm text-green-700 font-medium">Loading presentation viewer</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>This may take a few moments...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <ExclamationTriangleIcon className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white font-bold text-sm">!</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Office Online Viewer Unavailable</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-blue-500" />
              Troubleshooting Options
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Check File Access</h5>
                    <p className="text-sm text-blue-700">Ensure the file is publicly accessible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-900">Network Connection</h5>
                    <p className="text-sm text-green-700">Verify internet connectivity</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-900">File Format</h5>
                    <p className="text-sm text-purple-700">Ensure it's a valid .ppt or .pptx file</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-900">Use Fallback Viewer</h5>
                    <p className="text-sm text-orange-700">Switch to image-based preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try Again
            </button>

            {FallbackComponent && (
              <button
                onClick={handleFallback}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <EyeIcon className="w-4 h-4" />
                Use Fallback Viewer
              </button>
            )}

            {fileUrl && (
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <DocumentIcon className="w-4 h-4" />
                Download File
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white ${isModal ? 'rounded-2xl shadow-2xl' : ''} flex flex-col h-full overflow-hidden`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <CloudIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {fileName || 'Office Online Viewer'}
            </h1>
            <div className="text-sm text-gray-600">
              Microsoft Office Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="Viewer settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Fallback */}
          {FallbackComponent && (
            <button
              onClick={handleFallback}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Switch to fallback viewer"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Close viewer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={viewerConfig.wdDownloadButton === '1'}
                  onChange={(e) => updateViewerConfig('wdDownloadButton', e.target.checked ? '1' : '0')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show Download Button</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={viewerConfig.wdEmbedFS === '1'}
                  onChange={(e) => updateViewerConfig('wdEmbedFS', e.target.checked ? '1' : '0')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show Fullscreen Button</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={viewerConfig.wdHideGridlines === '0'}
                  onChange={(e) => updateViewerConfig('wdHideGridlines', e.target.checked ? '0' : '1')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show Gridlines</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Container */}
      <div className="flex-1 relative">
        {embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            title={`Office Online Viewer - ${fileName || 'Presentation'}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}

        {/* Loading overlay */}
        {!iframeLoaded && !error && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Office Online viewer...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficeOnlineViewer;