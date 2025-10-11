'use client';

import React, { useState, useEffect } from 'react';
import ContentViewer from './ContentViewer.client';

const SidePanelDocumentViewer = ({ 
  isOpen, 
  onClose, 
  document, 
  className = "" 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>


      {/* Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[35%] bg-white shadow-2xl transition-all duration-300 ease-in-out border-l border-gray-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
        style={{ zIndex: 9999 }}
      >
        {/* Panel Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 min-h-[80px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Document Preview</h3>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                {document?.title || document?.originalName || 'Document'}
              </p>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Close preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Document Content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
          {document && (
            <div className="h-full w-full">
              {/* PDF Documents */}
              {document.fileType === 'pdf' && (
                <iframe
                  src={document.filePath}
                  className="w-full h-full border-0"
                  title={document.title || document.originalName}
                />
              )}
              
              {/* DOCX Documents */}
              {document.fileType === 'docx' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">DOCX Document</h3>
                  <p className="text-sm text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={document.filePath}
                    download={document.originalName || document.title}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Document
                  </a>
                </div>
              )}
              
              {/* PPTX Documents */}
              {document.fileType === 'pptx' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">PowerPoint Presentation</h3>
                  <p className="text-sm text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={document.filePath}
                    download={document.originalName || document.title}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Presentation
                  </a>
                </div>
              )}
              
              {/* Other file types */}
              {!['pdf', 'docx', 'pptx'].includes(document.fileType) && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Document</h3>
                  <p className="text-sm text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={document.filePath}
                    download={document.originalName || document.title}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Footer - Document Actions */}
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 shadow-lg min-h-[70px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate max-w-[150px]">
                {document?.title || document?.originalName || 'Document'}
              </span>
              {document?.fileSize && (
                <>
                  <span>•</span>
                  <span>{Math.round(document.fileSize / 1024)} KB</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Download Button */}
              {document?.filePath && (
                <a
                  href={document.filePath}
                  download={document.originalName || document.title}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              )}
              
              {/* Full Screen Button */}
              <button
                onClick={() => {
                  // Open in full modal
                  handleClose();
                  // You can add logic here to open in full modal if needed
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Full Screen
              </button>
            </div>
          </div>
        </div>
      </div>


    </>
  );
};

export default SidePanelDocumentViewer;