'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const learningModes = [
  {
    id: 'ai-narrator',
    label: 'AI Narrator',
    short: 'Audio-first study sessions',
    description: 'Get natural voice explanations, focused summaries, and quick checkpoints after each section.',
    capabilities: ['Narration', 'Summaries', 'Quick Checks', 'Study Tips'],
    tech: 'Google TTS + Gemini',
  },
  {
    id: 'visual-learning',
    label: 'Visual Learning',
    short: 'Diagram-driven understanding',
    description: 'Convert topics into clean diagrams, concept maps, and visual memory aids.',
    capabilities: ['Concept Maps', 'Diagrams', 'Infographics', 'Flowcharts'],
    tech: 'Gemini Vision',
  },
  {
    id: 'active-learning',
    label: 'Active Learning Hub',
    short: 'Practice while learning',
    description: 'Build understanding through scenarios, challenge sets, and immediate feedback loops.',
    capabilities: ['Scenarios', 'Practice Sets', 'Feedback', 'Review Cycles'],
    tech: 'Adaptive Task Engine',
  },
  {
    id: 'intuitive-learning',
    label: 'Concept Constellation',
    short: 'Connect ideas deeply',
    description: 'Spot hidden relationships across concepts and build stronger mental models.',
    capabilities: ['Pattern Detection', 'Theme Linking', 'Insight Prompts', 'Idea Expansion'],
    tech: 'Semantic Graph AI',
  },
  {
    id: 'sensing-learning',
    label: 'Hands-On Lab',
    short: 'Step-by-step application',
    description: 'Use practical walkthroughs and guided tasks to translate theory into action.',
    capabilities: ['Lab Tasks', 'Guided Steps', 'Practical Checks', 'Applied Exercises'],
    tech: 'Simulation Layer',
  },
  {
    id: 'global-learning',
    label: 'Global Learning',
    short: 'Big-picture mastery',
    description: 'Understand systems end-to-end, then drill into the most important details.',
    capabilities: ['System Maps', 'Context Layers', 'Connections', 'Executive View'],
    tech: 'Context Mapping AI',
  },
  {
    id: 'sequential-learning',
    label: 'Sequential Learning',
    short: 'Structured progression',
    description: 'Follow a clear sequence with dependencies, milestones, and progress tracking.',
    capabilities: ['Roadmaps', 'Milestones', 'Dependencies', 'Progress'],
    tech: 'Flow Planner',
  },
  {
    id: 'reflective-learning',
    label: 'Reflective Learning',
    short: 'Deliberate depth',
    description: 'Review your thinking, identify gaps, and create stronger long-term recall.',
    capabilities: ['Reflection Prompts', 'Self-Assessment', 'Gap Analysis', 'Retention Notes'],
    tech: 'Reflection Assistant',
  },
];

const processSteps = [
  {
    title: 'Capture Learning Signals',
    detail: 'The platform observes interactions such as reading depth, question generation, and content preferences.',
  },
  {
    title: 'Classify Learning Style',
    detail: 'A trained ML model maps behavior into meaningful style dimensions.',
  },
  {
    title: 'Deliver Adaptive Modes',
    detail: 'AI automatically prioritizes the most effective content mode for each study session.',
  },
  {
    title: 'Continuously Improve',
    detail: 'Recommendations evolve as your behavior and performance change over time.',
  },
];

const replayFrames = [
  {
    stage: 'Signal Capture',
    signal: 'High interaction with diagrams and concept maps',
    confidence: 72,
    mode: 'Visual Learning',
    output: 'Generated concept diagram + infographic summary',
  },
  {
    stage: 'Model Rebalance',
    signal: 'Frequent question attempts and scenario clicks',
    confidence: 81,
    mode: 'Active Learning Hub',
    output: 'Scenario-based practice with instant feedback',
  },
  {
    stage: 'Depth Detection',
    signal: 'Long reflection sessions and note-heavy behavior',
    confidence: 86,
    mode: 'Reflective Learning',
    output: 'Prompt-driven reflection and retention cues',
  },
  {
    stage: 'Flow Optimization',
    signal: 'Sequential completion with low skip rate',
    confidence: 89,
    mode: 'Sequential Learning',
    output: 'Step-locked learning path with dependency guidance',
  },
];

const studioTopic = {
  title: 'Neural Networks',
  source: 'One topic transformed into eight adaptive outputs',
  outputs: {
    'ai-narrator': 'Audio briefing with checkpoint prompts and concise summaries',
    'visual-learning': 'Concept diagram, infographic, network map, and process flow',
    'active-learning': 'Challenge scenarios with feedback and discussion prompts',
    'intuitive-learning': 'Constellation map with hidden conceptual links',
    'sensing-learning': 'Interactive lab controls and measurable readouts',
    'global-learning': 'System-level map with interconnections and implications',
    'sequential-learning': 'Ordered learning path with prerequisites',
    'reflective-learning': 'Guided reflection prompts with timer-based focus',
  },
};

const constellationNodes = [
  {
    id: 'representation',
    label: 'Representation Learning',
    outputs: ['Visual map', 'Active scenario', 'Reflective prompt'],
  },
  {
    id: 'generalization',
    label: 'Generalization',
    outputs: ['Sequential path', 'Global systems view', 'Lab challenge'],
  },
  {
    id: 'optimization',
    label: 'Optimization',
    outputs: ['Hands-on tuning lab', 'Infographic summary', 'Audio explainer'],
  },
  {
    id: 'bias-variance',
    label: 'Bias-Variance Tradeoff',
    outputs: ['Concept constellation', 'Case-based practice', 'Reflection checklist'],
  },
];

const controlSignals = [
  {
    id: 'diagram-burst',
    label: 'Diagram Burst',
    effect: { visual: 18, intuitive: 8, global: 6, active: -4 },
    event: 'User opened 4 visual assets in one session.',
  },
  {
    id: 'scenario-loop',
    label: 'Scenario Loop',
    effect: { active: 16, sensing: 10, reflective: -6, sequential: 4 },
    event: 'User completed scenario and requested immediate feedback.',
  },
  {
    id: 'deep-journal',
    label: 'Deep Journal',
    effect: { reflective: 20, sequential: 6, active: -5, audio: 3 },
    event: 'Long reflection notes and prompt interactions detected.',
  },
  {
    id: 'step-discipline',
    label: 'Step Discipline',
    effect: { sequential: 18, sensing: 6, active: 4, intuitive: -3 },
    event: 'High completion rate on step-ordered learning flow.',
  },
  {
    id: 'audio-focus',
    label: 'Audio Focus',
    effect: { audio: 16, reflective: 6, visual: -5, global: 4 },
    event: 'Narrated content watch/listen time increased significantly.',
  },
];

const modeScoreMap = {
  'ai-narrator': 'audio',
  'visual-learning': 'visual',
  'active-learning': 'active',
  'intuitive-learning': 'intuitive',
  'sensing-learning': 'sensing',
  'global-learning': 'global',
  'sequential-learning': 'sequential',
  'reflective-learning': 'reflective',
};

const clampScore = (value) => Math.max(0, Math.min(100, value));

const getModeFromScores = (scores) => {
  const ranking = Object.entries(modeScoreMap).map(([modeId, scoreKey]) => ({
    modeId,
    score: scores[scoreKey] || 0,
  }));
  ranking.sort((a, b) => b.score - a.score);
  const best = ranking[0];
  const second = ranking[1];
  const confidence = clampScore(58 + (best.score - (second?.score || 0)) + Math.round(best.score * 0.25));
  return { modeId: best.modeId, confidence, ranking };
};

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeMode, setActiveMode] = useState(0);
  const [replayIndex, setReplayIndex] = useState(0);
  const [studioMode, setStudioMode] = useState('visual-learning');
  const [activeReflective, setActiveReflective] = useState(62);
  const [visualVerbal, setVisualVerbal] = useState(74);
  const [selectedNode, setSelectedNode] = useState(constellationNodes[0].id);
  const [controlScores, setControlScores] = useState({
    visual: 64,
    active: 56,
    reflective: 58,
    sequential: 52,
    intuitive: 49,
    sensing: 47,
    global: 45,
    audio: 39,
  });
  const [controlSelectedSignal, setControlSelectedSignal] = useState(controlSignals[0].id);
  const [controlAutoPlay, setControlAutoPlay] = useState(true);
  const [controlEvents, setControlEvents] = useState([
    'Engine initialized: baseline learner state loaded.',
    'Awaiting incoming behavior signals.',
  ]);

  useEffect(() => {
    setIsVisible(true);

    const styleTagId = 'landing-page-scroll-override';
    if (!document.getElementById(styleTagId)) {
      const style = document.createElement('style');
      style.id = styleTagId;
      style.textContent = `
        body, html {
          overflow: auto !important;
          height: auto !important;
        }
      `;
      document.head.appendChild(style);
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          router.replace('/home');
        }
      } catch (error) {
        // Guests remain on the landing page.
      }
    };

    checkAuth();

    const modeRotation = setInterval(() => {
      setActiveMode((current) => (current + 1) % learningModes.length);
    }, 4500);

    const replayRotation = setInterval(() => {
      setReplayIndex((current) => (current + 1) % replayFrames.length);
    }, 3200);

    return () => {
      const styleTag = document.getElementById(styleTagId);
      if (styleTag) styleTag.remove();
      clearInterval(modeRotation);
      clearInterval(replayRotation);
    };
  }, [router]);


  const mixedModeRecommendation = (() => {
    if (visualVerbal >= 65 && activeReflective >= 55) return 'visual-learning';
    if (visualVerbal >= 65 && activeReflective < 55) return 'active-learning';
    if (visualVerbal < 65 && activeReflective >= 55) return 'reflective-learning';
    return 'sequential-learning';
  })();

  const selectedConstellation = constellationNodes.find((node) => node.id === selectedNode) || constellationNodes[0];
  const controlRecommendation = getModeFromScores(controlScores);
  const controlRecommendedMode = controlRecommendation.modeId;

  const applyControlSignal = useCallback(
    (signalId, source = 'manual') => {
      const signal = controlSignals.find((item) => item.id === signalId);
      if (!signal) return;

      setControlSelectedSignal(signalId);
      setControlScores((prev) => {
        const next = { ...prev };
        Object.entries(signal.effect).forEach(([key, delta]) => {
          next[key] = clampScore((next[key] || 0) + delta);
        });

        const recommendation = getModeFromScores(next);
        const modeIndex = learningModes.findIndex((mode) => mode.id === recommendation.modeId);
        if (modeIndex >= 0) setActiveMode(modeIndex);
        setStudioMode(recommendation.modeId);
        setVisualVerbal(clampScore(50 + (next.visual - (next.audio + next.reflective) / 2)));
        setActiveReflective(clampScore(50 + (next.reflective - next.active / 2)));

        return next;
      });

      setControlEvents((prev) => {
        const line = `${source === 'stream' ? 'Stream' : 'Manual'} signal "${signal.label}": ${signal.event}`;
        return [line, ...prev].slice(0, 6);
      });
    },
    [setActiveMode, setStudioMode]
  );

  useEffect(() => {
    if (!controlAutoPlay) return undefined;
    const interval = setInterval(() => {
      const random = controlSignals[Math.floor(Math.random() * controlSignals.length)];
      applyControlSignal(random.id, 'stream');
    }, 5200);
    return () => clearInterval(interval);
  }, [controlAutoPlay, applyControlSignal]);

  const renderModePreview = (modeId) => {
    if (modeId === 'ai-narrator') {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">AI Narrator Session</p>
            <span className="rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-200">
              Live Audio
            </span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-400">Current segment</p>
            <p className="mt-1 text-sm font-medium text-white">Neural Networks: Foundations</p>
            <div className="mt-3 h-2 rounded bg-slate-800">
              <div className="h-2 w-2/3 rounded bg-blue-500" />
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">Quick quiz ready</div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">Summary generated</div>
          </div>
        </div>
      );
    }

    if (modeId === 'visual-learning') {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {['Overview', 'Summary', 'Network', 'Steps'].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  i === 0 ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100' : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-slate-800 bg-white p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Generated Concept Diagram</span>
              <span>PNG</span>
            </div>
            <div className="grid h-52 grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="rounded border border-slate-300 bg-white p-2 text-[11px] text-slate-600">Input Layer</div>
              <div className="rounded border border-slate-300 bg-white p-2 text-[11px] text-slate-600">Hidden Layers</div>
              <div className="rounded border border-slate-300 bg-white p-2 text-[11px] text-slate-600">Activation</div>
              <div className="rounded border border-slate-300 bg-white p-2 text-[11px] text-slate-600">Output</div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'active-learning') {
      return (
        <div className="rounded-xl border border-slate-800 bg-stone-950/90 p-3">
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {['Your Page', 'Talk It Through', 'Try A Choice', 'Explain It'].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  i === 2 ? 'border-amber-500/50 bg-amber-500/15 text-amber-100' : 'border-stone-700 bg-stone-900 text-stone-400'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-stone-700 bg-stone-900 p-3">
            <p className="text-xs text-stone-400">Scenario</p>
            <p className="mt-1 text-sm font-medium text-stone-100">
              A model overfits after epoch 20. What is your best immediate action?
            </p>
            <div className="mt-3 space-y-2">
              <div className="rounded border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-300">Increase hidden units</div>
              <div className="rounded border border-amber-500/60 bg-amber-500/15 px-3 py-2 text-xs text-amber-100">Apply early stopping</div>
              <div className="rounded border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-300">Remove validation split</div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'intuitive-learning') {
      return (
        <div className="rounded-xl border border-gray-800 bg-black p-2">
          <div className="grid gap-2 lg:grid-cols-[200px,1fr,220px]">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">View Lens</p>
              <div className="mt-2 space-y-1.5">
                <div className="rounded bg-blue-600 px-2 py-1.5 text-xs text-white">Constellation View</div>
                <div className="rounded bg-gray-800 px-2 py-1.5 text-xs text-gray-300">Concept Clusters</div>
                <div className="rounded bg-gray-800 px-2 py-1.5 text-xs text-gray-300">Frameworks</div>
                <div className="rounded bg-gray-800 px-2 py-1.5 text-xs text-gray-300">Innovations</div>
              </div>
            </div>
            <div className="relative min-h-[230px] rounded-lg border border-gray-800 bg-black">
              <div className="absolute left-[14%] top-[22%] rounded border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-white">Representation</div>
              <div className="absolute left-[40%] top-[15%] rounded border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-white">Learning Signal</div>
              <div className="absolute left-[28%] top-[52%] rounded border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-white">Concept Drift</div>
              <div className="absolute left-[62%] top-[46%] rounded border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-white">Generalization</div>
              <div className="absolute left-[35%] top-[33%] h-px w-[26%] bg-blue-500/50" />
              <div className="absolute left-[35%] top-[56%] h-px w-[30%] bg-cyan-500/50" />
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Focus</p>
              <p className="mt-1 text-sm font-medium text-white">Generalization</p>
              <p className="mt-2 text-xs text-gray-300">Tap any node to inspect links, implications, and related ideas.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[11px] text-gray-300">Bias</span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[11px] text-gray-300">Variance</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'sensing-learning') {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <div className="mb-2 flex gap-2">
            <span className="rounded-md border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1 text-xs text-cyan-100">Lab</span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">Challenges</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-400">Controls</p>
              <p className="mt-2 text-xs text-slate-300">Learning Rate</p>
              <div className="mt-2 h-2 rounded bg-slate-800">
                <div className="h-2 w-1/2 rounded bg-cyan-400" />
              </div>
              <div className="mt-3 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">Epochs: 50</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-400">Readout</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-cyan-300">92.4%</p>
              <p className="mt-1 text-xs text-slate-500">Validation accuracy</p>
              <div className="mt-3 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">Step 2 complete</div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'global-learning') {
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 flex gap-2">
            <span className="rounded-md border border-zinc-400/40 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-900">Overview</span>
            <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">Connections</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Center</p>
            <p className="mt-1 text-base font-semibold text-zinc-100">System-level behavior in neural learning</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">Feedback loops</div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">Cross-domain analogies</div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">Emergent patterns</div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">Systemic implications</div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'sequential-learning') {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-400">Step Progress</p>
              <span className="text-xs text-indigo-200">2 / 5</span>
            </div>
            <div className="h-2 rounded bg-slate-800">
              <div className="h-2 w-2/5 rounded bg-indigo-500" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr,220px]">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-wide text-indigo-300">Step 2</p>
              <p className="mt-1 text-sm font-semibold text-white">Forward pass mechanics</p>
              <p className="mt-2 text-xs text-slate-300">
                Understand matrix multiplication order, activation sequence, and expected output shape.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-400">Track</p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300">1. Inputs</div>
                <div className="rounded border border-amber-500/60 bg-amber-500/15 px-2 py-1 text-amber-100">2. Forward pass</div>
                <div className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300">3. Loss</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modeId === 'reflective-learning') {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3">
          <div className="mb-2 flex gap-2">
            {['Read', 'Question', 'Structure', 'Keep'].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  i === 1 ? 'border-teal-500/50 bg-teal-500/15 text-teal-100' : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-teal-200">03:28</p>
              <span className="rounded-md border border-amber-700/50 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100">Pause</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2">What claim is strongest, and why?</div>
              <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2">Where does the argument rely on assumptions?</div>
              <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2">What should be retained as your core takeaway?</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-slate-950 opacity-95" />
        <div className="absolute left-0 top-24 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-24 right-0 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/favicon.svg" alt="Intelevo" width={34} height={34} />
            <span className="text-xl font-semibold tracking-tight text-white">Intelevo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
          <div
            className={`grid items-center gap-10 lg:grid-cols-2 transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-200">
                ML-guided adaptive education
              </div>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">
                A modern learning platform built to adapt to how each student learns best.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                Intelevo combines machine learning and AI generation to deliver personalized study experiences across 8
                learning modes without friction.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Create Free Account
                </Link>
                <Link
                  href="#modes"
                  className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                >
                  Explore Learning Modes
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { value: '88.3%', label: 'Model accuracy' },
                  { value: '8', label: 'Learning modes' },
                  { value: '24/7', label: 'AI support' },
                  { value: '5,348', label: 'Training samples' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-2xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="text-sm font-medium text-slate-200">Adaptive Session Dashboard</div>
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                  Live
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Current topic</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">Machine Learning Fundamentals</p>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 rounded bg-slate-800" />
                    <div className="h-2 w-5/6 rounded bg-slate-800" />
                    <div className="h-2 w-2/3 rounded bg-blue-500/40" />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Recommended modes</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                      Active Learning Hub
                    </div>
                    <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                      Visual Learning
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
                      AI Narrator
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Adaptive confidence</span>
                  <span>88%</span>
                </div>
                <div className="h-2 rounded bg-slate-800">
                  <div className="h-2 w-[88%] rounded bg-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300">Learning Modes</p>
              <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Adaptive Preview Control Room</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-400">
              This section behaves like a live product floor, not a static mockup. Every panel reacts to adaptive logic and
              generated learning outputs.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learningModes.map((mode, index) => {
              const isActive = activeMode === index;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onMouseEnter={() => setActiveMode(index)}
                  onClick={() => setActiveMode(index)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isActive
                      ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-600'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{mode.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{mode.short}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mode.capabilities.slice(0, 2).map((capability) => (
                      <span
                        key={capability}
                        className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Adaptive Control Room</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Behavior signals actively reconfigure recommendations, preview outputs, and interface emphasis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setControlAutoPlay((prev) => !prev)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                    controlAutoPlay
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {controlAutoPlay ? 'Live Stream: ON' : 'Live Stream: OFF'}
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr,1.15fr,0.8fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Incoming Signals</p>
                  <div className="grid gap-2">
                    {controlSignals.map((signal) => (
                      <button
                        key={signal.id}
                        type="button"
                        onClick={() => applyControlSignal(signal.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                          controlSelectedSignal === signal.id
                            ? 'border-blue-500/60 bg-blue-500/15 text-blue-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <p className="font-semibold">{signal.label}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{signal.event}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Live Profile Scores</p>
                  <div className="space-y-2.5">
                    {controlRecommendation.ranking.slice(0, 6).map((item) => {
                      const mode = learningModes.find((entry) => entry.id === item.modeId);
                      return (
                        <div key={item.modeId}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-300">{mode?.label}</span>
                            <span className="text-slate-400">{item.score}%</span>
                          </div>
                          <div className="h-1.5 rounded bg-slate-800">
                            <div className="h-1.5 rounded bg-blue-500 transition-all duration-500" style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-lg border border-blue-500/40 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-200">Current output routing</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {learningModes.find((m) => m.id === controlRecommendedMode)?.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Confidence: {controlRecommendation.confidence}%</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Engine Feed</p>
                  <div className="space-y-2">
                    {controlEvents.map((eventLine, index) => (
                      <div key={`${eventLine}-${index}`} className="rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-[11px] text-slate-300">
                        {eventLine}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Control Room Output Preview</p>
                  <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                    Interface changed by behavior
                  </span>
                </div>
                {renderModePreview(controlRecommendedMode)}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Adaptive Replay</p>
                  <span className="rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-200">
                    Auto Demo
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {replayFrames.map((frame, index) => (
                      <button
                        key={frame.stage}
                        type="button"
                        onClick={() => setReplayIndex(index)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition ${
                          replayIndex === index
                            ? 'border-blue-500/50 bg-blue-500/15 text-blue-100'
                            : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {frame.stage}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-white">{replayFrames[replayIndex].signal}</p>
                  <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Model confidence</span>
                      <span>{replayFrames[replayIndex].confidence}%</span>
                    </div>
                    <div className="h-2 rounded bg-slate-800">
                      <div
                        className="h-2 rounded bg-blue-500 transition-all duration-500"
                        style={{ width: `${replayFrames[replayIndex].confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Recommended mode</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">{replayFrames[replayIndex].mode}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Generated output</p>
                      <p className="mt-1 text-sm text-slate-200">{replayFrames[replayIndex].output}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Before vs After Workspace</p>
                  <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                    Outcome Delta
                  </span>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-400">Before (Generic LMS)</p>
                    <div className="grid gap-2 text-xs text-slate-300">
                      <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">Single content format</div>
                      <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">No adaptive logic</div>
                      <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2">Static activity flow</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-400">After (Intelevo Adaptive)</p>
                    <div className="grid gap-2 text-xs text-slate-200">
                      <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">Mode automatically selected by model</div>
                      <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">Multi-format generated outputs</div>
                      <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">Continuous adaptation per behavior</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-center text-slate-300">
                        <div className="font-semibold text-white">+31%</div>
                        <div>Focus</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-center text-slate-300">
                        <div className="font-semibold text-white">+27%</div>
                        <div>Retention</div>
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-center text-slate-300">
                        <div className="font-semibold text-white">-22%</div>
                        <div>Time to Mastery</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">One Topic, 8 Outputs Studio</p>
                  <p className="mt-1 text-sm text-slate-300">{studioTopic.source}</p>
                </div>
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                  Topic: {studioTopic.title}
                </span>
              </div>
              <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {learningModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setStudioMode(mode.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      studioMode === mode.id
                        ? 'border-blue-500/60 bg-blue-500/15 text-blue-100'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <p className="font-semibold">{mode.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{studioTopic.outputs[mode.id]}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                {renderModePreview(studioMode)}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Mode Mixer</p>
                  <p className="mt-1 text-sm text-slate-300">Drag preferences and watch recommended preview change instantly.</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Active vs Reflective</span>
                      <span>{activeReflective}% reflective</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeReflective}
                      onChange={(e) => setActiveReflective(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Visual vs Verbal</span>
                      <span>{visualVerbal}% visual</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={visualVerbal}
                      onChange={(e) => setVisualVerbal(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-200">Recommended mode from mixer</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {learningModes.find((m) => m.id === mixedModeRecommendation)?.label}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  {renderModePreview(mixedModeRecommendation)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Constellation to Output Flow</p>
                  <p className="mt-1 text-sm text-slate-300">Click any concept node and inspect adaptive output bundle.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-black p-4">
                  <div className="relative min-h-[220px] rounded-lg border border-gray-800 bg-black">
                    {constellationNodes.map((node, index) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNode(node.id)}
                        className={`absolute rounded border px-2 py-1 text-[11px] transition ${
                          selectedNode === node.id
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
                        }`}
                        style={{
                          left: `${12 + (index % 2) * 44}%`,
                          top: `${18 + Math.floor(index / 2) * 40}%`,
                        }}
                      >
                        {node.label}
                      </button>
                    ))}
                    <div className="absolute left-[30%] top-[28%] h-px w-[28%] bg-blue-500/40" />
                    <div className="absolute left-[30%] top-[67%] h-px w-[28%] bg-cyan-500/40" />
                  </div>
                  <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Selected Node</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedConstellation.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedConstellation.outputs.map((output) => (
                        <span
                          key={output}
                          className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200"
                        >
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-medium text-blue-300">How It Works</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">From behavior signals to adaptive content</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <p className="text-xs font-semibold tracking-wide text-slate-500">STEP {String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 pt-8 text-center lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 md:p-14">
            <p className="text-sm font-medium text-blue-300">Ready To Start</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Launch your personalized learning journey today</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Create your account and let Intelevo build an experience aligned to your pace, preferences, and goals.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Start Free
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              >
                I Already Have An Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
          <p>© 2026 Intelevo</p>
          <p>Adaptive AI for modern education</p>
        </div>
      </footer>
    </div>
  );
}
