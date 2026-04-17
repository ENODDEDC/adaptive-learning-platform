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
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const SequentialLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('steps');
  const [steps, setSteps] = useState([]);
  const [conceptFlow, setConceptFlow] = useState([]);

  // Automatic time tracking for ML classification
  useLearningModeTracking('sequentialLearning', isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepTipsToast, setShowStepTipsToast] = useState(false);
  const [showFlowTipsToast, setShowFlowTipsToast] = useState(false);

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
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'sequential', fileName });
    }
  }, [isActive, docxContent]);

  useEffect(() => {
    if (!isActive) return;
    try {
      const seen = sessionStorage.getItem('sequential_step_tips_seen') === 'true';
      if (!seen) {
        setShowStepTipsToast(true);
        sessionStorage.setItem('sequential_step_tips_seen', 'true');
      }
    } catch {
      setShowStepTipsToast(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (!showStepTipsToast) return;
    const timer = setTimeout(() => setShowStepTipsToast(false), 8000);
    return () => clearTimeout(timer);
  }, [showStepTipsToast]);

  useEffect(() => {
    if (!isActive || activeTab !== 'flow') return;
    try {
      const seen = sessionStorage.getItem('sequential_flow_tips_seen') === 'true';
      if (!seen) {
        setShowFlowTipsToast(true);
        sessionStorage.setItem('sequential_flow_tips_seen', 'true');
      }
    } catch {
      setShowFlowTipsToast(true);
    }
  }, [isActive, activeTab]);

  useEffect(() => {
    if (!showFlowTipsToast) return;
    const timer = setTimeout(() => setShowFlowTipsToast(false), 8000);
    return () => clearTimeout(timer);
  }, [showFlowTipsToast]);

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
        <div className="flex justify-end">
          <button
            onClick={() => setShowStepTipsToast(true)}
            className="text-xs text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2"
          >
            Show study tips
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Progress Indicator */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                <span className="text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentStep(index);
                      trackBehavior('step_navigation', { mode: 'sequential', direction: 'chip-jump', step: index });
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                      index === currentStep
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                    Step {currentStep + 1}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{steps[currentStep]?.title}</h3>
                </div>
                {steps[currentStep]?.estimatedTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                    <ClockIcon className="w-4 h-4" />
                    <span>{steps[currentStep].estimatedTime}</span>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">How to study this step</p>
                <p className="text-sm text-gray-700">Read the explanation, then review takeaways before moving to the next step.</p>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-6 bg-white">
                <div dangerouslySetInnerHTML={{ __html: formatStepContent(steps[currentStep]?.content) }} />
              </div>

              {steps[currentStep]?.keyTakeaways && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Takeaways</h4>
                  <ul className="space-y-1.5">
                    {steps[currentStep].keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {steps[currentStep]?.documentSection && (
                <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mb-6 border border-gray-200">
                  Document Section: {steps[currentStep].documentSection}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-5">
                <button
                  onClick={() => {
                    const newStep = Math.max(0, currentStep - 1);
                    setCurrentStep(newStep);
                    trackBehavior('step_navigation', { mode: 'sequential', direction: 'previous', step: newStep });
                  }}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={() => {
                    const newStep = Math.min(steps.length - 1, currentStep + 1);
                    setCurrentStep(newStep);
                    trackBehavior('step_navigation', { mode: 'sequential', direction: 'next', step: newStep });
                  }}
                  disabled={currentStep === steps.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* All Steps Overview */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-lg lg:sticky lg:top-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">All Steps</h4>
              <div className="space-y-2.5">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setCurrentStep(index);
                      trackBehavior('step_navigation', { mode: 'sequential', direction: 'jump', step: index });
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      index === currentStep
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        index === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium leading-snug ${index === currentStep ? 'text-blue-900' : 'text-gray-900'}`}>
                          {step.title}
                        </p>
                        {step.estimatedTime && (
                          <p className="text-xs text-gray-500 mt-1">{step.estimatedTime}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
        <div className="flex justify-end">
          <button
            onClick={() => setShowFlowTipsToast(true)}
            className="text-xs text-purple-700 hover:text-purple-800 font-medium underline underline-offset-2"
          >
            Show concept tips
          </button>
        </div>

        {/* Concept Flow Visualization */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-5">Concept Progression Flow</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {conceptFlow.map((stage, index) => (
              <article
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 shrink-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900 leading-snug">{stage.title}</h4>
                  </div>
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-100 border border-purple-200 px-2 py-1 rounded-full shrink-0">
                    {stage.difficulty || 'N/A'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">{stage.description}</p>

                {stage.prerequisites?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Prerequisites</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.prerequisites.map((item, i) => (
                        <span key={i} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {stage.keyPoints?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">What you will learn</p>
                    <ul className="space-y-1.5">
                      {stage.keyPoints.slice(0, 4).map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.documentReferences?.length > 0 && (
                  <p className="text-[11px] text-gray-600 mb-2">
                    <span className="font-semibold text-gray-700">Document sections:</span> {stage.documentReferences.join(', ')}
                  </p>
                )}

                {stage.learningOutcome && (
                  <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-[11px] font-semibold text-green-800 mb-0.5">Learning outcome</p>
                    <p className="text-xs text-green-700">{stage.learningOutcome}</p>
                  </div>
                )}
              </article>
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
    const hasHtmlTags = /<\s*(p|ul|ol|li|h1|h2|h3|h4|div|strong|em|br)\b/i.test(content);

    // If content is already HTML from the generator, do NOT inject extra <br>
    // tags; just normalize excessive whitespace between tags.
    if (hasHtmlTags) {
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/>\s*\n\s*</g, '><');
    }

    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/<li class="ml-4 mb-1">\s*<\/li>/g, '')
      .replace(/(<br>\s*){3,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10001] flex flex-col" style={{ paddingTop: document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0' }}>
      {showStepTipsToast && (
        <div className="fixed left-4 top-24 z-[10020] w-80 max-w-[calc(100vw-2rem)]">
          <div className="rounded-xl border border-blue-200 bg-white shadow-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ListBulletIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Step Breakdown Tips</h4>
                  <p className="text-xs text-gray-700 mb-2">Follow this order: Step 1 → Step 2 → Step 3.</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>Complete each step before moving on.</li>
                    <li>Review takeaways after each step.</li>
                    <li>Use progress to track your pace.</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowStepTipsToast(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss tips"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFlowTipsToast && activeTab === 'flow' && (
        <div className="fixed left-4 top-24 z-[10020] w-80 max-w-[calc(100vw-2rem)]">
          <div className="rounded-xl border border-purple-200 bg-white shadow-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Concept Flow Tips</h4>
                  <p className="text-xs text-gray-700 mb-2">Follow the stage order and dependencies.</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>Start from lower-stage concepts first.</li>
                    <li>Check prerequisites before jumping ahead.</li>
                    <li>Use outcomes to confirm understanding.</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowFlowTipsToast(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss concept tips"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
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
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto">

          {/* Tabs */}
          <div className="flex items-center justify-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === activeTab;

              return (
                <div key={tab.key}>
                  <button
                    onClick={() => {
                      setActiveTab(tab.key);
                      trackBehavior('tab_switched', { mode: 'sequential', tab: tab.key });
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-5 md:px-6">
          {activeTab === 'steps' && renderStepBreakdown()}
          {activeTab === 'flow' && renderConceptFlow()}
        </div>
      </div>
    </div>
  );
};

export default SequentialLearning;