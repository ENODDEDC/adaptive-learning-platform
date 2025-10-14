'use client';

import React, { useState, useEffect, useRef } from 'react';
import { thumbnailCache } from '@/utils/thumbnailCache';

/**
 * Lazy Thumbnail Component
 * Only generates thumbnails when files are actually viewed/clicked
 * Prevents automatic cloud storage downloads on page load
 */
const LazyThumbnail = ({ attachment, onPreview, className = "" }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef(null);

  // Helper functions to detect file types
  const isPdfFile = (attachment) => {
    return attachment?.mimeType === 'application/pdf' ||
           attachment?.originalName?.toLowerCase().endsWith('.pdf') ||
           attachment?.title?.toLowerCase().endsWith('.pdf');
  };

  const isDocxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           attachment?.originalName?.toLowerCase().endsWith('.docx') ||
           attachment?.title?.toLowerCase().endsWith('.docx');
  };

  const isPptxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
           attachment?.originalName?.toLowerCase().endsWith('.pptx') ||
           attachment?.title?.toLowerCase().endsWith('.pptx');
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check cache first
  useEffect(() => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath;
    if (fileKey) {
      const cachedUrl = thumbnailCache.getThumbnailUrl(fileKey);
      if (cachedUrl) {
        setThumbnailUrl(cachedUrl);
      }
    }
  }, [attachment]);

  // Only generate thumbnail when user interacts AND file is in view
  useEffect(() => {
    if (hasUserInteracted && isInView && !thumbnailUrl && !isGeneratingThumbnail) {
      const fileKey = attachment.cloudStorage?.key || attachment.filePath;
      
      // Check if already processed to prevent duplicate requests
      if (fileKey && !thumbnailCache.isProcessed(fileKey)) {
        if (isPdfFile(attachment)) {
          generatePdfThumbnail();
        } else if (isDocxFile(attachment)) {
          generateDocxThumbnail();
        } else if (isPptxFile(attachment)) {
          generatePptxThumbnail();
        }
      }
    }
  }, [hasUserInteracted, isInView, thumbnailUrl, attachment]);

  const generatePdfThumbnail = async () => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      const response = await fetch('/api/pdf-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      console.error('❌ Error generating PDF thumbnail:', error);
      thumbnailCache.markFailed(fileKey);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateDocxThumbnail = async () => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      const response = await fetch('/api/docx-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      console.error('❌ Error generating DOCX thumbnail:', error);
      thumbnailCache.markFailed(fileKey);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generatePptxThumbnail = async () => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      const response = await fetch('/api/pptx-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      console.error('❌ Error generating PPTX thumbnail:', error);
      thumbnailCache.markFailed(fileKey);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleUserInteraction = () => {
    setHasUserInteracted(true);
    if (onPreview) {
      onPreview(attachment);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  return (
    <div ref={elementRef} className={`w-full group ${className}`}>
      {/* File Thumbnail Container */}
      <div className="relative w-full aspect-[4/3] bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-3">
        {isGeneratingThumbnail ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-gray-600">Loading preview...</span>
          </div>
        ) : thumbnailUrl ? (
          <>
            <iframe
              src={thumbnailUrl.startsWith('http') ? `${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true` : `${window.location.origin}${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true`}
              className="w-full h-full pointer-events-none border-0"
              title={`${fileName} thumbnail`}
              style={{
                transform: 'scale(0.2)',
                transformOrigin: 'top left',
                width: '500%',
                height: '400%'
              }}
            />
            {/* File Type Badge */}
            <div className={`absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm ${
              isPdfFile(attachment) ? 'bg-red-500' :
              isDocxFile(attachment) ? 'bg-blue-500' : 'bg-orange-500'
            }`}>
              {isPdfFile(attachment) ? 'PDF' : isDocxFile(attachment) ? 'DOCX' : 'PPTX'}
            </div>
          </>
        ) : (
          <button
            onClick={handleUserInteraction}
            className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {isPdfFile(attachment) ? (
              <svg className="w-8 h-8 text-red-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
              </svg>
            ) : isDocxFile(attachment) ? (
              <svg className="w-8 h-8 text-blue-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-orange-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
              </svg>
            )}
            <span className="text-xs text-gray-500 mb-1">
              {isPdfFile(attachment) ? 'PDF Document' :
               isDocxFile(attachment) ? 'Word Document' : 'PowerPoint'}
            </span>
            <span className="text-xs text-blue-600 font-medium">Click to preview</span>
          </button>
        )}

        {/* Hover Overlay */}
        {thumbnailUrl && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleUserInteraction}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="text-left w-full min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Document'}
        </p>
      </div>
    </div>
  );
};

export default LazyThumbnail;