'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  PhotoIcon,
  ChartBarIcon,
  MapIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import VisualWireframe from './VisualWireframe';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';
import { trackBehavior } from '@/utils/learningBehaviorTracker';

const IMMERSIVE_VISUAL_EVENT = 'assist-ed-immersive-visual-learning';

const VISUAL_TYPES = [
  {
    key: 'diagram',
    name: 'Overview',
    hint: 'How pieces connect',
    Icon: Squares2X2Icon
  },
  {
    key: 'infographic',
    name: 'Summary',
    hint: 'Scan key points',
    Icon: ChartBarIcon
  },
  {
    key: 'mindmap',
    name: 'Network',
    hint: 'Ideas linked',
    Icon: MapIcon
  },
  {
    key: 'flowchart',
    name: 'Steps',
    hint: 'Order of work',
    Icon: ArrowsRightLeftIcon
  }
];

const VisualDocxOverlay = ({
  isActive,
  onClose,
  docxContent,
  fileName,
  onVisualTypeChange,
  activeVisualType = 'diagram'
}) => {
  const [visuals, setVisuals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [concepts, setConcepts] = useState(null);

  useLearningModeTracking('visualLearning', isActive);

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-visual-learning', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_VISUAL_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-visual-learning');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_VISUAL_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

  const generateAllVisuals = useCallback(async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document text to visualize.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visual-content/generate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const result = await response.json();

      if (result.success) {
        setVisuals(result.visuals || {});
        setConcepts(result.concepts || null);
        trackBehavior('visual_batch_generated', { mode: 'visualLearning', fileName });
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (e) {
      console.error('Visual generation:', e);
      setError(e.message || 'Could not generate visuals');
    } finally {
      setLoading(false);
    }
  }, [docxContent, fileName]);

  const generateSingleVisual = useCallback(
    async (type) => {
      if (!docxContent || !docxContent.trim()) {
        setError('No document text to visualize.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/visual-content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docxText: docxContent,
            contentType: type
          })
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Request failed (${response.status})`);
        }

        const result = await response.json();
        const piece = result.visualContent ?? result.visual;

        if (result.success && piece) {
          setVisuals((prev) => ({ ...prev, [type]: piece }));
          if (result.concepts) setConcepts(result.concepts);
          trackBehavior('visual_single_generated', { mode: 'visualLearning', type, fileName });
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      } catch (e) {
        console.error(`Visual ${type}:`, e);
        setError(e.message || 'Could not generate');
      } finally {
        setLoading(false);
      }
    },
    [docxContent, fileName]
  );

  useEffect(() => {
    if (isActive && docxContent) {
      generateAllVisuals();
    }
  }, [isActive, docxContent, generateAllVisuals]);

  useEffect(() => {
    if (!isActive) {
      setVisuals({});
      setConcepts(null);
      setError(null);
    }
  }, [isActive]);

  const handleVisualTypeChange = (newType) => {
    onVisualTypeChange(newType);
    trackBehavior('tab_switched', { mode: 'visualLearning', tab: newType });
    if (!visuals[newType]) {
      generateSingleVisual(newType);
    }
  };

  const currentMeta = VISUAL_TYPES.find((v) => v.key === activeVisualType) || VISUAL_TYPES[0];
  const visual = visuals[activeVisualType];

  const downloadImage = (imageData, mimeType, suffix) => {
    try {
      const link = document.createElement('a');
      link.href = `data:${mimeType || 'image/png'};base64,${imageData}`;
      link.download = `${(fileName || 'document').replace(/\.[^/.]+$/, '')}_${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  const formatMarkdownText = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-slate-100 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold text-slate-50 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>')
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-3 mb-1 text-slate-300">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-3 mb-1 text-slate-300">$1</li>')
      .replace(/\n/g, '<br>');
    formatted = formatted.replace(/(<li class="ml-3 mb-1 text-slate-300">.*?<\/li>(?:<br>)*)+/g, (match) => {
      const clean = match.replace(/<br>/g, '');
      return `<ul class="list-disc list-inside space-y-1 my-2 text-slate-300">${clean}</ul>`;
    });
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>');
    return formatted;
  };

  const renderMainVisual = () => {
    if (loading && !visual) {
      return (
        <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-10">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
          <p className="text-center text-sm text-slate-400">Building {currentMeta.name.toLowerCase()} from your document…</p>
        </div>
      );
    }

    if (error && !visual) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-center">
          <p className="text-sm text-red-200/90">{error}</p>
          <button
            type="button"
            onClick={() => generateAllVisuals()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!visual) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <PhotoIcon className="h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">Nothing for this view yet.</p>
          <button
            type="button"
            onClick={() => generateSingleVisual(activeVisualType)}
            disabled={loading}
            className="rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-50"
          >
            Generate {currentMeta.name}
          </button>
        </div>
      );
    }

    if (visual.error) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-900/35 bg-amber-950/15 p-8 text-center">
          <p className="text-sm text-amber-100/90">{visual.error}</p>
          <button
            type="button"
            onClick={() => generateSingleVisual(activeVisualType)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
          >
            Regenerate
          </button>
        </div>
      );
    }

    if (visual.isWireframe && visual.wireframeData) {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <VisualWireframe wireframeData={visual.wireframeData} contentType={activeVisualType} />
        </div>
      );
    }

    if (visual.isFallback && visual.textDescription) {
      return (
        <div className="rounded-2xl border border-amber-900/30 bg-amber-950/10 p-5 sm:p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-amber-200/80">Text layout (no image)</p>
          <div
            className="prose prose-invert prose-sm max-w-none text-slate-300"
            dangerouslySetInnerHTML={{ __html: formatMarkdownText(visual.textDescription) }}
          />
        </div>
      );
    }

    if (visual.imageData) {
      return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => downloadImage(visual.imageData, visual.mimeType, activeVisualType)}
              className="rounded-lg border border-slate-600 bg-slate-950/90 p-2 text-slate-200 backdrop-blur hover:bg-slate-800"
              title="Download PNG"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => generateSingleVisual(activeVisualType)}
              disabled={loading}
              className="rounded-lg border border-slate-600 bg-slate-950/90 p-2 text-slate-200 backdrop-blur hover:bg-slate-800 disabled:opacity-50"
              title="Regenerate"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex max-h-[min(72vh,900px)] min-h-[240px] items-center justify-center overflow-auto p-3 sm:p-5">
            <img
              src={`data:${visual.mimeType || 'image/png'};base64,${visual.imageData}`}
              alt={`${currentMeta.name} — ${fileName || 'document'}`}
              className="max-h-full w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100015] flex flex-col bg-slate-950 text-slate-100 antialiased">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/90 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-emerald-200"
            title="Back to document"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white sm:text-base">Visual</h1>
            <p className="truncate text-xs text-slate-500">{fileName}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => generateSingleVisual(activeVisualType)}
            disabled={loading}
            className="hidden rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 sm:inline-flex sm:items-center sm:gap-1.5 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            This view
          </button>
          <button
            type="button"
            onClick={generateAllVisuals}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-50 sm:text-sm"
          >
            {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" /> : <ArrowPathIcon className="h-4 w-4" />}
            Refresh all
          </button>
        </div>
      </header>

      <details className="group shrink-0 border-b border-slate-800/80 bg-slate-900/35 [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition hover:bg-slate-800/50 hover:text-slate-400">
          <span className="inline-flex items-center gap-2">
            From your document
            <span className="text-slate-600 group-open:rotate-180 motion-safe:transition-transform">▼</span>
          </span>
        </summary>
        <div className="max-h-44 overflow-y-auto border-t border-slate-800/60 px-3 py-2">
          {concepts ? (
            <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="mb-1 text-[10px] uppercase text-slate-500">Focus</p>
                <p className="font-medium text-emerald-100/95">{concepts.mainTopic}</p>
              </div>
              {concepts.keyConcepts?.length ? (
                <div>
                  <p className="mb-1 text-[10px] uppercase text-slate-500">Ideas</p>
                  <ul className="space-y-1 text-slate-300">
                    {concepts.keyConcepts.slice(0, 8).map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-slate-600">{i + 1}.</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {concepts.processes?.length ? (
                <div>
                  <p className="mb-1 text-[10px] uppercase text-slate-500">Steps</p>
                  <ol className="list-decimal space-y-1 pl-4 text-slate-300">
                    {concepts.processes.slice(0, 6).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{loading ? 'Extracting structure…' : 'Open a document with text, then refresh.'}</p>
          )}
        </div>
      </details>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800/80 px-2 py-2 sm:px-3" aria-label="Visual type">
            {VISUAL_TYPES.map((t) => {
              const on = activeVisualType === t.key;
              const Icon = t.Icon;
              const ready = Boolean(visuals[t.key]);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleVisualTypeChange(t.key)}
                  className={`flex min-w-[7.5rem] shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left transition sm:min-w-0 sm:flex-1 ${
                    on
                      ? 'border-emerald-600/50 bg-emerald-950/35 text-emerald-50 ring-1 ring-emerald-500/25'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span className="flex w-full items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="text-xs font-semibold sm:text-sm">{t.name}</span>
                    {ready ? <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title="Ready" /> : null}
                  </span>
                  <span className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">{t.hint}</span>
                </button>
              );
            })}
          </nav>

        <div className="active-learning-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto max-w-[min(1200px,100%)]">{renderMainVisual()}</div>
        </div>
      </main>
    </div>
  );
};

export default VisualDocxOverlay;
