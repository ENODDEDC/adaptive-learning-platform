'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { databaseModeToButtonLabel } from '@/constants/learningModeLabels';

const DIMENSIONS = [
  {
    key: 'activeReflective',
    title: 'Active vs Reflective',
    left: 'Active',
    right: 'Reflective',
    color: 'indigo'
  },
  {
    key: 'sensingIntuitive',
    title: 'Sensing vs Intuitive',
    left: 'Sensing',
    right: 'Intuitive',
    color: 'emerald'
  },
  {
    key: 'visualVerbal',
    title: 'Visual vs Verbal',
    left: 'Visual',
    right: 'Verbal',
    color: 'violet'
  },
  {
    key: 'sequentialGlobal',
    title: 'Sequential vs Global',
    left: 'Sequential',
    right: 'Global',
    color: 'amber'
  }
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getStrength = (value) => {
  const abs = Math.abs(toNumber(value));
  if (abs <= 3) return 'Balanced';
  if (abs <= 7) return 'Moderate';
  return 'Strong';
};

const getPreference = (key, value) => {
  const n = toNumber(value);
  if (key === 'activeReflective') return n >= 0 ? 'Active' : 'Reflective';
  if (key === 'sensingIntuitive') return n >= 0 ? 'Sensing' : 'Intuitive';
  if (key === 'visualVerbal') return n >= 0 ? 'Visual' : 'Verbal';
  if (key === 'sequentialGlobal') return n >= 0 ? 'Sequential' : 'Global';
  return 'Unknown';
};

const barClass = (color) => {
  if (color === 'indigo') return 'from-indigo-500 to-indigo-700';
  if (color === 'emerald') return 'from-emerald-500 to-emerald-700';
  if (color === 'violet') return 'from-violet-500 to-violet-700';
  return 'from-amber-500 to-amber-700';
};

const LearningPreferences = () => {
  const [profile, setProfile] = useState(null);
  const [provisional, setProvisional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [mlRuntime, setMlRuntime] = useState({ checked: false, available: false });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning-style/profile');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const profileData = data.data?.profile || data.profile || {};

      if (data.data?.dataQuality) {
        profileData.dataQuality = data.data.dataQuality;
      }

      try {
        const behaviorRes = await fetch('/api/learning-behavior/track');
        if (behaviorRes.ok) {
          const behaviorData = await behaviorRes.json();
          const b = behaviorData?.data || {};
          profileData.dataQuality = {
            ...(profileData.dataQuality || {}),
            totalInteractions: toNumber(b.totalInteractions),
            dataCompleteness: toNumber(b.dataQuality?.completeness),
            sufficientForML: !!b.hasSufficientData
          };

          const modeUsage = b.modeUsageSummary || {};
          const pairScore = (a, bKey) =>
            toNumber(modeUsage?.[a]?.totalTime) - toNumber(modeUsage?.[bKey]?.totalTime);

          const modeRows = Object.entries(modeUsage)
            .map(([key, value]) => ({
              key,
              label: databaseModeToButtonLabel(
                key === 'sensingLearning'
                  ? 'Hands-On Lab'
                  : key === 'intuitiveLearning'
                    ? 'Concept Constellation'
                    : key === 'activeLearning'
                      ? 'Active Learning Hub'
                      : key === 'reflectiveLearning'
                        ? 'Reflective Learning'
                        : key === 'aiNarrator'
                          ? 'AI Narrator'
                          : key === 'visualLearning'
                            ? 'Visual Learning'
                            : key === 'sequentialLearning'
                              ? 'Sequential Learning'
                              : key === 'globalLearning'
                                ? 'Global Learning'
                                : key
              ),
              score: toNumber(value?.totalTime) + toNumber(value?.count) * 1000
            }))
            .filter((row) => row.score > 0)
            .sort((x, y) => y.score - x.score)
            .slice(0, 3);

          setProvisional({
            activeReflective: pairScore('activeLearning', 'reflectiveLearning'),
            sensingIntuitive: pairScore('sensingLearning', 'intuitiveLearning'),
            visualVerbal: pairScore('visualLearning', 'aiNarrator'),
            sequentialGlobal: pairScore('sequentialLearning', 'globalLearning'),
            topModes: modeRows
          });
        }
      } catch {
        // ignore behavior sync errors
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/test-ml-connection');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setMlRuntime({ checked: true, available: !!(res.ok && data?.success) });
        }
      } catch {
        if (!cancelled) setMlRuntime({ checked: true, available: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReset = async () => {
    setShowResetModal(false);
    setResetting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/reset-learning-profile', { method: 'DELETE' });
      if (!res.ok) throw new Error('reset failed');
      setProfile({ lastPrediction: null, dimensions: null, recommendedModes: [] });
      setMessage({ type: 'success', text: 'Learning profile reset successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset learning profile.' });
    } finally {
      setResetting(false);
    }
  };

  const dimensions = profile?.dimensions || null;
  const totalInteractions = toNumber(profile?.dataQuality?.totalInteractions || profile?.dataQuality?.interactionCount);
  const completeness = toNumber(profile?.dataQuality?.dataCompleteness || profile?.dataQuality?.completeness);
  const hasClassification = !!(
    profile?.hasBeenClassified === true &&
    dimensions &&
    Object.values(dimensions).some((v) => toNumber(v) !== 0)
  );

  const orderedRecommendations = useMemo(
    () => (Array.isArray(profile?.recommendedModes) ? profile.recommendedModes : []),
    [profile]
  );

  const provisionalReady =
    !hasClassification &&
    provisional &&
    Array.isArray(provisional.topModes) &&
    provisional.topModes.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <CogIcon className="h-7 w-7 text-indigo-600" />
          Learning Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-600">Your style profile based on tracked learning behavior.</p>
      </div>

      {message.text && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Engagement events</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalInteractions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Data completeness</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{completeness}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Classification</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {hasClassification ? 'Final' : (profile?.classificationStage === 'provisional' ? 'Provisional' : 'Not ready')}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Engine:{' '}
            {mlRuntime.checked
              ? mlRuntime.available
                ? 'Machine Learning service active'
                : 'Rule-based fallback (ML unavailable)'
              : 'Checking ML service...'}
          </p>
        </div>
      </div>

      {!hasClassification || !dimensions ? (
        <div className="space-y-4">
          {provisionalReady ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Early estimate (not final)</p>
              <p className="mt-1 text-sm text-indigo-900">
                This is a provisional learning preference from your current logs. It will stabilize after full classification.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {DIMENSIONS.map((item) => (
                  <div key={`prov-${item.key}`} className="rounded-lg border border-indigo-200 bg-white p-3">
                    <p className="text-xs text-slate-500">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {getPreference(item.key, provisional[item.key])}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500">Current strongest modes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {provisional.topModes.map((m) => (
                    <span key={m.key} className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800">
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <ChartBarIcon className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-base font-medium text-slate-800">No learning style yet.</p>
              <p className="mt-1 text-sm text-slate-600">Keep using learning modes to build your profile.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {DIMENSIONS.map((item) => {
            const value = toNumber(dimensions[item.key]);
            const normalized = ((value + 11) / 22) * 100;
            return (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {getStrength(value)}
                  </span>
                </div>
                <div className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                  <span>{item.left}</span>
                  <span>{item.right}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${barClass(item.color)}`}
                    style={{ width: `${Math.max(0, Math.min(100, normalized))}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Preference: <span className="font-semibold text-slate-900">{getPreference(item.key, value)}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <SparklesIcon className="h-5 w-5 text-indigo-600" />
          Recommended learning modes
        </h3>
        {orderedRecommendations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No recommendations yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {orderedRecommendations.map((mode, index) => (
              <div key={`${mode.mode}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {index + 1}. {databaseModeToButtonLabel(mode.mode)}
                </p>
                {typeof mode.confidence === 'number' && (
                  <p className="mt-1 text-xs text-slate-600">Confidence: {Math.round(mode.confidence * 100)}%</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <button
          onClick={() => setShowResetModal(true)}
          disabled={resetting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting...' : 'Reset learning profile'}
        </button>
        <p className="mt-2 text-sm text-red-800">This clears your learning behavior profile and starts from zero.</p>
      </div>

      {showResetModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Reset learning profile?</h3>
              <p className="mt-2 text-sm text-slate-600">
                This will remove your tracked learning pattern and recommendations. This cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Yes, reset
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LearningPreferences;
