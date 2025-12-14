/**
 * Date Formatting Utility
 * Provides human-readable date formatting for tasks and assignments
 */

import { format, formatDistanceToNow, differenceInDays, differenceInHours, isPast, isToday, isTomorrow } from 'date-fns';

/**
 * Format due date as relative time (e.g., "Due in 2 days", "2 days overdue")
 * @param {Date|string|null} dueDate - The due date
 * @returns {string} Formatted relative time string
 */
export function formatDueDate(dueDate) {
  if (!dueDate) return 'No due date';
  
  const due = new Date(dueDate);
  const now = new Date();
  
  // Check if overdue
  if (isPast(due) && !isToday(due)) {
    const daysOverdue = Math.abs(differenceInDays(now, due));
    if (daysOverdue === 0) {
      const hoursOverdue = Math.abs(differenceInHours(now, due));
      return `${hoursOverdue} ${hoursOverdue === 1 ? 'hour' : 'hours'} overdue`;
    }
    return `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`;
  }
  
  // Check if today
  if (isToday(due)) {
    return `Due today at ${format(due, 'h:mm a')}`;
  }
  
  // Check if tomorrow
  if (isTomorrow(due)) {
    return `Due tomorrow at ${format(due, 'h:mm a')}`;
  }
  
  // Future dates
  const daysUntilDue = differenceInDays(due, now);
  if (daysUntilDue <= 7) {
    return `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
  }
  
  // More than a week away
  return `Due ${format(due, 'MMM d, yyyy')}`;
}

/**
 * Format due date with time for display
 * @param {Date|string|null} dueDate - The due date
 * @returns {string} Formatted date and time string
 */
export function formatDueDateWithTime(dueDate) {
  if (!dueDate) return 'No due date';
  
  const due = new Date(dueDate);
  
  if (isToday(due)) {
    return `Today at ${format(due, 'h:mm a')}`;
  }
  
  if (isTomorrow(due)) {
    return `Tomorrow at ${format(due, 'h:mm a')}`;
  }
  
  return format(due, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Get time remaining until due date
 * @param {Date|string|null} dueDate - The due date
 * @returns {string} Time remaining string
 */
export function getTimeRemaining(dueDate) {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  
  if (isPast(due)) {
    return 'Overdue';
  }
  
  const daysRemaining = differenceInDays(due, now);
  const hoursRemaining = differenceInHours(due, now);
  
  if (daysRemaining === 0) {
    if (hoursRemaining === 0) {
      return 'Due very soon';
    }
    return `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'} remaining`;
  }
  
  if (daysRemaining === 1) {
    return '1 day remaining';
  }
  
  return `${daysRemaining} days remaining`;
}

/**
 * Format creation date for display
 * @param {Date|string} createdAt - The creation date
 * @returns {string} Formatted creation date
 */
export function formatCreatedDate(createdAt) {
  if (!createdAt) return '';
  
  const created = new Date(createdAt);
  
  if (isToday(created)) {
    return `Created today at ${format(created, 'h:mm a')}`;
  }
  
  return `Created ${formatDistanceToNow(created, { addSuffix: true })}`;
}

/**
 * Get urgency indicator text
 * @param {Date|string|null} dueDate - The due date
 * @returns {string} Urgency text
 */
export function getUrgencyText(dueDate) {
  if (!dueDate) return '';
  
  const due = new Date(dueDate);
  const now = new Date();
  
  if (isPast(due)) {
    return 'OVERDUE';
  }
  
  const hoursRemaining = differenceInHours(due, now);
  
  if (hoursRemaining <= 24) {
    return 'DUE SOON';
  }
  
  const daysRemaining = differenceInDays(due, now);
  
  if (daysRemaining <= 3) {
    return 'DUE SOON';
  }
  
  return '';
}

/**
 * Check if a date is within a certain number of days
 * @param {Date|string} date - The date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within the specified days
 */
export function isWithinDays(date, days) {
  if (!date) return false;
  
  const targetDate = new Date(date);
  const now = new Date();
  const diffDays = differenceInDays(targetDate, now);
  
  return diffDays >= 0 && diffDays <= days;
}
