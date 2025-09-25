'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import CreateClassworkModal from '@/components/CreateClassworkModal';
import SubmitAssignmentModal from '@/components/SubmitAssignmentModal';
import ContentViewer from '@/components/ContentViewer.client';

const ClassworkTab = ({ courseDetails, isInstructor, onOpenContent }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isCreateClassworkModalOpen, setIsCreateClassworkModalOpen] = useState(false);
  const [isClassworkMenuOpen, setIsClassworkMenuOpen] = useState(false);
  const [editingClasswork, setEditingClasswork] = useState(null);
  const [classworkType, setClassworkType] = useState('assignment');
  const [isSubmitAssignmentModalOpen, setIsSubmitAssignmentModalOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Enhanced filtering and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, timeline, kanban
  const [prevViewMode, setPrevViewMode] = useState('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, thisWeek, thisMonth, overdue
  const [statusFilter, setStatusFilter] = useState('all'); // all, notStarted, inProgress, completed
  const [groupBy, setGroupBy] = useState('none'); // none, dueDate, type, status

  // Handle smooth view mode transitions
  const handleViewModeChange = (newMode) => {
    if (newMode === viewMode || isTransitioning) return;

    setIsTransitioning(true);
    setPrevViewMode(viewMode);

    // Apply transition animation
    setTimeout(() => {
      setViewMode(newMode);
      setIsTransitioning(false);
    }, 150);
  };

  // Enhanced filtering and sorting logic
  const getFilteredAndSortedAssignments = useCallback(() => {
    let filtered = assignments.filter(assignment => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          assignment.title?.toLowerCase().includes(query) ||
          assignment.description?.toLowerCase().includes(query) ||
          assignment.type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filter !== 'all' && assignment.type !== filter) return false;

      // Date range filter
      if (dateRange !== 'all' && assignment.dueDate) {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        switch (dateRange) {
          case 'thisWeek':
            if (daysDiff < 0 || daysDiff > 7) return false;
            break;
          case 'thisMonth':
            if (daysDiff < 0 || daysDiff > 30) return false;
            break;
          case 'overdue':
            if (daysDiff >= 0) return false;
            break;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const submission = submissions.find(s => s.assignment === assignment._id);
        const isCompleted = submission && submission.status === 'submitted';
        const isInProgress = submission && submission.status === 'draft';
        
        switch (statusFilter) {
          case 'notStarted':
            if (submission) return false;
            break;
          case 'inProgress':
            if (!isInProgress) return false;
            break;
          case 'completed':
            if (!isCompleted) return false;
            break;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'dueDate':
          return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'mostUrgent':
          const aDue = new Date(a.dueDate || '9999-12-31');
          const bDue = new Date(b.dueDate || '9999-12-31');
          const now = new Date();
          const aUrgency = Math.ceil((aDue - now) / (1000 * 60 * 60 * 24));
          const bUrgency = Math.ceil((bDue - now) / (1000 * 60 * 60 * 24));
          return aUrgency - bUrgency;
        default:
          return 0;
      }
    });

    return filtered;
  }, [assignments, submissions, searchQuery, filter, dateRange, statusFilter, sortBy]);

  // Enhanced Activity Card Component
  const EnhancedActivityCard = ({ assignment, submission, isInstructor, onEdit, onDelete, onSubmit, onOpenContent, viewMode }) => {
    const typeConfig = {
      assignment: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        color: 'blue',
        bgColor: 'blue-50',
        borderColor: 'blue-200',
        textColor: 'blue-700',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-blue-600'
      },
      quiz: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
        color: 'purple',
        bgColor: 'purple-50',
        borderColor: 'purple-200',
        textColor: 'purple-700',
        gradientFrom: 'from-purple-500',
        gradientTo: 'to-purple-600'
      },
      material: {
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
        color: 'amber',
        bgColor: 'amber-50',
        borderColor: 'amber-200',
        textColor: 'amber-700',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-amber-600'
      }
    };

    const config = typeConfig[assignment.type] || typeConfig.assignment;
    const isCompleted = submission && submission.status === 'submitted';
    const isInProgress = submission && submission.status === 'draft';
    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !isCompleted;
    
    // Progress calculation (mock for now)
    const progress = isCompleted ? 100 : isInProgress ? Math.random() * 80 + 20 : 0;
    
    // Urgency calculation
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const urgency = isOverdue ? 'overdue' : daysLeft <= 2 ? 'urgent' : daysLeft <= 7 ? 'soon' : 'normal';

    const getUrgencyConfig = () => {
      switch (urgency) {
        case 'overdue':
          return { color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
        case 'urgent':
          return { color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
        case 'soon':
          return { color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
        default:
          return { color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
      }
    };

    const urgencyConfig = getUrgencyConfig();

    // Render different layouts based on view mode
    if (viewMode === 'grid') {
      return (
        <div className={`group relative bg-white border ${config.borderColor} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
          {/* Gradient Header */}
          <div className={`h-2 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`}></div>
          
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${config.bgColor} ${config.borderColor} border rounded-xl flex items-center justify-center`}>
                  <div className={config.textColor}>
                    {config.icon}
                  </div>
                </div>
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                    {(assignment.type || 'assignment').charAt(0).toUpperCase() + (assignment.type || 'assignment').slice(1)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {assignment.createdAt ? format(new Date(assignment.createdAt), 'MMM dd, yyyy') : ''}
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
                    Overdue
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                    Completed
                  </span>
                )}
                {isInProgress && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                    In Progress
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
              {assignment.title}
            </h3>

            {/* Progress Bar */}
            {assignment.type === 'assignment' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'No due date'}</span>
            </div>

            {/* Attachments */}
            {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{assignment.attachments.length} attachment{assignment.attachments.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {isInstructor ? (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={onDelete}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {isCompleted ? (
                      <span className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg">
                        ✓ Completed
                      </span>
                    ) : isInProgress ? (
                      <button
                        onClick={onSubmit}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={onSubmit}
                        className={`px-3 py-2 text-sm font-medium text-white bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-lg hover:opacity-90 transition-opacity`}
                      >
                        Start
                      </button>
                    )}
                  </>
                )}
              </div>
              
              {/* View Button */}
              <button
                onClick={() => {
                  if (onOpenContent) {
                    // If assignment has attachments, create a multi-attachment content object
                    if (assignment.attachments && assignment.attachments.length > 0) {
                      if (assignment.attachments.length === 1) {
                        // Single attachment - open directly
                        onOpenContent(assignment.attachments[0]);
                      } else {
                        // Multiple attachments - create a container object
                        const multiAttachmentContent = {
                          title: assignment.title,
                          contentType: 'multi-attachment',
                          attachments: assignment.attachments,
                          currentIndex: 0
                        };
                        onOpenContent(multiAttachmentContent);
                      }
                    } else {
                      // If no attachments, create a mock content object for the assignment
                      const mockContent = {
                        title: assignment.title,
                        filePath: null,
                        mimeType: 'text/plain',
                        fileSize: 0,
                        contentType: 'assignment'
                      };
                      onOpenContent(mockContent);
                    }
                  }
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        </div>
      );
    }

    // List view (compact)
    if (viewMode === 'list') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 ${config.bgColor} ${config.borderColor} border rounded-lg flex items-center justify-center`}>
                  <div className={config.textColor}>
                    {config.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{(assignment.type || 'assignment').charAt(0).toUpperCase() + (assignment.type || 'assignment').slice(1)}</span>
                    <span>•</span>
                    <span>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd') : 'No due date'}</span>
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{assignment.attachments.length} attachment{assignment.attachments.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                    ✓ Completed
                  </span>
                )}
                {isInProgress && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded">
                    In Progress
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                    Overdue
                  </span>
                )}
                <button
                  onClick={() => {
                    if (onOpenContent) {
                      if (assignment.attachments && assignment.attachments.length > 0) {
                        if (assignment.attachments.length === 1) {
                          onOpenContent(assignment.attachments[0]);
                        } else {
                          const multiAttachmentContent = {
                            title: assignment.title,
                            contentType: 'multi-attachment',
                            attachments: assignment.attachments,
                            currentIndex: 0
                          };
                          onOpenContent(multiAttachmentContent);
                        }
                      } else {
                        const mockContent = {
                          title: assignment.title,
                          filePath: null,
                          mimeType: 'text/plain',
                          fileSize: 0,
                          contentType: 'assignment'
                        };
                        onOpenContent(mockContent);
                      }
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Timeline view
    if (viewMode === 'timeline') {
      return (
        <div className="relative flex items-start gap-6">
          {/* Timeline dot */}
          <div className={`relative z-10 flex-shrink-0 w-16 h-16 ${config.bgColor} ${config.borderColor} border-2 rounded-full flex items-center justify-center`}>
            <div className={config.textColor}>
              {config.icon}
            </div>
          </div>
          
          {/* Content */}
          <div className={`flex-1 bg-white border ${config.borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {assignment.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                    {(assignment.type || 'assignment').charAt(0).toUpperCase() + (assignment.type || 'assignment').slice(1)}
                  </span>
                  <span>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'No due date'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                    ✓ Completed
                  </span>
                )}
                {isInProgress && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                    In Progress
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full">
                    Overdue
                  </span>
                )}
              </div>
            </div>
            
            {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{assignment.attachments.length} attachment{assignment.attachments.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (onOpenContent) {
                    if (assignment.attachments && assignment.attachments.length > 0) {
                      if (assignment.attachments.length === 1) {
                        onOpenContent(assignment.attachments[0]);
                      } else {
                        const multiAttachmentContent = {
                          title: assignment.title,
                          contentType: 'multi-attachment',
                          attachments: assignment.attachments,
                          currentIndex: 0
                        };
                        onOpenContent(multiAttachmentContent);
                      }
                    } else {
                      const mockContent = {
                        title: assignment.title,
                        filePath: null,
                        mimeType: 'text/plain',
                        fileSize: 0,
                        contentType: 'assignment'
                      };
                      onOpenContent(mockContent);
                    }
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Details
              </button>
              {!isInstructor && !isCompleted && (
                <button
                  onClick={onSubmit}
                  className={`px-4 py-2 text-sm font-medium text-white bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-lg hover:opacity-90 transition-opacity`}
                >
                  {isInProgress ? 'Continue' : 'Start'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Kanban view (compact cards)
    if (viewMode === 'kanban') {
      return (
        <div className={`bg-white border ${config.borderColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-8 h-8 ${config.bgColor} ${config.borderColor} border rounded-lg flex items-center justify-center flex-shrink-0`}>
              <div className={config.textColor}>
                {config.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                {assignment.title}
              </h4>
              <div className="text-xs text-gray-500">
                Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd') : 'No due date'}
              </div>
            </div>
          </div>
          
          {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{assignment.attachments.length}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
              {(assignment.type || 'assignment').charAt(0).toUpperCase() + (assignment.type || 'assignment').slice(1)}
            </span>
            <button
              onClick={() => {
                if (onOpenContent) {
                  if (assignment.attachments && assignment.attachments.length > 0) {
                    if (assignment.attachments.length === 1) {
                      onOpenContent(assignment.attachments[0]);
                    } else {
                      const multiAttachmentContent = {
                        title: assignment.title,
                        contentType: 'multi-attachment',
                        attachments: assignment.attachments,
                        currentIndex: 0
                      };
                      onOpenContent(multiAttachmentContent);
                    }
                  } else {
                    const mockContent = {
                      title: assignment.title,
                      filePath: null,
                      mimeType: 'text/plain',
                      fileSize: 0,
                      contentType: 'assignment'
                    };
                    onOpenContent(mockContent);
                  }
                }
              }}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
            >
              View
            </button>
          </div>
        </div>
      );
    }

    // Default view (original layout)
    return (
      <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                  <div className={config.textColor}>
                    {config.icon}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
                    {(assignment.type || 'assignment').charAt(0).toUpperCase() + (assignment.type || 'assignment').slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {assignment.createdAt ? format(new Date(assignment.createdAt), 'MMM dd, yyyy') : ''}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 break-words mb-2">
                {assignment.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'No due date'}</span>
                </div>
              </div>
              {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignment.attachments.map((att) => (
                    <div key={att._id} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate max-w-[180px] text-gray-700" title={att.originalName || att.title}>
                        {att.originalName || att.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenContent ? onOpenContent(att) : setSelectedContent(att)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-150"
                        >
                          View
                        </button>
                        <a
                          href={att.filePath}
                          download
                          className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors duration-150"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {isInstructor ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Assigned
                  </span>
                  <button
                    onClick={onEdit}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors duration-150"
                    aria-label="Edit classwork"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors duration-150"
                    aria-label="Delete classwork"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ) : submission ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Submitted
                </span>
              ) : (
                <button
                  onClick={onSubmit}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchAssignments = useCallback(async () => {
    if (!courseDetails) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/courses/${courseDetails._id}/classwork`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      let classwork = data.classwork;

      if (sortBy === 'newest') {
        classwork.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        classwork.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setAssignments(classwork);

      const submissionsRes = await fetch(`/api/courses/${courseDetails._id}/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions);
      }

    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [courseDetails, sortBy]);

  useEffect(() => {
    if (courseDetails) {
      fetchAssignments();
    }
  }, [courseDetails, fetchAssignments, sortBy]);

  const handleDeleteClasswork = useCallback(async (classworkId) => {
    if (!window.confirm('Are you sure you want to delete this classwork?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const res = await fetch(`/api/classwork/${classworkId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      fetchAssignments();
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete classwork:', err);
    }
  }, [fetchAssignments]);

  return (
    <div className="space-y-6">
      {/* Professional classwork management section */}
      <>
      {isInstructor && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm relative">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Classwork</h2>
                <p className="text-sm text-gray-600 mt-1">Create and manage assignments, quizzes, and materials</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  onClick={() => setIsClassworkMenuOpen(!isClassworkMenuOpen)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Create
                  <svg className="w-4 h-4 transition-transform duration-200" style={{transform: isClassworkMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd"/>
                  </svg>
                </button>
                <div id="classwork-menu" className={`absolute right-0 z-50 w-64 mt-2 origin-top-right bg-white border border-gray-200 rounded-lg shadow-xl focus:outline-none ${isClassworkMenuOpen ? '' : 'hidden'}`}>
                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150" onClick={() => { setClassworkType('assignment'); setIsCreateClassworkModalOpen(true); setIsClassworkMenuOpen(false); }}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Assignment
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150" onClick={() => { setClassworkType('quiz'); setIsCreateClassworkModalOpen(true); setIsClassworkMenuOpen(false); }}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Quiz
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150" onClick={() => { setClassworkType('question'); setIsCreateClassworkModalOpen(true); setIsClassworkMenuOpen(false); }}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Question
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150" onClick={() => { setClassworkType('material'); setIsCreateClassworkModalOpen(true); setIsClassworkMenuOpen(false); }}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Material
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Enhanced Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Title and View Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                <p className="text-sm text-gray-600 mt-1">All classwork and assignments</p>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  {[
                    { key: 'grid', icon: 'grid', label: 'Grid' },
                    { key: 'list', icon: 'list', label: 'List' },
                    { key: 'timeline', icon: 'timeline', label: 'Timeline' },
                    { key: 'kanban', icon: 'kanban', label: 'Kanban' }
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      onClick={() => handleViewModeChange(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all view-mode-transition ${
                        viewMode === key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      } ${isTransitioning ? 'pointer-events-none opacity-50' : ''}`}
                      title={label}
                      disabled={isTransitioning}
                    >
                      {icon === 'grid' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      )}
                      {icon === 'list' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      )}
                      {icon === 'timeline' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      )}
                      {icon === 'kanban' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filters */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All', color: 'gray' },
                  { key: 'assignment', label: 'Assignments', color: 'blue' },
                  { key: 'quiz', label: 'Quizzes', color: 'purple' },
                  { key: 'material', label: 'Materials', color: 'amber' }
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors duration-200 ${
                      filter === key
                        ? `bg-${color}-600 text-white border-${color}-600`
                        : `bg-white text-gray-700 border-gray-300 hover:bg-gray-50`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'thisWeek', label: 'Due This Week', color: 'blue' },
                  { key: 'overdue', label: 'Overdue', color: 'red' },
                  { key: 'notStarted', label: 'Not Started', color: 'gray' }
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'thisWeek' || key === 'overdue') {
                        setDateRange(key);
                        setStatusFilter('all');
                      } else {
                        setStatusFilter(key);
                        setDateRange('all');
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${
                      (key === 'thisWeek' || key === 'overdue') && dateRange === key
                        ? `bg-${color}-100 text-${color}-700 border-${color}-200`
                        : key === 'notStarted' && statusFilter === key
                        ? `bg-${color}-100 text-${color}-700 border-${color}-200`
                        : `bg-white text-gray-600 border-gray-200 hover:bg-gray-50`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="dueDate">Due Date</option>
                  <option value="title">Title</option>
                  <option value="mostUrgent">Most Urgent</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="thisWeek">This Week</option>
                      <option value="thisMonth">This Month</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="notStarted">Not Started</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Group By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="none">No Grouping</option>
                      <option value="dueDate">Due Date</option>
                      <option value="type">Type</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={`p-8 smooth-layout-change ${isTransitioning ? 'layout-transition-active' : ''}`}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_,i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">No activities yet</h4>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">Activities will appear here once your instructor creates assignments, quizzes, or materials for this course.</p>
            </div>
          ) : (() => {
            const filtered = getFilteredAndSortedAssignments();
            
            if (filtered.length === 0) {
              return (
                <div className="py-20 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
                    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                      <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">No matching activities</h4>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">Try adjusting your filters to see more activities, or check back later for new content.</p>
                </div>
              );
            }

            // Render based on view mode
            switch (viewMode) {
              case 'grid':
                return (
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 layout-transition-grid-to-list ${isTransitioning ? 'layout-transition-active' : ''}`}>
                    {filtered.map((assignment) => (
                      <EnhancedActivityCard 
                        key={assignment._id} 
                        assignment={assignment} 
                        submission={submissions.find(s => s.assignment === assignment._id)}
                        isInstructor={isInstructor}
                        onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                        onDelete={() => handleDeleteClasswork(assignment._id)}
                        onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                        onOpenContent={onOpenContent}
                        viewMode="grid"
                      />
                    ))}
                  </div>
                );
              
              case 'list':
                return (
                  <div className={`space-y-4 layout-transition-list-to-grid ${isTransitioning ? 'layout-transition-active' : ''}`}>
                    {filtered.map((assignment) => (
                      <EnhancedActivityCard 
                        key={assignment._id} 
                        assignment={assignment} 
                        submission={submissions.find(s => s.assignment === assignment._id)}
                        isInstructor={isInstructor}
                        onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                        onDelete={() => handleDeleteClasswork(assignment._id)}
                        onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                        onOpenContent={onOpenContent}
                        viewMode="list"
                      />
                    ))}
                  </div>
                );
              
              case 'timeline':
                return (
                  <div className={`relative layout-transition-to-timeline ${isTransitioning ? 'layout-transition-active' : ''}`}>
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>
                    <div className="space-y-8">
                      {filtered.map((assignment) => (
                        <EnhancedActivityCard 
                          key={assignment._id} 
                          assignment={assignment} 
                          submission={submissions.find(s => s.assignment === assignment._id)}
                          isInstructor={isInstructor}
                          onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                          onDelete={() => handleDeleteClasswork(assignment._id)}
                          onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                          onOpenContent={onOpenContent}
                          viewMode="timeline"
                        />
                      ))}
                    </div>
                  </div>
                );
              
              case 'kanban':
                return (
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 layout-transition-to-kanban ${isTransitioning ? 'layout-transition-active' : ''}`}>
                    {['notStarted', 'inProgress', 'completed'].map((status) => {
                      const statusAssignments = filtered.filter(assignment => {
                        const submission = submissions.find(s => s.assignment === assignment._id);
                        if (status === 'notStarted') return !submission;
                        if (status === 'inProgress') return submission && submission.status === 'draft';
                        if (status === 'completed') return submission && submission.status === 'submitted';
                        return false;
                      });
                      
                      return (
                        <div key={status} className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-4 capitalize">
                            {status.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <div className="space-y-3">
                            {statusAssignments.map((assignment) => (
                              <EnhancedActivityCard 
                                key={assignment._id} 
                                assignment={assignment} 
                                submission={submissions.find(s => s.assignment === assignment._id)}
                                isInstructor={isInstructor}
                                onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                                onDelete={() => handleDeleteClasswork(assignment._id)}
                                onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                                onOpenContent={onOpenContent}
                                viewMode="kanban"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              
              default:
                return (
                  <div className={`space-y-6 layout-transition-default ${isTransitioning ? 'layout-transition-active' : ''}`}>
                    {filtered.map((assignment) => (
                      <EnhancedActivityCard 
                        key={assignment._id} 
                        assignment={assignment} 
                        submission={submissions.find(s => s.assignment === assignment._id)}
                        isInstructor={isInstructor}
                        onEdit={() => { setEditingClasswork(assignment); setIsCreateClassworkModalOpen(true); }}
                        onDelete={() => handleDeleteClasswork(assignment._id)}
                        onSubmit={() => { setSubmittingAssignmentId(assignment._id); setIsSubmitAssignmentModalOpen(true); }}
                        onOpenContent={onOpenContent}
                        viewMode="default"
                      />
                    ))}
                  </div>
                );
            }
          })()}
        </div>
      </div>
      </>

      <CreateClassworkModal
        isOpen={isCreateClassworkModalOpen}
        onClose={() => {
          setIsCreateClassworkModalOpen(false);
          setEditingClasswork(null);
        }}
        courseId={courseDetails?._id}
        onClassworkCreated={fetchAssignments}
        initialData={editingClasswork}
        type={classworkType}
      />

      <SubmitAssignmentModal
        isOpen={isSubmitAssignmentModalOpen}
        onClose={() => setIsSubmitAssignmentModalOpen(false)}
        assignmentId={submittingAssignmentId}
        courseId={courseDetails?._id}
        onSubmissionSuccess={fetchAssignments}
      />
    </div>
  );
};

export default ClassworkTab;