'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
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

function gatherNumericControlValues(sim, inputsByName) {
  const nums = [];
  (sim?.interactiveElements || []).forEach((el) => {
    if (el.type === 'slider' || el.type === 'input') {
      const v = parseInteractiveNumber(inputsByName?.[el.name] ?? el.defaultValue);
      if (v !== null) nums.push(v);
    }
  });
  return nums;
}

function combineNumericValues(nums, combineRaw) {
  const mode = String(combineRaw || 'sum').toLowerCase();
  if (!nums.length) return null;
  switch (mode) {
    case 'product':
      return nums.reduce((a, b) => a * b, 1);
    case 'mean':
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min':
      return Math.min(...nums);
    case 'max':
      return Math.max(...nums);
    case 'first':
      return nums[0];
    case 'last':
      return nums[nums.length - 1];
    default:
      return nums.reduce((a, b) => a + b, 0);
  }
}

function gatherNumsFromElementNames(sim, inputsByName, names) {
  const elements = sim?.interactiveElements || [];
  const nums = [];
  (names || []).forEach((name) => {
    const el = elements.find((e) => e.name === name);
    if (!el || (el.type !== 'slider' && el.type !== 'input')) return;
    const v = parseInteractiveNumber(inputsByName?.[el.name] ?? el.defaultValue);
    if (v !== null) nums.push(v);
  });
  return nums;
}

/** Uses dataPoint.fromElements + combine when present; else legacy inference. */
function computeFromElementsBinding(sim, inputsByName, dp) {
  if (!Array.isArray(dp.fromElements) || dp.fromElements.length === 0) return null;

  const elements = sim?.interactiveElements || [];
  const nums = [];
  const texts = [];

  dp.fromElements.forEach((name) => {
    const el = elements.find((e) => e.name === name);
    if (!el) return;
    const raw = inputsByName?.[el.name] ?? el.defaultValue;
    if (el.type === 'slider' || el.type === 'input') {
      const n = parseInteractiveNumber(raw);
      if (n !== null) nums.push(n);
    } else {
      texts.push(String(raw ?? ''));
    }
  });

  if (nums.length) {
    return formatReadoutNumber(combineNumericValues(nums, dp.combine));
  }
  if (texts.length) return texts.filter(Boolean).join(' · ');
  return String(dp.value ?? '');
}

function computeLegacyReadoutForIndex(sim, inputsByName, dps, i) {
  const nums = gatherNumericControlValues(sim, inputsByName);
  if (nums.length === 0) return String(dps[i].value ?? '');
  if (nums.length === 1) {
    return i === 0 ? formatReadoutNumber(nums[0]) : String(dps[i].value ?? '');
  }
  const sum = nums.reduce((a, b) => a + b, 0);
  const prod = nums.reduce((a, b) => a * b, 1);
  const mean = sum / nums.length;
  if (i === 0) return formatReadoutNumber(sum);
  if (i === 1) return formatReadoutNumber(prod);
  if (i < nums.length) return formatReadoutNumber(nums[i]);
  return formatReadoutNumber(mean);
}

/** Map dataPoints to live strings (schema-driven + fallback). */
function getLiveReadoutValues(sim, inputsByName) {
  const dps = sim?.dataPoints || [];
  if (!dps.length) return [];
  return dps.map((dp, i) => {
    if (Array.isArray(dp.fromElements) && dp.fromElements.length > 0) {
      return computeFromElementsBinding(sim, inputsByName, dp);
    }
    return computeLegacyReadoutForIndex(sim, inputsByName, dps, i);
  });
}

function resolveButtonAggregation(sim) {
  const btn = (sim?.interactiveElements || []).find((e) => e.type === 'button');
  if (btn && Array.isArray(btn.fromElements) && btn.fromElements.length > 0) {
    return { names: btn.fromElements, combine: btn.combine };
  }
  const dp0 = sim?.dataPoints?.[0];
  if (dp0 && Array.isArray(dp0.fromElements) && dp0.fromElements.length > 0) {
    return { names: dp0.fromElements, combine: dp0.combine };
  }
  return { names: null, combine: 'sum' };
}

function parseSliderBounds(range) {
  const s = String(range ?? '');
  const parts = s.split(/[-–]/).map((p) => parseFloat(String(p).trim()));
  if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
    return { min: parts[0], max: parts[1] };
  }
  return { min: 0, max: 100 };
}

const SensingLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('simulations');
  const [simulations, setSimulations] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSimulation, setActiveSimulation] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [simulationInputs, setSimulationInputs] = useState({});
  const [challengeProgress, setChallengeProgress] = useState({});
  const [calcNoticeBySim, setCalcNoticeBySim] = useState({});

  // Automatic time tracking for ML classification
  useLearningModeTracking('sensingLearning', isActive);

  const tabs = [
    {
      key: 'simulations',
      name: 'Interactive Lab',
      icon: BeakerIcon,
      description: 'Hands-on simulations and experiments'
    },
    {
      key: 'challenges',
      name: 'Practical Challenges',
      icon: PuzzlePieceIcon,
      description: 'Real-world problem solving'
    }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateSensingContent();
      // Track mode activation
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSimulations(result.simulations || []);
        setChallenges(result.challenges || []);
        
        // Initialize simulation inputs
        if (result.simulations && result.simulations.length > 0) {
          const initialInputs = {};
          result.simulations.forEach((sim, simIndex) => {
            initialInputs[simIndex] = {};
            sim.interactiveElements?.forEach(element => {
              initialInputs[simIndex][element.name] = element.defaultValue;
            });
          });
          setSimulationInputs(initialInputs);
        }

        // Initialize challenge progress
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
    } catch (error) {
      console.error('Error generating sensing content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasFullContent = simulations.length > 0 && challenges.length > 0;

  const requestRegenerate = () => {
    if (!window.confirm('Regenerate hands-on lab? This runs the AI again and uses more API quota.')) return;
    generateSensingContent();
  };

  const activeSimForReadouts = simulations[activeSimulation];
  const activeSimInputsForReadouts = simulationInputs[activeSimulation] || {};
  const liveReadoutValues = useMemo(
    () =>
      activeSimForReadouts
        ? getLiveReadoutValues(activeSimForReadouts, activeSimInputsForReadouts)
        : [],
    [activeSimForReadouts, activeSimInputsForReadouts]
  );

  useEffect(() => {
    setCalcNoticeBySim({});
  }, [activeSimulation]);

  const handleSimulationInputChange = (simIndex, elementName, value) => {
    setSimulationInputs(prev => ({
      ...prev,
      [simIndex]: {
        ...prev[simIndex],
        [elementName]: value
      }
    }));
    setCalcNoticeBySim((prev) => {
      if (!prev[simIndex]) return prev;
      const next = { ...prev };
      delete next[simIndex];
      return next;
    });
    // Track interaction
    trackBehavior('interactive_element_used', { 
      mode: 'sensing', 
      elementType: 'simulation_input',
      elementName,
      value 
    });
  };

  const handleSimulationCalculate = useCallback(
    (simIndex) => {
      const sim = simulations[simIndex];
      const inputs = simulationInputs[simIndex] || {};
      const { names, combine } = resolveButtonAggregation(sim);
      const nums = names?.length
        ? gatherNumsFromElementNames(sim, inputs, names)
        : gatherNumericControlValues(sim, inputs);
      const result = nums.length ? combineNumericValues(nums, combine) : NaN;

      trackBehavior('simulation_calculate', {
        mode: 'sensing',
        simIndex,
        binding: names || 'all_numeric',
        combine: combine || 'sum',
        inputs: nums,
        result: Number.isFinite(result) ? result : null
      });

      if (Number.isFinite(result)) {
        const mode = String(combine || 'sum').toLowerCase();
        setCalcNoticeBySim((prev) => ({
          ...prev,
          [simIndex]: `Result: ${formatReadoutNumber(result)} (${mode})`
        }));
      } else {
        setCalcNoticeBySim((prev) => ({
          ...prev,
          [simIndex]: 'Set numeric values on the linked controls, then tap Calculate.'
        }));
      }
    },
    [simulations, simulationInputs]
  );

  const handleChallengeStepComplete = (challengeIndex, stepIndex) => {
    setChallengeProgress(prev => ({
      ...prev,
      [challengeIndex]: {
        ...prev[challengeIndex],
        currentStep: Math.max(prev[challengeIndex]?.currentStep || 0, stepIndex + 1)
      }
    }));
    // Track step completion
    trackBehavior('step_completed', { 
      mode: 'sensing', 
      challengeIndex, 
      stepIndex 
    });
  };

  const handleCheckpointComplete = (challengeIndex, checkpointIndex) => {
    setChallengeProgress(prev => {
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
    // Track checkpoint completion
    trackBehavior('checkpoint_completed', { 
      mode: 'sensing', 
      challengeIndex, 
      checkpointIndex 
    });
  };

  const renderSimulations = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Setting up interactive lab...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Lab Setup Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!simulations || simulations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Simulations Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create interactive experiments</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Generate Lab
          </button>
        </div>
      );
    }

    const currentSim = simulations[activeSimulation];
    const currentInputs = simulationInputs[activeSimulation] || {};

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-teal-200/70 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100/80 bg-teal-50/40 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">Lab runs</p>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {activeSimulation + 1} / {simulations.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-5">
            {simulations.map((sim, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSimulation(index)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-left text-sm transition-all ${
                  index === activeSimulation
                    ? 'border-teal-600 bg-teal-600 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-teal-300 hover:bg-teal-50/60'
                }`}
              >
                {sim.type === 'calculator' && <CalculatorIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {sim.type === 'graph' && <ChartBarIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {sim.type === 'experiment' && <BeakerIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {sim.type === 'data_analysis' && <ChartBarIcon className="h-4 w-4 shrink-0 opacity-90" />}
                {sim.type === 'virtual_lab' && <CogIcon className="h-4 w-4 shrink-0 opacity-90" />}
                <span className="max-w-[200px] truncate font-medium">{sim.title}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
                {currentSim.type === 'calculator' && <CalculatorIcon className="h-6 w-6" />}
                {currentSim.type === 'graph' && <ChartBarIcon className="h-6 w-6" />}
                {currentSim.type === 'experiment' && <BeakerIcon className="h-6 w-6" />}
                {currentSim.type === 'data_analysis' && <ChartBarIcon className="h-6 w-6" />}
                {currentSim.type === 'virtual_lab' && <CogIcon className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{currentSim.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{currentSim.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <ClockIcon className="h-4 w-4 text-slate-500" />
              {currentSim.estimatedTime}
            </div>
          </header>

          <div className="grid gap-5 p-5 lg:grid-cols-12 lg:gap-6 lg:p-6">
            <div className="lg:col-span-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Controls</p>
              <div className="space-y-3">
                {currentSim.interactiveElements?.map((element, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 shadow-sm"
                  >
                    <label className="block text-sm font-semibold text-slate-900">{element.name}</label>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{element.description}</p>

                    {element.type === 'slider' && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="range"
                          min={parseSliderBounds(element.range).min}
                          max={parseSliderBounds(element.range).max}
                          step="any"
                          value={currentInputs[element.name] ?? element.defaultValue}
                          onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                          className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>
                            {parseSliderBounds(element.range).min} {element.unit}
                          </span>
                          <span className="font-semibold text-teal-700">
                            {currentInputs[element.name] ?? element.defaultValue} {element.unit}
                          </span>
                          <span>
                            {parseSliderBounds(element.range).max} {element.unit}
                          </span>
                        </div>
                      </div>
                    )}

                    {element.type === 'input' && (
                      <input
                        type="number"
                        value={currentInputs[element.name] ?? element.defaultValue}
                        onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        placeholder={element.unit ? `Value (${element.unit})` : 'Value'}
                      />
                    )}

                    {element.type === 'dropdown' && (
                      <select
                        value={currentInputs[element.name] ?? element.defaultValue}
                        onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {(Array.isArray(element.range) ? element.range : []).map((option, optIndex) => (
                          <option key={optIndex} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {element.type === 'button' && (
                      <button
                        type="button"
                        onClick={() => handleSimulationCalculate(activeSimulation)}
                        className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
                      >
                        {element.defaultValue || 'Calculate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live readouts</p>
              <p className="mb-3 text-xs text-slate-500">
                Each readout uses the lab JSON bindings when present (which controls feed it and how they combine).
                Otherwise values are inferred from your controls. Calculate uses the same binding as the button or main
                result when defined.
              </p>
              {calcNoticeBySim[activeSimulation] && (
                <p className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
                  {calcNoticeBySim[activeSimulation]}
                </p>
              )}
              <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-cyan-50/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {currentSim.dataPoints?.map((dataPoint, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/80 bg-white/95 p-3 shadow-sm ring-1 ring-teal-100/60"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700/90">
                        {dataPoint.label}
                      </p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-teal-900">
                        {liveReadoutValues[index] ?? String(dataPoint.value ?? '')}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-slate-600">{dataPoint.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lab guide</p>
            <ol className="space-y-3">
              {currentSim.stepByStepGuide?.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-xs font-bold text-sky-800 shadow-sm">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 border-t border-slate-100 bg-slate-50/40 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Objectives</p>
              <ul className="mt-3 space-y-2">
                {currentSim.learningObjectives?.map((objective, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Real-world tie-in</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{currentSim.realWorldApplication}</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderChallenges = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Preparing practical challenges...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Challenge Setup Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!challenges || challenges.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Challenges Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create practical challenges</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Generate Challenges
          </button>
        </div>
      );
    }

    const currentChallenge = challenges[activeChallenge];
    const currentProgress = challengeProgress[activeChallenge] || { currentStep: 0, completedCheckpoints: [] };

    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-cyan-200/70 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100/80 bg-cyan-50/40 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-900">Challenges</p>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {activeChallenge + 1} / {challenges.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-5">
            {challenges.map((challenge, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveChallenge(index)}
                className={`flex min-w-[160px] max-w-[260px] shrink-0 flex-col rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  index === activeChallenge
                    ? 'border-cyan-600 bg-cyan-600 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-cyan-300 hover:bg-cyan-50/50'
                }`}
              >
                <span className="truncate text-sm font-semibold">{challenge.title}</span>
                {challenge.category && (
                  <span
                    className={`mt-0.5 truncate text-[11px] ${
                      index === activeChallenge ? 'text-cyan-100' : 'text-slate-500'
                    }`}
                  >
                    {challenge.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                <PuzzlePieceIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{currentChallenge.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{currentChallenge.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <ClockIcon className="h-4 w-4 text-slate-500" />
              {currentChallenge.estimatedTime}
            </div>
          </header>

          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-900">Materials</p>
              <ul className="mt-3 space-y-2">
                {currentChallenge.materials?.map((material, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    {material}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900">Success metrics</p>
              <ul className="mt-3 space-y-2">
                {currentChallenge.successMetrics?.map((metric, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-950">Real-world link</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{currentChallenge.realWorldConnection}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Procedure</p>
            <div className="space-y-4">
              {currentChallenge.procedure?.map((step, index) => {
                const done = index < currentProgress.currentStep;
                const active = index === currentProgress.currentStep;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-4 transition-colors ${
                      done
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : active
                          ? 'border-sky-300 bg-sky-50/60 ring-1 ring-sky-200/80'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                          done ? 'bg-emerald-600' : active ? 'bg-sky-600' : 'bg-slate-400'
                        }`}
                      >
                        {done ? '✓' : step.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {step.step}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{step.instruction}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-sky-100 bg-white/90 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase text-sky-800">Expected</p>
                            <p className="mt-1 text-xs text-slate-700">{step.expectedResult}</p>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-white/90 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase text-amber-900">Tips</p>
                            <p className="mt-1 text-xs text-slate-700">{step.tips}</p>
                          </div>
                        </div>
                        {index >= currentProgress.currentStep && (
                          <button
                            type="button"
                            onClick={() => handleChallengeStepComplete(activeChallenge, index)}
                            className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
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

          <div className="border-t border-slate-100 bg-violet-50/30 px-5 py-5 sm:px-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-violet-900">Checkpoints</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentChallenge.checkpoints?.map((checkpoint, index) => {
                const cpDone = currentProgress.completedCheckpoints.includes(index);
                return (
                  <div
                    key={index}
                    className={`flex gap-3 rounded-xl border p-3.5 ${
                      cpDone ? 'border-emerald-200 bg-emerald-50/60' : 'border-violet-100 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCheckpointComplete(activeChallenge, index)}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition ${
                        cpDone ? 'bg-emerald-600' : 'bg-violet-600 hover:bg-violet-700'
                      }`}
                      aria-pressed={cpDone}
                    >
                      {cpDone ? '✓' : index + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-violet-950">{checkpoint.checkpoint}</p>
                      <p className="mt-1 text-xs text-slate-600">{checkpoint.criteria}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{checkpoint.troubleshooting}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentChallenge.extensionActivities?.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Extensions</p>
              <div className="flex flex-wrap gap-2">
                {currentChallenge.extensionActivities.map((activity, index) => (
                  <span
                    key={index}
                    className="rounded-lg border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-medium text-indigo-950"
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
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hands-On Lab</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!hasFullContent && !loading && (
            <button
              type="button"
              onClick={generateSensingContent}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-white transition hover:from-teal-600 hover:to-cyan-700"
              title="Generate hands-on content"
            >
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                Generate
              </span>
            </button>
          )}
          {hasFullContent && !loading && (
            <button
              type="button"
              onClick={requestRegenerate}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              title="Runs the AI again; uses more quota"
            >
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 text-slate-500" />
                Regenerate
              </span>
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-900">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              Generating…
            </div>
          )}
        </div>
      </div>

      {/* Tab Selector with Explanations */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="mx-auto max-w-7xl">
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
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'simulations' ? 'Interactive experiments you can manipulate' : 'Step-by-step challenges with concrete outcomes'}
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
        <div className="mx-auto max-w-7xl p-6">
          {activeTab === 'simulations' && renderSimulations()}
          {activeTab === 'challenges' && renderChallenges()}
        </div>
      </div>
    </div>
  );
};

export default SensingLearning;