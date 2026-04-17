'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  GlobeAltIcon,
  EyeIcon,
  ShareIcon,
  LightBulbIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const GlobalLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName,
  pdfSource = null
}) => {
  const [activeTab, setActiveTab] = useState('bigpicture');
  const [bigPicture, setBigPicture] = useState(null);
  const [interconnections, setInterconnections] = useState(null);

  // Automatic time tracking for ML classification
  useLearningModeTracking('globalLearning', isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    {
      key: 'bigpicture',
      name: 'Big Picture',
      icon: EyeIcon,
      description: 'Overall context and significance'
    },
    {
      key: 'interconnections',
      name: 'Interconnections',
      icon: ShareIcon,
      description: 'How everything connects together'
    }
  ];

  useEffect(() => {
    if (isActive && (docxContent || pdfSource?.fileKey || pdfSource?.filePath)) {
      generateGlobalContent();
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'global', fileName });
    }
  }, [isActive, docxContent, pdfSource?.fileKey, pdfSource?.filePath]);

  const generateGlobalContent = async () => {
    if ((!docxContent || !docxContent.trim()) && !pdfSource?.fileKey && !pdfSource?.filePath) {
      setError('No document content available for global analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/global-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docxText: docxContent,
          fileKey: pdfSource?.fileKey,
          filePath: pdfSource?.filePath,
          mimeType: pdfSource?.mimeType,
          fileName
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult?.details || errorResult?.error || errorMessage;
        } catch {
          // ignore JSON parsing failure
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setBigPicture(result.bigPicture || null);
        setInterconnections(result.interconnections || null);
      } else {
        throw new Error(result.error || 'Failed to generate global learning content');
      }
    } catch (error) {
      console.error('Error generating global content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasFullContent = Boolean(bigPicture && interconnections);

  const requestRegenerate = () => {
    const ok = window.confirm(
      'Regenerate global learning? This runs the AI again and uses more API quota.'
    );
    if (!ok) return;
    generateGlobalContent();
  };

  const renderBigPicture = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Analyzing the big picture...</p>
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
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!bigPicture) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Big Picture Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to analyze the overall context</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Big Picture
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Top bento: overview + learning approach side by side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {bigPicture.overallPurpose && (
            <section className="xl:col-span-7 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-white shadow-sm overflow-hidden">
              <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-violet-100/80 bg-white/60 backdrop-blur-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <LightBulbIcon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{bigPicture.overallPurpose.title}</h3>
              </header>
              <div className="p-5 sm:p-6 space-y-5">
                <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-prose">
                  {bigPicture.overallPurpose.description}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-violet-100 bg-violet-500/[0.06] px-4 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 mb-1.5">Significance</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{bigPicture.overallPurpose.realWorldSignificance}</p>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-500/[0.06] px-4 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 mb-1.5">Key question</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{bigPicture.overallPurpose.keyQuestion}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {bigPicture.learningStrategy && (
            <section className="xl:col-span-5 rounded-2xl border border-fuchsia-200/70 bg-gradient-to-b from-fuchsia-50/50 to-white shadow-sm overflow-hidden flex flex-col">
              <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-fuchsia-100/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white shadow-sm">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{bigPicture.learningStrategy.title}</h3>
              </header>
              <div className="p-5 flex-1 flex flex-col gap-4">
                <p className="text-sm text-slate-600 leading-relaxed">{bigPicture.learningStrategy.description}</p>
                <div className="grid grid-cols-1 gap-3 flex-1">
                  <div className="rounded-xl border border-fuchsia-100 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700 mb-1">Starting point</p>
                    <p className="text-sm text-slate-700">{bigPicture.learningStrategy.startingPoint}</p>
                  </div>
                  <div className="rounded-xl border border-fuchsia-100 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700 mb-1">Mental model</p>
                    <p className="text-sm text-slate-700">{bigPicture.learningStrategy.mentalModel}</p>
                  </div>
                </div>
                {bigPicture.learningStrategy.keyInsights?.length > 0 && (
                  <div className="pt-1 border-t border-fuchsia-100/80">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700 mb-2">Insights</p>
                    <ul className="flex flex-col gap-2">
                      {bigPicture.learningStrategy.keyInsights.map((insight, index) => (
                        <li key={index} className="flex gap-2.5 text-sm text-slate-700 leading-snug">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-fuchsia-100 text-[11px] font-bold text-fuchsia-800">
                            {index + 1}
                          </span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Wider context: timeline-style three beats */}
        {bigPicture.bigPictureContext && (
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <header className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <GlobeAltIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{bigPicture.bigPictureContext.title}</h3>
            </header>
            <div className="p-5 sm:p-6">
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed mb-6 max-w-4xl">{bigPicture.bigPictureContext.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
                {[
                  { label: 'Broader field', body: bigPicture.bigPictureContext.broaderField },
                  { label: 'Historical lens', body: bigPicture.bigPictureContext.historicalContext },
                  { label: 'Future angle', body: bigPicture.bigPictureContext.futureImplications }
                ].map((cell, i) => (
                  <div
                    key={cell.label}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-4 items-start"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        {cell.label}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{cell.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* System view: chips + two prose panels */}
        {bigPicture.systemicView && (
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <PuzzlePieceIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{bigPicture.systemicView.title}</h3>
            </header>
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed max-w-4xl">{bigPicture.systemicView.description}</p>
              {bigPicture.systemicView.mainComponents?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2.5">Main components</p>
                  <div className="flex flex-wrap gap-2">
                    {bigPicture.systemicView.mainComponents.map((component, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1.5 text-sm font-medium text-teal-900"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800 mb-2">Relationships</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{bigPicture.systemicView.relationships}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800 mb-2">Emergent properties</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{bigPicture.systemicView.emergentProperties}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Practical band */}
        {bigPicture.practicalRelevance && (
          <section className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/40 via-white to-rose-50/30 shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-orange-100/80 bg-white/70">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{bigPicture.practicalRelevance.title}</h3>
            </header>
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed max-w-4xl">{bigPicture.practicalRelevance.description}</p>
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 rounded-xl border border-orange-100 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-800 mb-2.5">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bigPicture.practicalRelevance.industries?.map((industry, index) => (
                      <span
                        key={index}
                        className="rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-950 ring-1 ring-inset ring-orange-200/60"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-1 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 mb-2">Daily life</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{bigPicture.practicalRelevance.dailyLife}</p>
                </div>
                <div className="lg:col-span-1 rounded-xl border border-sky-100 bg-sky-50/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800 mb-2">Global impact</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{bigPicture.practicalRelevance.globalImpact}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderInterconnections = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Mapping interconnections...</p>
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
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!interconnections) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Interconnections Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to map how everything connects</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Interconnections
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {interconnections.conceptNetwork && (
          <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-emerald-100/80 bg-white/70">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <ShareIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Concept network</h3>
            </header>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-100 bg-emerald-500/[0.07] px-5 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 mb-1.5">Central theme</p>
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-snug">{interconnections.conceptNetwork.centralTheme}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Core nodes</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {interconnections.conceptNetwork.coreNodes?.map((node, index) => (
                    <article
                      key={index}
                      className="group relative rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:ring-emerald-200/80 hover:shadow-md"
                    >
                      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 opacity-90" aria-hidden />
                      <div className="pl-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-base font-semibold text-slate-900 pr-6">{node.name}</h4>
                          <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{node.description}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-800 mb-1.5">Links</p>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {node.connections?.map((connection, i) => (
                                <li key={i} className="flex gap-1.5 leading-snug">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                                  <span>{connection}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800 mb-1.5">Why it matters</p>
                            <p className="text-xs text-slate-700 leading-relaxed">{node.importance}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {interconnections.conceptNetwork.emergentPatterns && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2.5">Emergent patterns</p>
                  <div className="flex flex-wrap gap-2">
                    {interconnections.conceptNetwork.emergentPatterns.map((pattern, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3 py-1.5 text-sm text-purple-950"
                      >
                        <span className="text-[10px] font-bold text-purple-600">{index + 1}</span>
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {interconnections.systemDynamics && (
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">System dynamics</h3>
            </header>
            <div className="p-5 sm:p-6 grid lg:grid-cols-2 gap-6 lg:gap-8">
              {interconnections.systemDynamics.feedbackLoops && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Feedback loops</p>
                  <ul className="space-y-3">
                    {interconnections.systemDynamics.feedbackLoops.map((loop, index) => (
                      <li
                        key={index}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 flex gap-3"
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                            loop.type === 'reinforcing' ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          title={loop.type}
                        >
                          {loop.type === 'reinforcing' ? '+' : '∿'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{loop.name}</p>
                          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{loop.description}</p>
                          <p className="mt-2 text-xs text-slate-500 border-t border-slate-200/80 pt-2">
                            <span className="font-semibold text-slate-700">Impact:</span> {loop.impact}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interconnections.systemDynamics.causeEffectChains && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Cause → effect</p>
                  <ul className="space-y-4">
                    {interconnections.systemDynamics.causeEffectChains.map((chain, index) => (
                      <li key={index} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                        <p className="text-sm font-semibold text-amber-950 mb-3">{chain.trigger}</p>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-1 mb-3">
                          {chain.chain?.map((effect, i) => (
                            <React.Fragment key={i}>
                              <span className="inline-flex max-w-full rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-amber-950 ring-1 ring-amber-200/80">
                                {effect}
                              </span>
                              {i < chain.chain.length - 1 && (
                                <span className="mx-0.5 text-amber-500 text-xs font-bold" aria-hidden>
                                  →
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-amber-200/60 pt-2">
                          <span className="font-semibold text-amber-900">Significance:</span> {chain.significance}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {interconnections.crossDomainConnections && (
          <section className="rounded-2xl border border-indigo-200/70 bg-white shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-indigo-100/80 bg-indigo-50/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Cross-domain</h3>
            </header>
            <div className="p-5 sm:p-6 space-y-5">
              {interconnections.crossDomainConnections.relatedFields && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Related fields</p>
                  <div className="flex flex-wrap gap-2">
                    {interconnections.crossDomainConnections.relatedFields.map((field, index) => (
                      <span
                        key={index}
                        className="rounded-lg bg-indigo-600/10 px-2.5 py-1 text-xs font-medium text-indigo-950 ring-1 ring-inset ring-indigo-200/70"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {interconnections.crossDomainConnections.analogies && (
                <div className="grid md:grid-cols-2 gap-4">
                  {interconnections.crossDomainConnections.analogies.map((analogy, index) => (
                    <div key={index} className="rounded-xl border border-violet-100 bg-violet-50/30 p-4 flex flex-col">
                      <p className="text-sm font-semibold text-violet-950">{analogy.comparison}</p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">{analogy.explanation}</p>
                      <p className="mt-3 text-xs text-slate-500 border-t border-violet-100 pt-2">
                        <span className="font-semibold text-violet-900">Limits:</span> {analogy.limitations}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {interconnections.crossDomainConnections.applications && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Applications</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {interconnections.crossDomainConnections.applications.map((application, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-emerald-950"
                      >
                        {application}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {interconnections.holisticInsights && (
          <section className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 shadow-sm overflow-hidden">
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-100/80 bg-white/60">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                <LightBulbIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Holistic insights</h3>
            </header>
            <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
              {interconnections.holisticInsights.keyRealizations && (
                <div className="rounded-xl border border-amber-100 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-2">Realizations</p>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.keyRealizations.map((realization, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-700 leading-snug">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {realization}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {interconnections.holisticInsights.paradoxes && (
                <div className="rounded-xl border border-orange-100 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-800 mb-2">Tensions</p>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.paradoxes.map((paradox, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-700 leading-snug">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        {paradox}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {interconnections.holisticInsights.unifyingPrinciples && (
                <div className="rounded-xl border border-emerald-100 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 mb-2">Principles</p>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.unifyingPrinciples.map((principle, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-700 leading-snug">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {principle}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl border border-violet-100 bg-white/90 p-4 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800 mb-2">Systemic implications</p>
                <p className="text-sm text-slate-700 leading-relaxed">{interconnections.holisticInsights.systemicImplications}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  console.log('🌍 GlobalLearning render - isActive:', isActive, 'docxContent length:', docxContent?.length);
  
  if (!isActive) {
    console.log('❌ GlobalLearning NOT rendering (isActive is false)');
    return null;
  }

  console.log('✅ GlobalLearning IS rendering!');

  return (
    <div className="fixed inset-0 bg-white z-[10001] flex flex-col" style={{ paddingTop: document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0' }}>
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
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <GlobeAltIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Global Learning</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!hasFullContent && !loading && (
            <button
              type="button"
              onClick={generateGlobalContent}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
              title="Generate global analysis"
            >
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Generate</span>
              </div>
            </button>
          )}
          {hasFullContent && !loading && (
            <button
              type="button"
              onClick={requestRegenerate}
              className="px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              title="Runs the AI again; uses more quota"
            >
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 text-slate-500" />
                Regenerate
              </span>
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 text-sm">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Generating…</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Selector with Explanations */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'bigpicture' ? 'Shows overall context and significance' : 'Shows how concepts connect and influence each other'}
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
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === 'bigpicture' && renderBigPicture()}
          {activeTab === 'interconnections' && renderInterconnections()}
        </div>
      </div>
    </div>
  );
};

export default GlobalLearning;
