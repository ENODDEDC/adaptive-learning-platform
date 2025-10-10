'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  SparklesIcon, 
  AcademicCapIcon,
  EyeIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { thumbnailCache } from '@/utils/thumbnailCache';
import AITutorModal from './AITutorModal';

/**
 * Smart Thumbnail Component with AI Tutor Integration
 * Shows AI Tutor button prominently for DOCX files
 */
const SmartThumbnail = ({ attachment, onPreview, className = "" }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [docxContent, setDocxContent] = useState('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const elementRef = useRef(null);
  const hasAttemptedGeneration = useRef(false);

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

  // Intersection Observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check cache first, then auto-generate when in view
  useEffect(() => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey) return;

    // First, check if we have it cached
    const cachedUrl = thumbnailCache.getThumbnailUrl(fileKey);
    if (cachedUrl) {
      console.log('✅ Using cached thumbnail for:', fileKey);
      setThumbnailUrl(cachedUrl);
      return;
    }

    // If not cached and in view, generate automatically (but only once)
    if (isInView && !thumbnailUrl && !isGeneratingThumbnail && !hasAttemptedGeneration.current) {
      if (!thumbnailCache.isProcessed(fileKey)) {
        hasAttemptedGeneration.current = true;
        
        if (isPdfFile(attachment)) {
          generatePdfThumbnail();
        } else if (isDocxFile(attachment)) {
          generateDocxThumbnail();
        } else if (isPptxFile(attachment)) {
          generatePptxThumbnail();
        }
      }
    }
  }, [isInView, thumbnailUrl, attachment]);

  const generatePdfThumbnail = async () => {
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      console.log('📄 Generating PDF thumbnail (one-time):', fileKey);
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
          console.log('✅ PDF thumbnail cached permanently!');
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
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      console.log('📝 Generating DOCX thumbnail (one-time):', fileKey);
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
          console.log('✅ DOCX thumbnail cached permanently!');
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
    const fileKey = attachment.cloudStorage?.key || attachment.filePath || attachment._id;
    if (!fileKey || isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    thumbnailCache.markGenerating(fileKey);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      console.log('📊 Generating PPTX thumbnail (one-time):', fileKey);
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
          console.log('✅ PPTX thumbnail cached permanently!');
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

  const extractDocxContent = async () => {
    if (isExtractingContent || docxContent) return;

    setIsExtractingContent(true);
    setExtractionError('');

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath
      };

      const response = await fetch('/api/docx-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.content && result.content.rawText) {
          setDocxContent(result.content.rawText);
          setShowAITutor(true);
        } else {
          throw new Error('No text content found in document');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract content');
      }
    } catch (error) {
      console.error('❌ Error extracting DOCX content:', error);
      setExtractionError(error.message);
    } finally {
      setIsExtractingContent(false);
    }
  };

  const handleAITutorClick = (e) => {
    e.stopPropagation();
    extractDocxContent();
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(attachment);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  return (
    <>
      <div ref={elementRef} className={`w-full group cursor-pointer ${className}`} onClick={handlePreview}>
        {/* File Thumbnail Container */}
        <div className="relative w-full aspect-[4/3] bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-3">
          {isGeneratingThumbnail ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm text-blue-700 font-medium">Generating preview...</span>
              <span className="text-xs text-blue-600 mt-1">This happens only once</span>
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

              {/* AI Tutor Button - Only for DOCX files */}
              {isDocxFile(attachment) && (
                <div className="absolute top-2 left-2">
                  <button
                    onClick={handleAITutorClick}
                    disabled={isExtractingContent}
                    className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="AI Tutor - Learn with AI assistance"
                  >
                    {isExtractingContent ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    <span className="text-xs font-semibold">AI Tutor</span>
                  </button>
                </div>
              )}
              
              {/* Cached indicator */}
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                ✓ Cached
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-3">
                  {/* Preview Button */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                    <EyeIcon className="w-6 h-6 text-gray-700" />
                  </div>

                  {/* AI Tutor Button for DOCX files */}
                  {isDocxFile(attachment) && (
                    <button
                      onClick={handleAITutorClick}
                      disabled={isExtractingContent}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50"
                      title="AI Tutor"
                    >
                      {isExtractingContent ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <AcademicCapIcon className="w-6 h-6" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              {isPdfFile(attachment) ? (
                <svg className="w-12 h-12 text-red-400 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
                </svg>
              ) : isDocxFile(attachment) ? (
                <DocumentTextIcon className="w-12 h-12 text-blue-400 mb-3" />
              ) : (
                <svg className="w-12 h-12 text-orange-400 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
                </svg>
              )}
              <span className="text-sm text-gray-600 font-medium">
                {isPdfFile(attachment) ? 'PDF Document' :
                 isDocxFile(attachment) ? 'Word Document' : 'PowerPoint'}
              </span>
              <span className="text-xs text-gray-500 mt-1">Preview will load automatically</span>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="text-left w-full min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={fileName}>
            {fileName}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Document'}
            </p>
            {isDocxFile(attachment) && (
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <SparklesIcon className="w-3 h-3" />
                <span>AI Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Extraction Error */}
        {extractionError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{extractionError}</p>
            <button
              onClick={handleAITutorClick}
              className="text-xs text-red-700 underline hover:no-underline mt-1"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* AI Tutor Modal */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        docxContent={docxContent}
        fileName={fileName}
      />
    </>
  );
};

export default SmartThumbnail;