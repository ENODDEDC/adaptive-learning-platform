/**
 * Task Priority Utility
 * Calculates priority levels for assignments and forms based on due dates
 */

/**
 * Calculate priority level based on due date
 * @param {Date|string|null} dueDate - The due date of the task
 * @returns {'overdue'|'dueSoon'|'upcoming'} Priority level
 */
export function calculatePriority(dueDate) {
  if (!dueDate) return 'upcoming';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffInMs = due - now;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  // Overdue: due date has passed
  if (diffInDays < 0) return 'overdue';
  
  // Due soon: within 3 days
  if (diffInDays <= 3) return 'dueSoon';
  
  // Upcoming: more than 3 days away
  return 'upcoming';
}

/**
 * Get priority display information
 * @param {'overdue'|'dueSoon'|'upcoming'} priority - Priority level
 * @returns {Object} Display information including label, color, and icon
 */
export function getPriorityInfo(priority) {
  const priorityMap = {
    overdue: {
      label: 'Overdue',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      icon: 'exclamation-circle'
    },
    dueSoon: {
      label: 'Due Soon',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-500',
      icon: 'clock'
    },
    upcoming: {
      label: 'Upcoming',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-500',
      icon: 'calendar'
    }
  };
  
  return priorityMap[priority] || priorityMap.upcoming;
}

/**
 * Get priority order for sorting
 * @param {'overdue'|'dueSoon'|'upcoming'} priority - Priority level
 * @returns {number} Sort order (lower number = higher priority)
 */
export function getPriorityOrder(priority) {
  const orderMap = {
    overdue: 0,
    dueSoon: 1,
    upcoming: 2
  };
  
  return orderMap[priority] ?? 2;
}

/**
 * Sort tasks by priority and due date
 * @param {Array} tasks - Array of task objects with priority and dueDate
 * @returns {Array} Sorted tasks
 */
export function sortTasksByPriority(tasks) {
  return tasks.sort((a, b) => {
    // First sort by priority
    const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Items without due dates go last
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    
    // If both have no due date, sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Group tasks by priority
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Tasks grouped by priority
 */
export function groupTasksByPriority(tasks) {
  return {
    overdue: tasks.filter(task => task.priority === 'overdue'),
    dueSoon: tasks.filter(task => task.priority === 'dueSoon'),
    upcoming: tasks.filter(task => task.priority === 'upcoming')
  };
}
