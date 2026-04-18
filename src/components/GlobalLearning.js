'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Source_Serif_4 } from 'next/font/google';
import {
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

const IMMERSIVE_GLOBAL_EVENT = 'assist-ed-immersive-global';

/** Calm editorial display for headings (global / big-picture mode). */
const glDisplay = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-gl-display',
  display: 'swap'
});

const displayHeading = 'font-[family-name:var(--font-gl-display),ui-serif,Georgia,serif]';

const GlobalLearning = ({ isActive, onClose, docxContent, fileName, pdfSource = null }) => {
  const [activeTab, setActiveTab] = useState('bigpicture');
  const [bigPicture, setBigPicture] = useState(null);
  const [interconnections, setInterconnections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useLearningModeTracking('globalLearning', isActive);

  const tabs = useMemo(
    () => [
      { key: 'bigpicture', name: 'Overview', icon: EyeIcon },
      { key: 'interconnections', name: 'Connections', icon: ShareIcon }
    ],
    []
  );

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-global', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_GLOBAL_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-global');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_GLOBAL_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && (docxContent || pdfSource?.fileKey || pdfSource?.filePath)) {
      generateGlobalContent();
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
          // ignore
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
    } catch (err) {
      console.error('Error generating global content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasFullContent = Boolean(bigPicture && interconnections);

  const requestRegenerate = () => {
    if (!window.confirm('Regenerate? Uses more API quota.')) return;
    generateGlobalContent();
  };

  const renderHeaderTabs = () => (
    <nav
      className="inline-flex w-full max-w-[min(100%,280px)] rounded-md border border-zinc-700/80 bg-zinc-900 p-0.5 sm:w-auto sm:max-w-none"
      role="tablist"
      aria-label="Global learning views"
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
              trackBehavior('tab_switched', { mode: 'global', tab: tab.key });
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition sm:flex-initial sm:px-3 sm:py-1.5 sm:text-sm ${
              selected
                ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-800/90 hover:text-zinc-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" />
            <span className="truncate">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderLoading = (tone) => (
    <div className="flex min-h-[min(70vh,480px)] flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
      <p className="text-sm text-zinc-400">{tone === 'web' ? 'Mapping links…' : 'Building overview…'}</p>
    </div>
  );

  const renderErrorBlock = (retryLabel) => (
    <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/50 bg-red-950/30 px-6 text-center">
      <p className={`text-lg font-semibold text-red-200/95 ${displayHeading}`}>Something broke</p>
      <p className="max-w-md text-sm text-zinc-400">{error}</p>
      <button
        type="button"
        onClick={generateGlobalContent}
        className="rounded-lg border border-zinc-600 bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white"
      >
        {retryLabel}
      </button>
    </div>
  );

  const renderEmptyBlock = (label) => (
    <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-6 text-center">
      <p className={`text-base font-semibold text-zinc-100 ${displayHeading}`}>{label}</p>
      <button
        type="button"
        onClick={generateGlobalContent}
        className="rounded-lg border border-zinc-600 bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white"
      >
        Generate
      </button>
    </div>
  );

  const renderBigPicture = () => {
    if (loading) return renderLoading('overview');
    if (error) return renderErrorBlock('Try again');
    if (!bigPicture) return renderEmptyBlock('No overview yet');

    const op = bigPicture.overallPurpose;
    const ctx = bigPicture.bigPictureContext;
    const sys = bigPicture.systemicView;
    const pr = bigPicture.practicalRelevance;
    const ls = bigPicture.learningStrategy;

    return (
      <div className="space-y-5 sm:space-y-6">
        {op && (
          <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/40 p-6 sm:p-9">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Focus</p>
            <h2 className={`mt-2 text-2xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-3xl lg:text-[2rem] ${displayHeading}`}>
              {op.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-lg">{op.description}</p>
            <div className="mt-8 grid gap-4 border-t border-zinc-800 pt-8 sm:grid-cols-2">
              <div className="border-l-2 border-zinc-600 pl-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Why it matters</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{op.realWorldSignificance}</p>
              </div>
              <div className="border-l-2 border-zinc-500 pl-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Anchor</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-200">{op.keyQuestion}</p>
              </div>
            </div>
          </section>
        )}

        {ctx && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`text-xl font-semibold text-zinc-50 sm:text-2xl ${displayHeading}`}>{ctx.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">{ctx.description}</p>
            <div className="relative mt-8 grid gap-4 md:grid-cols-3">
              <div className="hidden md:block absolute left-[10%] right-[10%] top-4 h-px bg-zinc-700/50" aria-hidden />
              {[
                { k: 'Field', body: ctx.broaderField },
                { k: 'Past', body: ctx.historicalContext },
                { k: 'Ahead', body: ctx.futureImplications }
              ].map((cell, i) => (
                <div key={cell.k} className="relative flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 pt-5 md:pt-6">
                  <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-xs font-semibold text-zinc-300">
                    {i + 1}
                  </span>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{cell.k}</p>
                  <p className="text-sm leading-relaxed text-zinc-300">{cell.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {sys && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`text-xl font-semibold text-zinc-50 ${displayHeading}`}>{sys.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-400">{sys.description}</p>
            {sys.mainComponents?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {sys.mainComponents.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/60 px-2.5 py-1.5 text-sm text-zinc-200"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-600 text-[10px] font-semibold text-zinc-400">
                      {i + 1}
                    </span>
                    {c}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Relationships</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{sys.relationships}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Emergent</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{sys.emergentProperties}</p>
              </div>
            </div>
          </section>
        )}

        {pr && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`text-xl font-semibold text-zinc-50 ${displayHeading}`}>{pr.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-400">{pr.description}</p>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Where</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pr.industries?.map((ind, i) => (
                    <span key={i} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Everyday</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{pr.dailyLife}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Wider world</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{pr.globalImpact}</p>
              </div>
            </div>
          </section>
        )}

        {ls && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-950 text-zinc-400">
                <LightBulbIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`text-xl font-semibold text-zinc-50 ${displayHeading}`}>{ls.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{ls.description}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Start</p>
                <p className="mt-2 text-sm text-zinc-300">{ls.startingPoint}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Mental model</p>
                <p className="mt-2 text-sm text-zinc-300">{ls.mentalModel}</p>
              </div>
            </div>
            {ls.keyInsights?.length > 0 && (
              <ul className="mt-6 space-y-3 border-t border-zinc-800 pt-6">
                {ls.keyInsights.map((insight, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-snug text-zinc-300">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-950 text-xs font-medium text-zinc-500">
                      {index + 1}
                    </span>
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    );
  };

  const renderInterconnections = () => {
    if (loading) return renderLoading('web');
    if (error) return renderErrorBlock('Retry');
    if (!interconnections) return renderEmptyBlock('No link map yet');

    const net = interconnections.conceptNetwork;
    const dyn = interconnections.systemDynamics;
    const cross = interconnections.crossDomainConnections;
    const hol = interconnections.holisticInsights;

    return (
      <div className="space-y-5 sm:space-y-6">
        {net && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl border-b border-zinc-800 pb-8 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Center</p>
              <p className={`mt-3 text-xl font-semibold leading-snug text-zinc-50 sm:text-2xl ${displayHeading}`}>
                {net.centralTheme}
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {net.coreNodes?.map((node, index) => (
                <article key={index} className="relative rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 pl-4 sm:pl-5">
                  <div className="absolute bottom-4 left-0 top-4 w-px bg-zinc-600" aria-hidden />
                  <div className="flex items-start justify-between gap-2 pl-3">
                    <h4 className={`text-base font-semibold text-zinc-50 ${displayHeading}`}>{node.name}</h4>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-500">
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-3 pl-3 text-sm leading-relaxed text-zinc-400">{node.description}</p>
                  <div className="mt-4 grid gap-3 pl-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Links</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
                        {node.connections?.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Weight</p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{node.importance}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {net.emergentPatterns?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-zinc-800 pt-6">
                {net.emergentPatterns.map((pattern, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-300"
                  >
                    <span className="text-[10px] font-semibold text-zinc-500">{index + 1}</span>
                    {pattern}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {dyn && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`flex items-center gap-2 text-xl font-semibold text-zinc-50 ${displayHeading}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-950 text-zinc-400">
                <PuzzlePieceIcon className="h-4 w-4" />
              </span>
              Motion & leverage
            </h3>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {dyn.feedbackLoops?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Loops</p>
                  <ul className="mt-3 space-y-3">
                    {dyn.feedbackLoops.map((loop, index) => (
                      <li key={index} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-zinc-950 ${
                            loop.type === 'reinforcing' ? 'bg-zinc-300' : 'bg-zinc-500 text-zinc-100'
                          }`}
                          title={loop.type}
                        >
                          {loop.type === 'reinforcing' ? '+' : '∿'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-100">{loop.name}</p>
                          <p className="mt-1 text-sm text-zinc-400">{loop.description}</p>
                          <p className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-500">{loop.impact}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dyn.causeEffectChains?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Chains</p>
                  <ul className="mt-3 space-y-4">
                    {dyn.causeEffectChains.map((chain, index) => (
                      <li key={index} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-sm font-medium text-zinc-200">{chain.trigger}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                          {chain.chain?.map((effect, i) => (
                            <React.Fragment key={i}>
                              <span className="inline-flex max-w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                                {effect}
                              </span>
                              {i < chain.chain.length - 1 && (
                                <span className="text-xs font-medium text-zinc-600" aria-hidden>
                                  →
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <p className="mt-3 border-t border-zinc-800 pt-2 text-xs text-zinc-500">{chain.significance}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {cross && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`text-xl font-semibold text-zinc-50 ${displayHeading}`}>Beyond this page</h3>
            {cross.relatedFields?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {cross.relatedFields.map((field, index) => (
                  <span
                    key={index}
                    className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
            {cross.analogies?.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {cross.analogies.map((analogy, index) => (
                  <div key={index} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <p className={`text-sm font-semibold text-zinc-100 ${displayHeading}`}>{analogy.comparison}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{analogy.explanation}</p>
                    <p className="mt-3 border-t border-zinc-800 pt-2 text-xs text-zinc-500">{analogy.limitations}</p>
                  </div>
                ))}
              </div>
            )}
            {cross.applications?.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cross.applications.map((application, index) => (
                  <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-sm text-zinc-300">
                    {application}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {hol && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 sm:p-7">
            <h3 className={`flex items-center gap-2 text-xl font-semibold text-zinc-50 ${displayHeading}`}>
              <LightBulbIcon className="h-5 w-5 text-zinc-500" />
              Whole-system takeaways
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {hol.keyRealizations?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Realizations</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {hol.keyRealizations.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hol.paradoxes?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Tensions</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {hol.paradoxes.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hol.unifyingPrinciples?.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Principles</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {hol.unifyingPrinciples.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hol.systemicImplications && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:col-span-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Ripples</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{hol.systemicImplications}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  if (!isActive) return null;

  const shell = (
    <div
      className={`fixed inset-0 left-0 top-0 z-[100020] flex flex-col bg-zinc-950 text-zinc-100 antialiased ${glDisplay.variable} font-sans`}
      style={{
        paddingTop: typeof document !== 'undefined' && document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0',
        backgroundImage:
          'radial-gradient(ellipse 100% 80% at 50% -30%, rgba(113,113,122,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(63,63,70,0.2), transparent)'
      }}
    >
      <header className="border-b border-zinc-800/90 bg-zinc-950/90 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-[min(1200px,calc(100%-0.25rem))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              title="Back"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400">
              <GlobeAltIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`truncate text-sm font-semibold text-zinc-100 sm:text-base ${displayHeading}`}>Global Learning</h2>
              <p className="truncate text-xs text-zinc-500">{fileName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {renderHeaderTabs()}
            <div className="flex shrink-0 items-center gap-1.5">
              {!hasFullContent && !loading && (
                <button
                  type="button"
                  onClick={generateGlobalContent}
                  className="rounded-lg border border-zinc-600 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white sm:text-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Generate
                  </span>
                </button>
              )}
              {hasFullContent && !loading && (
                <button
                  type="button"
                  onClick={requestRegenerate}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 sm:px-3 sm:text-sm"
                  title="Uses more API quota"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </span>
                </button>
              )}
              {loading && (
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[min(1200px,calc(100%-1rem))] px-4 py-5 sm:px-6 sm:py-7">
          {activeTab === 'bigpicture' && renderBigPicture()}
          {activeTab === 'interconnections' && renderInterconnections()}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default GlobalLearning;
