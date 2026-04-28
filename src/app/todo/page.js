'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PrioritySection from '@/components/PrioritySection';
import HorizontalNav from '@/components/HorizontalNav';
import { groupTasksByPriority } from '@/utils/taskPriority';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

export default function ToDoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('pending');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    overdue: 0, dueSoon: 0, upcoming: 0, total: 0, completed: 0,
  });

  const fetchPendingTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/students/todo');
      if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.status}`);
      const data = await response.json();
      setTasks(data.tasks || []);
      setTaskCounts(prev => ({ ...prev, ...data.counts }));
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompletedTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/students/todo/completed');
      if (!response.ok) throw new Error(`Failed to fetch completed tasks: ${response.status}`);
      const data = await response.json();
      setCompletedTasks(data.tasks || []);
      setTaskCounts(prev => ({ ...prev, completed: data.count || 0 }));
    } catch (err) {
      setError(err.message || 'Failed to load completed tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(() => {
    if (view === 'pending') fetchPendingTasks();
    else fetchCompletedTasks();
  }, [view, fetchPendingTasks, fetchCompletedTasks]);

  const handleTaskClick = useCallback((task) => {
    if (task.type === 'assignment') router.push(`/courses/${task.courseId}`);
    else if (task.type === 'form') router.push(`/forms/${task._id}`);
  }, [router]);

  useEffect(() => {
    fetchPendingTasks();
    fetchCompletedTasks();
  }, [fetchPendingTasks, fetchCompletedTasks]);

  const groupedTasks = groupTasksByPriority(tasks);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, border: '3px solid #e5e7eb',
            borderTopColor: '#6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>Loading your tasks…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ExclamationTriangleIcon style={{ width: 28, height: 28, color: '#ef4444' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Unable to Load Tasks</h3>
          <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>{error}</p>
          <button onClick={refreshTasks} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14,
          }}>
            <ArrowPathIcon style={{ width: 16, height: 16 }} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Stat cards config ────────────────────────────────────────────────────
  const stats = [
    taskCounts.overdue > 0 && {
      label: 'Overdue', count: taskCounts.overdue,
      bg: '#fff1f2', border: '#fecdd3', text: '#be123c',
      icon: <ExclamationTriangleIcon style={{ width: 20, height: 20, color: '#e11d48' }} />,
    },
    taskCounts.dueSoon > 0 && {
      label: 'Due Soon', count: taskCounts.dueSoon,
      bg: '#fff7ed', border: '#fed7aa', text: '#c2410c',
      icon: <ClockIcon style={{ width: 20, height: 20, color: '#ea580c' }} />,
    },
    taskCounts.upcoming > 0 && {
      label: 'Upcoming', count: taskCounts.upcoming,
      bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8',
      icon: <CalendarDaysIcon style={{ width: 20, height: 20, color: '#3b82f6' }} />,
    },
  ].filter(Boolean);

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fb' }}>
      <div style={{ flexShrink: 0 }}>
        <HorizontalNav />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

            {/* Left: title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
                  My To-Do List
                </h1>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0', fontWeight: 400 }}>
                  {view === 'pending'
                    ? `${taskCounts.total} pending ${taskCounts.total === 1 ? 'task' : 'tasks'} across all courses`
                    : `${taskCounts.completed} completed ${taskCounts.completed === 1 ? 'task' : 'tasks'}`}
                </p>
              </div>
            </div>

            {/* Right: tabs + refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Tab toggle */}
              <div style={{
                display: 'flex', background: '#f3f4f6', borderRadius: 10,
                padding: 4, gap: 2,
              }}>
                {[
                  { key: 'pending', label: `Pending`, count: taskCounts.total },
                  { key: 'completed', label: `Completed`, count: taskCounts.completed },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setView(tab.key)}
                    style={{
                      padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                      background: view === tab.key ? '#fff' : 'transparent',
                      color: view === tab.key ? '#111827' : '#6b7280',
                      boxShadow: view === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      marginLeft: 6, fontSize: 11, fontWeight: 700,
                      background: view === tab.key ? (tab.key === 'pending' ? '#6366f1' : '#10b981') : '#d1d5db',
                      color: view === tab.key ? '#fff' : '#6b7280',
                      borderRadius: 20, padding: '1px 7px',
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={refreshTasks}
                aria-label="Refresh tasks"
                style={{
                  width: 38, height: 38, borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <ArrowPathIcon style={{ width: 17, height: 17 }} />
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          {view === 'pending' && stats.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  flex: '1 1 160px', background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: s.text, margin: '2px 0 0', lineHeight: 1 }}>{s.count}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {view === 'pending' ? (
          tasks.length === 0 ? (
            <EmptyState onHome={() => router.push('/home')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <PrioritySection priority="overdue" tasks={groupedTasks.overdue} onTaskClick={handleTaskClick} />
              <PrioritySection priority="dueSoon" tasks={groupedTasks.dueSoon} onTaskClick={handleTaskClick} />
              <PrioritySection priority="upcoming" tasks={groupedTasks.upcoming} onTaskClick={handleTaskClick} />
            </div>
          )
        ) : (
          <CompletedView tasks={completedTasks} onTaskClick={handleTaskClick} />
        )}
      </div>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onHome }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
      padding: '64px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <CheckCircleIcon style={{ width: 32, height: 32, color: '#22c55e' }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>All Caught Up!</h3>
      <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 360, margin: '0 auto 24px' }}>
        No pending assignments or forms. Great job staying on top of your work!
      </p>
      <button onClick={onHome} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 14,
      }}>
        <HomeIcon style={{ width: 16, height: 16 }} /> Go to Home
      </button>
    </div>
  );
}

// ── Completed View ───────────────────────────────────────────────────────────
function CompletedView({ tasks, onTaskClick }) {
  if (tasks.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        padding: '64px 32px', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, background: '#f3f4f6', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <CheckCircleIcon style={{ width: 28, height: 28, color: '#9ca3af' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>No Completed Tasks Yet</h3>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Complete some assignments or forms to see them here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {tasks.map(task => (
        <div
          key={task._id}
          onClick={() => onTaskClick(task)}
          style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
            borderLeft: '4px solid #10b981', padding: '18px 20px',
            cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#374151',
              borderRadius: 20, padding: '3px 10px',
            }}>{task.courseName}</span>
            <CheckCircleSolid style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 6px', lineHeight: 1.4 }}>
            {task.title}
          </h3>
          {task.description && (
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {task.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              {task.type === 'form' ? 'Form' : task.assignmentType === 'quiz' ? 'Quiz' : 'Assignment'}
            </span>
            {task.grade != null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{task.grade}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
