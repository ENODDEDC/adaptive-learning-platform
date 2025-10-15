'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  MapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SequentialLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('steps');
  const [steps, setSteps] = useState([]);
  const [conceptFlow, setConceptFlow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const tabs = [
    {
      key: 'steps',
      name: 'Step Breakdown',
      icon: ListBulletIcon,
      description: 'Step-by-step content breakdown'
    },
    {
      key: 'flow',
      name: 'Concept Flow',
      icon: MapIcon,
      description: 'Concept progression mapping'
    }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateSequentialContent();
    }
  }, [isActive, docxContent]);

  const generateSequentialContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for sequential analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sequential-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSteps(result.steps || []);
        setConceptFlow(result.conceptFlow || []);
      } else {
        throw new Error(result.error || 'Failed to generate sequential content');
      }
    } catch (error) {
      console.error('Error generating sequential content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepBreakdown = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Analyzing content structure...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Analysis Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSequentialContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!steps || steps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Steps Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to analyze content structure</p>
          </div>
          <button
            onClick={generateSequentialContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Steps
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Step Breakdown Explanation */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ListBulletIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Step Breakdown for Sequential Learners</h3>
              <p className="text-green-800 text-sm leading-relaxed mb-3">
                This breaks the document into <strong>logical reading sections</strong> that you should follow in order.
                Sequential learners benefit from clear, structured progression through content.
              </p>
              <div className="text-xs text-green-700">
                <p><strong>Purpose:</strong> "Read section 1 → then section 2 → then section 3"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-sm text-gray-600">{currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
              {currentStep + 1}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{steps[currentStep]?.title}</h3>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-6">
            <div dangerouslySetInnerHTML={{ __html: formatStepContent(steps[currentStep]?.content) }} />
          </div>

          {steps[currentStep]?.keyTakeaways && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Key Takeaways
              </h4>
              <ul className="space-y-1">
                {steps[currentStep].keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {steps[currentStep]?.documentSection && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              📄 Document Section: {steps[currentStep].documentSection}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* All Steps Overview */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">All Steps</h4>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  index === currentStep
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`font-medium ${index === currentStep ? 'text-blue-900' : 'text-gray-900'}`}>
                    {step.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConceptFlow = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Mapping concept relationships...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Mapping Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSequentialContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!conceptFlow || conceptFlow.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Concept Flow Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to map concept relationships</p>
          </div>
          <button
            onClick={generateSequentialContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Concept Flow
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Concept Flow Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Concept Flow for Sequential Learners</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                This shows how <strong>concepts build on each other</strong> rather than just which sections to read.
                Sequential learners benefit from understanding these connections to see the logical progression of ideas.
              </p>
              <div className="text-xs text-blue-700">
                <p><strong>Purpose:</strong> "Learn Concept A → then Concept B (needs A) → then Concept C (needs A+B)"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Concept Flow Visualization */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-6">Concept Progression Flow</h4>

          <div className="space-y-4">
            {conceptFlow.map((stage, index) => (
              <div key={index} className="flex items-start gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {index < conceptFlow.length - 1 && (
                    <div className="w-0.5 h-16 bg-gradient-to-b from-purple-400 to-transparent mt-2"></div>
                  )}
                </div>

                {/* Concept Content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{stage.title}</h4>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{stage.description}</p>

                  {stage.keyPoints && stage.keyPoints.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">What you'll learn:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {stage.keyPoints.slice(0, 4).map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {stage.prerequisites && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-purple-600">Prerequisites: </span>
                      <span className="text-xs text-gray-600">{stage.prerequisites.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Complexity: {stage.difficulty}</span>
                  </div>

                  {stage.keyPoints && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Key Points:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {stage.keyPoints.slice(0, 3).map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {stage.documentReferences && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Document Sections:</p>
                      <p className="text-xs text-gray-600">{stage.documentReferences.join(', ')}</p>
                    </div>
                  )}

                  {stage.learningOutcome && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs font-medium text-green-800">🎯 Learning Outcome:</p>
                      <p className="text-xs text-green-700">{stage.learningOutcome}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Concept Dependencies */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Concept Dependencies</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conceptFlow.map((stage, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{stage.title}</span>
                </div>
                {stage.prerequisites && stage.prerequisites.length > 0 ? (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Builds on:</span> {stage.prerequisites.join(', ')}
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-medium">Foundation concept</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const formatStepContent = (content) => {
    if (!content) return '';
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n/g, '<br>');
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10001] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            title="Back to document"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sequential Learning</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateSequentialContent}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
            title="Regenerate sequential analysis"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Generate</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Selector with Explanations */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Purpose Explanation */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Sequential learners benefit from understanding both <strong>content order</strong> and <strong>concept relationships</strong>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === activeTab;

              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'steps' ? 'Shows which sections to read in order' : 'Shows how concepts connect and build on each other'}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === 'steps' && renderStepBreakdown()}
          {activeTab === 'flow' && renderConceptFlow()}
        </div>
      </div>
    </div>
  );
};

export default SequentialLearning;