'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowPathIcon,
  ChevronLeftIcon,
    BookOpenIcon,
    MagnifyingGlassIcon,
  ListBulletIcon,
  BookmarkIcon,
  PlayIcon,
    PauseIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const IMMERSIVE_REFLECTIVE_EVENT = 'assist-ed-immersive-reflective-learning';

const TABS = [
  { key: 'absorption', label: 'Read', Icon: BookOpenIcon },
  { key: 'analysis', label: 'Question', Icon: MagnifyingGlassIcon },
  { key: 'architecture', label: 'Structure', Icon: ListBulletIcon },
  { key: 'mastery', label: 'Keep', Icon: BookmarkIcon }
];

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ReflectiveLearning = ({ isActive, onClose, docxContent, fileName }) => {
    const [activePhase, setActivePhase] = useState('absorption');
  const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  const [contemplationSec, setContemplationSec] = useState(0);
    const [isContemplating, setIsContemplating] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [journal, setJournal] = useState([]);
  const [genTick, setGenTick] = useState(0);

  useLearningModeTracking('reflectiveLearning', isActive);

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-reflective-learning', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_REFLECTIVE_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-reflective-learning');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_REFLECTIVE_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

    useEffect(() => {
        if (isActive && docxContent) {
            trackBehavior('mode_activated', { mode: 'reflective', fileName });
        }
    }, [isActive, docxContent, fileName]);

  const generateContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/reflective-learning/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
          fileName: fileName || 'document'
        })
      });
      const data = await response.json().catch(() => ({}));
            if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      setPayload({
        readAnchors: data.readAnchors || [],
        phaseCopy: data.phaseCopy || {}
      });
    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not generate');
        } finally {
            setLoading(false);
        }
  }, [docxContent, fileName]);

  useEffect(() => {
    if (!isActive || !docxContent) return;
    generateContent();
  }, [isActive, docxContent, genTick, generateContent]);

  useEffect(() => {
    if (!isContemplating) return undefined;
    const id = setInterval(() => setContemplationSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isContemplating]);

  const requestRegenerate = () => {
    if (!window.confirm('Regenerate? Uses more API quota.')) return;
    setPayload(null);
    setJournal([]);
    setNoteDraft('');
    setContemplationSec(0);
        setIsContemplating(false);
    setGenTick((n) => n + 1);
  };

  const appendNote = () => {
    const t = noteDraft.trim();
    if (!t) return;
    setJournal((prev) => [
            ...prev,
      { id: Date.now(), phase: activePhase, text: t, at: new Date().toISOString() }
    ]);
    setNoteDraft('');
    trackBehavior('reflection_note_added', { mode: 'reflective', phase: activePhase });
    };

    if (!isActive) return null;

  const pc = payload?.phaseCopy || {};
  const anchors = payload?.readAnchors || [];

  const shell = (
    <div
      className="fixed inset-0 left-0 top-0 z-[100020] flex flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased"
      style={{
        paddingTop: typeof document !== 'undefined' && document.body.hasAttribute('data-has-ml-nav') ? '16px' : '0',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -15%, rgba(45,212,191,0.06), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(99,102,241,0.05), transparent 50%)'
      }}
    >
      <header className="shrink-0 border-b border-slate-800/90 bg-slate-950/95 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
                        <button
              type="button"
                            onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-teal-200"
              title="Back"
                        >
              <ChevronLeftIcon className="h-5 w-5" />
                        </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-50 sm:text-base">Reflect</h1>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
                        </div>
                    </div>
          <div className="flex shrink-0 items-center gap-2">
            {payload && !loading ? (
              <button
                type="button"
                onClick={requestRegenerate}
                className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 sm:text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Regenerate
                </span>
              </button>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
                …
                            </div>
            ) : null}
                    </div>
                </div>

        <div className="mt-2 flex w-full gap-1 border-t border-slate-800/80 pt-2 sm:gap-2">
          {TABS.map((t) => {
            const Icon = t.Icon;
            const on = activePhase === t.key;
            return (
                        <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                            onClick={() => {
                  setActivePhase(t.key);
                  trackBehavior('tab_switched', { mode: 'reflective', tab: t.key });
                }}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium sm:text-sm ${on
                  ? 'border-teal-600/50 bg-teal-950/40 text-teal-50 ring-1 ring-teal-500/30'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                <span className="truncate">{t.label}</span>
                        </button>
            );
          })}
                </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
              <p className="text-sm text-slate-400">Preparing quiet prompts from your document…</p>
                        </div>
                    </div>
                ) : error ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-md rounded-2xl border border-red-900/40 bg-red-950/25 p-6 text-center">
              <ExclamationTriangleIcon className="mx-auto mb-3 h-10 w-10 text-red-400" />
              <p className="text-sm text-red-200/90">{error}</p>
                            <button
                type="button"
                onClick={generateContent}
                className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-500"
                            >
                Try again
                            </button>
                        </div>
                    </div>
                ) : (
          <div className="active-learning-scroll mx-auto min-h-0 w-full max-w-[min(960px,calc(100%-0.5rem))] flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3 py-2">
              <div className="font-mono text-sm text-teal-200/90 tabular-nums">{formatMMSS(contemplationSec)}</div>
                                                <button
                type="button"
                onClick={() => setIsContemplating((c) => !c)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium sm:text-sm ${isContemplating
                  ? 'border-amber-700/50 bg-amber-950/40 text-amber-100'
                  : 'border-slate-600 bg-slate-800 text-slate-200'
                  }`}
              >
                {isContemplating ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                {isContemplating ? 'Pause' : 'Focus timer'}
                                            </button>
                                        </div>

            {activePhase === 'absorption' ? (
              <div className="space-y-5">
                                            <div className="space-y-3">
                  {anchors.map((a, i) => (
                    <article
                      key={i}
                      className="rounded-2xl border border-slate-800/90 bg-slate-900/45 p-4 sm:p-5"
                    >
                      <h2 className="text-sm font-semibold text-teal-200/95">{a.title}</h2>
                      <blockquote className="mt-2 border-l-2 border-teal-700/50 pl-3 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                        {a.excerpt}
                      </blockquote>
                      <p className="mt-3 text-sm text-slate-400">{a.prompt}</p>
                    </article>
                                                    ))}
                                                </div>
                <ul className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4">
                  {(pc.absorption?.prompts || []).map((p, i) => (
                    <li key={i} className="text-sm leading-relaxed text-slate-300">
                      <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ul>
                                        </div>
            ) : null}

            {activePhase === 'analysis' ? (
              <div className="space-y-5">
                <ul className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4">
                  {(pc.analysis?.prompts || []).map((p, i) => (
                    <li key={i} className="text-sm leading-relaxed text-slate-300">
                      <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tensions</p>
                  {(pc.analysis?.challenges || []).map((c, i) => (
                    <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                      {c}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
            ) : null}

            {activePhase === 'architecture' ? (
              <div className="space-y-5">
                <ol className="list-decimal space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4 pl-8">
                  {(pc.architecture?.bullets || []).map((b, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      {b}
                    </li>
                  ))}
                </ol>
                {pc.architecture?.prompt ? (
                  <p className="rounded-xl border border-teal-900/30 bg-teal-950/15 p-4 text-sm italic text-teal-100/85">{pc.architecture.prompt}</p>
                ) : null}
                                                            </div>
            ) : null}

            {activePhase === 'mastery' ? (
              <div className="space-y-5">
                <ul className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4">
                  {(pc.mastery?.prompts || []).map((p, i) => (
                    <li key={i} className="text-sm leading-relaxed text-slate-300">
                      <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ul>
                {pc.mastery?.capsulePrompt ? (
                  <p className="rounded-xl border border-indigo-900/35 bg-indigo-950/20 p-4 text-sm text-indigo-100/90">{pc.mastery.capsulePrompt}</p>
                ) : null}
                                        </div>
            ) : null}

            <div className="mt-8 border-t border-slate-800/80 pt-4">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Private log</label>
                                            <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Thoughts for your eyes only…"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="mt-2 flex justify-end">
                                                <button
                  type="button"
                  onClick={appendNote}
                  className="rounded-lg border border-teal-700/50 bg-teal-900/40 px-4 py-2 text-sm font-medium text-teal-50 hover:bg-teal-900/60"
                >
                  Add to log
                                                </button>
                                            </div>
              {journal.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {journal
                    .slice()
                    .reverse()
                    .map((j) => (
                      <li key={j.id} className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 text-sm text-slate-300">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">{j.phase}</span>
                        <p className="mt-1 whitespace-pre-wrap">{j.text}</p>
                      </li>
                    ))}
                </ul>
              ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

  return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default ReflectiveLearning;
