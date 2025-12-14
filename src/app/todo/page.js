'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PrioritySection from '@/components/PrioritySection';
import { groupTasksByPriority } from '@/utils/taskPriority';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

/**
 * Standalone To-Do Page
 * Shows all pending tasks across all enrolled courses
 */
export default function ToDoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('pending'); // 'pending' or 'completed'
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    overdue: 0,
    dueSoon: 0,
    upcoming: 0,
    total: 0,
    completed: 0
  });
  
  /**
   * Fetch pending tasks from API
   */
  const fetchPendingTasks = useCallback(async () => {
    try {
      console.log('📋 ToDoPage: Fetching pending tasks...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/students/todo');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ ToDoPage: Received', data.tasks?.length || 0, 'tasks');
      console.log('📊 ToDoPage: Counts:', data.counts);
      
      setTasks(data.tasks || []);
      setTaskCounts(prev => ({ ...prev, ...data.counts }));
      
    } catch (err) {
      console.error('❌ ToDoPage: Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch completed tasks from API
   */
  const fetchCompletedTasks = useCallback(async () => {
    try {
      console.log('✅ ToDoPage: Fetching completed tasks...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/students/todo/completed');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completed tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ ToDoPage: Received', data.tasks?.length || 0, 'completed tasks');
      
      setCompletedTasks(data.tasks || []);
      setTaskCounts(prev => ({ ...prev, completed: data.count || 0 }));
      
    } catch (err) {
      console.error('❌ ToDoPage: Error fetching completed tasks:', err);
      setError(err.message || 'Failed to load completed tasks');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Refresh tasks
   */
  const refreshTasks = useCallback(() => {
    console.log('🔄 ToDoPage: Refreshing tasks...');
    if (view === 'pending') {
      fetchPendingTasks();
    } else {
      fetchCompletedTasks();
    }
  }, [view, fetchPendingTasks, fetchCompletedTasks]);
  
  /**
   * Handle task click - navigate to appropriate page
   */
  const handleTaskClick = useCallback((task) => {
    console.log('🖱️ ToDoPage: Task clicked:', task.title, 'Type:', task.type);
    
    if (task.type === 'assignment') {
      // Navigate to course page where student can view and submit the assignment
      router.push(`/courses/${task.courseId}`);
    } else if (task.type === 'form') {
      // Navigate to form page
      router.push(`/forms/${task._id}`);
    }
  }, [router]);
  
  // Fetch tasks on component mount
  useEffect(() => {
    console.log('🎬 ToDoPage: Component mounted, fetching tasks...');
    fetchPendingTasks();
    fetchCompletedTasks();
  }, [fetchPendingTasks, fetchCompletedTasks]);
  
  // Group tasks by priority
  const groupedTasks = groupTasksByPriority(tasks);
  
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    );
  }
  
  // Empty State
  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/home')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                aria-label="Go to home"
              >
                <HomeIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My To-Do List</h1>
                <p className="text-gray-600 mt-1">All your pending tasks in one place</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              You have no pending assignments or forms. Great job staying on top of your work!
            </p>
            <button
              onClick={() => router.push('/home')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main Content
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/home')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                aria-label="Go to home"
              >
                <HomeIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My To-Do List</h1>
                <p className="text-gray-600 mt-1">
                  {view === 'pending' 
                    ? `${taskCounts.total} ${taskCounts.total === 1 ? 'task' : 'tasks'} pending across all courses`
                    : `${taskCounts.completed} ${taskCounts.completed === 1 ? 'task' : 'tasks'} completed`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="inline-flex bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setView('pending')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pending ({taskCounts.total})
                </button>
                <button
                  onClick={() => setView('completed')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === 'completed'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Completed ({taskCounts.completed})
                </button>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={refreshTasks}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Refresh tasks"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Summary Stats - Only show for pending view */}
          {view === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overdue */}
            {taskCounts.overdue > 0 && (
              <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Overdue</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">{taskCounts.overdue}</p>
                  </div>
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Due Soon */}
            {taskCounts.dueSoon > 0 && (
              <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Due Soon</p>
                    <p className="text-3xl font-bold text-orange-900 mt-1">{taskCounts.dueSoon}</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Upcoming */}
            {taskCounts.upcoming > 0 && (
              <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{taskCounts.upcoming}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
        
        {/* Task Sections */}
        {view === 'pending' ? (
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
        ) : (
          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Tasks Yet</h3>
                <p className="text-gray-600">Complete some assignments or forms to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white rounded-lg border-2 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {task.courseName}
                      </span>
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                    
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>
                        {task.type === 'form' ? 'Form' : task.assignmentType === 'quiz' ? 'Quiz' : 'Assignment'}
                      </span>
                      {task.grade !== null && task.grade !== undefined && (
                        <span className="font-semibold text-green-600">
                          Grade: {task.grade}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
