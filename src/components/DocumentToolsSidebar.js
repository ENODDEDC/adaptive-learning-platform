'use client';

import React, { useState } from 'react';
import { 
  AcademicCapIcon,
  PencilSquareIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const DocumentToolsSidebar = ({ 
  onAITutorClick, 
  onNotesClick,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`absolute top-4 right-4 z-40 ${className}`}>
      <div className="flex items-center">
        {/* Main Toolbar */}
        <div className={`bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-auto'
        }`}>
          {/* Header */}
          <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              {isExpanded && (
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Document Tools</span>
                </div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200 rounded transition-colors ml-auto"
                title={isExpanded ? "Collapse toolbar" : "Expand toolbar"}
              >
                {isExpanded ? (
                  <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                ) : (
                  <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Tools */}
          {isExpanded ? (
            <div className="p-3 space-y-3">
              {/* AI Narrator */}
              <div className="group">
                <button
                  onClick={onAITutorClick}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                  title="AI Narrator - Listen with AI assistance"
                >
                  <SparklesIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">AI Narrator</div>
                    <div className="text-xs opacity-90">Listen with AI assistance</div>
                  </div>
                  <AcademicCapIcon className="w-5 h-5 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                </button>
              </div>

              {/* Notes */}
              <div className="group">
                <button
                  onClick={onNotesClick}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200"
                  title="Notes - View and manage notes"
                >
                  <PencilSquareIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Notes</div>
                    <div className="text-xs opacity-90">View and manage notes</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 flex gap-2">
              {/* AI Narrator Icon */}
              <button
                onClick={onAITutorClick}
                className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                title="AI Narrator - Listen with AI assistance"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>

              {/* Notes Icon */}
              <button
                onClick={onNotesClick}
                className="p-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200"
                title="Notes - View and manage notes"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentToolsSidebar;