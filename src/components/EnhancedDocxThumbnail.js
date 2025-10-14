'use client';

import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  AcademicCapIcon, 
  SpeakerWaveIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import AITutorModal from './AITutorModal';

const EnhancedDocxThumbnail = ({ attachment, onPreview, className = "" }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [docxContent, setDocxContent] = useState('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // Helper function to detect DOCX files
  const isDocxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           attachment?.originalName?.toLowerCase().endsWith('.docx') ||
           attachment?.title?.toLowerCase().endsWith('.docx');
  };

  useEffect(() => {
    // Auto-generate thumbnail if it doesn't exist
    if (!thumbnailUrl && !isGeneratingThumbnail && isDocxFile(attachment)) {
      generateDocxThumbnail();
    }
  }, [thumbnailUrl, attachment]);

  const generateDocxThumbnail = async () => {
    if (isGeneratingThumbnail) return;

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
        }
      }
    } catch (error) {
      console.error('❌ Error generating DOCX thumbnail:', error);
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

  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview(attachment);
    }
  };

  const fileName = attachment.originalName || attachment.title || 'Document';

  if (!isDocxFile(attachment)) {
    return null; // Only render for DOCX files
  }

  return (
    <>
      <div className={`w-full group cursor-pointer ${className}`}>
        {/* DOCX Thumbnail Container */}
        <div className="relative w-full aspect-[4/3] bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 mb-3">
          {isGeneratingThumbnail ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm text-blue-700 font-medium">Generating preview...</span>
            </div>
          ) : thumbnailUrl ? (
            <>
              <iframe
                src={`${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width`}
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
              <div className="absolute top-2 right-2 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm bg-blue-500">
                DOCX
              </div>



              {/* Hover Overlay with Actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-3">
                  {/* Preview Button */}
                  <button
                    onClick={handlePreviewClick}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg hover:bg-white"
                    title="Preview Document"
                  >
                    <EyeIcon className="w-6 h-6 text-blue-600" />
                  </button>


                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <DocumentTextIcon className="w-12 h-12 text-blue-400 mb-3" />
              <span className="text-sm text-blue-600 font-medium">DOCX Document</span>
              <span className="text-xs text-blue-500 mt-1">Click to preview</span>
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
              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Word Document'}
            </p>

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

      {/* AI Narrator Modal */}
      <AITutorModal
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        docxContent={docxContent}
        fileName={fileName}
      />
    </>
  );
};

export default EnhancedDocxThumbnail;