'use client';

import React, { useEffect, useState } from 'react';
import { DocumentIcon, VideoCameraIcon, SpeakerWaveIcon, EyeIcon, PhotographIcon } from '@heroicons/react/24/outline';
import ContentViewer from './ContentViewer.client';

const AttachmentPreview = ({ attachment }) => {
  const [showViewer, setShowViewer] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(attachment.thumbnailUrl);

  useEffect(() => {
    setThumbnailUrl(attachment.thumbnailUrl);
  }, [attachment.thumbnailUrl]);

  const isVideo = attachment.contentType === 'video';
  const isAudio = attachment.contentType === 'audio';
  const isDocument = attachment.contentType === 'document';
  const isDocx = attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';



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
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={`${attachment.title} thumbnail`} className="w-16 h-10 object-cover rounded-md bg-white border" />
          ) : (
            <div className="w-12 h-10 flex-shrink-0 bg-white rounded-md border flex items-center justify-center">
              <DocumentIcon className="w-6 h-6 text-blue-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{attachment.title}</p>
            <p className="text-sm text-slate-500">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowViewer(true)}
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
      {showViewer && isDocument && (
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