'use client';

import React, { useState } from 'react';
import { getPriorityInfo } from '@/utils/taskPriority';
import { formatDueDate, getTimeRemaining } from '@/utils/dateFormatting';
import {
  ClockIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

const PRIORITY_CONFIG = {
  overdue: {
    accent: '#ef4444',
    badgeBg: '#fff1f2',
    badgeText: '#be123c',
    label: 'Overdue',
    Icon: ExclamationCircleIcon,
  },
  dueSoon: {
    accent: '#f97316',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    label: 'Due Soon',
    Icon: ClockIcon,
  },
  upcoming: {
    accent: '#6366f1',
    badgeBg: '#eef2ff',
    badgeText: '#4338ca',
    label: 'Upcoming',
    Icon: CalendarDaysIcon,
  },
};

const ToDoCard = ({ task, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.upcoming;
  const { Icon: PriorityIcon } = cfg;
  const TaskIcon = task.type === 'form' ? ClipboardDocumentCheckIcon : DocumentTextIcon;

  const handleClick = () => onClick && onClick(task);
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
  };

  return (
    <div
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${task.title} - ${task.courseName} - ${cfg.label}`}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        borderLeft: `4px solid ${cfg.accent}`,
        padding: '18px 18px 14px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        outline: 'none',
        position: 'relative',
      }}
    >
      {/* Top row: course badge + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#374151',
          borderRadius: 20, padding: '3px 10px', maxWidth: '65%',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.courseName}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: task.status === 'draft' ? '#fefce8' : '#f3f4f6',
          color: task.status === 'draft' ? '#a16207' : '#6b7280',
          borderRadius: 20, padding: '3px 10px',
        }}>
          {task.status === 'draft' ? 'In Progress' : 'Not Started'}
        </span>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <TaskIcon style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0, marginTop: 2 }} />
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: hovered ? cfg.accent : '#111827',
          margin: 0, lineHeight: 1.45, transition: 'color 0.15s',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.title}
        </h3>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <TaskIcon style={{ width: 12, height: 12 }} />
          {task.type === 'form'
            ? `Form · ${task.questionCount} questions`
            : task.assignmentType === 'quiz' ? 'Quiz' : 'Assignment'}
        </span>
        {task.attachments?.length > 0 && (
          <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
            <PaperClipIcon style={{ width: 12, height: 12 }} />
            {task.attachments.length}
          </span>
        )}
      </div>

      {/* Footer: due date + priority badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <PriorityIcon style={{ width: 14, height: 14, color: cfg.accent }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.accent }}>
            {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          background: cfg.badgeBg, color: cfg.badgeText, borderRadius: 6, padding: '3px 8px',
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Time remaining */}
      {task.dueDate && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>
          {getTimeRemaining(task.dueDate)}
        </p>
      )}
    </div>
  );
};

export default ToDoCard;
