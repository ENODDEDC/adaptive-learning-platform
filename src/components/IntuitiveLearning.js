'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  SparklesIcon,
  EyeIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  ArrowsPointingOutIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const IMMERSIVE_CONSTELLATION_EVENT = 'assist-ed-immersive-constellation';

const UNIVERSE_PHASE_HINTS = {
  constellation: 'Wander the map — tap nodes; there is no single finish line.',
  clusters: 'Same ideas, grouped into neighborhoods you can compare.',
  frameworks: 'The lenses and language your source keeps leaning on.',
  innovations: 'Where clusters could combine into something new.'
};

const INSIGHT_PHASE_HINTS = {
  moments: 'Short bursts — pick the thread that pulls you in first.',
  bridges: 'Hidden wires between two ideas you might not pair yet.',
  themes: 'Gravity that keeps showing up across the material.',
  futures: 'Possible arcs — imagination fuel, not a forecast.'
};

const UNIVERSE_ORBIT_TAGS = ['Map', 'Group', 'Frame', 'Create'];
const INSIGHT_ORBIT_TAGS = ['Spark', 'Bridge', 'Weave', 'Horizon'];

/** Push overlapping constellation nodes apart; keeps positions near model hints. */
function relaxConstellationNodes(nodes, options = {}) {
  if (!nodes.length) return [];
  const margin = options.margin ?? 0.065;
  const iterations = options.iterations ?? 85;
  const damping = options.damping ?? 0.68;
  const n = nodes.length;
  const minDist =
    options.minDist ?? Math.min(0.15, Math.max(0.078, 0.55 / Math.sqrt(Math.max(n, 2))));

  const state = nodes.map((node) => ({
    ...node,
    ox: node.x,
    oy: node.y,
    x: node.x,
    y: node.y
  }));

  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = 0; i < state.length; i += 1) {
      for (let j = i + 1; j < state.length; j += 1) {
        const a = state[i];
        const b = state[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 1e-5) {
          const angle = ((i * 37 + j * 17) % 360) * (Math.PI / 180);
          dx = Math.cos(angle) * 0.001;
          dy = Math.sin(angle) * 0.001;
          dist = Math.hypot(dx, dy);
        }
        if (dist >= minDist) continue;
        const push = ((minDist - dist) / dist) * damping * 0.5;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }

    const pull = 0.038 * (1 - iter / iterations);
    for (const p of state) {
      p.x += (p.ox - p.x) * pull;
      p.y += (p.oy - p.y) * pull;
      p.x = Math.min(1 - margin, Math.max(margin, p.x));
      p.y = Math.min(1 - margin, Math.max(margin, p.y));
    }
  }

  return state.map(({ ox, oy, ...rest }) => rest);
}

const IntuitiveLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('universe');
  const [conceptUniverse, setConceptUniverse] = useState(null);
  const [insightPatterns, setInsightPatterns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [universeView, setUniverseView] = useState('constellation');
  const [insightView, setInsightView] = useState('moments');
  const [activeClusterIndex, setActiveClusterIndex] = useState(0);
  const [insightMomentIdx, setInsightMomentIdx] = useState(0);
  const [bridgeIdx, setBridgeIdx] = useState(0);
  const [themeIdx, setThemeIdx] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);

  // Automatic time tracking for ML classification
  useLearningModeTracking('intuitiveLearning', isActive);

  const starfield = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: `${(i * 19 + 11) % 90}%`,
        top: `${(i * 31 + 5) % 85}%`,
        delay: `${(i % 9) * 0.2}s`,
        dur: `${2.4 + (i % 5) * 0.3}s`
      })),
    []
  );

  const constellationGraph = useMemo(() => {
    const clusters = conceptUniverse?.conceptClusters;
    if (!clusters?.length) return { nodes: [], edges: [] };
    const nodes = [];
    const edges = [];
    const edgeKeys = new Set();
    const idByName = new Map();

    clusters.forEach((cluster, ci) => {
      const concepts = cluster.concepts || [];
      concepts.forEach((concept, k) => {
        const id = `n-${ci}-${k}`;
        idByName.set(String(concept.name || '').trim(), id);
        let x = Number(concept?.position?.x);
        let y = Number(concept?.position?.y);
        if (!Number.isFinite(x)) {
          x = concepts.length <= 1 ? 0.5 : (k + 0.5) / concepts.length;
        }
        if (!Number.isFinite(y)) {
          y = 0.18 + (ci / Math.max(clusters.length, 1)) * 0.58 + (k % 3) * 0.05;
        }
        nodes.push({
          id,
          clusterIndex: ci,
          clusterName: cluster.name,
          concept,
          x: Math.min(0.93, Math.max(0.07, x)),
          y: Math.min(0.9, Math.max(0.1, y))
        });
      });
    });

    clusters.forEach((cluster, ci) => {
      const concepts = cluster.concepts || [];
      if (concepts.length < 2) return;
      for (let i = 0; i < concepts.length; i += 1) {
        const j = (i + 1) % concepts.length;
        const a = `n-${ci}-${i}`;
        const b = `n-${ci}-${j}`;
        const k = [a, b].sort().join('|');
        if (edgeKeys.has(k)) continue;
        edgeKeys.add(k);
        edges.push({ from: a, to: b, type: 'cluster' });
      }
    });

    nodes.forEach((node) => {
      (node.concept.connections || []).forEach((targetName) => {
        const tid = idByName.get(String(targetName).trim());
        if (!tid || tid === node.id) return;
        const k = [node.id, tid].sort().join('|');
        if (edgeKeys.has(k)) return;
        edgeKeys.add(k);
        edges.push({ from: node.id, to: tid, type: 'link' });
      });
    });

    return { nodes: relaxConstellationNodes(nodes), edges };
  }, [conceptUniverse]);

  useEffect(() => {
    setActiveClusterIndex(0);
    setSelectedConcept(null);
  }, [conceptUniverse]);

  useEffect(() => {
    setInsightMomentIdx(0);
    setBridgeIdx(0);
    setThemeIdx(0);
    setScenarioIdx(0);
  }, [insightPatterns]);

  useEffect(() => {
    setInsightMomentIdx(0);
    setBridgeIdx(0);
    setThemeIdx(0);
    setScenarioIdx(0);
  }, [insightView]);

  useEffect(() => {
    if (universeView !== 'constellation') setSelectedConcept(null);
  }, [universeView]);

  /** Full-bleed: notify Layout (custom event + body flag) before paint; collapse main rail. */
  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-constellation', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_CONSTELLATION_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-constellation');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_CONSTELLATION_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

  const tabs = [
    {
      key: 'universe',
      name: 'Concept Universe',
      icon: SparklesIcon,
      description: 'Interactive constellation of interconnected concepts'
    },
    {
      key: 'insights',
      name: 'Pattern Discovery',
      icon: LightBulbIcon,
      description: 'Hidden patterns and creative insights'
    }
  ];

  const universeViews = [
    { key: 'constellation', name: 'Constellation View', icon: StarIcon },
    { key: 'clusters', name: 'Concept Clusters', icon: PuzzlePieceIcon },
    { key: 'frameworks', name: 'Theoretical Frameworks', icon: ArrowsPointingOutIcon },
    { key: 'innovations', name: 'Innovation Opportunities', icon: BoltIcon }
  ];

  const insightViews = [
    { key: 'moments', name: 'Insight Moments', icon: LightBulbIcon },
    { key: 'bridges', name: 'Conceptual Bridges', icon: ArrowsPointingOutIcon },
    { key: 'themes', name: 'Emergent Themes', icon: EyeIcon },
    { key: 'futures', name: 'Future Scenarios', icon: SparklesIcon }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateIntuitivContent();
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'intuitive', fileName });
    }
  }, [isActive, docxContent]);

  const generateIntuitivContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for conceptual analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intuitive-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.details || errorData?.error || errorMessage;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setConceptUniverse(result.conceptUniverse || null);
        setInsightPatterns(result.insightPatterns || null);
      } else {
        throw new Error(result.error || 'Failed to generate conceptual pattern discovery content');
      }
    } catch (error) {
      console.error('Error generating intuitive content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUniverseRoadmap = () => {
    if (!conceptUniverse) return null;
    const activeI = Math.max(0, universeViews.findIndex((v) => v.key === universeView));
    const anchor =
      conceptUniverse.conceptClusters?.[0]?.name ||
      conceptUniverse.hiddenPatterns?.[0]?.name ||
      (fileName ? String(fileName).replace(/\.[^.]+$/, '') : '') ||
      'this source';

    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Learning orbit</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300 font-medium">
              Anchor on <span className="font-semibold text-white">{anchor}</span> — then jump to any phase; order is
              yours.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-blue-600 bg-blue-700 px-4 py-2 text-right sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200">You are here</p>
            <p className="text-sm font-semibold text-white">{universeViews[activeI]?.name}</p>
          </div>
        </div>

        <div
          className="flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto scroll-smooth pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Concept universe phases"
        >
          {universeViews.map((view, i) => {
            const Icon = view.icon;
            const isHere = view.key === universeView;
            return (
              <React.Fragment key={view.key}>
                {i > 0 && (
                  <div
                    className="flex w-5 shrink-0 items-center justify-center text-xs font-light text-blue-400 sm:w-7"
                    aria-hidden
                  >
                    →
                  </div>
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={isHere}
                  onClick={() => {
                    setUniverseView(view.key);
                    trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                  }}
                  className={`flex w-[min(148px,42vw)] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-3 text-center transition sm:w-[min(160px,22%)] sm:max-w-[200px] sm:flex-1 ${
                    isHere
                      ? 'border-blue-500 bg-blue-600 shadow-md text-white'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isHere ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-600 text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight">{view.name}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    {UNIVERSE_ORBIT_TAGS[i]}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <p className="mt-3 border-t border-gray-700 pt-3 text-center text-xs leading-relaxed text-gray-400 sm:text-left">
          {UNIVERSE_PHASE_HINTS[universeView]}
        </p>
      </div>
    );
  };

  const renderInsightRoadmap = () => {
    if (!insightPatterns) return null;
    const activeI = Math.max(0, insightViews.findIndex((v) => v.key === insightView));
    const thread =
      insightPatterns.insightMoments?.[0]?.title ||
      insightPatterns.emergentThemes?.[0]?.name ||
      (fileName ? String(fileName).replace(/\.[^.]+$/, '') : '') ||
      'this thread';

    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Pattern trail</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300 font-medium">
              Start from <span className="font-semibold text-white">{thread}</span> — then follow curiosity, not a
              checklist.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-blue-600 bg-blue-700 px-4 py-2 text-right sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200">You are here</p>
            <p className="text-sm font-semibold text-white">{insightViews[activeI]?.name}</p>
          </div>
        </div>

        <div
          className="flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto scroll-smooth pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Pattern discovery phases"
        >
          {insightViews.map((view, i) => {
            const Icon = view.icon;
            const isHere = view.key === insightView;
            return (
              <React.Fragment key={view.key}>
                {i > 0 && (
                  <div
                    className="flex w-5 shrink-0 items-center justify-center text-xs font-light text-blue-400 sm:w-7"
                    aria-hidden
                  >
                    →
                  </div>
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={isHere}
                  onClick={() => {
                    setInsightView(view.key);
                    trackBehavior('tab_switched', { mode: 'intuitive', tab: `insight:${view.key}` });
                  }}
                  className={`flex w-[min(148px,42vw)] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-3 text-center transition sm:w-[min(160px,22%)] sm:max-w-[200px] sm:flex-1 ${
                    isHere
                      ? 'border-blue-500 bg-blue-600 shadow-md text-white'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isHere ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-600 text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight">{view.name}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    {INSIGHT_ORBIT_TAGS[i]}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <p className="mt-3 border-t border-gray-700 pt-3 text-center text-xs leading-relaxed text-gray-400 sm:text-left">
          {INSIGHT_PHASE_HINTS[insightView]}
        </p>
      </div>
    );
  };

  const renderConceptUniverse = () => {
    if (loading) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-gray-800 bg-gray-900">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
          <p className="text-sm text-gray-400">Mapping your constellation…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-red-800 bg-gray-900 px-6">
          <div className="text-center text-red-400">
            <p className="text-lg font-semibold">Constellation failed</p>
            <p className="mt-2 text-sm text-red-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={generateIntuitivContent}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!conceptUniverse) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-gray-800 bg-gray-900">
          <p className="text-center text-gray-300">
            <span className="block text-lg font-semibold text-white">No universe yet</span>
            <span className="mt-2 block text-sm text-gray-400">Generate to build a map from your document.</span>
          </p>
          <button
            type="button"
            onClick={generateIntuitivContent}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Generate
          </button>
        </div>
      );
    }

    return (
      <div className="h-full">
        {universeView === 'constellation' && (
          <div className="flex h-full">
            {/* Left Sidebar - Lens Controls */}
            <div className="w-[280px] border-r border-gray-800 bg-gray-900 p-4 flex-shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">View Lens</p>
              <div className="space-y-2">
                {universeViews.map((view) => {
                  const Icon = view.icon;
                  const isV = view.key === universeView;
                  return (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => {
                        setUniverseView(view.key);
                        trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                        isV
                          ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{view.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Additional Info */}
              <div className="mt-6 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="font-medium text-gray-300">Tip:</span> Each lens reveals different aspects of your concept universe. Switch between views to explore connections, patterns, and insights.
                </p>
              </div>
            </div>
            
            {/* Right Side - Constellation */}
            <div className="flex-1 min-h-0">
              {renderConstellation()}
            </div>
          </div>
        )}
        {universeView === 'clusters' && (
          <div className="h-full p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[280px,1fr] h-full">
              {/* Left Sidebar - Lens Controls */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 h-fit">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">View Lens</p>
                <div className="space-y-2">
                  {universeViews.map((view) => {
                    const Icon = view.icon;
                    const isV = view.key === universeView;
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => {
                          setUniverseView(view.key);
                          trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                          isV
                            ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{view.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Side - Content */}
              <div className="min-h-0 overflow-y-auto space-scrollbar">
                {renderConceptClusters()}
              </div>
            </div>
          </div>
        )}
        {universeView === 'frameworks' && (
          <div className="h-full p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[280px,1fr] h-full">
              {/* Left Sidebar - Lens Controls */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 h-fit">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">View Lens</p>
                <div className="space-y-2">
                  {universeViews.map((view) => {
                    const Icon = view.icon;
                    const isV = view.key === universeView;
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => {
                          setUniverseView(view.key);
                          trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                          isV
                            ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{view.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Side - Content */}
              <div className="min-h-0 overflow-y-auto space-scrollbar">
                {renderTheoreticalFrameworks()}
              </div>
            </div>
          </div>
        )}
        {universeView === 'innovations' && (
          <div className="h-full p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[280px,1fr] h-full">
              {/* Left Sidebar - Lens Controls */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 h-fit">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">View Lens</p>
                <div className="space-y-2">
                  {universeViews.map((view) => {
                    const Icon = view.icon;
                    const isV = view.key === universeView;
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => {
                          setUniverseView(view.key);
                          trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                          isV
                            ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{view.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Side - Content */}
              <div className="min-h-0 overflow-y-auto space-scrollbar">
                {renderInnovationOpportunities()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConstellation = () => {
    if (!conceptUniverse?.conceptClusters) return null;
    const { nodes, edges } = constellationGraph;

    return (
      <div className="h-full flex flex-col lg:flex-row">
        <div className="relative flex-1 bg-black">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            {starfield.map((s, i) => (
              <div
                key={i}
                className="absolute h-0.5 w-0.5 animate-pulse rounded-full bg-white"
                style={{
                  left: s.left,
                  top: s.top,
                  animationDelay: s.delay,
                  animationDuration: s.dur
                }}
              />
            ))}
          </div>

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="intuitive-edge" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {edges.map((e, i) => {
              const from = nodes.find((n) => n.id === e.from);
              const to = nodes.find((n) => n.id === e.to);
              if (!from || !to) return null;
              return (
                <line
                  key={`${e.from}-${e.to}-${i}`}
                  x1={from.x * 100}
                  y1={from.y * 100}
                  x2={to.x * 100}
                  y2={to.y * 100}
                  stroke={e.type === 'link' ? 'url(#intuitive-edge)' : 'rgba(59,130,246,0.4)'}
                  strokeWidth={e.type === 'link' ? 0.42 : 0.22}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {nodes.map((node) => {
            const active = selectedConcept?.name === node.concept.name;
            // Use bright terminal colors like real space interfaces
            const clusterColors = [
              '#3b82f6', // blue-500
              '#06b6d4', // cyan-500  
              '#10b981', // emerald-500
              '#f59e0b', // amber-500
              '#ef4444', // red-500
              '#8b5cf6', // violet-500
              '#ec4899', // pink-500
              '#84cc16'  // lime-500
            ];
            const nodeColor = clusterColors[node.clusterIndex % clusterColors.length];
            
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setSelectedConcept(node.concept);
                  trackBehavior('concept_explored', { mode: 'intuitive', conceptName: node.concept.name });
                }}
                className={`absolute max-w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? 'z-20 scale-[1.03] border-blue-400 ring-2 ring-blue-400 bg-gray-900'
                    : 'z-10 border-gray-700 hover:z-20 hover:scale-[1.02] hover:border-gray-600 bg-gray-900 hover:bg-gray-800'
                }`}
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: nodeColor }}
                  />
                  <span className="block max-w-full truncate text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    {node.clusterName}
                  </span>
                </div>
                <span className="mt-0.5 block text-xs font-semibold leading-snug text-white line-clamp-2">
                  {node.concept.name}
                </span>
              </button>
            );
          })}

          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-600/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white shadow-lg">
            <StarIcon className="h-5 w-5 text-blue-200" />
            <span>Live map</span>
          </div>
        </div>

        <aside className="flex w-full flex-col border-t border-gray-800 bg-gray-900 p-4 lg:w-[min(100%,340px)] lg:border-l lg:border-t-0 lg:shrink-0 space-scrollbar overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Focus</p>
          {selectedConcept ? (
            <div className="mt-3 flex flex-1 flex-col gap-3">
              <div>
                <h4 className="text-lg font-bold leading-tight text-white">{selectedConcept.name}</h4>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {selectedConcept.type}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-gray-300">{selectedConcept.description}</p>
              {selectedConcept.connections?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400">Linked ideas</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedConcept.connections.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedConcept.implications?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Where it leads</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
                    {selectedConcept.implications.slice(0, 4).map((im, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                        <span>{im}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedConcept(null)}
                className="mt-auto rounded-lg border border-gray-700 bg-gray-800 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                Clear focus
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Tap any node on the map. Lines show links inside a group (faint) and cross-connections from your
              material (bright).
            </p>
          )}
        </aside>
      </div>
    );
  };

  const renderConceptClusters = () => {
    if (!conceptUniverse?.conceptClusters?.length) return null;
    const clusters = conceptUniverse.conceptClusters;
    const idx = Math.min(activeClusterIndex, clusters.length - 1);
    const cluster = clusters[idx];

    return (
      <div className="grid gap-4 lg:grid-cols-[min(260px,100%),1fr]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {clusters.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveClusterIndex(i)}
              className={`shrink-0 rounded-2xl border px-3 py-2.5 text-left transition lg:w-full ${
                i === idx
                  ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="block text-sm font-semibold leading-snug line-clamp-2">{c.name}</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {c.concepts?.length || 0} concepts · {c.abstractionLevel}
              </span>
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Active cluster</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white leading-tight">{cluster.name}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300">{cluster.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
                {cluster.theme}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(cluster.concepts || []).map((concept, conceptIndex) => {
              // Use bright terminal colors like real space interfaces
              const clusterColors = [
                '#3b82f6', // blue-500
                '#06b6d4', // cyan-500  
                '#10b981', // emerald-500
                '#f59e0b', // amber-500
                '#ef4444', // red-500
                '#8b5cf6', // violet-500
                '#ec4899', // pink-500
                '#84cc16'  // lime-500
              ];
              const conceptColor = clusterColors[conceptIndex % clusterColors.length];
              
              return (
                <div
                  key={conceptIndex}
                  className="flex min-w-[140px] max-w-xs flex-1 flex-col rounded-2xl border border-gray-700 bg-gray-800 p-3 sm:min-w-[180px] shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: conceptColor }}
                    />
                    <h4 className="text-sm font-semibold leading-snug text-white line-clamp-2">{concept.name}</h4>
                  </div>
                  <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-gray-300">{concept.description}</p>
                  <span className="mt-2 inline-flex w-fit rounded-full border border-gray-600 bg-gray-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {concept.type}
                  </span>
                </div>
              );
            })}
          </div>

          {(cluster.emergentProperties?.length > 0 || cluster.futureDirections?.length > 0) && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {cluster.emergentProperties?.length > 0 && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Emergent</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cluster.emergentProperties.map((property, i) => (
                      <span key={i} className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs text-emerald-100">
                        {property}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cluster.futureDirections?.length > 0 && (
                <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200">Next moves</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cluster.futureDirections.map((direction, i) => (
                      <span key={i} className="rounded-full bg-blue-500/20 border border-blue-400/30 px-2.5 py-1 text-xs text-blue-100">
                        {direction}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTheoreticalFrameworks = () => {
    if (!conceptUniverse?.theoreticalFrameworks) return null;

    return (
      <div className="space-y-4">
        {conceptUniverse.theoreticalFrameworks.map((framework, index) => (
          <div key={index} className="relative">
            {/* Framework Root Node - Compact */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500 bg-blue-600">
                <ArrowsPointingOutIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{framework.name}</h3>
                <p className="text-xs text-gray-300 line-clamp-1">{framework.description}</p>
                <span className="inline-flex rounded-full border border-gray-600 bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-300 mt-1">
                  {framework.scope} scope
                </span>
              </div>
            </div>

            {/* Compact Tree Structure */}
            <div className="relative ml-4 pl-4 border-l border-gray-600">
              {/* Core Concepts Branch - Compact */}
              {framework.concepts && framework.concepts.length > 0 && (
                <div className="relative mb-3">
                  <div className="absolute -left-4 top-2 w-4 h-px bg-gray-600"></div>
                  <div className="absolute -left-4 top-2 w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-violet-300">C</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">Core Concepts</h4>
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    {framework.concepts.slice(0, 3).map((concept, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                        <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{concept}</span>
                      </div>
                    ))}
                    {framework.concepts.length > 3 && (
                      <div className="text-[10px] text-gray-400 ml-3">+{framework.concepts.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Principles Branch - Compact */}
              {framework.principles && framework.principles.length > 0 && (
                <div className="relative mb-3">
                  <div className="absolute -left-4 top-2 w-4 h-px bg-gray-600"></div>
                  <div className="absolute -left-4 top-2 w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-cyan-300">P</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Principles</h4>
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    {framework.principles.slice(0, 2).map((principle, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{principle}</span>
                      </div>
                    ))}
                    {framework.principles.length > 2 && (
                      <div className="text-[10px] text-gray-400 ml-3">+{framework.principles.length - 2} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Applications Branch - Compact */}
              {framework.applications && framework.applications.length > 0 && (
                <div className="relative mb-3">
                  <div className="absolute -left-4 top-2 w-4 h-px bg-gray-600"></div>
                  <div className="absolute -left-4 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-300">A</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Applications</h4>
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    {framework.applications.slice(0, 2).map((application, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{application}</span>
                      </div>
                    ))}
                    {framework.applications.length > 2 && (
                      <div className="text-[10px] text-gray-400 ml-3">+{framework.applications.length - 2} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Extensions Branch - Compact */}
              {framework.extensions && framework.extensions.length > 0 && (
                <div className="relative mb-3">
                  <div className="absolute -left-4 top-2 w-4 h-px bg-gray-600"></div>
                  <div className="absolute -left-4 top-2 w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-yellow-300">E</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300">Extensions</h4>
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    {framework.extensions.slice(0, 2).map((extension, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                        <div className="w-1 h-1 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{extension}</span>
                      </div>
                    ))}
                    {framework.extensions.length > 2 && (
                      <div className="text-[10px] text-gray-400 ml-3">+{framework.extensions.length - 2} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Limitations Branch - Compact */}
              {framework.limitations && framework.limitations.length > 0 && (
                <div className="relative mb-3">
                  <div className="absolute -left-4 top-2 w-4 h-px bg-gray-600"></div>
                  <div className="absolute -left-4 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-red-300">L</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">Limitations</h4>
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    {framework.limitations.slice(0, 2).map((limitation, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-200">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{limitation}</span>
                      </div>
                    ))}
                    {framework.limitations.length > 2 && (
                      <div className="text-[10px] text-gray-400 ml-3">+{framework.limitations.length - 2} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Compact separator between frameworks */}
            {index < conceptUniverse.theoreticalFrameworks.length - 1 && (
              <div className="my-4 border-t border-gray-700/50"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInnovationOpportunities = () => {
    if (!conceptUniverse?.innovationOpportunities) return null;

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {conceptUniverse.innovationOpportunities.map((opportunity, index) => (
          <div
            key={index}
            className="flex flex-col rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg"
          >
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <BoltIcon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-snug text-white">{opportunity.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-300">{opportunity.description}</p>
                <span className="mt-2 inline-flex rounded-full border border-gray-600 bg-gray-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-300">
                  {opportunity.timeline}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {opportunity.conceptCombination?.map((concept, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-400">+</span>}
                  <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-200">
                    {concept}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Novelty', v: opportunity.novelty, tone: 'text-blue-200' },
                { label: 'Feasible', v: opportunity.feasibility, tone: 'text-emerald-200' },
                { label: 'Impact', v: opportunity.impact, tone: 'text-cyan-200' }
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-gray-700 bg-gray-900 px-2 py-3 text-center"
                >
                  <div className={`text-xl font-bold tabular-nums ${m.tone}`}>
                    {Math.round((m.v || 0.5) * 100)}%
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div className="mt-4 rounded-xl border border-gray-700 bg-gray-900 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Needs</p>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
                  {opportunity.requirements.map((requirement, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInsightPatterns = () => {
    if (loading) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-gray-800 bg-gray-900">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
          <p className="text-sm text-gray-400">Surfacing patterns…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-red-800 bg-gray-900 px-6">
          <div className="text-center text-red-400">
            <p className="text-lg font-semibold">Patterns failed</p>
            <p className="mt-2 text-sm text-red-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={generateIntuitivContent}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!insightPatterns) {
      return (
        <div className="flex min-h-[60vh] h-full flex-col items-center justify-center space-y-4 rounded-2xl border border-gray-800 bg-gray-900">
          <p className="text-center text-gray-300">
            <span className="block text-lg font-semibold text-white">No patterns yet</span>
            <span className="mt-2 block text-sm text-gray-400">Generate to mine this document for links and themes.</span>
          </p>
          <button
            type="button"
            onClick={generateIntuitivContent}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Generate
          </button>
        </div>
      );
    }

    return (
      <div className="h-full p-4 sm:p-6">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-300 font-medium leading-relaxed">
              <span className="font-semibold text-white">Scan → pick one thread → go deep.</span> The trail is a compass,
              not homework — jump to any stop.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-1">Links</span>
              <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-1">Themes</span>
              <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-1">Horizons</span>
            </div>
          </div>

          {renderInsightRoadmap()}

          {insightView === 'moments' && renderInsightMoments()}
          {insightView === 'bridges' && renderConceptualBridges()}
          {insightView === 'themes' && renderEmergentThemes()}
          {insightView === 'futures' && renderFutureScenarios()}
        </div>
      </div>
    );
  };

  const renderInsightMoments = () => {
    if (!insightPatterns?.insightMoments?.length) return null;
    const moments = insightPatterns.insightMoments;
    const idx = Math.min(insightMomentIdx, moments.length - 1);
    const insight = moments[idx];

    return (
      <div className="grid gap-4 lg:grid-cols-[min(280px,100%),1fr]">
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-2">
          {moments.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInsightMomentIdx(i)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                i === idx
                  ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {m.type} · {m.depth}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-snug line-clamp-2">{m.title}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-300">
              {insight.type}
            </span>
            <span className="rounded-full border border-gray-600 bg-gray-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-300">
              {insight.depth}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white">{insight.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-gray-300 font-medium">{insight.description}</p>

          {insight.conceptsConnected?.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400">Connected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insight.conceptsConnected.map((concept, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 text-xs text-cyan-100"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200">Why it matters</p>
              <p className="mt-2 text-sm leading-relaxed text-blue-100">{insight.reasoning}</p>
            </div>
            {insight.implications?.length > 0 && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Implications</p>
                <ul className="mt-2 space-y-2 text-sm text-emerald-100">
                  {insight.implications.map((implication, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      <span>{implication}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {insight.questions?.length > 0 && (
            <div className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-200">Questions to chase</p>
              <ul className="mt-2 space-y-2 text-sm text-yellow-100">
                {insight.questions.map((question, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-yellow-300">?</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConceptualBridges = () => {
    if (!insightPatterns?.conceptualBridges?.length) return null;
    const bridges = insightPatterns.conceptualBridges;
    const idx = Math.min(bridgeIdx, bridges.length - 1);
    const bridge = bridges[idx];

    return (
      <div className="grid gap-4 lg:grid-cols-[min(260px,100%),1fr]">
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-2">
          {bridges.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBridgeIdx(i)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                i === idx
                  ? 'border-cyan-500 bg-cyan-600 text-white shadow-md'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {b.bridgeType}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-snug line-clamp-2">{b.name}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <h3 className="text-xl font-bold text-white">{bridge.name}</h3>
          <p className="mt-2 text-sm text-gray-300">{bridge.description}</p>

          <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">From</p>
              <p className="mt-2 text-sm font-semibold leading-snug text-white">{bridge.fromConcept}</p>
            </div>
            <div className="flex shrink-0 items-center justify-center px-2">
              <div className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                {bridge.bridgeType}
              </div>
            </div>
            <div className="flex-1 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-200/90">To</p>
              <p className="mt-2 text-sm font-semibold leading-snug text-white">{bridge.toConcept}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">How it links</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{bridge.explanation}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">Reveals</p>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-50/95">
                {bridge.implications?.map((implication, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
                    <span>{implication}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-200">Examples</p>
              <ul className="mt-2 space-y-1.5 text-sm text-yellow-100">
                {bridge.examples?.map((example, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-yellow-300" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-700 bg-gray-800 py-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-cyan-200">
                {Math.round((bridge.strength || 0.5) * 100)}%
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Strength</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 py-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-fuchsia-200">
                {Math.round((bridge.novelty || 0.5) * 100)}%
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Novelty</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmergentThemes = () => {
    if (!insightPatterns?.emergentThemes?.length) return null;
    const themes = insightPatterns.emergentThemes;
    const idx = Math.min(themeIdx, themes.length - 1);
    const theme = themes[idx];

    return (
      <div className="grid gap-4 lg:grid-cols-[min(260px,100%),1fr]">
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-2">
          {themes.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setThemeIdx(i)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                i === idx
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t.abstractionLevel} · {t.universality}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-snug line-clamp-2">{t.name}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-100">
              {theme.abstractionLevel}
            </span>
            <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-medium text-teal-100">
              {theme.universality}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white leading-tight">{theme.name}</h3>
          <p className="mt-2 text-base leading-relaxed text-gray-300">{theme.description}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:min-h-[120px] sm:items-center">
            <div className="w-full max-w-md rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-center sm:w-auto sm:max-w-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">Theme hub</p>
              <p className="mt-2 text-lg font-bold text-white">{theme.name}</p>
            </div>
            <div className="flex flex-1 flex-wrap justify-center gap-2">
              {theme.concepts?.map((concept, i) => (
                <span
                  key={i}
                  className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>

          {theme.manifestations?.length > 0 && (
            <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-200/90">Shows up as</p>
              <ul className="mt-2 space-y-2 text-sm text-sky-50/95">
                {theme.manifestations.map((manifestation, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-300" />
                    <span>{manifestation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">Evolution</p>
              <p className="mt-2 text-sm leading-relaxed text-violet-50/95">{theme.evolution}</p>
            </div>
            {theme.crossDomainApplications?.length > 0 && (
              <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-200/90">Elsewhere</p>
                <ul className="mt-2 space-y-1.5 text-sm text-orange-50/95">
                  {theme.crossDomainApplications.map((application, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-300" />
                      <span>{application}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFutureScenarios = () => {
    if (!insightPatterns?.futureScenarios?.length) return null;
    const scenarios = insightPatterns.futureScenarios;
    const idx = Math.min(scenarioIdx, scenarios.length - 1);
    const scenario = scenarios[idx];

    return (
      <div className="grid gap-4 lg:grid-cols-[min(260px,100%),1fr]">
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-2">
          {scenarios.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScenarioIdx(i)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                i === idx
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {s.timeline}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-snug line-clamp-2">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-400/35 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-100">
              {scenario.timeline}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
              Horizon
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white leading-tight">{scenario.name}</h3>
          <p className="mt-2 text-base leading-relaxed text-gray-300">{scenario.description}</p>

          {scenario.basedOnConcepts?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {scenario.basedOnConcepts.map((concept, i) => (
                <span
                  key={i}
                  className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs text-violet-50"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-700 bg-gray-800 py-4 text-center">
              <div className="text-3xl font-bold tabular-nums text-emerald-200">
                {Math.round((scenario.probability || 0.5) * 100)}%
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Probability</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 py-4 text-center">
              <div className="text-3xl font-bold tabular-nums text-orange-200">
                {Math.round((scenario.impact || 0.5) * 100)}%
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Impact</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/90">Requirements</p>
              <ul className="mt-2 space-y-2 text-sm text-indigo-50/95">
                {scenario.requirements?.map((requirement, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-300" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-200/90">Signals</p>
              <ul className="mt-2 space-y-2 text-sm text-fuchsia-50/95">
                {scenario.indicators?.map((indicator, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fuchsia-300" />
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {scenario.implications?.length > 0 && (
            <div className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-200">If this happens</p>
              <ul className="mt-2 space-y-2 text-sm text-yellow-100">
                {scenario.implications.map((implication, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-yellow-300" />
                    <span>{implication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isActive) return null;

  const shell = (
    <div
      className="fixed inset-0 left-0 top-0 z-[100020] flex flex-col bg-black"
      style={{ paddingTop: document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0' }}
    >
      {/* Professional Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        {/* Main Header Row */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              title="Back to document"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400 truncate max-w-[300px]">{fileName}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isT = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    isT
                      ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.name}
                </button>
              );
            })}
            
            <button
              onClick={generateIntuitivContent}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 text-sm font-medium shadow-md"
              title="Regenerate concept constellation"
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
        
        {/* Sub Header - Quick Info */}
        <div className="flex items-center justify-between px-6 py-2 bg-gray-800/50 border-t border-gray-700/50">
          <p className="text-sm text-gray-300">
            <span className="font-medium text-white">Big picture first:</span> scan the map, then open a lens for detail
          </p>
          
          <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <span className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1">Patterns</span>
            <span className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1">Links</span>
            <span className="rounded-full border border-gray-600 bg-gray-700 px-3 py-1">Implications</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-scrollbar">
        <div className="h-full">
          {activeTab === 'universe' && renderConceptUniverse()}
          {activeTab === 'insights' && renderInsightPatterns()}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default IntuitiveLearning;
