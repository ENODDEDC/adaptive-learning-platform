'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PrioritySection from './PrioritySection';
import { groupTasksByPriority } from '@/utils/taskPriority';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * ToDoTab Component
 * Main component for displaying student's pending tasks
 */
const ToDoTab = ({ user, courseDetails }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    overdue: 0,
    dueSoon: 0,
    upcoming: 0,
    total: 0
  });
  
  /**
   * Fetch pending tasks from API
   */
  const fetchPendingTasks = useCallback(async () => {
    try {
      console.log('📋 ToDoTab: Fetching pending tasks...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/students/todo');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ ToDoTab: Received', data.tasks?.length || 0, 'tasks');
      console.log('📊 ToDoTab: Counts:', data.counts);
      
      setTasks(data.tasks || []);
      setTaskCounts(data.counts || { overdue: 0, dueSoon: 0, upcoming: 0, total: 0 });
      
    } catch (err) {
      console.error('❌ ToDoTab: Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Refresh tasks (can be called after task completion)
   */
  const refreshTasks = useCallback(() => {
    console.log('🔄 ToDoTab: Refreshing tasks...');
    fetchPendingTasks();
  }, [fetchPendingTasks]);
  
  /**
   * Handle task click - navigate to appropriate page
   */
  const handleTaskClick = useCallback((task) => {
    console.log('🖱️ ToDoTab: Task clicked:', task.title, 'Type:', task.type);
    
    if (task.type === 'assignment') {
      // Navigate to course classwork page where student can submit
      router.push(`/courses/${task.courseId}`);
    } else if (task.type === 'form') {
      // Navigate to form page
      router.push(`/forms/${task._id}`);
    }
  }, [router]);
  
  // Fetch tasks on component mount
  useEffect(() => {
    console.log('🎬 ToDoTab: Component mounted, fetching tasks...');
    fetchPendingTasks();
  }, [fetchPendingTasks]);
  
  // Group tasks by priority
  const groupedTasks = groupTasksByPriority(tasks);
  
  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your tasks...</p>
      </div>
    );
  }
  
  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Tasks
        </h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          {error}
        </p>
        <button
          onClick={refreshTasks}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Try Again
        </button>
      </div>
    );
  }
  
  // Empty State
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          All Caught Up!
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          You have no pending assignments or forms. Great job staying on top of your work!
        </p>
      </div>
    );
  }
  
  // Main Content
  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My To-Do List
            </h1>
            <p className="text-gray-600 mt-1">
              {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} pending
            </p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshTasks}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Refresh tasks"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Overdue */}
          {taskCounts.overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">{taskCounts.overdue}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          )}
          
          {/* Due Soon */}
          {taskCounts.dueSoon > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Due Soon</p>
                  <p className="text-2xl font-bold text-orange-900">{taskCounts.dueSoon}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          {/* Upcoming */}
          {taskCounts.upcoming > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-900">{taskCounts.upcoming}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Priority Sections */}
      <div className="space-y-8">
        <PrioritySection
          priority="overdue"
          tasks={groupedTasks.overdue}
          onTaskClick={handleTaskClick}
        />
        
        <PrioritySection
          priority="dueSoon"
          tasks={groupedTasks.dueSoon}
          onTaskClick={handleTaskClick}
        />
        
        <PrioritySection
          priority="upcoming"
          tasks={groupedTasks.upcoming}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  );
};

export default ToDoTab;
