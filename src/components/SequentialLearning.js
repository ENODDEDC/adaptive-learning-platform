'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

const IMMERSIVE_SEQUENTIAL_EVENT = 'assist-ed-immersive-sequential';

const SequentialLearning = ({ isActive, onClose, docxContent, fileName }) => {
  const [activeTab, setActiveTab] = useState('steps');
  const [steps, setSteps] = useState([]);
  const [conceptFlow, setConceptFlow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepTipsToast, setShowStepTipsToast] = useState(false);
  const [showFlowTipsToast, setShowFlowTipsToast] = useState(false);

  useLearningModeTracking('sequentialLearning', isActive);

  const tabs = useMemo(
    () => [
      { key: 'steps', name: 'Steps', icon: ListBulletIcon },
      { key: 'flow', name: 'Path', icon: MapIcon }
    ],
    []
  );

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-sequential', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_SEQUENTIAL_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-sequential');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_SEQUENTIAL_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && docxContent) {
      generateSequentialContent();
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
    if (!showStepTipsToast) return undefined;
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
    if (!showFlowTipsToast) return undefined;
    const timer = setTimeout(() => setShowFlowTipsToast(false), 8000);
    return () => clearTimeout(timer);
  }, [showFlowTipsToast]);

  const hasContent = steps.length > 0 || conceptFlow.length > 0;

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
        setCurrentStep(0);
      } else {
        throw new Error(result.error || 'Failed to generate sequential content');
      }
    } catch (err) {
      console.error('Error generating sequential content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestRegenerate = () => {
    if (!window.confirm('Regenerate? Uses more API quota.')) return;
    generateSequentialContent();
  };

  const formatStepContent = (content) => {
    if (!content) return '';
    const hasHtmlTags = /<\s*(p|ul|ol|li|h1|h2|h3|h4|div|strong|em|br)\b/i.test(content);

    if (hasHtmlTags) {
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/>\s*\n\s*</g, '><');
    }

    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-100 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-slate-100 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-50 mt-6 mb-4">$1</h1>')
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-4 mb-1 text-slate-300">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4 mb-1 text-slate-300">$1</li>')
      .replace(/<li class="ml-4 mb-1 text-slate-300">\s*<\/li>/g, '')
      .replace(/(<br>\s*){3,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const renderHeaderTabs = () => (
    <nav
      className="inline-flex w-full max-w-[min(100%,240px)] rounded-md border border-indigo-900/50 bg-slate-950/90 p-0.5 sm:w-auto sm:max-w-none"
      role="tablist"
      aria-label="Sequential learning views"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              setActiveTab(tab.key);
              trackBehavior('tab_switched', { mode: 'sequential', tab: tab.key });
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition sm:flex-initial sm:px-3 sm:text-sm ${
              selected
                ? 'bg-indigo-500/25 text-indigo-100 shadow-inner ring-1 ring-indigo-400/35'
                : 'text-slate-400 hover:bg-slate-800/90 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" />
            <span className="truncate">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderStepBreakdown = () => {
    if (loading) {
      return (
        <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
          <p className="text-sm text-slate-400">Mapping steps…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/40 bg-red-950/25 px-6 text-center">
          <p className="text-lg font-semibold text-red-200">Could not build path</p>
          <p className="max-w-md text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={generateSequentialContent}
            className="rounded-lg border border-indigo-500 bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!steps || steps.length === 0) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 px-6 text-center">
          <p className="text-base font-medium text-slate-200">No steps yet</p>
          <button
            type="button"
            onClick={generateSequentialContent}
            className="rounded-lg border border-indigo-500 bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Generate
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowStepTipsToast(true)}
            className="text-xs font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
          >
            Study tips
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="space-y-5 lg:col-span-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-100">Your position</h3>
                <span className="rounded-full border border-indigo-500/40 bg-indigo-950/50 px-2.5 py-1 text-xs font-medium tabular-nums text-indigo-200">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-800 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentStep(index);
                      trackBehavior('step_navigation', { mode: 'sequential', direction: 'chip-jump', step: index });
                    }}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                      index === currentStep
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30'
                        : 'border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-400/90">
                    Step {currentStep + 1}
                  </p>
                  <h3 className="text-xl font-semibold leading-tight text-slate-50">{steps[currentStep]?.title}</h3>
                </div>
                {steps[currentStep]?.estimatedTime && (
                  <div className="flex shrink-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-400">
                    <ClockIcon className="h-4 w-4 text-indigo-400" />
                    <span>{steps[currentStep].estimatedTime}</span>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">How to use this track</p>
                <p className="text-sm text-slate-400">
                  Read in order. Finish this station, skim takeaways, then advance — no skipping ahead unless you
                  already meet the prerequisites.
                </p>
              </div>

              <div className="prose prose-invert prose-sm mb-6 max-w-none text-slate-300">
                <div dangerouslySetInnerHTML={{ __html: formatStepContent(steps[currentStep]?.content) }} />
              </div>

              {steps[currentStep]?.keyTakeaways && (
                <div className="mb-6 rounded-lg border border-indigo-900/50 bg-indigo-950/30 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-indigo-200">Takeaways</h4>
                  <ul className="space-y-1.5">
                    {steps[currentStep].keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {steps[currentStep]?.documentSection && (
                <div className="mb-6 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Source slice:</span> {steps[currentStep].documentSection}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const newStep = Math.max(0, currentStep - 1);
                    setCurrentStep(newStep);
                    trackBehavior('step_navigation', { mode: 'sequential', direction: 'previous', step: newStep });
                  }}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Back
                </button>

                <div className="flex gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        index === currentStep ? 'bg-amber-400' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newStep = Math.min(steps.length - 1, currentStep + 1);
                    setCurrentStep(newStep);
                    trackBehavior('step_navigation', { mode: 'sequential', direction: 'next', step: newStep });
                  }}
                  disabled={currentStep === steps.length - 1}
                  className="flex items-center gap-2 rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 lg:sticky lg:top-4">
              <h4 className="mb-3 text-base font-semibold text-slate-100">Full track</h4>
              <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentStep(index);
                      trackBehavior('step_navigation', { mode: 'sequential', direction: 'jump', step: index });
                    }}
                    className={`w-full rounded-lg border p-3.5 text-left transition ${
                      index === currentStep
                        ? 'border-indigo-500/50 bg-indigo-950/40 ring-1 ring-indigo-500/25'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          index === currentStep ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            index === currentStep ? 'text-indigo-100' : 'text-slate-300'
                          }`}
                        >
                          {step.title}
                        </p>
                        {step.estimatedTime && <p className="mt-1 text-xs text-slate-500">{step.estimatedTime}</p>}
                      </div>
                    </div>
                  </button>
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
        <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
          <p className="text-sm text-slate-400">Mapping concept path…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/40 bg-red-950/25 px-6 text-center">
          <p className="text-lg font-semibold text-red-200">Path failed</p>
          <p className="max-w-md text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={generateSequentialContent}
            className="rounded-lg border border-indigo-500 bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!conceptFlow || conceptFlow.length === 0) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 px-6 text-center">
          <p className="text-base font-medium text-slate-200">No concept path yet</p>
          <button
            type="button"
            onClick={generateSequentialContent}
            className="rounded-lg border border-indigo-500 bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Generate
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowFlowTipsToast(true)}
            className="text-xs font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
          >
            Path tips
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-5 sm:p-6">
          <h4 className="mb-5 text-lg font-semibold text-slate-100">Stages (in order)</h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {conceptFlow.map((stage, index) => (
              <article key={index} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold leading-snug text-slate-100">{stage.title}</h4>
                  </div>
                  <span className="shrink-0 rounded-full border border-indigo-500/30 bg-indigo-950/50 px-2 py-1 text-[11px] font-medium text-indigo-200">
                    {stage.difficulty || '—'}
                  </span>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-slate-400">{stage.description}</p>

                {stage.prerequisites?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">Needs first</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.prerequisites.map((item, i) => (
                        <span
                          key={i}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {stage.keyPoints?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">You will cover</p>
                    <ul className="space-y-1.5">
                      {stage.keyPoints.slice(0, 4).map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.documentReferences?.length > 0 && (
                  <p className="mb-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-400">Doc refs:</span> {stage.documentReferences.join(', ')}
                  </p>
                )}

                {stage.learningOutcome && (
                  <div className="mt-2 rounded-lg border border-emerald-900/40 bg-emerald-950/25 p-2.5">
                    <p className="mb-0.5 text-[11px] font-semibold text-emerald-400/90">Outcome</p>
                    <p className="text-xs text-emerald-100/90">{stage.learningOutcome}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-5 sm:p-6">
          <h4 className="mb-4 text-lg font-semibold text-slate-100">Dependencies</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {conceptFlow.map((stage, index) => (
              <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-200">{stage.title}</span>
                </div>
                {stage.prerequisites && stage.prerequisites.length > 0 ? (
                  <p className="text-sm text-slate-400">
                    <span className="font-medium text-slate-300">Builds on:</span> {stage.prerequisites.join(', ')}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-emerald-400/90">Foundation stage</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isActive) return null;

  const shell = (
    <div
      className="fixed inset-0 left-0 top-0 z-[100020] flex flex-col bg-slate-950 font-sans text-slate-100 antialiased"
      style={{
        paddingTop: typeof document !== 'undefined' && document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0',
        backgroundImage:
          'radial-gradient(ellipse 100% 70% at 50% -30%, rgba(79,70,229,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(30,27,75,0.35), transparent)'
      }}
    >
      {showStepTipsToast && (
        <div className="pointer-events-auto fixed left-4 top-24 z-[100025] w-80 max-w-[calc(100vw-2rem)]">
          <div className="overflow-hidden rounded-xl border border-indigo-500/30 bg-slate-900 shadow-xl shadow-black/40">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/50 p-2">
                  <ListBulletIcon className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-slate-100">Step track</h4>
                  <p className="mb-2 text-xs text-slate-400">Follow strict order: 1 → 2 → 3.</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>Finish the current station before advancing.</li>
                    <li>Use takeaways as your exit check.</li>
                    <li>Jump chips are for review, not for skipping unread material.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStepTipsToast(false)}
                  className="text-slate-500 hover:text-slate-300"
                  aria-label="Dismiss tips"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFlowTipsToast && activeTab === 'flow' && (
        <div className="pointer-events-auto fixed left-4 top-24 z-[100025] w-80 max-w-[calc(100vw-2rem)]">
          <div className="overflow-hidden rounded-xl border border-indigo-500/30 bg-slate-900 shadow-xl shadow-black/40">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/50 p-2">
                  <MapIcon className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-slate-100">Concept path</h4>
                  <p className="mb-2 text-xs text-slate-400">Respect stage order and prerequisites.</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>Earlier stages unlock later ones.</li>
                    <li>Read “Needs first” before assuming you can skip ahead.</li>
                    <li>Outcomes tell you when a stage is truly done.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFlowTipsToast(false)}
                  className="text-slate-500 hover:text-slate-300"
                  aria-label="Dismiss path tips"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-slate-800/90 bg-slate-950/95 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-[min(1200px,calc(100%-0.25rem))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              title="Back"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-800/50 bg-indigo-950/50 text-indigo-300">
              <ListBulletIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-slate-50 sm:text-base">Sequential Learning</h2>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {renderHeaderTabs()}
            <div className="flex shrink-0 items-center gap-1.5">
              {!hasContent && !loading && (
                <button
                  type="button"
                  onClick={generateSequentialContent}
                  className="rounded-lg border border-indigo-500 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 sm:text-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Generate
                  </span>
                </button>
              )}
              {hasContent && !loading && (
                <button
                  type="button"
                  onClick={requestRegenerate}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 sm:px-3 sm:text-sm"
                  title="Uses more API quota"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </span>
                </button>
              )}
              {loading && (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="sequential-learning-scroll flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[min(1200px,calc(100%-1rem))] px-4 py-5 sm:px-6 sm:py-6">
          {activeTab === 'steps' && renderStepBreakdown()}
          {activeTab === 'flow' && renderConceptFlow()}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default SequentialLearning;
