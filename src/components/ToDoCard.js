'use client';

import React from 'react';
import { getPriorityInfo } from '@/utils/taskPriority';
import { formatDueDate, getTimeRemaining } from '@/utils/dateFormatting';
import {
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

/**
 * ToDoCard Component
 * Displays an individual task (assignment or form) with priority indicators
 */
const ToDoCard = ({ task, onClick }) => {
  const priorityInfo = getPriorityInfo(task.priority);
  
  // Get appropriate icon based on priority
  const PriorityIcon = task.priority === 'overdue' 
    ? ExclamationCircleIcon 
    : task.priority === 'dueSoon'
    ? ClockIcon
    : CalendarIcon;
  
  // Get task type icon
  const TaskIcon = task.type === 'form' 
    ? ClipboardDocumentCheckIcon 
    : DocumentTextIcon;
  
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };
  
  return (
    <div
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`${task.title} - ${task.courseName} - ${priorityInfo.label}`}
      className={`
        relative bg-white rounded-lg border-2 border-l-4 ${priorityInfo.borderColor}
        shadow-sm hover:shadow-md transition-all duration-200
        cursor-pointer group overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header: Course Badge and Status */}
        <div className="flex items-start justify-between mb-3">
          {/* Course Badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {task.courseName}
          </span>
          
          {/* Status Badge */}
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${task.status === 'draft' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {task.status === 'draft' ? 'In Progress' : 'Not Started'}
          </span>
        </div>
        
        {/* Task Title */}
        <div className="flex items-start gap-2 mb-2">
          <TaskIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {task.title}
          </h3>
        </div>
        
        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Task Type Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1">
            {task.type === 'form' ? (
              <>
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                Form ({task.questionCount} questions)
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-4 h-4" />
                {task.assignmentType === 'quiz' ? 'Quiz' : 'Assignment'}
              </>
            )}
          </span>
          
          {task.attachments && task.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1">
              📎 {task.attachments.length} {task.attachments.length === 1 ? 'file' : 'files'}
            </span>
          )}
        </div>
        
        {/* Due Date and Priority */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Due Date */}
          <div className="flex items-center gap-2">
            <PriorityIcon className={`w-4 h-4 ${priorityInfo.textColor}`} />
            <span className={`text-sm font-medium ${priorityInfo.textColor}`}>
              {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
            </span>
          </div>
          
          {/* Priority Badge */}
          <span className={`
            inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold
            ${priorityInfo.bgColor} ${priorityInfo.textColor}
          `}>
            {priorityInfo.label}
          </span>
        </div>
        
        {/* Time Remaining (for tasks with due dates) */}
        {task.dueDate && (
          <div className="mt-2 text-xs text-gray-500">
            {getTimeRemaining(task.dueDate)}
          </div>
        )}
      </div>
      
      {/* Hover Indicator */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg pointer-events-none transition-colors duration-200" />
    </div>
  );
};

export default ToDoCard;
