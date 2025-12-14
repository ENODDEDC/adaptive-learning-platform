'use client';

import React from 'react';
import ToDoCard from './ToDoCard';
import { getPriorityInfo } from '@/utils/taskPriority';
import {
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * PrioritySection Component
 * Groups and displays tasks by priority level
 */
const PrioritySection = ({ priority, tasks, onTaskClick }) => {
  // Don't render if no tasks
  if (!tasks || tasks.length === 0) {
    return null;
  }
  
  const priorityInfo = getPriorityInfo(priority);
  
  // Get appropriate icon based on priority
  const PriorityIcon = priority === 'overdue' 
    ? ExclamationCircleIcon 
    : priority === 'dueSoon'
    ? ClockIcon
    : CalendarIcon;
  
  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-lg
          ${priorityInfo.bgColor}
        `}>
          <PriorityIcon className={`w-6 h-6 ${priorityInfo.textColor}`} />
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {priorityInfo.label}
          </h2>
          <p className="text-sm text-gray-500">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        
        {/* Count Badge */}
        <span className={`
          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
          ${priorityInfo.bgColor} ${priorityInfo.textColor}
        `}>
          {tasks.length}
        </span>
      </div>
      
      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <ToDoCard
            key={task._id}
            task={task}
            onClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};

export default PrioritySection;
