'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { JetBrains_Mono } from 'next/font/google';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  CalculatorIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const IMMERSIVE_SENSING_EVENT = 'assist-ed-immersive-sensing';

const labMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sensing-mono',
  display: 'swap'
});

const readoutType = 'font-[family-name:var(--font-sensing-mono),ui-monospace,monospace] tabular-nums';

function parseInteractiveNumber(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function formatReadoutNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const rounded = Math.round(n * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
  return String(rounded).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function combineNumericValues(nums, combineRaw) {
  const mode = String(combineRaw || 'sum').toLowerCase();
  if (!nums.length) return null;
  switch (mode) {
    case 'product':
      return nums.reduce((a, b) => a * b, 1);
    case 'mean':
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    default:
      return nums.reduce((a, b) => a + b, 0);
  }
}

function patternIcon(sim) {
  if (sim?.labPattern === 'dual_input_calculate') return 'calc';
  if (sim?.labPattern === 'dropdown_readout') return 'dropdown';
  return 'slider';
}

const SensingLearning = ({ isActive, onClose, docxContent, fileName }) => {
  const [activeTab, setActiveTab] = useState('simulations');
  const [simulations, setSimulations] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSimulation, setActiveSimulation] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [simulationInputs, setSimulationInputs] = useState({});
  const [challengeProgress, setChallengeProgress] = useState({});

  useLearningModeTracking('sensingLearning', isActive);

  const tabs = useMemo(
    () => [
      { key: 'simulations', name: 'Lab', icon: BeakerIcon },
      { key: 'challenges', name: 'Challenges', icon: PuzzlePieceIcon }
    ],
    []
  );

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isActive) return undefined;
    document.body.setAttribute('data-immersive-sensing', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_SENSING_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-sensing');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_SENSING_EVENT, { detail: { open: false } }));
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && docxContent) {
      generateSensingContent();
      trackBehavior('mode_activated', { mode: 'sensing', fileName });
    }
  }, [isActive, docxContent]);

  const generateSensingContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for hands-on analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sensing-learning/generate', {
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
          // ignore
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setSimulations(result.simulations || []);
        setChallenges(result.challenges || []);

        if (result.simulations && result.simulations.length > 0) {
          const initialInputs = {};
          result.simulations.forEach((sim, simIndex) => {
            if (sim.labPattern === 'slider_readout') {
              initialInputs[simIndex] = { slider: String(sim.sliderDefault ?? 0) };
            } else if (sim.labPattern === 'dual_input_calculate') {
              initialInputs[simIndex] = {
                inputA: String(sim.inputADefault ?? 0),
                inputB: String(sim.inputBDefault ?? 0)
              };
            } else if (sim.labPattern === 'dropdown_readout') {
              initialInputs[simIndex] = { dropdown: sim.defaultOption ?? sim.options?.[0] ?? '' };
            } else {
              initialInputs[simIndex] = { slider: '0' };
            }
          });
          setSimulationInputs(initialInputs);
        }

        if (result.challenges && result.challenges.length > 0) {
          const initialProgress = {};
          result.challenges.forEach((challenge, challengeIndex) => {
            initialProgress[challengeIndex] = {
              currentStep: 0,
              completedCheckpoints: [],
              startTime: Date.now()
            };
          });
          setChallengeProgress(initialProgress);
        }
      } else {
        throw new Error(result.error || 'Failed to generate sensing learning content');
      }
    } catch (err) {
      console.error('Error generating sensing content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasFullContent = simulations.length > 0 && challenges.length > 0;

  const requestRegenerate = () => {
    if (!window.confirm('Regenerate lab? Uses more API quota.')) return;
    generateSensingContent();
  };

  const handleSimulationInputChange = (simIndex, elementName, value) => {
    setSimulationInputs((prev) => ({
      ...prev,
      [simIndex]: {
        ...prev[simIndex],
        [elementName]: value
      }
    }));
    trackBehavior('interactive_element_used', {
      mode: 'sensing',
      elementType: 'simulation_input',
      elementName,
      value
    });
  };

  const handleChallengeStepComplete = (challengeIndex, stepIndex) => {
    setChallengeProgress((prev) => ({
      ...prev,
      [challengeIndex]: {
        ...prev[challengeIndex],
        currentStep: Math.max(prev[challengeIndex]?.currentStep || 0, stepIndex + 1)
      }
    }));
    trackBehavior('step_completed', { mode: 'sensing', challengeIndex, stepIndex });
  };

  const handleCheckpointComplete = (challengeIndex, checkpointIndex) => {
    setChallengeProgress((prev) => {
      const currentProgress = prev[challengeIndex] || { completedCheckpoints: [] };
      const newCheckpoints = [...currentProgress.completedCheckpoints];
      if (!newCheckpoints.includes(checkpointIndex)) {
        newCheckpoints.push(checkpointIndex);
      }
      return {
        ...prev,
        [challengeIndex]: {
          ...currentProgress,
          completedCheckpoints: newCheckpoints
        }
      };
    });
    trackBehavior('checkpoint_completed', { mode: 'sensing', challengeIndex, checkpointIndex });
  };

  const renderHeaderTabs = () => (
    <nav
      className="inline-flex w-full max-w-[min(100%,260px)] rounded-md border border-cyan-900/50 bg-slate-950/90 p-0.5 sm:w-auto sm:max-w-none"
      role="tablist"
      aria-label="Hands-on lab views"
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
              trackBehavior('tab_switched', { mode: 'sensing', tab: tab.key });
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition sm:flex-initial sm:px-3 sm:text-sm ${
              selected
                ? 'bg-cyan-500/20 text-cyan-100 shadow-inner ring-1 ring-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" />
            <span className="truncate">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderSimulations = () => {
    if (loading) {
      return (
        <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
          <p className="text-sm text-slate-400">Setting up instruments…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/40 bg-red-950/25 px-6 text-center">
          <p className="text-lg font-semibold text-red-200">Lab failed</p>
          <p className="max-w-md text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={generateSensingContent}
            className="rounded-lg border border-cyan-700 bg-cyan-600 px-5 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!simulations || simulations.length === 0) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 px-6 text-center">
          <p className="text-base font-medium text-slate-200">No lab runs yet</p>
          <button
            type="button"
            onClick={generateSensingContent}
            className="rounded-lg border border-cyan-600 bg-cyan-600/90 px-5 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            Generate
          </button>
        </div>
      );
    }

    const currentSim = simulations[activeSimulation];
    const currentInputs = simulationInputs[activeSimulation] || {};

    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-600/90">Runs</p>
            <span className="text-xs font-medium tabular-nums text-slate-500">
              {activeSimulation + 1} / {simulations.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-4">
            {simulations.map((sim, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSimulation(index)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  index === activeSimulation
                    ? 'border-cyan-500/60 bg-cyan-950/80 text-cyan-50 shadow-sm ring-1 ring-cyan-500/30'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-cyan-800 hover:bg-slate-900'
                }`}
              >
                {patternIcon(sim) === 'calc' && <CalculatorIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {patternIcon(sim) === 'dropdown' && <CogIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {patternIcon(sim) === 'slider' && <ChartBarIcon className="h-4 w-4 shrink-0 opacity-90" />}
                <span className="max-w-[200px] truncate font-medium">{sim.title}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35">
          <header className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-800/60 bg-cyan-950/50 text-cyan-300">
                {patternIcon(currentSim) === 'calc' && <CalculatorIcon className="h-5 w-5" />}
                {patternIcon(currentSim) === 'dropdown' && <CogIcon className="h-5 w-5" />}
                {patternIcon(currentSim) === 'slider' && <ChartBarIcon className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">{currentSim.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{currentSim.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-400">
              <ClockIcon className="h-3.5 w-3.5 text-cyan-600" />
              {currentSim.estimatedTime}
            </div>
          </header>

          <div className="grid gap-5 p-4 lg:grid-cols-12 lg:gap-6 lg:p-5">
            <div className="lg:col-span-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Controls</p>
              <div className="space-y-3">
                {currentSim.labPattern === 'slider_readout' && (
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                    <label className="block text-sm font-medium text-slate-200">{currentSim.sliderLabel}</label>
                    <div className="mt-3 space-y-2">
                      <input
                        type="range"
                        min={currentSim.sliderMin}
                        max={currentSim.sliderMax}
                        step={currentSim.sliderStep || 'any'}
                        value={currentInputs.slider ?? String(currentSim.sliderDefault)}
                        onChange={(e) => {
                          handleSimulationInputChange(activeSimulation, 'slider', e.target.value);
                          trackBehavior('interactive_element_used', {
                            mode: 'sensing',
                            elementType: 'slider',
                            labPattern: 'slider_readout'
                          });
                        }}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-cyan-400"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>
                          {currentSim.sliderMin} {currentSim.sliderUnit}
                        </span>
                        <span className={`font-semibold text-cyan-400 ${readoutType}`}>
                          {currentInputs.slider ?? currentSim.sliderDefault} {currentSim.sliderUnit}
                        </span>
                        <span>
                          {currentSim.sliderMax} {currentSim.sliderUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {currentSim.labPattern === 'dual_input_calculate' && (
                  <>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                      <label className="block text-sm font-medium text-slate-200">{currentSim.inputALabel}</label>
                      <input
                        type="number"
                        value={currentInputs.inputA ?? String(currentSim.inputADefault)}
                        onChange={(e) => {
                          handleSimulationInputChange(activeSimulation, 'inputA', e.target.value);
                          trackBehavior('interactive_element_used', {
                            mode: 'sensing',
                            elementType: 'input',
                            labPattern: 'dual_input_calculate'
                          });
                        }}
                        className="mt-3 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                      <label className="block text-sm font-medium text-slate-200">{currentSim.inputBLabel}</label>
                      <input
                        type="number"
                        value={currentInputs.inputB ?? String(currentSim.inputBDefault)}
                        onChange={(e) => {
                          handleSimulationInputChange(activeSimulation, 'inputB', e.target.value);
                          trackBehavior('interactive_element_used', {
                            mode: 'sensing',
                            elementType: 'input',
                            labPattern: 'dual_input_calculate'
                          });
                        }}
                        className="mt-3 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                      />
                    </div>
                  </>
                )}

                {currentSim.labPattern === 'dropdown_readout' && (
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                    <label className="block text-sm font-medium text-slate-200">{currentSim.dropdownLabel}</label>
                    <select
                      value={
                        currentSim.options?.includes(currentInputs.dropdown)
                          ? currentInputs.dropdown
                          : currentSim.defaultOption
                      }
                      onChange={(e) => {
                        handleSimulationInputChange(activeSimulation, 'dropdown', e.target.value);
                        trackBehavior('interactive_element_used', {
                          mode: 'sensing',
                          elementType: 'dropdown',
                          labPattern: 'dropdown_readout'
                        });
                      }}
                      className="mt-3 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    >
                      {(currentSim.options || []).map((option, optIndex) => (
                        <option key={optIndex} value={option} className="bg-slate-900">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Readout</p>
              <div className="rounded-lg border border-cyan-800/40 bg-gradient-to-br from-cyan-950/50 to-slate-950/80 p-4 ring-1 ring-cyan-500/10">
                <div className="grid gap-3">
                  {currentSim.labPattern === 'slider_readout' && (
                    <div className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-600/90">
                        {currentSim.readoutLabel}
                      </p>
                      <p className={`mt-1 text-3xl font-semibold text-cyan-300 ${readoutType}`}>
                        {formatReadoutNumber(parseInteractiveNumber(currentInputs.slider ?? currentSim.sliderDefault))}{' '}
                        {currentSim.sliderUnit}
                      </p>
                      {currentSim.readoutDescription && (
                        <p className="mt-2 text-xs leading-snug text-slate-500">{currentSim.readoutDescription}</p>
                      )}
                    </div>
                  )}
                  {currentSim.labPattern === 'dual_input_calculate' && (
                    <div className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-600/90">
                        {currentSim.readoutLabel}{' '}
                        <span className="normal-case text-slate-500">({currentSim.combine})</span>
                      </p>
                      <p className={`mt-1 text-3xl font-semibold text-cyan-300 ${readoutType}`}>
                        {(() => {
                          const a = parseInteractiveNumber(currentInputs.inputA ?? currentSim.inputADefault);
                          const b = parseInteractiveNumber(currentInputs.inputB ?? currentSim.inputBDefault);
                          if (a === null || b === null) return '—';
                          const v = combineNumericValues([a, b], currentSim.combine);
                          return v === null ? '—' : formatReadoutNumber(v);
                        })()}
                      </p>
                      {currentSim.readoutDescription && (
                        <p className="mt-2 text-xs leading-snug text-slate-500">{currentSim.readoutDescription}</p>
                      )}
                    </div>
                  )}
                  {currentSim.labPattern === 'dropdown_readout' && (
                    <div className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-600/90">{currentSim.readoutTitle}</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-200">
                        {(() => {
                          const opts = currentSim.options || [];
                          const raw = currentInputs.dropdown ?? currentSim.defaultOption;
                          const sel = opts.includes(raw) ? raw : opts[0];
                          const i = Math.max(0, opts.indexOf(sel));
                          return currentSim.optionDescriptions?.[i] || sel || '—';
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 px-4 py-4 sm:px-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Procedure</p>
            <ol className="space-y-3">
              {currentSim.stepByStepGuide?.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-900/60 bg-cyan-950/40 text-xs font-bold text-cyan-400">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-400">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 border-t border-slate-800 bg-slate-950/30 p-4 sm:grid-cols-2 sm:p-5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Objectives</p>
              <ul className="mt-3 space-y-2">
                {currentSim.learningObjectives?.map((objective, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Real world</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{currentSim.realWorldApplication}</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderChallenges = () => {
    if (loading) {
      return (
        <div className="flex min-h-[min(70vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
          <p className="text-sm text-slate-400">Loading challenges…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-red-900/40 bg-red-950/25 px-6 text-center">
          <p className="text-lg font-semibold text-red-200">Setup failed</p>
          <p className="max-w-md text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={generateSensingContent}
            className="rounded-lg border border-teal-600 bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!challenges || challenges.length === 0) {
      return (
        <div className="flex min-h-[min(70vh,380px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 px-6 text-center">
          <p className="text-base font-medium text-slate-200">No challenges yet</p>
          <button
            type="button"
            onClick={generateSensingContent}
            className="rounded-lg border border-teal-600 bg-teal-600/90 px-5 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            Generate
          </button>
        </div>
      );
    }

    const currentChallenge = challenges[activeChallenge];
    const currentProgress = challengeProgress[activeChallenge] || { currentStep: 0, completedCheckpoints: [] };

    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">Pick task</p>
            <span className="text-xs font-medium tabular-nums text-slate-500">
              {activeChallenge + 1} / {challenges.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-4">
            {challenges.map((challenge, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveChallenge(index)}
                className={`flex min-w-[140px] max-w-[240px] shrink-0 flex-col rounded-lg border px-3 py-2 text-left transition ${
                  index === activeChallenge
                    ? 'border-teal-500/50 bg-teal-950/70 text-teal-50 ring-1 ring-teal-500/30'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-teal-900 hover:bg-slate-900'
                }`}
              >
                <span className="truncate text-sm font-semibold">{challenge.title}</span>
                {challenge.category && (
                  <span
                    className={`mt-0.5 truncate text-[11px] ${index === activeChallenge ? 'text-teal-200/80' : 'text-slate-500'}`}
                  >
                    {challenge.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35">
          <header className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-teal-800/50 bg-teal-950/40 text-teal-300">
                <PuzzlePieceIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">{currentChallenge.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{currentChallenge.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-400">
              <ClockIcon className="h-3.5 w-3.5 text-teal-500" />
              {currentChallenge.estimatedTime}
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Materials</p>
              <ul className="mt-3 space-y-2">
                {currentChallenge.materials?.map((material, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                    {material}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Success</p>
              <ul className="mt-3 space-y-2">
                {currentChallenge.successMetrics?.map((metric, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Link out</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{currentChallenge.realWorldConnection}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 px-4 py-4 sm:px-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Steps</p>
            <div className="space-y-4">
              {currentChallenge.procedure?.map((step, index) => {
                const done = index < currentProgress.currentStep;
                const active = index === currentProgress.currentStep;
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 transition-colors ${
                      done
                        ? 'border-teal-900/60 bg-teal-950/25'
                        : active
                          ? 'border-cyan-600/40 bg-cyan-950/20 ring-1 ring-cyan-500/25'
                          : 'border-slate-800 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                          done ? 'bg-teal-600' : active ? 'bg-cyan-600' : 'bg-slate-600'
                        }`}
                      >
                        {done ? '✓' : step.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {step.step}</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{step.instruction}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Expected</p>
                            <p className="mt-1 text-xs text-slate-400">{step.expectedResult}</p>
                          </div>
                          <div className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Tips</p>
                            <p className="mt-1 text-xs text-slate-400">{step.tips}</p>
                          </div>
                        </div>
                        {index >= currentProgress.currentStep && (
                          <button
                            type="button"
                            onClick={() => handleChallengeStepComplete(activeChallenge, index)}
                            className="mt-3 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
                          >
                            Mark complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-4 sm:px-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Checkpoints</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentChallenge.checkpoints?.map((checkpoint, index) => {
                const cpDone = currentProgress.completedCheckpoints.includes(index);
                return (
                  <div
                    key={index}
                    className={`flex gap-3 rounded-lg border p-3.5 ${
                      cpDone ? 'border-teal-800/60 bg-teal-950/30' : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCheckpointComplete(activeChallenge, index)}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition ${
                        cpDone ? 'bg-teal-600' : 'bg-cyan-700 hover:bg-cyan-600'
                      }`}
                      aria-pressed={cpDone}
                    >
                      {cpDone ? '✓' : index + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{checkpoint.checkpoint}</p>
                      <p className="mt-1 text-xs text-slate-500">{checkpoint.criteria}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{checkpoint.troubleshooting}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentChallenge.extensionActivities?.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-4 sm:px-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Extensions</p>
              <div className="flex flex-wrap gap-2">
                {currentChallenge.extensionActivities.map((activity, index) => (
                  <span
                    key={index}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  };

  if (!isActive) return null;

  const shell = (
    <div
      className={`fixed inset-0 left-0 top-0 z-[100020] flex flex-col bg-slate-950 text-slate-100 antialiased ${labMono.variable} font-sans`}
      style={{
        paddingTop: typeof document !== 'undefined' && document.body.hasAttribute('data-has-ml-nav') ? '48px' : '0',
        backgroundImage:
          'radial-gradient(ellipse 90% 60% at 50% -25%, rgba(6,182,212,0.08), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(13,148,136,0.06), transparent)'
      }}
    >
      <header className="border-b border-slate-800/90 bg-slate-950/95 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-[min(1200px,calc(100%-0.25rem))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-200"
              title="Back"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-cyan-400">
              <BeakerIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-slate-50 sm:text-base">Hands-On Lab</h2>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {renderHeaderTabs()}
            <div className="flex shrink-0 items-center gap-1.5">
              {!hasFullContent && !loading && (
                <button
                  type="button"
                  onClick={generateSensingContent}
                  className="rounded-lg border border-cyan-600 bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 sm:text-sm"
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
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="sensing-learning-scroll flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[min(1200px,calc(100%-1rem))] px-4 py-5 sm:px-6 sm:py-6">
          {activeTab === 'simulations' && renderSimulations()}
          {activeTab === 'challenges' && renderChallenges()}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default SensingLearning;
