'use client';

import { useState } from 'react';
import PowerPointViewerWrapper from './PowerPointViewerWrapper';

const PowerPointViewerDemo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewerMode, setViewerMode] = useState('auto');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Sample PowerPoint files for testing
  const sampleFiles = [
    {
      path: '/uploads/sample-presentation.pptx',
      name: 'Sample Presentation.pptx',
      description: 'A sample PowerPoint presentation'
    },
    {
      path: '/uploads/business-plan.ppt',
      name: 'Business Plan.ppt',
      description: 'Business plan presentation (PPT format)'
    }
  ];

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          PowerPoint Viewer Demo
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Viewer Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viewer Mode
              </label>
              <select
                value={viewerMode}
                onChange={(e) => setViewerMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="office-online">Office Online Only</option>
                <option value="image-based">Image-based Only</option>
                <option value="mobile">Mobile Optimized</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Sample Presentations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleFiles.map((file, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0V1m10 3V1m0 3l1 1v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5l1-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-600">{file.description}</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Presentation
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Features Demonstrated:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Microsoft Office Online integration with iframe</li>
            <li>• Automatic fallback to image-based viewer</li>
            <li>• Mobile-optimized touch navigation</li>
            <li>• Error handling and user feedback</li>
            <li>• Viewer customization options</li>
            <li>• Progressive enhancement approach</li>
            <li>• Security considerations with signed URLs</li>
          </ul>
        </div>
      </div>

      {/* Viewer Modal */}
      {isViewerOpen && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden">
            <PowerPointViewerWrapper
              filePath={selectedFile.path}
              fileName={selectedFile.name}
              onClose={handleCloseViewer}
              preferredViewer={viewerMode}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerPointViewerDemo;