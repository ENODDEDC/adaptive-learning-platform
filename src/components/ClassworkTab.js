'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import CreateClassworkModal from '@/components/CreateClassworkModal';
// Removed FormBuilderModal - now using full-page editor
import SubmitAssignmentModal from '@/components/SubmitAssignmentModal';
import TeacherAssignmentModal from '@/components/TeacherAssignmentModal';
import StudentAssignmentModal from '@/components/StudentAssignmentModal';
import ContentViewer from '@/components/ContentViewer.client';
import AttachmentPreview from '@/components/AttachmentPreview';
import EnhancedDocxThumbnail from '@/components/EnhancedDocxThumbnail';
import thumbnailCache from '@/utils/thumbnailGenerationCache';
import ConfirmationModal from '@/components/ConfirmationModal';
import { TrashIcon } from '@heroicons/react/24/outline';

// Completely Isolated Context Menu System (No React State)
let globalContextMenu = null;

const createContextMenu = (x, y, options) => {
  // Remove existing menu
  removeContextMenu();

  // Create menu element
  const menu = document.createElement('div');
  menu.id = 'isolated-context-menu';
  menu.className = 'fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-[100] min-w-[160px]';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.transform = 'translate(0, 0)';

  // Add options
  options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = `w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors duration-150 ${option.disabled
      ? 'text-gray-400 cursor-not-allowed'
      : option.danger
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700'
      }`;

    if (option.icon) {
      const svg = document.createElement('div');
      svg.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${option.icon}</svg>`;
      button.appendChild(svg.firstChild);
    }

    const label = document.createElement('span');
    label.textContent = option.label;
    button.appendChild(label);

    if (!option.disabled) {
      button.onclick = () => {
        option.action();
        removeContextMenu();
      };
    }

    menu.appendChild(button);
  });

  // Add to document
  document.body.appendChild(menu);
  globalContextMenu = menu;

  // Add event listeners
  const handleClickOutside = (event) => {
    if (!menu.contains(event.target)) {
      removeContextMenu();
    }
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      removeContextMenu();
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    removeContextMenu();
  };

  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('contextmenu', handleContextMenu);
  }, 0);

  // Store cleanup function
  menu._cleanup = () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
    document.removeEventListener('contextmenu', handleContextMenu);
  };
};

const removeContextMenu = () => {
  if (globalContextMenu) {
    if (globalContextMenu._cleanup) {
      globalContextMenu._cleanup();
    }
    if (globalContextMenu.parentNode) {
      globalContextMenu.parentNode.removeChild(globalContextMenu);
    }
    globalContextMenu = null;
  }
};

// Form Thumbnail Component with Live Preview
const FormThumbnail = ({ form, onPreview, isInstructor, onEdit }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (isInstructor && onEdit) {
      // For instructors: open form editor
      onEdit(form);
    } else {
      // For students: open form preview in new tab (same as "Preview Form" context menu)
      if (form._id) {
        window.open(`/forms/${form._id}`, '_blank');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full group"
    >
      {/* Form Thumbnail Container */}
      <div className="relative w-full aspect-[4/3] bg-white border-2 border-purple-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-3">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-purple-600">Loading preview...</span>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800 text-center mb-2 line-clamp-2">
              {form.title || 'Untitled Form'}
            </h4>
            <div className="w-full space-y-1 px-4">
              <div className="h-2 bg-purple-200 rounded-full w-3/4 mx-auto"></div>
              <div className="h-2 bg-purple-200 rounded-full w-1/2 mx-auto"></div>
              <div className="h-2 bg-purple-200 rounded-full w-2/3 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Live Form Preview */}
        <iframe
          src={`/forms/${form._id}`}
          className="w-full h-full pointer-events-none border-0"
          title={`${form.title || 'Form'} preview`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            transform: 'scale(0.25)',
            transformOrigin: 'top left',
            width: '400%',
            height: '400%'
          }}
        />

        {/* File Type Badge */}
        <div className="absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm bg-purple-500 z-20">
          FORM
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
            {isInstructor ? (
              // Edit icon for instructors
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              // Eye icon for students
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Form Info */}
      <div className="text-left w-full min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors" title={form.title}>
          {form.title || 'Untitled Form'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Interactive Form
        </p>
      </div>
    </button>
  );
};

// Stable Thumbnail Component that prevents re-renders from parent state changes
const StableThumbnailComponent = React.memo(({ attachment, onPreview }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(
    attachment.thumbnailUrl || thumbnailCache.getThumbnailUrl(attachment._id)
  );
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const hasAttemptedRef = useRef(false);

  // Helper function to detect file types
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

  useEffect(() => {
    // Check cache first
    const cachedUrl = thumbnailCache.getThumbnailUrl(attachment._id);
    if (cachedUrl && !thumbnailUrl) {
      setThumbnailUrl(cachedUrl);
      return;
    }

    // Only attempt once per attachment globally using cache
    if (!attachment._id) return;
    if (hasAttemptedRef.current) return;
    if (!thumbnailCache.shouldAttemptGeneration(attachment._id, attachment.thumbnailUrl || thumbnailUrl)) {
      return;
    }

    hasAttemptedRef.current = true;
    thumbnailCache.markAttempted(attachment._id);

    if (isPdfFile(attachment)) {
      generatePdfThumbnail();
    } else if (isDocxFile(attachment)) {
      generateDocxThumbnail();
    } else if (isPptxFile(attachment)) {
      generatePptxThumbnail();
    }
  }, []);

  const generatePdfThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateDocxThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generatePptxThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (onPreview) onPreview(attachment);
      }}
      className="w-full group"
    >
      {/* PDF Thumbnail Container */}
      <div className="relative w-full aspect-[4/3] bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-3">
        {isGeneratingThumbnail ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-gray-600">Loading...</span>
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
            <div className={`absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm ${isPdfFile(attachment) ? 'bg-red-500' :
              isDocxFile(attachment) ? 'bg-blue-500' : 'bg-orange-500'
              }`}>
              {isPdfFile(attachment) ? 'PDF' : isDocxFile(attachment) ? 'DOCX' : 'PPTX'}
            </div>
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
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
            <span className="text-xs text-gray-500">
              {isPdfFile(attachment) ? 'PDF Preview' :
                isDocxFile(attachment) ? 'DOCX Preview' : 'PPTX Preview'}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="text-left w-full min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'PDF Document'}
        </p>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Only re-render if attachment ID or thumbnailUrl changes
  return (
    prevProps.attachment._id === nextProps.attachment._id &&
    prevProps.attachment.thumbnailUrl === nextProps.attachment.thumbnailUrl
  );
});

// Enhanced PDF/DOCX Thumbnail Component for Grid View (Stable)
const EnhancedPDFFileThumbnail = React.memo(({ attachment, onPreview }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(
    attachment.thumbnailUrl || thumbnailCache.getThumbnailUrl(attachment._id)
  );
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const hasAttemptedRef = useRef(false);

  // Helper function to detect file types
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

  useEffect(() => {
    // Check cache first
    const cachedUrl = thumbnailCache.getThumbnailUrl(attachment._id);
    if (cachedUrl && !thumbnailUrl) {
      setThumbnailUrl(cachedUrl);
      return;
    }

    // Only attempt once per attachment globally using cache
    if (!attachment._id) return;
    if (hasAttemptedRef.current) return;
    if (!thumbnailCache.shouldAttemptGeneration(attachment._id, attachment.thumbnailUrl || thumbnailUrl)) {
      return;
    }

    hasAttemptedRef.current = true;
    thumbnailCache.markAttempted(attachment._id);

    if (isPdfFile(attachment)) {
      generatePdfThumbnail();
    } else if (isDocxFile(attachment)) {
      generateDocxThumbnail();
    } else if (isPptxFile(attachment)) {
      generatePptxThumbnail();
    }
  }, []);

  const generatePdfThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateDocxThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generatePptxThumbnail = async () => {
    if (!attachment._id) return;
    if (thumbnailCache.isGenerating(attachment._id)) return;

    thumbnailCache.startGenerating(attachment._id);
    setIsGeneratingThumbnail(true);

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
          thumbnailCache.finishGenerating(attachment._id, result.thumbnailUrl);
        } else {
          setHasFailed(true);
          thumbnailCache.markFailed(attachment._id);
        }
      } else {
        setHasFailed(true);
        thumbnailCache.markFailed(attachment._id);
      }
    } catch (error) {
      setHasFailed(true);
      thumbnailCache.markFailed(attachment._id);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  return (
    <div className="w-full bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
      {/* File Header */}
      <div className={`px-4 py-2 flex items-center justify-between ${isPdfFile(attachment)
        ? 'bg-gradient-to-r from-red-500 to-red-600'
        : isDocxFile(attachment)
          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
          : 'bg-gradient-to-r from-orange-500 to-orange-600'
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {isPdfFile(attachment) ? '📄' : isDocxFile(attachment) ? '📝' : '📊'}
            </span>
          </div>
          <span className="text-white font-semibold text-sm">
            {isPdfFile(attachment) ? 'PDF Document' : isDocxFile(attachment) ? 'Word Document' : 'PowerPoint'}
          </span>
        </div>
        <div className="text-white/80 text-xs">
          {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : ''}
        </div>
      </div>

      {/* PDF Thumbnail */}
      <div className="p-4">
        <div className="relative w-full aspect-[4/3] bg-white rounded-lg border-2 border-gray-200 shadow-inner overflow-hidden mb-3">
          {isGeneratingThumbnail ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <div className={`w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mb-2 ${isPdfFile(attachment) ? 'border-red-500' :
                isDocxFile(attachment) ? 'border-blue-500' : 'border-orange-500'
                }`}></div>
              <span className="text-sm text-gray-600 font-medium">Generating preview...</span>
            </div>
          ) : thumbnailUrl ? (
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
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <svg className={`w-12 h-12 mb-2 fill="currentColor" ${isPdfFile(attachment) ? 'text-red-400' :
                isDocxFile(attachment) ? 'text-blue-400' : 'text-orange-400'
                }`} viewBox="0 0 24 24">
                <path d="M8.5 5h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 017 17.5v-11A1.5 1.5 0 018.5 5z" />
              </svg>
              <span className="text-sm text-gray-500 font-medium">
                {isPdfFile(attachment) ? 'PDF Preview' :
                  isDocxFile(attachment) ? 'DOCX Preview' : 'PPTX Preview'}
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all duration-300">
              <svg className={`w-6 h-6 ${isPdfFile(attachment) ? 'text-red-600' :
                isDocxFile(attachment) ? 'text-blue-600' : 'text-orange-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate group-hover:text-red-700 transition-colors">
            {fileName}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPreview) onPreview(attachment);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md ${isPdfFile(attachment)
              ? 'bg-red-500 hover:bg-red-600'
              : isDocxFile(attachment)
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-orange-500 hover:bg-orange-600'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isPdfFile(attachment) ? 'Open PDF' : isDocxFile(attachment) ? 'Open DOCX' : 'Open PPTX'}
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if attachment ID or thumbnailUrl changes
  return (
    prevProps.attachment._id === nextProps.attachment._id &&
    prevProps.attachment.thumbnailUrl === nextProps.attachment.thumbnailUrl
  );
});

const ClassworkTab = ({
  courseDetails,
  isInstructor,
  onOpenContent,
  onClassworkCreated,
  // Props from parent for create classwork panel
  isCreateClassworkModalOpen,
  setIsCreateClassworkModalOpen,
  editingClasswork,
  setEditingClasswork,
  classworkType,
  setClassworkType,
  compactMode = false,
  submissionsFromProps = [] // Add missing prop with default value
}) => {
  const [assignments, setAssignments] = useState([]);
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  // Removed local state - now using props from parent
  // const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  // Removed form builder modal state - now using full-page editor
  const [isClassworkMenuOpen, setIsClassworkMenuOpen] = useState(false);
  // Removed local state - now using props from parent
  // const [editingClasswork, setEditingClasswork] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  // const [classworkType, setClassworkType] = useState('assignment');
  const [isSubmitAssignmentModalOpen, setIsSubmitAssignmentModalOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDragLoading, setIsDragLoading] = useState(false);
  const [isDragOperationInProgress, setIsDragOperationInProgress] = useState(false);

  // New states for assignment modals
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isTeacherAssignmentModalOpen, setIsTeacherAssignmentModalOpen] = useState(false);
  const [isStudentAssignmentModalOpen, setIsStudentAssignmentModalOpen] = useState(false);

  // Enhanced filtering and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [prevViewMode, setPrevViewMode] = useState('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, thisWeek, thisMonth, overdue
  const [statusFilter, setStatusFilter] = useState('all'); // all, notStarted, inProgress, submitted, completed
  const [groupBy, setGroupBy] = useState('none'); // none, dueDate, type, status

  // Toast notification system
  const [toasts, setToasts] = useState([]);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    classworkId: null
  });

  // Sync submissions from props to local state
  useEffect(() => {
    console.log('🔍 CLASSWORK: Submissions from props:', submissionsFromProps);
    if (submissionsFromProps && submissionsFromProps.length > 0) {
      console.log('🔍 CLASSWORK: Syncing submissions from props:', submissionsFromProps.length, 'items');
      console.log('🔍 CLASSWORK: Submission details:', submissionsFromProps.map(s => ({
        id: s._id,
        assignment: s.assignment || s.assignmentId?._id,
        status: s.status,
        grade: s.grade
      })));
      setSubmissions(submissionsFromProps);
    } else {
      console.log('🔍 CLASSWORK: No submissions from props or empty array');
    }
  }, [submissionsFromProps]);

  // Toast notification functions
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Note: Context menu now uses isolated DOM-based system (no React state)

  // Handle right-click context menu (No React State - Completely Isolated)
  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();

    const x = event.clientX;
    const y = event.clientY;

    // Adjust position if menu would go off-screen
    const menuWidth = 160;
    const menuHeight = 120;
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

    // Get context menu options
    const options = getContextMenuOptions(item);

    // Create isolated context menu (no React state involved)
    createContextMenu(adjustedX, adjustedY, options);
  };

  // Close context menu (now handled by isolated system)
  const closeContextMenu = () => {
    removeContextMenu();
  };

  // Get context menu options based on item type and user role
  const getContextMenuOptions = (item) => {
    const isForm = item?.itemType === 'form' || item?.type === 'form';
    const options = [];

    if (isForm) {
      // Form options
      options.push({
        label: 'Preview Form',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />',
        action: () => {
          if (item._id) {
            window.open(`/forms/${item._id}`, '_blank');
          }
        }
      });

      if (isInstructor) {
        options.push({
          label: 'Edit Form',
          icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />',
          action: () => handleEditForm(item)
        });

        options.push({
          label: 'Delete Form',
          icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />',
          action: () => handleDeleteClasswork(item._id),
          danger: true
        });
      }
    } else {
      // Assignment options
      options.push({
        label: 'View Details',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />',
        action: () => {
          if (onOpenContent) {
            if (item.attachments && item.attachments.length > 0) {
              if (item.attachments.length === 1) {
                onOpenContent(item.attachments[0]);
              } else {
                const multiAttachmentContent = {
                  title: item.title,
                  contentType: 'multi-attachment',
                  attachments: item.attachments,
                  currentIndex: 0
                };
                onOpenContent(multiAttachmentContent);
              }
            } else {
              const mockContent = {
                title: item.title,
                filePath: null,
                mimeType: 'text/plain',
                fileSize: 0,
                contentType: item.itemType || 'assignment'
              };
              onOpenContent(mockContent);
            }
          }
        }
      });

      if (isInstructor) {
        options.push({
          label: 'Edit Assignment',
          icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />',
          action: () => handleEditClasswork(item)
        });

        options.push({
          label: 'Delete Assignment',
          icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />',
          action: () => handleDeleteClasswork(item._id),
          danger: true
        });
      } else {
        // Student options
        const submission = submissions.find(s => String(s.assignment) === String(item._id));
        if (!submission || submission.status !== 'submitted') {
          options.push({
            label: 'Submit Assignment',
            icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
            action: () => handleSubmitAssignment(item._id)
          });
        }
      }
    }

    return options;
  };

  // Form builder modal removed - now using full-page editor

  // Helper function to redirect to full-page form editor
  const handleCreateForm = () => {
    // Check if courseDetails is available
    if (!courseDetails || !courseDetails._id) {
      console.error('Course details not available:', courseDetails);
      alert('Course information is not loaded yet. Please wait a moment and try again.');
      return;
    }

    // Redirect to full-page form editor for consistency
    window.location.href = `/forms/new?courseId=${courseDetails._id}`;
  };

  // Handle assignment click - open appropriate modal based on user role
  const handleAssignmentClick = (assignment) => {
    if (isInstructor) {
      setSelectedAssignment(assignment);
      setIsTeacherAssignmentModalOpen(true);
    } else {
      setSelectedAssignment(assignment);
      setIsStudentAssignmentModalOpen(true);
    }
  };



  // Helper function to edit existing form
  const handleEditForm = (form) => {
    window.location.href = `/forms/${form._id}/edit`;
  };

  // Handle smooth view mode transitions
  const handleViewModeChange = (newMode) => {
    if (newMode === viewMode || isTransitioning) return;

    setIsTransitioning(true);
    setPrevViewMode(viewMode);

    // Apply transition animation
    setTimeout(() => {
      setViewMode(newMode);
      setIsTransitioning(false);
    }, 150);
  };



  // Enhanced filtering and sorting logic
  const getFilteredAndSortedAssignments = useCallback(() => {
    // Combine assignments and forms
    // Note: assignments array contains ALL classwork items with their 'type' field
    let allItems = [
      ...assignments.map(item => ({
        ...item,
        itemType: item.type === 'assignment' ? 'assignment' : item.type
      })),
      ...forms.map(item => ({ ...item, itemType: 'form' }))
    ];

    let filtered = allItems.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filter !== 'all' && item.type !== filter && item.itemType !== filter) return false;

      // Date range filter (only for assignments, forms don't have due dates)
      if (dateRange !== 'all' && item.itemType === 'assignment' && item.dueDate) {
        const now = new Date();
        const dueDate = new Date(item.dueDate);
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        switch (dateRange) {
          case 'thisWeek':
            if (daysDiff < 0 || daysDiff > 7) return false;
            break;
          case 'thisMonth':
            if (daysDiff < 0 || daysDiff > 30) return false;
            break;
          case 'overdue':
            if (daysDiff >= 0) return false;
            break;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        // Forms don't have submissions, so only filter assignments
        if (item.itemType === 'assignment') {
          const submission = submissions.find(s => String(s.assignment) === String(item._id));
          const isCompleted = submission && submission.status === 'submitted' && submission.grade !== undefined && submission.grade !== null;
          const isInProgress = submission && submission.status === 'draft';

          switch (statusFilter) {
            case 'notStarted':
              if (submission) return false;
              break;
            case 'inProgress':
              if (!isInProgress) return false;
              break;
            case 'completed':
              if (!isCompleted) return false;
              break;
          }
        } else if (item.itemType === 'form') {
          // Forms are always considered "not started" for status filtering
          if (statusFilter !== 'notStarted') return false;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'dueDate':
          // Forms don't have due dates, so sort them after assignments with due dates
          const aDue = a.itemType === 'assignment' ? a.dueDate : '9999-12-31';
          const bDue = b.itemType === 'assignment' ? b.dueDate : '9999-12-31';
          return new Date(aDue) - new Date(bDue);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'mostUrgent':
          // Only assignments can be urgent, forms are never urgent
          if (a.itemType === 'form' && b.itemType === 'form') return 0;
          if (a.itemType === 'form') return 1;
          if (b.itemType === 'form') return -1;

          const aDueDate = new Date(a.dueDate || '9999-12-31');
          const bDueDate = new Date(b.dueDate || '9999-12-31');
          const now = new Date();
          const aUrgency = Math.ceil((aDueDate - now) / (1000 * 60 * 60 * 24));
          const bUrgency = Math.ceil((bDueDate - now) / (1000 * 60 * 60 * 24));
          return aUrgency - bUrgency;
        default:
          return 0;
      }
    });

    return filtered;
  }, [assignments, submissions, searchQuery, filter, dateRange, statusFilter, sortBy]);

  // Note: Dropdown menu replaced with right-click context menu



  // Enhanced Activity Card Component
  const EnhancedActivityCard = ({ assignment, form, submission, isInstructor, onEdit, onDelete, onSubmit, onOpenContent, viewMode }) => {
    // Handle both assignments and forms
    const item = assignment || form;

    // Return null if no item is provided
    if (!item) {
      console.warn('EnhancedActivityCard: No item provided');
      return null;
    }

    // Use the actual type from the item, not just form vs assignment
    const itemType = form ? 'form' : (item.type || 'assignment');

    const typeConfig = {
      assignment: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        color: 'blue',
        bgColor: 'blue-50/80',
        borderColor: 'blue-200/60',
        textColor: 'blue-700',
        accentColor: 'blue-600',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-blue-600',
        gradientBg: 'from-blue-50/50 to-indigo-50/50',
        shadowColor: 'shadow-blue-100/50',
        hoverBg: 'hover:bg-blue-50/90',
        ringColor: 'ring-blue-500/20',
        lightBg: 'bg-blue-25',
        darkBg: 'bg-blue-600',
        lightText: 'text-blue-600',
        darkText: 'text-white'
      },
      quiz: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
        color: 'purple',
        bgColor: 'purple-50/80',
        borderColor: 'purple-200/60',
        textColor: 'purple-700',
        accentColor: 'purple-600',
        gradientFrom: 'from-purple-500',
        gradientTo: 'to-purple-600',
        gradientBg: 'from-purple-50/50 to-violet-50/50',
        shadowColor: 'shadow-purple-100/50',
        hoverBg: 'hover:bg-purple-50/90',
        ringColor: 'ring-purple-500/20',
        lightBg: 'bg-purple-25',
        darkBg: 'bg-purple-600',
        lightText: 'text-purple-600',
        darkText: 'text-white'
      },
      material: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
        color: 'emerald',
        bgColor: 'emerald-50/80',
        borderColor: 'emerald-200/60',
        textColor: 'emerald-700',
        accentColor: 'emerald-600',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-600',
        gradientBg: 'from-emerald-50/50 to-teal-50/50',
        shadowColor: 'shadow-emerald-100/50',
        hoverBg: 'hover:bg-emerald-50/90',
        ringColor: 'ring-emerald-500/20',
        lightBg: 'bg-emerald-25',
        darkBg: 'bg-emerald-600',
        lightText: 'text-emerald-600',
        darkText: 'text-white'
      },
      question: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        color: 'orange',
        bgColor: 'orange-50/80',
        borderColor: 'orange-200/60',
        textColor: 'orange-700',
        accentColor: 'orange-600',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-orange-600',
        gradientBg: 'from-orange-50/50 to-amber-50/50',
        shadowColor: 'shadow-orange-100/50',
        hoverBg: 'hover:bg-orange-50/90',
        ringColor: 'ring-orange-500/20',
        lightBg: 'bg-orange-25',
        darkBg: 'bg-orange-600',
        lightText: 'text-orange-600',
        darkText: 'text-white'
      },
      form: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h-2m0 0H9m4 0v4m-4-4v4" /></svg>,
        color: 'emerald',
        bgColor: 'emerald-50/80',
        borderColor: 'emerald-200/60',
        textColor: 'emerald-700',
        accentColor: 'emerald-600',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-600',
        gradientBg: 'from-emerald-50/50 to-teal-50/50',
        shadowColor: 'shadow-emerald-100/50',
        hoverBg: 'hover:bg-emerald-50/90',
        ringColor: 'ring-emerald-500/20',
        lightBg: 'bg-emerald-25',
        darkBg: 'bg-emerald-600',
        lightText: 'text-emerald-600',
        darkText: 'text-white'
      }
    };

    const config = typeConfig[item.type] || typeConfig.assignment;
    const isCompleted = submission && submission.status === 'submitted' && submission.grade !== undefined && submission.grade !== null;
    const isInProgress = submission && submission.status === 'draft';
    const isOverdue = itemType === 'assignment' && item.dueDate && new Date(item.dueDate) < new Date() && !isCompleted;

    // Enhanced Progress calculation with more realistic logic
    const getProgress = () => {
      // Forms don't have progress like assignments
      if (itemType === 'form') {
        return 0; // Forms show 0 progress
      }

      if (isCompleted) return 100;
      if (isInProgress) {
        // Simulate progress based on time elapsed and urgency
        const now = new Date();
        const created = new Date(item.createdAt);
        const due = new Date(item.dueDate);
        const totalTime = due - created;
        const elapsedTime = now - created;
        const progressRatio = Math.min(elapsedTime / totalTime, 0.9); // Cap at 90% until completed
        return Math.max(10, progressRatio * 100); // Minimum 10% progress
      }
      return 0;
    };

    const progress = getProgress();

    // Enhanced Urgency calculation with more granular levels
    const getUrgency = () => {
      // Forms are never urgent
      if (itemType === 'form') return 'normal';

      if (isOverdue) return 'overdue';

      if (daysLeft <= 0) return 'overdue';
      if (daysLeft <= 1) return 'critical';
      if (daysLeft <= 2) return 'urgent';
      if (daysLeft <= 4) return 'soon';
      if (daysLeft <= 7) return 'upcoming';
      return 'normal';
    };

    // Calculate daysLeft first for use in other parts of the component (only for assignments)
    const now = new Date();
    const dueDate = itemType === 'assignment' ? new Date(item.dueDate) : new Date();
    const daysLeft = itemType === 'assignment' ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : 999;

    const urgency = getUrgency();

    const getUrgencyConfig = () => {
      switch (urgency) {
        case 'overdue':
          return {
            color: 'red',
            bg: 'bg-red-50/80',
            border: 'border-red-200/60',
            text: 'text-red-700',
            accentColor: 'red-600',
            gradientFrom: 'from-red-500',
            gradientTo: 'to-red-600',
            gradientBg: 'from-red-50/50 to-rose-50/50',
            shadowColor: 'shadow-red-100/50',
            hoverBg: 'hover:bg-red-50/90',
            ringColor: 'ring-red-500/20',
            lightBg: 'bg-red-25',
            darkBg: 'bg-red-600',
            lightText: 'text-red-600',
            darkText: 'text-white',
            label: 'Overdue',
            icon: '⚠️'
          };
        case 'critical':
          return {
            color: 'red',
            bg: 'bg-red-100/80',
            border: 'border-red-300/60',
            text: 'text-red-800',
            accentColor: 'red-700',
            gradientFrom: 'from-red-600',
            gradientTo: 'to-red-700',
            gradientBg: 'from-red-100/50 to-pink-100/50',
            shadowColor: 'shadow-red-200/50',
            hoverBg: 'hover:bg-red-100/90',
            ringColor: 'ring-red-600/20',
            lightBg: 'bg-red-50',
            darkBg: 'bg-red-700',
            lightText: 'text-red-700',
            darkText: 'text-white',
            label: 'Critical',
            icon: '🚨'
          };
        case 'urgent':
          return {
            color: 'orange',
            bg: 'bg-orange-50/80',
            border: 'border-orange-200/60',
            text: 'text-orange-700',
            accentColor: 'orange-600',
            gradientFrom: 'from-orange-500',
            gradientTo: 'to-orange-600',
            gradientBg: 'from-orange-50/50 to-amber-50/50',
            shadowColor: 'shadow-orange-100/50',
            hoverBg: 'hover:bg-orange-50/90',
            ringColor: 'ring-orange-500/20',
            lightBg: 'bg-orange-25',
            darkBg: 'bg-orange-600',
            lightText: 'text-orange-600',
            darkText: 'text-white',
            label: 'Urgent',
            icon: '⏰'
          };
        case 'soon':
          return {
            color: 'amber',
            bg: 'bg-amber-50/80',
            border: 'border-amber-200/60',
            text: 'text-amber-700',
            accentColor: 'amber-600',
            gradientFrom: 'from-amber-500',
            gradientTo: 'to-amber-600',
            gradientBg: 'from-amber-50/50 to-yellow-50/50',
            shadowColor: 'shadow-amber-100/50',
            hoverBg: 'hover:bg-amber-50/90',
            ringColor: 'ring-amber-500/20',
            lightBg: 'bg-amber-25',
            darkBg: 'bg-amber-600',
            lightText: 'text-amber-600',
            darkText: 'text-white',
            label: 'Due Soon',
            icon: '📅'
          };
        case 'upcoming':
          return {
            color: 'blue',
            bg: 'bg-blue-50/80',
            border: 'border-blue-200/60',
            text: 'text-blue-700',
            accentColor: 'blue-600',
            gradientFrom: 'from-blue-500',
            gradientTo: 'to-blue-600',
            gradientBg: 'from-blue-50/50 to-indigo-50/50',
            shadowColor: 'shadow-blue-100/50',
            hoverBg: 'hover:bg-blue-50/90',
            ringColor: 'ring-blue-500/20',
            lightBg: 'bg-blue-25',
            darkBg: 'bg-blue-600',
            lightText: 'text-blue-600',
            darkText: 'text-white',
            label: 'Upcoming',
            icon: '📋'
          };
        default:
          return {
            color: 'emerald',
            bg: 'bg-emerald-50/80',
            border: 'border-emerald-200/60',
            text: 'text-emerald-700',
            accentColor: 'emerald-600',
            gradientFrom: 'from-emerald-500',
            gradientTo: 'to-emerald-600',
            gradientBg: 'from-emerald-50/50 to-green-50/50',
            shadowColor: 'shadow-emerald-100/50',
            hoverBg: 'hover:bg-emerald-50/90',
            ringColor: 'ring-emerald-500/20',
            lightBg: 'bg-emerald-25',
            darkBg: 'bg-emerald-600',
            lightText: 'text-emerald-600',
            darkText: 'text-white',
            label: 'Normal',
            icon: '✅'
          };
      }
    };

    const urgencyConfig = getUrgencyConfig();

    // Render different layouts based on view mode
    if (viewMode === 'grid') {
      return (
        <div
          className="group relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.01] min-h-[320px]"
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {/* Clean Header */}
          <div className="p-6 pb-4">
            {/* Header with Type and Date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
                <div>
                  <span className="inline-flex px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                    {(item.type || 'assignment').charAt(0).toUpperCase() + (item.type || 'assignment').slice(1)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : ''}
              </div>
            </div>

            {/* Status Badge for Students - Prominent Position */}
            {!isInstructor && itemType === 'assignment' && (
              <div className="mb-3">
                {submission && submission.grade !== null && submission.grade !== undefined ? (
                  // Graded - Show grade prominently
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow-sm ${submission.grade >= 90 ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200' :
                        submission.grade >= 70 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-200' :
                          submission.grade >= 50 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-2 border-yellow-200' :
                            'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200'
                      }`}>
                      <span className="text-base">✅</span>
                      <span>Graded: {submission.grade}%</span>
                    </span>
                  </div>
                ) : submission && submission.status === 'submitted' ? (
                  // Submitted but not graded
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-sm">
                    <span className="text-base">📝</span>
                    <span>Submitted - Awaiting Grade</span>
                  </span>
                ) : submission && submission.status === 'draft' ? (
                  // In Progress
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg shadow-sm">
                    <span className="text-base">🔄</span>
                    <span>In Progress</span>
                  </span>
                ) : item.dueDate && new Date(item.dueDate) < new Date() ? (
                  // Missed/Overdue - No submission and past due date
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-lg shadow-sm">
                    <span className="text-base">❌</span>
                    <span>Missed</span>
                  </span>
                ) : (
                  // Not Started - No submission but not overdue yet
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-lg shadow-sm">
                    <span className="text-base">⭕</span>
                    <span>Not Started</span>
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
              {item.title}
            </h3>
          </div>


          {/* Main Content Area */}
          <div className="flex-1 px-6">
            {/* Form Thumbnail or Attachments */}
            {itemType === 'form' ? (
              <div className="mb-4">
                <FormThumbnail
                  form={item}
                  onPreview={onOpenContent}
                  isInstructor={isInstructor}
                  onEdit={onEdit}
                />
              </div>
            ) : Array.isArray(item.attachments) && item.attachments.length > 0 && (
              <div className="mb-4">
                {item.attachments.slice(0, 1).map((attachment, index) => {
                  // Enhanced DOCX thumbnail with AI narrator for DOCX files
                  if (attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    attachment.originalName?.toLowerCase().endsWith('.docx') ||
                    attachment.title?.toLowerCase().endsWith('.docx')) {
                    return (
                      <EnhancedDocxThumbnail
                        key={attachment._id || index}
                        attachment={attachment}
                        onPreview={onOpenContent}
                      />
                    );
                  }

                  // Modern PDF/PPTX thumbnail for other document types
                  if (attachment.mimeType === 'application/pdf' ||
                    attachment.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                    return (
                      <StableThumbnailComponent
                        key={attachment._id || index}
                        attachment={attachment}
                        onPreview={onOpenContent}
                      />
                    );
                  }

                  // Modern file display for other types
                  const fileName = attachment.originalName || attachment.title || `File ${index + 1}`;
                  const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <button
                      key={attachment._id || index}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenContent) onOpenContent(attachment);
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group"
                      title={`Click to preview ${fileName}`}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate" title={fileName}>{fileName}</p>
                        <p className="text-xs text-gray-500">{extension}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
                {item.attachments.length > 1 && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">+{item.attachments.length - 1} more file{item.attachments.length > 2 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {item.attachments && item.attachments.length > 0 && `${item.attachments.length} file${item.attachments.length > 1 ? 's' : ''}`}
              </div>

              {/* Status Badge for Students */}
              {!isInstructor && itemType === 'assignment' && (
                <div className="flex items-center gap-2">
                  {submission && submission.grade !== null && submission.grade !== undefined ? (
                    // Graded
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full ${submission.grade >= 90 ? 'bg-green-100 text-green-700 border border-green-200' :
                          submission.grade >= 70 ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            submission.grade >= 50 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        <span>✅</span>
                        <span>{submission.grade}%</span>
                      </span>
                    </div>
                  ) : submission && submission.status === 'submitted' ? (
                    // Submitted but not graded
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full">
                      <span>📝</span>
                      <span>Submitted</span>
                    </span>
                  ) : submission && submission.status === 'draft' ? (
                    // In Progress
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">
                      <span>🔄</span>
                      <span>In Progress</span>
                    </span>
                  ) : item.dueDate && new Date(item.dueDate) < new Date() ? (
                    // Missed/Overdue
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-full">
                      <span>❌</span>
                      <span>Missed</span>
                    </span>
                  ) : (
                    // Not Started
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-full">
                      <span>⭕</span>
                      <span>Not Started</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // List view (compact)
    if (viewMode === 'list') {
      return (
        <div
          className="bg-white border border-gray-200/60 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-gray-300/60 overflow-hidden cursor-pointer"
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between gap-6">
              {/* Left Section - Main Content */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                {/* Icon and Type */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className={`w-12 h-12 ${config.bgColor} ${config.borderColor} border rounded-xl flex items-center justify-center shadow-md ${config.shadowColor} hover:scale-110 transition-all duration-300`}>
                    <div className={config.textColor}>
                      {config.icon}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-sm ${config.shadowColor}`}>
                      {(item.type || 'assignment').charAt(0).toUpperCase() + (item.type || 'assignment').slice(1)}
                    </span>
                    <div className="text-xs text-gray-500 font-medium">
                      {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : ''}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 hover:text-blue-700 transition-colors duration-200">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                          {item.description}
                        </p>
                      )}

                      {/* Compact Metadata Row */}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <div className="flex items-center gap-1">
                              {item.attachments.slice(0, 2).map((attachment, index) => {
                                const fileName = attachment.originalName || attachment.title || `File ${index + 1}`;
                                const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                                return (
                                  <button
                                    key={attachment._id || index}
                                    onClick={() => onOpenContent ? onOpenContent(attachment) : null}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                                    title={`Click to preview ${fileName}`}
                                  >
                                    <svg className="w-2 h-2 text-gray-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                                      {extension}
                                    </span>
                                  </button>
                                );
                              })}
                              {item.attachments.length > 2 && (
                                <span className="text-xs font-medium text-gray-500">+{item.attachments.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {itemType === 'assignment' && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium text-xs">{Math.round(progress)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Assignments */}
                    {itemType === 'assignment' && (
                      <div className="flex-shrink-0 w-24">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                          <span>Progress</span>
                          <span className={`${config.textColor} font-bold`}>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200/60 rounded-full h-2 shadow-inner">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} transition-all duration-500 shadow-sm`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section - Status and Actions */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 rounded-full shadow-sm hover:scale-105 transition-all duration-300">
                      <span className="text-sm">✅</span>
                      <span>Completed</span>
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-700 bg-blue-50/90 border border-blue-200/70 rounded-full shadow-sm hover:scale-105 transition-all duration-300">
                      <span className="text-sm">🔄</span>
                      <span>In Progress</span>
                    </span>
                  )}
                </div>

                {/* Compact Action Menu */}
                <div className="flex items-center gap-2">
                  {isInstructor ? (
                    {/* Right-click context menu replaces dropdown */ }
                  ) : (
                    <>
                      {isCompleted ? (
                        <span className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 rounded">
                          ✓ Done
                        </span>
                      ) : isInProgress ? (
                        <button
                          onClick={onSubmit}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/60 rounded hover:bg-blue-100/80 transition-all duration-200"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={onSubmit}
                          className={`px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded hover:opacity-90 transition-all duration-200`}
                        >
                          Start
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Timeline view
    if (viewMode === 'timeline') {
      return (
        <div className="relative flex items-start gap-8">
          {/* Enhanced Timeline dot */}
          <div className="relative z-10 flex-shrink-0">
            <div className={`w-20 h-20 ${config.bgColor} ${config.borderColor} border-3 rounded-full flex items-center justify-center shadow-lg ${config.shadowColor} hover:scale-110 transition-all duration-300 hover:shadow-xl`}>
              <div className={config.textColor}>
                {config.icon}
              </div>
            </div>
            {/* Timeline line */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-200"></div>
          </div>

          {/* Enhanced Content */}
          <div className={`flex-1 bg-white border ${config.borderColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-300/60`}>
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-md ${config.shadowColor}`}>
                    {(item.type || 'assignment').charAt(0).toUpperCase() + (item.type || 'assignment').slice(1)}
                  </span>
                  <div className="text-sm text-gray-500 font-medium">
                    Created {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : 'Recently'}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight hover:text-blue-700 transition-colors duration-200">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-600 leading-relaxed text-base">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 rounded-full shadow-sm hover:scale-105 transition-all duration-300">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      Completed
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-blue-700 bg-blue-50/90 border border-blue-200/70 rounded-full shadow-sm hover:scale-105 transition-all duration-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Details */}
              <div className="space-y-6">

                {/* Enhanced Progress for Assignments */}
                {itemType === 'assignment' && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <div className={`w-5 h-5 ${config.bgColor} ${config.borderColor} border rounded-lg flex items-center justify-center shadow-sm`}>
                        <svg className={`w-3 h-3 ${config.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      Progress & Status
                    </h4>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                          <span>Completion Status</span>
                          <div className="flex items-center gap-2">
                            <span className={`${config.textColor} font-bold`}>{Math.round(progress)}%</span>
                            {progress > 0 && progress < 100 && (
                              <span className="text-xs text-gray-500 font-medium">
                                {isInProgress ? 'In Progress' : 'Not Started'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-gray-200/60 rounded-full h-3 shadow-inner border border-gray-300/30">
                            <div
                              className={`h-3 rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} transition-all duration-700 shadow-md relative overflow-hidden`}
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                            </div>
                          </div>
                          {/* Progress milestones */}
                          <div className="flex justify-between mt-1 text-xs text-gray-400">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                          <span className="text-xs font-medium text-gray-700">
                            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Form Preview or Attachments */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {itemType === 'form' ? 'Form Preview' : 'Attachments'}
                </h4>
                {itemType === 'form' ? (
                  <div className="space-y-2">
                    <FormThumbnail
                      form={item}
                      onPreview={onOpenContent}
                      isInstructor={isInstructor}
                      onEdit={onEdit}
                    />
                  </div>
                ) : Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {item.attachments.slice(0, 3).map((attachment, index) => {
                      // Enhanced DOCX thumbnail with AI narrator for DOCX files
                      if (attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        attachment.originalName?.toLowerCase().endsWith('.docx') ||
                        attachment.title?.toLowerCase().endsWith('.docx')) {
                        return (
                          <EnhancedDocxThumbnail
                            key={attachment._id || index}
                            attachment={attachment}
                            onPreview={onOpenContent}
                            className="mb-2"
                          />
                        );
                      }

                      // Custom compact PDF/PPTX thumbnail for other document types
                      if (attachment.mimeType === 'application/pdf' ||
                        attachment.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                        return (
                          <EnhancedPDFFileThumbnail
                            key={attachment._id || index}
                            attachment={attachment}
                            onPreview={onOpenContent}
                          />
                        );
                      }

                      // Keep simple buttons for other file types
                      const fileName = attachment.originalName || attachment.title || `File ${index + 1}`;
                      const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                      return (
                        <button
                          key={attachment._id || index}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenContent) onOpenContent(attachment);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group cursor-pointer"
                          title={`Click to preview ${fileName}`}
                        >
                          <svg className="w-3 h-3 text-gray-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                            {extension}
                          </span>
                        </button>
                      );
                    })}
                    {item.attachments.length > 3 && (
                      <div className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                        <span className="text-xs font-medium text-blue-700">+{item.attachments.length - 3}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No attachments
                  </div>
                )}
              </div>
            </div>

            {/* Compact Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="text-sm text-gray-500 font-medium">
                {itemType === 'assignment' && `Progress: ${Math.round(progress)}% • `}
                {item.attachments && item.attachments.length > 0 && `${item.attachments.length} file${item.attachments.length > 1 ? 's' : ''}`}
              </div>

              <div className="flex items-center gap-2">
                {isInstructor ? (
                  {/* Right-click context menu replaces dropdown */ }
                ) : (
                  <>
                    {!isCompleted && (
                      <button
                        onClick={onSubmit}
                        className={`px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-lg hover:opacity-90 transition-all duration-200`}
                      >
                        {isInProgress ? 'Continue' : 'Start'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Kanban view (compact cards)
    if (viewMode === 'kanban') {
      return (
        <div className={`bg-white border ${config.borderColor} rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-300/60 overflow-hidden`}>
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 ${config.bgColor} ${config.borderColor} border rounded-xl flex items-center justify-center shadow-md ${config.shadowColor} hover:scale-110 transition-all duration-300 flex-shrink-0`}>
              <div className={config.textColor}>
                {config.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-gray-900 line-clamp-2 mb-2 leading-tight hover:text-blue-700 transition-colors duration-200">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-sm`}>
                  {(item.type || 'assignment').charAt(0).toUpperCase() + (item.type || 'assignment').slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  Completed
                </span>
              )}
              {isInProgress && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-50/90 border border-yellow-200/70 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
                  In Progress
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar for Assignments */}
          {itemType === 'assignment' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
                <span>Progress</span>
                <span className={`${config.textColor} font-bold`}>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200/60 rounded-full h-2 shadow-inner">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} transition-all duration-500 shadow-sm`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Compact Attachments */}
          {Array.isArray(item.attachments) && item.attachments.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {item.attachments.slice(0, 2).map((attachment, index) => {
                  const fileName = attachment.originalName || attachment.title || `File ${index + 1}`;
                  const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <button
                      key={attachment._id || index}
                      onClick={() => onOpenContent ? onOpenContent(attachment) : null}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group cursor-pointer"
                      title={`Click to preview ${fileName}`}
                    >
                      <svg className="w-2 h-2 text-gray-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                        {extension}
                      </span>
                    </button>
                  );
                })}
                {item.attachments.length > 2 && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <span>+{item.attachments.length - 2}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compact Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 font-medium">
              {item.attachments && item.attachments.length > 0 && `${item.attachments.length} file${item.attachments.length > 1 ? 's' : ''}`}
            </div>

            <div className="flex items-center gap-2">
              {isInstructor ? (
                {/* Right-click context menu replaces dropdown */ }
              ) : (
                <>
                  {!isCompleted && (
                    <button
                      onClick={onSubmit}
                      className={`px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded hover:opacity-90 transition-all duration-200`}
                    >
                      {isInProgress ? 'Continue' : 'Start'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default view (original layout)
    return (
      <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                  <div className={config.textColor}>
                    {config.icon}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
                    {(item.type || 'assignment').charAt(0).toUpperCase() + (item.type || 'assignment').slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : ''}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 break-words mb-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Due: {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : 'No due date'}</span>
                </div>
              </div>
              {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.attachments.map((att) => (
                    <div key={att._id} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate max-w-[180px] text-gray-700" title={att.originalName || att.title}>
                        {att.originalName || att.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenContent ? onOpenContent(att) : setSelectedContent(att)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-150"
                        >
                          View
                        </button>
                        <a
                          href={att.filePath}
                          download
                          className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors duration-150"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {isInstructor ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Assigned
                  </span>
                  <button
                    onClick={onEdit}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors duration-150"
                    aria-label="Edit classwork"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors duration-150"
                    aria-label="Delete classwork"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ) : submission ? (
                <div className="flex flex-col items-end gap-2">
                  {submission.grade !== null && submission.grade !== undefined ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Graded
                      </span>
                      <span className={`text-lg font-bold ${submission.grade >= 90 ? 'text-green-600' :
                          submission.grade >= 70 ? 'text-blue-600' :
                            submission.grade >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                        }`}>
                        {submission.grade}%
                      </span>
                    </>
                  ) : item.dueDate && new Date(item.dueDate) < new Date() ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Submitted (Not Graded)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Submitted
                    </span>
                  )}
                </div>
              ) : item.dueDate && new Date(item.dueDate) < new Date() ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Missed
                </span>
              ) : (
                <button
                  onClick={onSubmit}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchAssignments = useCallback(async (isDragOperation = false) => {
    console.log('🔍 CLASSWORK: fetchAssignments called with courseDetails:', courseDetails?._id);
    if (!courseDetails) {
      console.log('🔍 CLASSWORK: No courseDetails available, returning early');
      return;
    }

    try {
      if (isDragOperation) {
        setIsDragLoading(true);
      } else {
        setLoading(true);
      }
      setError('');

      const res = await fetch(`/api/courses/${courseDetails._id}/classwork`);

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      let classwork = data.classwork || [];

      // Apply sorting
      if (sortBy === 'newest') {
        classwork.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sortBy === 'oldest') {
        classwork.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      } else if (sortBy === 'dueDate') {
        classwork.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
      } else if (sortBy === 'title') {
        classwork.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sortBy === 'mostUrgent') {
        const now = new Date();
        classwork.sort((a, b) => {
          const aDue = new Date(a.dueDate || '9999-12-31');
          const bDue = new Date(b.dueDate || '9999-12-31');
          const aUrgency = Math.ceil((aDue - now) / (1000 * 60 * 60 * 24));
          const bUrgency = Math.ceil((bDue - now) / (1000 * 60 * 60 * 24));
          return aUrgency - bUrgency;
        });
      }

      console.log('🔍 CLASSWORK: Fetched classwork:', classwork.length, 'items');
      console.log('🔍 CLASSWORK: First few items:', classwork.slice(0, 3).map(item => ({
        id: item._id,
        title: item.title,
        type: item.type,
        createdAt: item.createdAt
      })));

      // Store ALL classwork items - they already have a 'type' field
      console.log('🔍 CLASSWORK: Setting assignments state with', classwork.length, 'items');
      setAssignments(classwork);

      // Note: Submissions are synced from parent component via props in useEffect
      console.log('🔍 CLASSWORK: Current submissions count:', submissions.length, 'items');

    } catch (err) {
      console.error('🔍 CLASSWORK: Failed to fetch assignments:', err);
      setError(err.message);
      setAssignments([]);
    } finally {
      if (isDragOperation) {
        setIsDragLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [courseDetails, sortBy]);

  const fetchForms = useCallback(async () => {
    if (!courseDetails) return;

    try {
      const res = await fetch(`/api/courses/${courseDetails._id}/forms`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (res.ok) {
        const data = await res.json();
        console.log('🔍 FORMS: Fetched forms:', data.forms.length, 'items');
        setForms(data.forms || []);
      } else {
        console.error('🔍 FORMS: Failed to fetch forms, status:', res.status);
        setForms([]);
      }
    } catch (err) {
      console.warn('🔍 FORMS: Failed to fetch forms:', err);
      setForms([]);
    }
  }, [courseDetails]);

  useEffect(() => {
    console.log('🔍 CLASSWORK: useEffect triggered - courseDetails:', !!courseDetails, 'sortBy:', sortBy);
    if (courseDetails) {
      console.log('🔍 CLASSWORK: useEffect calling fetchAssignments');
      fetchAssignments();
      fetchForms();
    }
  }, [courseDetails, fetchAssignments, fetchForms, sortBy]);

  const handleDeleteClasswork = useCallback((classworkId) => {
    setConfirmationModal({ isOpen: true, classworkId });
  }, []);

  const executeDeleteClasswork = useCallback(async (classworkId) => {
    try {
      showToast('Deleting classwork...', 'info', 2000);

      const res = await fetch(`/api/classwork/${classworkId}`, {
        method: 'DELETE',
        credentials: 'include' // Use cookie-based authentication
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      console.log('🔍 CLASSWORK: Classwork deleted successfully, refreshing data');
      showToast('Classwork deleted successfully!', 'success');

      fetchAssignments(); // Refresh assignments list
      fetchForms(); // Also refresh forms list
    } catch (err) {
      setError(err.message);
      showToast('Failed to delete classwork. Please try again.', 'error');
      console.error('🔍 CLASSWORK: Failed to delete classwork:', err);
    }
  }, [fetchAssignments, fetchForms, showToast]);

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e, assignmentId) => {
    e.dataTransfer.setData('text/plain', assignmentId);
    e.dataTransfer.effectAllowed = 'move';

    // Add visual feedback
    const draggedElement = e.target.closest('.kanban-card');
    if (draggedElement) {
      draggedElement.classList.add('dragging');
    }
  }, []);

  const handleDragEnd = useCallback((e) => {
    // Reset visual feedback
    const draggedElement = e.target.closest('.kanban-card');
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
    }

    // Reset all drop zones
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.classList.remove('drag-over');
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Add visual feedback to drop zone
    const dropZone = e.target.closest('.kanban-column');
    if (dropZone && !dropZone.classList.contains('drag-over')) {
      // Reset all other drop zones first
      document.querySelectorAll('.kanban-column').forEach(column => {
        column.classList.remove('drag-over');
      });
      // Add drag-over class to current drop zone
      dropZone.classList.add('drag-over');
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only reset if we're actually leaving the drop zone
    const dropZone = e.target.closest('.kanban-column');
    if (dropZone) {
      const rect = dropZone.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      // Check if mouse is still within the drop zone bounds
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        dropZone.classList.remove('drag-over');
      }
    }
  }, []);

  const handleDrop = useCallback(async (e, targetStatus) => {
    e.preventDefault();

    // Reset visual feedback
    const dropZone = e.target.closest('.kanban-column');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }

    const assignmentId = e.dataTransfer.getData('text/plain');
    if (!assignmentId) {
      return;
    }

    console.log('🔄 Simple drag and drop - Assignment:', assignmentId, 'Target:', targetStatus);

    // Set loading state immediately
    setIsDragOperationInProgress(true);

    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token');
        setIsDragOperationInProgress(false);
        return;
      }

      // Get user ID from token
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (error) {
        console.error('❌ Invalid token');
        return;
      }

      // Find the assignment
      const assignment = assignments.find(a => a._id === assignmentId);
      if (!assignment) {
        console.error('❌ Assignment not found');
        return;
      }

      // Find existing submission
      const currentSubmission = submissions.find(s => String(s.assignment) === String(assignmentId));

      if (targetStatus === 'notStarted') {
        // Delete submission if it exists
        if (currentSubmission) {
          console.log('🔄 Deleting submission for Not Started');
          const deleteRes = await fetch(`/api/submissions/${currentSubmission._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (deleteRes.ok) {
            // Remove from local state
            setSubmissions(prev => prev.filter(s => String(s.assignment) !== String(assignmentId)));
            console.log('✅ Submission deleted - Local state updated optimistically');
          } else {
            console.error('❌ Failed to delete submission on server');
            throw new Error('Failed to delete submission');
          }
        }
      } else {
        // Create or update submission for In Progress or Completed
        const isCompleted = targetStatus === 'completed';
        const submissionData = {
          assignmentId,
          studentId: userId,
          status: isCompleted ? 'submitted' : 'draft',
          progress: isCompleted ? 100 : 0,
          content: currentSubmission?.content || '',
          attachments: currentSubmission?.attachments || []
        };

        if (currentSubmission) {
          // Update existing submission
          console.log('🔄 Updating existing submission');
          const updateRes = await fetch(`/api/submissions/${currentSubmission._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
          });

          if (updateRes.ok) {
            const updatedSubmission = await updateRes.json();
            // Update local state
            setSubmissions(prev => prev.map(s =>
              String(s.assignment) === String(assignmentId)
                ? { ...s, ...submissionData }
                : s
            ));
            console.log('✅ Submission updated - Local state updated optimistically');
          } else {
            console.error('❌ Failed to update submission on server');
            throw new Error('Failed to update submission');
          }
        } else {
          // Create new submission
          console.log('🔄 Creating new submission');
          const createRes = await fetch(`/api/courses/${courseDetails._id}/submissions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
          });

          if (createRes.ok) {
            const newSubmission = await createRes.json();
            // Add to local state
            setSubmissions(prev => [...prev, {
              _id: newSubmission.submission._id,
              assignment: assignmentId,
              ...submissionData
            }]);
            console.log('✅ Submission created - Local state updated optimistically');
          } else {
            console.error('❌ Failed to create submission on server');
            throw new Error('Failed to create submission');
          }
        }
      }

      // Optimistic UI update - only update local state
      console.log('🔄 Drag operation completed, updating local state optimistically');

    } catch (error) {
      console.error('❌ Drag and drop error:', error);
      // Rollback local state changes on error after a short delay
      console.log('🔄 Rolling back local state changes due to error in 2 seconds...');
      setTimeout(async () => {
        console.log('🔄 Rolling back local state changes now');
        await fetchAssignments(true);
      }, 2000);
    } finally {
      // Clear loading state
      setIsDragOperationInProgress(false);
    }
  }, [assignments, submissions, courseDetails._id]);

  return (
    <div className="space-y-8">
      {/* Context Menu now uses isolated DOM-based system */}
      {/* Enhanced Professional classwork management section */}
      <>
        {isInstructor && (
          <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 relative">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">Classwork</h2>
                  <p className="text-sm font-medium text-gray-600 mt-1">Create and manage assignments, quizzes, and materials</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg shadow-blue-500/25"
                  onClick={() => setIsCreateClassworkModalOpen(true)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          {/* Enhanced Header */}
          <div className="px-8 py-5 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              {/* Minimal Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                  <p className="text-sm text-gray-500 mt-0.5">All classwork and assignments</p>
                </div>

                {/* Essential Controls Only */}
                <div className="flex items-center gap-3">
                  {/* Compact Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search assignments, forms, and materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-64 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Minimal Filter Controls */}
              <div className="flex items-center gap-4">
                {/* Essential Filters Only */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Filter:</span>
                  <div className="flex items-center bg-gray-100 rounded-md p-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'assignment', label: 'Assignments' },
                      { key: 'form', label: 'Forms' },
                      { key: 'material', label: 'Materials' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-2.5 py-1 text-sm rounded transition-all duration-200 ${filter === key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due This Week Filter Only */}
                <button
                  onClick={() => {
                    setDateRange(dateRange === 'thisWeek' ? 'all' : 'thisWeek');
                    setStatusFilter('all');
                  }}
                  className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${dateRange === 'thisWeek'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Due This Week
                </button>
              </div>

            </div>
          </div>
          <div className={`p-10 smooth-layout-change ${isTransitioning ? 'layout-transition-active' : ''}`}>
            {(loading && !isDragOperationInProgress) ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100/60 rounded-2xl p-6 shadow-sm animate-pulse hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-20 text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-500"></div>
                  <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <svg className="w-12 h-12 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">No activities yet</h4>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed group-hover:text-gray-700 transition-colors duration-300">Activities will appear here once your instructor creates assignments, quizzes, or materials for this course.</p>
              </div>
            ) : (() => {
              const filtered = getFilteredAndSortedAssignments();

              if (filtered.length === 0) {
                return (
                  <div className="py-24 text-center group">
                    <div className="relative max-w-md mx-auto">
                      {/* Animated Background Elements */}
                      <div className="absolute inset-0 -z-10">
                        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-full opacity-60 animate-pulse"></div>
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                      </div>

                      {/* Main Icon */}
                      <div className="relative w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:via-indigo-200 group-hover:to-purple-200 transition-all duration-700 shadow-lg group-hover:shadow-xl transform group-hover:scale-110">
                        <div className="absolute inset-2 bg-white rounded-full shadow-inner"></div>
                        {searchQuery ? (
                          <svg className="relative w-12 h-12 text-amber-500 group-hover:text-amber-600 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        ) : (
                          <svg className="relative w-12 h-12 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}

                        {/* Floating Elements */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-200 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-200 rounded-full animate-pulse"></div>
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                          {searchQuery ? 'No Results Found' : 'Ready to Get Started?'}
                        </h3>
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                          {searchQuery
                            ? `No classwork matches "${searchQuery}". Try adjusting your search terms or filters.`
                            : isInstructor
                              ? 'Create your first assignment or form to engage with your students.'
                              : 'No assignments or forms have been posted yet. Check back later!'
                          }
                        </p>

                        {/* Action Buttons */}
                        {isInstructor && !searchQuery && (
                          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                            <button
                              onClick={() => setIsCreateClassworkModalOpen(true)}
                              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl group/btn"
                            >
                              <svg className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create Assignment
                            </button>
                            <button
                              onClick={handleCreateForm}
                              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl group/btn"
                            >
                              <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Create Form
                            </button>
                          </div>
                        )}

                        {/* Search Suggestions */}
                        {searchQuery && (
                          <div className="pt-4 space-y-2">
                            <button
                              onClick={() => setSearchQuery('')}
                              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200 hover:underline"
                            >
                              Clear search and show all classwork
                            </button>
                            <div className="text-xs text-gray-500">
                              Try searching for: assignments, forms, quizzes, or materials
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Render based on view mode
              switch (viewMode) {
                case 'grid':
                  return (
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 layout-transition-grid-to-list ${isTransitioning ? 'layout-transition-active' : ''}`}>
                      {filtered.map((item) => {
                        // Find submission for this assignment - check both assignment and assignmentId fields
                        const itemSubmission = item.itemType === 'assignment'
                          ? submissions.find(s => {
                            const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                            const match = String(submissionAssignmentId) === String(item._id);
                            if (match) {
                              console.log('🔍 MATCH: Found submission for assignment', item.title, ':', s);
                            }
                            return match;
                          })
                          : null;

                        if (item.itemType === 'assignment' && !itemSubmission) {
                          console.log('🔍 NO MATCH: No submission found for assignment', item.title, item._id);
                          console.log('🔍 Available submissions:', submissions.map(s => ({
                            assignment: s.assignment || s.assignmentId?._id || s.assignmentId,
                            status: s.status,
                            grade: s.grade
                          })));
                        }

                        return (
                          <EnhancedActivityCard
                            key={item._id}
                            assignment={item.itemType !== 'form' ? item : null}
                            form={item.itemType === 'form' ? item : null}
                            submission={itemSubmission}
                            isInstructor={isInstructor}
                            onEdit={() => {
                              if (item.itemType === 'form') {
                                handleEditForm(item);
                              } else {
                                setEditingClasswork(item);
                                setIsCreateClassworkModalOpen(true);
                              }
                            }}
                            onDelete={() => handleDeleteClasswork(item._id)}
                            onSubmit={() => { setSubmittingAssignmentId(item._id); setIsSubmitAssignmentModalOpen(true); }}
                            onOpenContent={onOpenContent}
                            viewMode="grid"
                          />
                        );
                      })}
                    </div>
                  );

                case 'list':
                  return (
                    <div className={`space-y-3 lg:space-y-4 layout-transition-list-to-grid ${isTransitioning ? 'layout-transition-active' : ''}`}>
                      {filtered.map((item) => {
                        const itemSubmission = item.itemType === 'assignment'
                          ? submissions.find(s => {
                            const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                            return String(submissionAssignmentId) === String(item._id);
                          })
                          : null;

                        return (
                          <EnhancedActivityCard
                            key={item._id}
                            assignment={item.itemType !== 'form' ? item : null}
                            form={item.itemType === 'form' ? item : null}
                            submission={itemSubmission}
                            isInstructor={isInstructor}
                            onEdit={() => {
                              if (item.itemType === 'form') {
                                handleEditForm(item);
                              } else {
                                setEditingClasswork(item);
                                setIsCreateClassworkModalOpen(true);
                              }
                            }}
                            onDelete={() => handleDeleteClasswork(item._id)}
                            onSubmit={() => { setSubmittingAssignmentId(item._id); setIsSubmitAssignmentModalOpen(true); }}
                            onOpenContent={onOpenContent}
                            viewMode="list"
                          />
                        );
                      })}
                    </div>
                  );

                case 'timeline':
                  return (
                    <div className={`relative layout-transition-to-timeline ${isTransitioning ? 'layout-transition-active' : ''}`}>
                      <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>
                      <div className="space-y-6 lg:space-y-8">
                        {filtered.map((item) => {
                          const itemSubmission = item.itemType === 'assignment'
                            ? submissions.find(s => {
                              const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                              return String(submissionAssignmentId) === String(item._id);
                            })
                            : null;

                          return (
                            <EnhancedActivityCard
                              key={item._id}
                              assignment={item.itemType !== 'form' ? item : null}
                              form={item.itemType === 'form' ? item : null}
                              submission={itemSubmission}
                              isInstructor={isInstructor}
                              onEdit={() => {
                                if (item.itemType === 'form') {
                                  handleEditForm(item);
                                } else {
                                  setEditingClasswork(item);
                                  setIsCreateClassworkModalOpen(true);
                                }
                              }}
                              onDelete={() => handleDeleteClasswork(item._id)}
                              onSubmit={() => { setSubmittingAssignmentId(item._id); setIsSubmitAssignmentModalOpen(true); }}
                              onOpenContent={onOpenContent}
                              viewMode="timeline"
                            />
                          );
                        })}
                      </div>
                    </div>
                  );

                case 'kanban':
                  return (
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 layout-transition-to-kanban ${isTransitioning ? 'layout-transition-active' : ''}`}>
                      {isDragLoading && (
                        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Updating...</span>
                        </div>
                      )}
                      {['notStarted', 'inProgress', 'completed'].map((status) => {
                        // Simplified filtering with better state synchronization
                        const statusAssignments = assignments.filter(assignment => {
                          const submission = submissions.find(s => {
                            const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                            return String(submissionAssignmentId) === String(assignment._id);
                          });

                          if (status === 'notStarted') {
                            return !submission; // No submission = Not Started
                          }
                          if (status === 'inProgress') {
                            return submission && submission.status === 'draft'; // Draft = In Progress
                          }
                          if (status === 'completed') {
                            return submission && submission.status === 'submitted' && submission.grade !== undefined && submission.grade !== null; // Submitted + graded = Completed
                          }
                          return false;
                        });

                        // Add forms to appropriate columns (forms are never "in progress" or "completed")
                        const statusForms = status === 'notStarted' ? forms : [];

                        return (
                          <div
                            key={status}
                            className={`kanban-column bg-gray-50/50 rounded-xl p-5 border border-gray-200/60 transition-all duration-200 ${isDragLoading ? 'opacity-75 pointer-events-none' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, status)}
                            style={{ minHeight: '200px' }}
                          >
                            <h3 className="text-base font-bold text-gray-800 mb-5 capitalize flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${status === 'notStarted' ? 'bg-gray-400' :
                                status === 'inProgress' ? 'bg-yellow-500 animate-pulse' :
                                  'bg-emerald-500'
                                }`}></div>
                              {status === 'inProgress' ? 'In Progress' :
                                status.replace(/([A-Z])/g, ' $1').trim()}
                              <span className="text-sm font-normal text-gray-500">({statusAssignments.length + (status === 'notStarted' ? statusForms.length : 0)})</span>
                            </h3>
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                              {statusAssignments.map((assignment) => {
                                const assignmentSubmission = submissions.find(s => {
                                  const submissionAssignmentId = s.assignment || s.assignmentId?._id || s.assignmentId;
                                  return String(submissionAssignmentId) === String(assignment._id);
                                });

                                return (
                                  <div
                                    key={assignment._id}
                                    className="kanban-card cursor-move"
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, assignment._id)}
                                    onDragEnd={handleDragEnd}
                                    style={{ pointerEvents: 'auto' }}
                                  >
                                    <EnhancedActivityCard
                                      assignment={assignment}
                                      submission={assignmentSubmission}
                                      isInstructor={isInstructor}
                                      onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                                      onDelete={() => handleDeleteClasswork(assignment._id)}
                                      onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                                      onOpenContent={onOpenContent}
                                      viewMode="kanban"
                                    />
                                  </div>
                                );
                              })}
                              {statusForms.map((form) => (
                                <div
                                  key={form._id}
                                  className="kanban-card cursor-move"
                                  draggable="true"
                                  onDragStart={(e) => handleDragStart(e, form._id)}
                                  onDragEnd={handleDragEnd}
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  <EnhancedActivityCard
                                    form={form}
                                    isInstructor={isInstructor}
                                    onEdit={() => {
                                      handleEditForm(form);
                                    }}
                                    onDelete={() => handleDeleteClasswork(form._id)}
                                    onOpenContent={onOpenContent}
                                    viewMode="kanban"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );

                default:
                  return (
                    <div className={`space-y-6 layout-transition-default ${isTransitioning ? 'layout-transition-active' : ''}`}>
                      {filtered.map((assignment) => (
                        <EnhancedActivityCard
                          key={assignment._id}
                          assignment={assignment}
                          submission={submissions.find(s => String(s.assignment) === String(assignment._id))}
                          isInstructor={isInstructor}
                          onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                          onDelete={() => handleDeleteClasswork(assignment._id)}
                          onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                          onOpenContent={onOpenContent}
                          viewMode="default"
                        />
                      ))}
                    </div>
                  );
              }
            })()}
          </div>
        </div>
      </>

      <CreateClassworkModal
        isOpen={isCreateClassworkModalOpen}
        onClose={() => {
          setIsCreateClassworkModalOpen(false);
          setEditingClasswork(null);
        }}
        courseId={courseDetails?._id}
        onClassworkCreated={onClassworkCreated || fetchAssignments}
        initialData={editingClasswork}
        type={classworkType}
      />

      {/* FormBuilderModal removed - now using full-page editor */}

      <SubmitAssignmentModal
        isOpen={isSubmitAssignmentModalOpen}
        onClose={() => setIsSubmitAssignmentModalOpen(false)}
        assignmentId={submittingAssignmentId}
        courseId={courseDetails?._id}
        onSubmissionSuccess={fetchAssignments}
      />

      {/* Teacher Assignment Detail Modal */}
      {isTeacherAssignmentModalOpen && selectedAssignment && (
        <TeacherAssignmentModal
          isOpen={isTeacherAssignmentModalOpen}
          onClose={() => {
            setIsTeacherAssignmentModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          courseId={courseDetails?._id}
          onUpdate={fetchAssignments}
        />
      )}

      {/* Student Assignment View Modal */}
      {isStudentAssignmentModalOpen && selectedAssignment && (
        <StudentAssignmentModal
          isOpen={isStudentAssignmentModalOpen}
          onClose={() => {
            setIsStudentAssignmentModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          courseId={courseDetails?._id}
          onSubmissionSuccess={fetchAssignments}
        />
      )}



      {/* Enhanced Drag and Drop Styles */}
      <style jsx>{`
        .kanban-card {
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          position: relative;
          touch-action: none;
        }

        .kanban-card::before {
          content: '⋮⋮';
          position: absolute;
          top: 8px;
          right: 8px;
          color: #9CA3AF;
          font-size: 12px;
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }

        .kanban-card:hover::before {
          opacity: 1;
        }

        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .kanban-card:hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          z-index: 10;
        }

        .kanban-card:hover::before {
          opacity: 1;
        }

        .kanban-card.dragging {
          opacity: 0.5;
          transform: rotate(2deg) scale(1.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          z-index: 1000;
        }

        .kanban-column {
          transition: all 0.2s ease;
          min-height: 200px;
        }

        .kanban-column.drag-over {
          background-color: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
          transform: scale(1.02);
        }

        .kanban-column.drag-over::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
          border-radius: inherit;
          pointer-events: none;
          z-index: 5;
        }

        /* Prevent text selection during drag */
        .kanban-card * {
          pointer-events: auto;
        }

        .kanban-card.dragging * {
          pointer-events: none;
        }

        /* Ensure drag works properly */
        .kanban-card {
          pointer-events: auto;
        }

        .kanban-card.dragging {
          pointer-events: none;
        }

        /* Fix for nested elements interfering with drag */
        .kanban-card > * {
          pointer-events: none;
        }

        .kanban-card {
          pointer-events: auto;
        }

        /* Enhanced drop zone indicator */
        .kanban-column.drag-over::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 2px dashed rgba(59, 130, 246, 0.6);
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.1);
          animation: pulse-drop-zone 1.5s ease-in-out infinite;
          z-index: 10;
        }

        @keyframes pulse-drop-zone {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.6;
          }
        }

        /* Smooth transitions for all interactive elements */
        .kanban-card,
        .kanban-column {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced focus states for accessibility */
        .kanban-card:focus {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }

        /* Loading state for cards during drag operations */
        .kanban-card.dragging {
          animation: drag-pulse 0.6s ease-in-out infinite alternate;
        }

        @keyframes drag-pulse {
          0% {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          100% {
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>

      {/* Toast Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 animate-in slide-in-from-right-5 ${toast.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800'
                : toast.type === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-800'
                  : 'bg-blue-50/90 border-blue-200 text-blue-800'
              }`}
          >
            {/* Toast Icon */}
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Toast Message */}
            <div className="flex-1 font-medium text-sm">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, classworkId: null })}
        onConfirm={() => {
          executeDeleteClasswork(confirmationModal.classworkId);
          setConfirmationModal({ isOpen: false, classworkId: null });
        }}
        title="Delete Classwork"
        message="Are you sure you want to delete this classwork? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={<TrashIcon className="w-6 h-6" />}
      />
    </div>
  );
};

export default ClassworkTab;
