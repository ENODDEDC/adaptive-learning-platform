'use client';

import React, { useState, useEffect, useRef } from 'react';
import { thumbnailCache } from '@/utils/thumbnailCache';

/**
 * Viewport-Based Thumbnail Component
 * Generates thumbnails only when files come into view (scroll-based)
 * Good UX with significant cloud storage savings
 */
const ViewportThumbnail = ({ attachment, onPreview, className = "" }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef(null);
  const hasGenerated = useRef(false);

  // File type detection
  const isPdfFile = (attachment) => {
    return attachment?.mimeType === 'application/pdf' ||
      attachment?.originalName?.toLowerCase().endsWith('.pdf');
  };

  const isDocxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      attachment?.originalName?.toLowerCase().endsWith('.docx');
  };

  const isPptxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      attachment?.originalName?.toLowerCase().endsWith('.pptx');
  };

  // Intersection Observer with delay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add 500ms delay to avoid generating thumbnails for fast scrolling
          setTimeout(() => {
            if (elementRef.current) {
              const rect = elementRef.current.getBoundingClientRect();
              const isStillVisible = rect.top < window.innerHeight && rect.bottom > 0;
              if (isStillVisible) {
                setIsInView(true);
              }
            }
          }, 500);
        }
      },
      { threshold: 0.3, rootMargin: '100px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Generate thumbnail when in view
  useEffect(() => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey) return;

    // Check cache first
    const cachedUrl = thumbnailCache.getThumbnailUrl(fileKey);
    if (cachedUrl) {
      setThumbnailUrl(cachedUrl);
      return;
    }

    // Generate when in view (only once)
    if (isInView && !hasGenerated.current && !isGeneratingThumbnail) {
      hasGenerated.current = true;

      if (isPdfFile(attachment)) {
        generateThumbnail('/api/pdf-thumbnail');
      } else if (isDocxFile(attachment)) {
        generateThumbnail('/api/docx-thumbnail');
      } else if (isPptxFile(attachment)) {
        generateThumbnail('/api/pptx-thumbnail');
      }
    }
  }, [isInView, attachment]);

  const generateThumbnail = async (apiEndpoint) => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: attachment.cloudStorage?.key,
          filePath: attachment.filePath,
          contentId: attachment._id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
          thumbnailCache.markCompleted(fileKey, result.thumbnailUrl);
        }
      } else {
        thumbnailCache.markFailed(fileKey);
      }
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      thumbnailCache.markFailed(fileKey);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  return (
    <div ref={elementRef} className={`w-full group cursor-pointer ${className}`} onClick={() => onPreview?.(attachment)}>
      <div className="relative w-full aspect-[4/3] bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-3">
        {isGeneratingThumbnail ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-blue-700">Loading preview...</span>
          </div>
        ) : thumbnailUrl ? (
          <iframe
            src={`${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width`}
            className="w-full h-full pointer-events-none border-0"
            style={{
              transform: 'scale(0.2)',
              transformOrigin: 'top left',
              width: '500%',
              height: '400%'
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
            </svg>
            <span className="text-xs text-gray-500">
              {isInView ? 'Loading...' : 'Scroll to load'}
            </span>
          </div>
        )}
      </div>

      <div className="text-left w-full min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{fileName}</p>
        <p className="text-xs text-gray-500 mt-1">
          {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Document'}
        </p>
      </div>
    </div>
  );
};

export default ViewportThumbnail;