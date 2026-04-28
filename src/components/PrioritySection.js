'use client';

import React from 'react';
import ToDoCard from './ToDoCard';
import { getPriorityInfo } from '@/utils/taskPriority';
import { ClockIcon, CalendarDaysIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const PRIORITY_STYLES = {
  overdue: {
    dot: '#ef4444',
    label: 'Overdue',
    labelColor: '#be123c',
    labelBg: '#fff1f2',
    Icon: ExclamationCircleIcon,
    iconColor: '#ef4444',
  },
  dueSoon: {
    dot: '#f97316',
    label: 'Due Soon',
    labelColor: '#c2410c',
    labelBg: '#fff7ed',
    Icon: ClockIcon,
    iconColor: '#f97316',
  },
  upcoming: {
    dot: '#6366f1',
    label: 'Upcoming',
    labelColor: '#4338ca',
    labelBg: '#eef2ff',
    Icon: CalendarDaysIcon,
    iconColor: '#6366f1',
  },
};

const PrioritySection = ({ priority, tasks, onTaskClick }) => {
  if (!tasks || tasks.length === 0) return null;

  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.upcoming;
  const { Icon } = s;

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: s.labelBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon style={{ width: 17, height: 17, color: s.iconColor }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{s.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, background: s.labelBg, color: s.labelColor,
          borderRadius: 20, padding: '2px 9px', marginLeft: 2,
        }}>
          {tasks.length}
        </span>
        <div style={{ flex: 1, height: 1, background: '#f3f4f6', marginLeft: 4 }} />
      </div>

      {/* Task grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 14,
      }}>
        {tasks.map(task => (
          <ToDoCard key={task._id} task={task} onClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
};

export default PrioritySection;
