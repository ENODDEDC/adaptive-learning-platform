'use client';

import React, { useEffect, useState } from 'react';
import { DocumentIcon, VideoCameraIcon, SpeakerWaveIcon, EyeIcon, PhotographIcon } from '@heroicons/react/24/outline';
import ContentViewer from './ContentViewer.client';

const AttachmentPreview = ({ attachment, onPreview }) => {
  const [showViewer, setShowViewer] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  useEffect(() => {
    setThumbnailUrl(attachment.thumbnailUrl);

    // Auto-generate PDF thumbnail if it doesn't exist
    if (attachment.mimeType === 'application/pdf' && !attachment.thumbnailUrl && !isGeneratingThumbnail) {
      generatePdfThumbnail();
    }

    // Auto-generate DOCX thumbnail if it doesn't exist
    if (isDocxFile(attachment) && !attachment.thumbnailUrl && !isGeneratingThumbnail) {
      generateDocxThumbnail();
    }

    // Auto-generate PPTX thumbnail if it doesn't exist
    if (isPptxFile(attachment) && !attachment.thumbnailUrl && !isGeneratingThumbnail) {
      generatePptxThumbnail();
    }
  }, [attachment.thumbnailUrl, attachment.mimeType]);

  const generatePdfThumbnail = async () => {
    if (isGeneratingThumbnail) return;
    
    setIsGeneratingThumbnail(true);
    console.log('🖼️ Generating PDF thumbnail for:', attachment.title);
    console.log('📋 Full attachment object:', attachment);
    console.log('📋 Attachment data:', {
      id: attachment._id,
      cloudStorageKey: attachment.cloudStorage?.key,
      filePath: attachment.filePath,
      mimeType: attachment.mimeType,
      hasCloudStorage: !!attachment.cloudStorage,
      hasFilePath: !!attachment.filePath
    });
    
    // Validate required data
    if (!attachment.cloudStorage?.key && !attachment.filePath) {
      console.error('❌ Missing both cloudStorage key and filePath');
      setIsGeneratingThumbnail(false);
      return;
    }
    
    if (!attachment._id) {
      console.warn('⚠️ Missing attachment ID - database won\'t be updated');
    }
    
    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id // Pass the content ID to update the database
      };
      
      console.log('📤 Sending request to /api/pdf-thumbnail:', requestBody);
      
      const response = await fetch('/api/pdf-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ PDF thumbnail generated successfully:', result);
        
        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
          console.log('🖼️ Thumbnail URL set:', result.thumbnailUrl);
          
          // Force a re-render to show the new thumbnail
          setTimeout(() => {
            console.log('🔄 Forcing component re-render for thumbnail display');
          }, 100);
        } else {
          console.warn('⚠️ No thumbnail URL in response:', result);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = await response.text();
        }
        console.error('❌ Failed to generate PDF thumbnail:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
      }
    } catch (error) {
      console.error('❌ Error generating PDF thumbnail:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - check if server is running');
      }
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateDocxThumbnail = async () => {
    if (isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    console.log('🖼️ Generating DOCX thumbnail for:', attachment.title);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      console.log('📤 Sending DOCX thumbnail request:', requestBody);

      const response = await fetch('/api/docx-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 DOCX thumbnail response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ DOCX thumbnail generated successfully:', result);

        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
          console.log('🖼️ DOCX thumbnail URL set:', result.thumbnailUrl);
        } else {
          console.warn('⚠️ No thumbnail URL in DOCX response:', result);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = await response.text();
        }
        console.error('❌ Failed to generate DOCX thumbnail:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
      }
    } catch (error) {
      console.error('❌ Error generating DOCX thumbnail:', error);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generatePptxThumbnail = async () => {
    if (isGeneratingThumbnail) return;

    setIsGeneratingThumbnail(true);
    console.log('🖼️ Generating PPTX thumbnail for:', attachment.title);

    try {
      const requestBody = {
        fileKey: attachment.cloudStorage?.key,
        filePath: attachment.filePath,
        contentId: attachment._id
      };

      console.log('📤 Sending PPTX thumbnail request:', requestBody);

      const response = await fetch('/api/pptx-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 PPTX thumbnail response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ PPTX thumbnail generated successfully:', result);

        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
          console.log('🖼️ PPTX thumbnail URL set:', result.thumbnailUrl);
        } else {
          console.warn('⚠️ No thumbnail URL in PPTX response:', result);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = await response.text();
        }
        console.error('❌ Failed to generate PPTX thumbnail:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
      }
    } catch (error) {
      console.error('❌ Error generating PPTX thumbnail:', error);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const isVideo = attachment?.contentType === 'video' || attachment?.mimeType?.startsWith('video/');
  const isAudio = attachment?.contentType === 'audio' || attachment?.mimeType?.startsWith('audio/');
  const isDocument = attachment?.contentType === 'document' || attachment?.mimeType?.startsWith('application/');
  const isDocx = attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isImage = attachment?.mimeType?.startsWith('image/');
  const isPdf = attachment?.mimeType === 'application/pdf';

  // Helper function to detect DOCX files
  const isDocxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           attachment?.originalName?.toLowerCase().endsWith('.docx') ||
           attachment?.title?.toLowerCase().endsWith('.docx');
  };

  // Helper function to detect PPTX files
  const isPptxFile = (attachment) => {
    return attachment?.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
           attachment?.originalName?.toLowerCase().endsWith('.pptx') ||
           attachment?.title?.toLowerCase().endsWith('.pptx');
  };
  
  const getFileTypeIcon = () => {
    if (isVideo) return '🎥';
    if (isAudio) return '🎵';
    if (isImage) return '🖼️';
    if (isPdf) return '📄';
    if (isDocx) return '📝';
    if (isDocument) return '📄';
    return '📄';
  };

  const getFileTypeLabel = () => {
    if (isVideo) return 'Video';
    if (isAudio) return 'Audio';
    if (isImage) return 'Image';
    if (isPdf) return 'PDF';
    if (isDocx) return 'Word Document';
    if (isDocument) return 'Document';
    return 'File';
  };



  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderAttachment = () => {
    if (isVideo) {
      return (
        <video controls className="w-full rounded-lg max-h-96 bg-black" src={attachment.filePath}>
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="p-4 bg-slate-50 rounded-lg">
          <audio controls className="w-full" src={attachment.filePath}>
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // Default to document/file display
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          {isGeneratingThumbnail ? (
            // Loading state for PDF thumbnail generation
            <div className="relative w-20 h-14 bg-gray-100 rounded-md border shadow-sm overflow-hidden flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                <span className="text-xs text-gray-500">PDF</span>
              </div>
            </div>
          ) : thumbnailUrl ? (
            // PDF/DOCX Thumbnail using PDF.js (same approach as PowerPoint viewer)
            <div className="relative w-20 h-14 bg-white rounded-md border shadow-sm overflow-hidden">
              <iframe
                src={thumbnailUrl.startsWith('http') ? `${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true` : `${window.location.origin}${thumbnailUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none&zoom=page-width&disableTextLayer=true&disableRange=true&disableAutoFetch=true`}
                className="w-full h-full pointer-events-none border-0"
                title={`${attachment.title} thumbnail`}
                style={{
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                  width: '400%',
                  height: '400%'
                }}
                onLoad={() => console.log('🖼️ Thumbnail iframe loaded successfully')}
                onError={() => console.error('❌ Thumbnail iframe failed to load')}
              />
              {/* File Type Badge */}
              {isPdf && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📄</span>
                </div>
              )}
              {isDocx && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📝</span>
                </div>
              )}
              {isPptxFile(attachment) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📊</span>
                </div>
              )}
            </div>
          ) : isPdf && attachment.filePath ? (
            // Fallback: Try to use original PDF if no thumbnail yet
            <div className="relative w-20 h-14 bg-white rounded-md border shadow-sm overflow-hidden">
              <iframe
                src={`${window.location.origin}${attachment.filePath}#page=1&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&zoom=50`}
                className="w-full h-full pointer-events-none border-0"
                title={`${attachment.title} thumbnail`}
                style={{
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                  width: '400%',
                  height: '400%'
                }}
              />
              {/* PDF Badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">📄</span>
              </div>
            </div>
          ) : thumbnailUrl ? (
            // Regular image thumbnail
            <div className="relative">
              <img 
                src={thumbnailUrl} 
                alt={`${attachment.title} thumbnail`} 
                className="w-20 h-14 object-cover rounded-md bg-white border shadow-sm" 
              />
              {isPdf && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📄</span>
                </div>
              )}
            </div>
          ) : (
            // Fallback icon
            <div className="w-20 h-14 flex-shrink-0 bg-white rounded-md border flex items-center justify-center">
              {isPdf ? (
                <div className="flex flex-col items-center">
                  <DocumentIcon className="w-6 h-6 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">PDF</span>
                </div>
              ) : (
                <DocumentIcon className="w-6 h-6 text-blue-500" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{attachment.title}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{getFileTypeIcon()}</span>
              <span>{getFileTypeLabel()}</span>
              <span>•</span>
              <span>{formatFileSize(attachment.fileSize)}</span>
              {isGeneratingThumbnail && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 text-xs">Generating preview...</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (typeof onPreview === 'function') {
              onPreview(attachment);
            } else {
              setShowViewer(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border rounded-lg hover:bg-slate-50 flex-shrink-0"
        >
          <EyeIcon className="w-5 h-5" />
          <span>Preview</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="mt-4">
        {renderAttachment()}
      </div>
      {showViewer && (
        <ContentViewer
          content={attachment}
          onClose={() => setShowViewer(false)}
          isModal={true}
        />
      )}
    </>
  );
};

export default AttachmentPreview;