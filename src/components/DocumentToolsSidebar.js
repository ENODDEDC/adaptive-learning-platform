'use client';

import React, { useState } from 'react';
import { 
  AcademicCapIcon,
  PencilSquareIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  GlobeAltIcon,
  BeakerIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const DocumentToolsSidebar = ({
  onAITutorClick,
  onNotesClick,
  onVisualContentClick,
  onSequentialLearningClick,
  onGlobalLearningClick,
  onSensingLearningClick,
  onIntuitiveLearningClick,
  isExtractingContent = false,
  isAINarratorLoading = false,
  isSequentialLearningLoading = false,
  isGlobalLearningLoading = false,
  isSensingLearningLoading = false,
  isIntuitiveLearningLoading = false,
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
                  disabled={isAINarratorLoading}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                  title="AI Narrator - Listen with AI assistance"
                >
                  {isAINarratorLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <SparklesIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">AI Narrator</div>
                    <div className="text-xs opacity-90">
                      {isAINarratorLoading ? 'Analyzing content...' : 'Listen with AI assistance'}
                    </div>
                  </div>
                  <AcademicCapIcon className="w-5 h-5 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                </button>
              </div>

              {/* Visual Learning */}
              <div className="group">
                <button
                  onClick={onVisualContentClick}
                  disabled={isExtractingContent}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                  title="Visual Learning - Transform documents into visual formats"
                >
                  {isExtractingContent ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <PhotoIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Visual Learning</div>
                    <div className="text-xs opacity-90">
                      {isExtractingContent ? 'Processing document...' : 'Transform into visual formats'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Sequential Learning */}
              <div className="group">
                <button
                  onClick={onSequentialLearningClick}
                  disabled={isSequentialLearningLoading}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
                  title="Sequential Learning - Step-by-step breakdown and concept progression"
                >
                  {isSequentialLearningLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Sequential Learning</div>
                    <div className="text-xs opacity-90">
                      {isSequentialLearningLoading ? 'Processing document...' : 'Step-by-step progression'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Global Learning */}
              <div className="group">
                <button
                  onClick={onGlobalLearningClick}
                  disabled={isGlobalLearningLoading}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                  title="Global Learning - Big picture view and interconnections"
                >
                  {isGlobalLearningLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Global Learning</div>
                    <div className="text-xs opacity-90">
                      {isGlobalLearningLoading ? 'Processing document...' : 'Big picture & interconnections'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Sensing Learning */}
              <div className="group">
                <button
                  onClick={onSensingLearningClick}
                  disabled={isSensingLearningLoading}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
                  title="Hands-On Lab - Interactive experiments and practical challenges"
                >
                  {isSensingLearningLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <BeakerIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Hands-On Lab</div>
                    <div className="text-xs opacity-90">
                      {isSensingLearningLoading ? 'Processing document...' : 'Interactive experiments & challenges'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Intuitive Learning */}
              <div className="group">
                <button
                  onClick={onIntuitiveLearningClick}
                  disabled={isIntuitiveLearningLoading}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                  title="Concept Constellation - Pattern discovery and abstract connections"
                >
                  {isIntuitiveLearningLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  ) : (
                    <EyeIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Concept Constellation</div>
                    <div className="text-xs opacity-90">
                      {isIntuitiveLearningLoading ? 'Processing document...' : 'Pattern discovery & connections'}
                    </div>
                  </div>
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
                disabled={isAINarratorLoading}
                className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                title={isAINarratorLoading ? "AI Narrator - Analyzing content..." : "AI Narrator - Listen with AI assistance"}
              >
                {isAINarratorLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
              </button>

              {/* Visual Learning Icon */}
              <button
                onClick={onVisualContentClick}
                disabled={isExtractingContent}
                className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                title={isExtractingContent ? "Processing document..." : "Visual Learning - Transform into visual formats"}
              >
                {isExtractingContent ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PhotoIcon className="w-5 h-5" />
                )}
              </button>

              {/* Sequential Learning Icon */}
              <button
                onClick={onSequentialLearningClick}
                disabled={isSequentialLearningLoading}
                className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
                title={isSequentialLearningLoading ? "Sequential Learning - Processing document..." : "Sequential Learning - Step-by-step progression"}
              >
                {isSequentialLearningLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Global Learning Icon */}
              <button
                onClick={onGlobalLearningClick}
                disabled={isGlobalLearningLoading}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                title={isGlobalLearningLoading ? "Global Learning - Processing document..." : "Global Learning - Big picture & interconnections"}
              >
                {isGlobalLearningLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <GlobeAltIcon className="w-5 h-5" />
                )}
              </button>

              {/* Sensing Learning Icon */}
              <button
                onClick={onSensingLearningClick}
                disabled={isSensingLearningLoading}
                className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
                title={isSensingLearningLoading ? "Hands-On Lab - Processing document..." : "Hands-On Lab - Interactive experiments & challenges"}
              >
                {isSensingLearningLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <BeakerIcon className="w-5 h-5" />
                )}
              </button>

              {/* Intuitive Learning Icon */}
              <button
                onClick={onIntuitiveLearningClick}
                disabled={isIntuitiveLearningLoading}
                className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                title={isIntuitiveLearningLoading ? "Concept Constellation - Processing document..." : "Concept Constellation - Pattern discovery & connections"}
              >
                {isIntuitiveLearningLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
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