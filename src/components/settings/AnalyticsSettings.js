'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const MODE_LABELS = {
  aiNarrator: 'Listen along',
  visualLearning: 'Diagrams',
  sequentialLearning: 'Step-by-step',
  globalLearning: 'Overview',
  sensingLearning: 'Examples',
  intuitiveLearning: 'Patterns',
  activeLearning: 'Practice',
  reflectiveLearning: 'Think deeper'
};

const ASSISTANT_LABELS = {
  askMode: 'Ask mode',
  researchMode: 'Research mode',
  textToDocsMode: 'Text to docs'
};

const formatTime = (ms = 0) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
};

const AnalyticsSettings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/learning-behavior/track');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data?.data || null);
    } catch (error) {
      console.error('Failed to fetch tracking logs:', error);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const modeRows = useMemo(() => {
    const summary = stats?.modeUsageSummary || {};
    return Object.entries(summary)
      .map(([key, value]) => ({
        key,
        label: MODE_LABELS[key] || key,
        count: Number(value?.count) || 0,
        totalTime: Number(value?.totalTime) || 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const assistantRows = useMemo(() => {
    const usage = stats?.aiAssistantUsage || {};
    return Object.entries(ASSISTANT_LABELS).map(([key, label]) => ({
      key,
      label,
      count: Number(usage?.[key]?.count) || 0
    }));
  }, [stats]);

  const hasAnyModeLogs = modeRows.some((row) => row.count > 0 || row.totalTime > 0);
  const recentLogs = Array.isArray(stats?.recentLogs) ? stats.recentLogs : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <DocumentTextIcon className="h-7 w-7 text-indigo-600" />
            Tracking Logs
          </h2>
          <p className="mt-1 text-sm text-slate-600">Live summary of what your learning actions recorded.</p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            fetchStats();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Total logged interactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalInteractions || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Total learning time</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
            <ClockIcon className="h-6 w-6 text-emerald-600" />
            {formatTime(stats?.totalLearningTime)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalSessions || 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ChartBarIcon className="h-5 w-5 text-indigo-600" />
            Learning mode logs
          </h3>
        </div>
        {!hasAnyModeLogs ? (
          <p className="px-5 py-8 text-sm text-slate-600">No learning mode logs yet. Open and use a mode to start tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Mode</th>
                  <th className="px-5 py-3 text-left font-medium">Times opened</th>
                  <th className="px-5 py-3 text-left font-medium">Time spent</th>
                </tr>
              </thead>
              <tbody>
                {modeRows.map((row) => (
                  <tr key={row.key} className="border-t border-slate-100">
                    <td className="px-5 py-3 text-slate-800">{row.label}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{row.count}</td>
                    <td className="px-5 py-3 text-slate-700">{formatTime(row.totalTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <SparklesIcon className="h-5 w-5 text-violet-600" />
            AI assistant logs
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
          {assistantRows.map((row) => (
            <div key={row.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{row.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{row.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">Recent tracking logs</h3>
        </div>
        {recentLogs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-600">No recent logs yet.</p>
        ) : (
          <div className="space-y-3 p-5">
            {recentLogs.map((log) => (
              <div key={`${log.sessionId}-${log.timestamp}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                  <p className="text-xs text-slate-500">Session: {String(log.sessionId || '').slice(-10)}</p>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                  <p className="text-slate-700">Mode opens: <span className="font-semibold text-slate-900">{log.modeInteractions || 0}</span></p>
                  <p className="text-slate-700">Mode time: <span className="font-semibold text-slate-900">{formatTime(log.totalModeTime)}</span></p>
                  <p className="text-slate-700">AI assistant actions: <span className="font-semibold text-slate-900">{log.assistantInteractions || 0}</span></p>
                </div>
                {Array.isArray(log.modeBreakdown) && log.modeBreakdown.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.modeBreakdown.slice(0, 6).map((item) => (
                      <span key={`${log.sessionId}-${item.mode}`} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700">
                        {MODE_LABELS[item.mode] || item.mode}: {item.count} ({formatTime(item.totalTime)})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSettings;
