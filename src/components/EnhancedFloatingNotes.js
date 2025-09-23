'use client';

import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  HashtagIcon,
  SparklesIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';

// Note templates for quick creation
const NOTE_TEMPLATES = {
  question: {
    icon: QuestionMarkCircleIcon,
    color: 'blue',
    content: '❓ Question: ',
    placeholder: 'What would you like to ask?'
  },
  important: {
    icon: ExclamationTriangleIcon,
    color: 'red',
    content: '⚠️ Important: ',
    placeholder: 'What is important to remember?'
  },
  todo: {
    icon: CheckCircleIcon,
    color: 'green',
    content: '✅ Todo: ',
    placeholder: 'What needs to be done?'
  },
  summary: {
    icon: DocumentTextIcon,
    color: 'purple',
    content: '📝 Summary: ',
    placeholder: 'Summarize the key points...'
  },
  idea: {
    icon: SparklesIcon,
    color: 'yellow',
    content: '💡 Idea: ',
    placeholder: 'What\'s your idea?'
  }
};

// Utility functions for collision detection and smart positioning
const checkCollision = (rect1, rect2, margin = 10) => {
  return !(rect1.right + margin < rect2.left || 
           rect1.left - margin > rect2.right || 
           rect1.bottom + margin < rect2.top || 
           rect1.top - margin > rect2.bottom);
};

const findOptimalPosition = (existingNotes, containerRect, noteWidth = 280, noteHeight = 200) => {
  const margin = 20;
  const gridSize = 40;
  
  // Try positions in a grid pattern
  for (let y = margin; y < containerRect.height - noteHeight - margin; y += gridSize) {
    for (let x = margin; x < containerRect.width - noteWidth - margin; x += gridSize) {
      const newRect = { left: x, top: y, right: x + noteWidth, bottom: y + noteHeight };
      
      const hasCollision = existingNotes.some(note => {
        const noteRect = {
          left: note.position.x,
          top: note.position.y,
          right: note.position.x + (note.size?.width || 280),
          bottom: note.position.y + (note.size?.height || 200)
        };
        return checkCollision(newRect, noteRect);
      });
      
      if (!hasCollision) {
        return { x, y };
      }
    }
  }
  
  // Fallback to random position if no optimal position found
  return {
    x: Math.random() * (containerRect.width - noteWidth - margin * 2) + margin,
    y: Math.random() * (containerRect.height - noteHeight - margin * 2) + margin
  };
};

const FloatingNote = ({ note, isActive, onClick, onUpdate, onDelete, onResizeStart, onDragStart, isResizing, onSave, onHide, draggedNote }) => {
  const noteRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(() => {
    // Strip HTML tags and decode HTML entities for editing
    if (!note.content) return '';
    return note.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/&nbsp;/g, ' ');
  });

  const [showHelp, setShowHelp] = useState(!note.content);



  const handleContentClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      setShowHelp(false);
      // Strip HTML tags and decode HTML entities for editing
      const plainText = note.content
        ? note.content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/&/g, '&')
            .replace(/"/g, '"')
            .replace(/'/g, "'")
            .replace(/&nbsp;/g, ' ')
        : '';
      setEditContent(plainText);
    }
  }, [isEditing, note.content]);

  const handleSave = useCallback(() => {
    // Save the plain text content
    const plainTextContent = editContent.trim();
    if (plainTextContent) {
      onUpdate(note.id, plainTextContent);
      if (onSave) {
        // Call onSave with the note object so it has access to all note data
        onSave(plainTextContent, note);
      }
      setShowHelp(false);
    }
    setIsEditing(false);
  }, [note.id, editContent, onUpdate, onSave, note]);

  const handleCancel = useCallback(() => {
    // Strip HTML tags and decode HTML entities for editing
    const plainText = note.content
      ? note.content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/&/g, '&')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/&nbsp;/g, ' ')
      : '';
    setEditContent(plainText);
    setIsEditing(false);
    setShowHelp(!note.content);
  }, [note.content]);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'b':
          e.preventDefault();
          // Insert bold markdown
          insertFormatting('**', '**');
          break;
        case 'i':
          e.preventDefault();
          // Insert italic markdown
          insertFormatting('*', '*');
          break;
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const insertFormatting = useCallback((prefix, suffix) => {
    const textarea = document.querySelector(`#note-textarea-${note.id}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);

    if (selectedText) {
      const newText = editContent.substring(0, start) + prefix + selectedText + suffix + editContent.substring(end);
      setEditContent(newText);

      // Set cursor position after the inserted formatting
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // If no text selected, just insert the prefix and suffix at cursor position
      const cursorPos = textarea.selectionStart;
      const newText = editContent.substring(0, cursorPos) + prefix + suffix + editContent.substring(cursorPos);
      setEditContent(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [editContent, note.id]);

  // Function to render markdown-like formatting for preview
  const renderFormattedText = useCallback((text) => {
    if (!text) return '';

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold: **text**
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic: *text*
  }, []);

  return (
    <div
      ref={noteRef}
      id={`note-${note.id}`}
      className={`absolute rounded-xl shadow-lg border transition-all duration-200 ${
        isActive
          ? 'border-indigo-400 shadow-xl z-50'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
      } ${isResizing || draggedNote === note.id ? 'cursor-grabbing z-50' : 'cursor-default'}`}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size?.width || 280,
        height: note.size?.height || 200,
        backgroundColor: '#ffffff',
        transform: draggedNote === note.id ? 'rotate(2deg) scale(1.02)' : 'none',
        transition: draggedNote === note.id ? 'none' : 'all 0.2s ease',
      }}
      onClick={() => onClick(note.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with gradient */}
      <div
        className="flex items-center justify-between p-3 rounded-t-xl bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100 cursor-move select-none"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragStart(e, note.id);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
          <div className="w-3 h-3 rounded-full bg-pink-400"></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="text-xs font-medium text-gray-500 size-indicator">
            {Math.round(note.size?.width || 280)} × {Math.round(note.size?.height || 200)}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide(note.id);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="p-1 text-gray-600 hover:text-gray-800 rounded transition-colors pointer-events-auto"
            title="Hide floating note"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 h-[calc(100%-40px)] overflow-auto">
        {isEditing ? (
          <div className="w-full h-full">
            {/* Simple textarea for editing - no preview during editing */}
            <textarea
              id={`note-textarea-${note.id}`}
              className="w-full h-full resize-none border-none outline-none text-gray-700 text-sm font-light bg-white"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Start typing here..."
              autoFocus
              style={{
                caretColor: '#3b82f6', // Blue cursor color
              }}
            />
          </div>
        ) : (
          <div
            className={`w-full h-full text-gray-700 text-sm font-light select-none transition-all duration-200 ${
              !isEditing ? 'cursor-text hover:bg-gray-50 hover:bg-opacity-50 rounded' : ''
            }`}
            onClick={handleContentClick}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {note.content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: note.content.replace(/</g, '<').replace(/>/g, '>')
                }}
              />
            ) : showHelp ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="text-gray-400 text-xs space-y-1">
                  <div className="font-medium mb-2">💡 Keyboard Shortcuts</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+S</kbd> Save note</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+B</kbd> Bold text</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+I</kbd> Italic text</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Cancel editing</div>
                  <div className="text-gray-300 text-xs mt-3">Click to start editing...</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic">Click to edit note...</div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Resize Handles */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner handles */}
        <div
          className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-sm cursor-se-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'se');
            }
          }}
          title="Resize southeast"
        />
        <div
          className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-sm cursor-ne-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'ne');
            }
          }}
          title="Resize northeast"
        />
        <div
          className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-sm cursor-sw-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'sw');
            }
          }}
          title="Resize southwest"
        />
        <div
          className={`absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-sm cursor-nw-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'nw');
            }
          }}
          title="Resize northwest"
        />
        
        {/* Edge handles */}
        <div
          className={`absolute top-1/2 -right-1.5 w-3 h-6 bg-white rounded-sm cursor-e-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 transform -translate-y-1/2 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'e');
            }
          }}
          title="Resize east"
        />
        <div
          className={`absolute top-1/2 -left-1.5 w-3 h-6 bg-white rounded-sm cursor-w-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 transform -translate-y-1/2 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'w');
            }
          }}
          title="Resize west"
        />
        <div
          className={`absolute left-1/2 -bottom-1.5 w-6 h-3 bg-white rounded-sm cursor-s-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 transform -translate-x-1/2 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 's');
            }
          }}
          title="Resize south"
        />
        <div
          className={`absolute left-1/2 -top-1.5 w-6 h-3 bg-white rounded-sm cursor-n-resize opacity-0 ${
            isHovered || isActive ? 'opacity-100' : ''
          } transition-opacity pointer-events-auto shadow border border-gray-300 transform -translate-x-1/2 resize-handle`}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (typeof onResizeStart === 'function') {
              onResizeStart(e, note.id, 'n');
            }
          }}
          title="Resize north"
        />
      </div>
    </div>
  );
};

const EnhancedFloatingNotes = forwardRef(({ contentId, courseId, userId, isVisible = true }, ref) => {
  // Core state
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [floatingNotes, setFloatingNotes] = useState([]);
  
  // UI state
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Drag and resize state
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingNote, setResizingNote] = useState(null);
  const [resizeDirection, setResizeDirection] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [activeNote, setActiveNote] = useState(null);
  
  const containerRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    lastWidth: 0,
    lastHeight: 0,
    animationFrameId: null
  });

  // Ensure container reference is properly set
  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = document.querySelector('.fixed.inset-0.pointer-events-none.z-\\[9999\\]') || document.body;
    }
  }, []);

  // Fetch functions
  const fetchSavedNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes?contentId=${contentId}&courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        const mappedNotes = (data.notes || []).map(note => ({
          ...note,
          id: note._id || note.id,
          timestamp: note.createdAt || note.timestamp || new Date().toISOString(),
          type: note.type || 'general'
        }));
        setSavedNotes(mappedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  }, [contentId, courseId]);

  const fetchSharedNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes?courseId=${courseId}&includeShared=true&excludeContentId=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        const mappedSharedNotes = (data.sharedNotes || [])
          .filter(note => {
            const noteUserId = note.userId?._id || note.userId?.toString() || note.userId;
            const currentUserId = userId?.toString() || userId;
            return noteUserId !== currentUserId;
          })
          .map(note => ({
            ...note,
            id: note._id || note.id,
            timestamp: note.createdAt || note.timestamp || new Date().toISOString(),
            isShared: true,
            authorName: note.userId?.name || 'Unknown User',
            type: note.type || 'general'
          }));
        setSharedNotes(mappedSharedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch shared notes:', error);
    }
  }, [courseId, contentId, userId]);

  useEffect(() => {
    if (contentId && userId) {
      fetchSavedNotes();
      fetchSharedNotes();
    }
  }, [contentId, userId, fetchSavedNotes, fetchSharedNotes]);

  // Enhanced note creation with templates and smart positioning
  const createNote = useCallback((template = null) => {
    const containerRect = containerRef.current?.getBoundingClientRect() || { width: 1200, height: 800 };
    const position = findOptimalPosition(floatingNotes, containerRect);
    
    const newNote = {
      id: `temp-${Date.now()}`,
      content: template ? template.content : '',
      position,
      timestamp: new Date().toISOString(),
      isNew: true,
      type: template ? template.type : 'general',
      size: { width: 280, height: 200 }
    };
    
    setFloatingNotes(prev => [...prev, newNote]);
    setIsCreatingNote(false);
    setShowTemplates(false);
  }, [floatingNotes]);

  const createContextualNote = useCallback((contextualText, contextualId) => {
    const containerRect = containerRef.current?.getBoundingClientRect() || { width: 1200, height: 800 };
    const position = findOptimalPosition(floatingNotes, containerRect);
    
    const newNote = {
      id: `temp-${Date.now()}`,
      content: contextualText,
      position,
      timestamp: new Date().toISOString(),
      isNew: true,
      contextualText,
      contextualId,
      type: 'contextual',
      size: { width: 280, height: 200 }
    };
    setFloatingNotes(prev => [...prev, newNote]);
  }, [floatingNotes]);

  // Enhanced save function
  const saveNote = useCallback(async (noteId, content, position, contextualText, contextualId, size, type = 'general') => {
    try {
      const noteData = {
        contentId,
        courseId,
        userId,
        content,
        position,
        size,
        type,
        contextualText,
        contextualId,
      };

      let response;
      if (noteId.startsWith('temp-')) {
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData)
        });
      } else {
        response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, position, contextualText, contextualId, size, type })
        });
      }

      if (response.ok) {
        const savedNote = await response.json();
        const noteWithId = { 
          ...savedNote.note, 
          id: savedNote.note._id || savedNote.note.id,
          timestamp: savedNote.note.createdAt || savedNote.note.timestamp || new Date().toISOString()
        };
        
        setFloatingNotes(prev => prev.map(note => 
          note.id === noteId ? noteWithId : note
        ));
        
        setSavedNotes(prev => {
          const existingIndex = prev.findIndex(note => note.id === noteWithId.id);
          if (existingIndex >= 0) {
            return prev.map(note => note.id === noteWithId.id ? noteWithId : note);
          } else {
            return [...prev, noteWithId];
          }
        });
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [contentId, courseId, userId]);

  // Completely rewritten resize functionality with a focus on the exact behavior you want
  const handleResizeStart = useCallback((e, noteId, direction) => {
    // Prevent starting a new resize operation if one is already in progress
    if (resizingNote) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const note = floatingNotes.find(n => n.id === noteId);
    if (!note) return;

    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    setResizingNote(noteId);
    setActiveNote(noteId); // Make note active when resizing
    setResizeDirection(direction);
    setResizeStart({
      // Store the mouse position relative to the container
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      // Store the current note dimensions and position
      width: note.size?.width || 280,
      height: note.size?.height || 200,
      position: note.position
    });
  }, [floatingNotes, resizingNote]);



  // Enhanced drag with collision detection and snapping
  const handleMouseDown = useCallback((e, noteId) => {
    // Don't start dragging if we're already resizing
    if (resizingNote) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const note = floatingNotes.find(n => n.id === noteId);
    if (!note) {
      return;
    }

    const noteElement = document.getElementById(`note-${noteId}`);
    if (noteElement) {
      const noteRect = noteElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

      setDraggedNote(noteId);
      setActiveNote(noteId); // Make note active when dragging
      setDragOffset({
        x: e.clientX - noteRect.left,
        y: e.clientY - noteRect.top
      });

      // Start drag immediately
      dragStateRef.current.isDragging = true;
      dragStateRef.current.lastX = noteRect.left - containerRect.left;
      dragStateRef.current.lastY = noteRect.top - containerRect.top;
    }
  }, [floatingNotes, resizingNote]);

  const handleMouseMove = useCallback((e) => {
    // Handle dragging
    if (draggedNote && !resizingNote) {
      if (!containerRef.current) {
        return;
      }

      const noteElement = document.getElementById(`note-${draggedNote}`);
      if (!noteElement) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const noteWidth = noteElement.offsetWidth;
      const noteHeight = noteElement.offsetHeight;

      // Calculate new position based on mouse movement
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Boundary constraints relative to container
      newX = Math.max(0, Math.min(newX, containerRect.width - noteWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - noteHeight));

      // Apply position immediately
      noteElement.style.left = `${newX}px`;
      noteElement.style.top = `${newY}px`;

      // Update drag state
      dragStateRef.current.lastX = newX;
      dragStateRef.current.lastY = newY;
      dragStateRef.current.isDragging = true;

      return;
    }
    
    // Handle resizing
    if (resizingNote) {
      // Check if the left mouse button is still pressed
      if (e.buttons !== 1) {
        // Call resize end logic directly
        if (resizingNote) {
          const finalWidth = dragStateRef.current.lastWidth;
          const finalHeight = dragStateRef.current.lastHeight;
          const finalX = dragStateRef.current.lastX;
          const finalY = dragStateRef.current.lastY;

          setFloatingNotes(prev => prev.map(n =>
            n.id === resizingNote ? { 
              ...n, 
              size: { width: finalWidth, height: finalHeight },
              position: { x: finalX, y: finalY }
            } : n
          ));

          const note = floatingNotes.find(n => n.id === resizingNote);
          if (note) {
            saveNote(note.id, note.content, { x: finalX, y: finalY }, note.contextualText, note.contextualId, 
                    { width: finalWidth, height: finalHeight }, note.type);
          }
          
          // Hide size indicator
          const noteElement = document.getElementById(`note-${resizingNote}`);
          if (noteElement) {
            const sizeIndicator = noteElement.querySelector('.size-indicator');
            if (sizeIndicator) {
              sizeIndicator.style.opacity = '0';
            }
          }
          
          setResizingNote(null);
          setResizeDirection('');
        }
        return;
      }
      
      if (!containerRef.current) return;

      const noteElement = document.getElementById(`note-${resizingNote}`);
      if (!noteElement) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - containerRect.left - resizeStart.x;
      const dy = e.clientY - containerRect.top - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.position.x;
      let newY = resizeStart.position.y;
      
      // Handle different resize directions with proper constraints
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(200, Math.min(600, resizeStart.width + dx));
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.max(200, Math.min(600, resizeStart.width - dx));
        // Adjust position when resizing from the left
        newX = resizeStart.position.x + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(150, Math.min(500, resizeStart.height + dy));
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.max(150, Math.min(500, resizeStart.height - dy));
        // Adjust position when resizing from the top
        newY = resizeStart.position.y + (resizeStart.height - newHeight);
      }

      // Apply size and position
      noteElement.style.width = `${newWidth}px`;
      noteElement.style.height = `${newHeight}px`;
      noteElement.style.left = `${newX}px`;
      noteElement.style.top = `${newY}px`;
      
      // Show size indicator
      const sizeIndicator = noteElement.querySelector('.size-indicator');
      if (sizeIndicator) {
        sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)}`;
        sizeIndicator.style.opacity = '1';
      }

      dragStateRef.current.lastWidth = newWidth;
      dragStateRef.current.lastHeight = newHeight;
      dragStateRef.current.lastX = newX;
      dragStateRef.current.lastY = newY;
    }
  }, [draggedNote, dragOffset, resizingNote, resizeStart, resizeDirection]);

  const handleMouseUp = useCallback(() => {
    if (draggedNote) {
      if (dragStateRef.current.animationFrameId) {
        cancelAnimationFrame(dragStateRef.current.animationFrameId);
      }

      const finalX = dragStateRef.current.lastX;
      const finalY = dragStateRef.current.lastY;

      // Update floating notes with new position
      setFloatingNotes(prev => prev.map(n =>
        n.id === draggedNote ? { ...n, position: { x: finalX, y: finalY } } : n
      ));

      // Save the new position
      const note = floatingNotes.find(n => n.id === draggedNote);
      if (note) {
        saveNote(note.id, note.content, { x: finalX, y: finalY }, note.contextualText, note.contextualId, note.size, note.type);
      }

      // Reset drag state
      setDraggedNote(null);
      dragStateRef.current.isDragging = false;
    }
    
    // Handle resize end
    if (resizingNote) {
      // Call resize end logic directly to avoid circular dependency
      if (resizingNote) {
        const finalWidth = dragStateRef.current.lastWidth;
        const finalHeight = dragStateRef.current.lastHeight;
        const finalX = dragStateRef.current.lastX;
        const finalY = dragStateRef.current.lastY;

        setFloatingNotes(prev => prev.map(n =>
          n.id === resizingNote ? { 
            ...n, 
            size: { width: finalWidth, height: finalHeight },
            position: { x: finalX, y: finalY }
          } : n
        ));

        const note = floatingNotes.find(n => n.id === resizingNote);
        if (note) {
          saveNote(note.id, note.content, { x: finalX, y: finalY }, note.contextualText, note.contextualId, 
                  { width: finalWidth, height: finalHeight }, note.type);
        }
        
        // Hide size indicator
        const noteElement = document.getElementById(`note-${resizingNote}`);
        if (noteElement) {
          const sizeIndicator = noteElement.querySelector('.size-indicator');
          if (sizeIndicator) {
            sizeIndicator.style.opacity = '0';
          }
        }
        
        setResizingNote(null);
        setResizeDirection('');
      }
    }
  }, [draggedNote, resizingNote, floatingNotes, saveNote]);

  // Set up global event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Filter and search functions
  const filteredNotes = [...savedNotes, ...sharedNotes].filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (note.contextualText && note.contextualText.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Export functions
  const exportNotes = useCallback(async (format) => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/notes/export?contentId=${contentId}&courseId=${courseId}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${contentId}.${format === 'pdf' ? 'pdf' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [contentId, courseId]);

  // Share function
  const toggleNoteSharing = useCallback(async (noteId) => {
    try {
      const note = [...savedNotes, ...floatingNotes].find(n => n.id === noteId);
      if (!note) return;

      const response = await fetch(`/api/notes/${noteId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: !note.isShared })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setSavedNotes(prev => prev.map(n => 
          n.id === noteId ? { ...n, isShared: updatedNote.isShared } : n
        ));
        setFloatingNotes(prev => prev.map(n => 
          n.id === noteId ? { ...n, isShared: updatedNote.isShared } : n
        ));
      }
    } catch (error) {
      console.error('Failed to toggle note sharing:', error);
    }
  }, [savedNotes, floatingNotes]);

  // Delete function
  const deleteNote = useCallback(async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (response.ok) {
        setSavedNotes(prev => prev.filter(note => note.id !== noteId));
        setFloatingNotes(prev => prev.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, []);

  // Show saved note as floating note
  const showNoteAsFloating = useCallback((noteId) => {
    const savedNote = savedNotes.find(note => note.id === noteId);
    if (savedNote && !floatingNotes.find(note => note.id === noteId)) {
      // Add the saved note to floating notes with a good position
      const containerRect = containerRef.current?.getBoundingClientRect() || { width: 1200, height: 800 };
      const position = findOptimalPosition(floatingNotes, containerRect);

      const noteWithPosition = {
        ...savedNote,
        position,
        size: savedNote.size || { width: 280, height: 200 }
      };

      setFloatingNotes(prev => [...prev, noteWithPosition]);
      setActiveNote(noteId);
    }
  }, [savedNotes, floatingNotes]);

  // Hide floating note
  const hideFloatingNote = useCallback((noteId) => {
    setFloatingNotes(prev => prev.filter(note => note.id !== noteId));
    if (activeNote === noteId) {
      setActiveNote(null);
    }
  }, [activeNote]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    createNote,
    createContextualNote,
    exportNotes,
    getNotes: () => [...savedNotes, ...floatingNotes]
  }));

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999]" ref={containerRef} style={{ pointerEvents: 'auto' }}>
      {/* Floating Notes */}
      {floatingNotes.map(note => (
        <FloatingNote
          key={note.id}
          note={note}
          isActive={activeNote === note.id}
          onClick={(id) => setActiveNote(id)}
          onUpdate={(id, content) => {
            setFloatingNotes(prev => prev.map(n =>
              n.id === id ? { ...n, content } : n
            ));
          }}
          onSave={(content, noteObj) => {
            if (noteObj) {
              saveNote(noteObj.id, content, noteObj.position, noteObj.contextualText, noteObj.contextualId, noteObj.size, noteObj.type);
            }
          }}
          onDelete={deleteNote}
          onResizeStart={handleResizeStart}
          onDragStart={handleMouseDown}
          isResizing={resizingNote === note.id}
          onHide={hideFloatingNote}
          draggedNote={draggedNote}
        />
      ))}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsNotesOpen(!isNotesOpen)}
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 pointer-events-auto z-50"
      >
        <PencilSquareIcon className="h-6 w-6" />
      </button>

      {/* Notes Panel */}
      {isNotesOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 pointer-events-auto z-50">
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center">
                <Squares2X2Icon className="h-5 w-5 mr-2" />
                Smart Notes
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                  title="Create template note"
                >
                  <SparklesIcon className="h-5 w-5 text-white" />
                </button>
                <button 
                  onClick={() => createNote()}
                  className="p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                  title="Add new note"
                >
                  <PlusIcon className="h-5 w-5 text-white" />
                </button>
                <button 
                  onClick={() => setIsNotesOpen(false)}
                  className="p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                  title="Close panel"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-md text-xs ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <FunnelIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 rounded text-xs ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  All
                </button>
                
                <button
                  onClick={() => setFilterType('contextual')}
                  className={`px-2 py-1 rounded text-xs ${filterType === 'contextual' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Contextual
                </button>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => exportNotes('pdf')}
                  disabled={isExporting}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  title="Export as PDF"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(NOTE_TEMPLATES).map(([key, template]) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => createNote({ ...template, type: key })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs ${
                          filterType === key 
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Notes List */}
          <div className="max-h-96 overflow-y-auto p-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2">No notes yet</p>
                <button 
                  onClick={() => createNote()}
                  className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id}
                  className={`mb-3 rounded-xl border transition-all duration-200 ${
                    note.isShared 
                      ? 'border-indigo-200 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          {note.type && NOTE_TEMPLATES[note.type] && (
                            <div className={`p-1 rounded mr-2`}>
                              {React.createElement(NOTE_TEMPLATES[note.type].icon, { className: "h-4 w-4" })}
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {note.type || 'Note'}
                          </span>
                          {note.isShared && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              Shared
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: note.content.substring(0, 60) || 'Empty note'
                            }}
                          />
                          {note.content.length > 60 && '...'}
                        </p>
                        
                        {note.contextualText && (
                          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1">
                            "{note.contextualText.substring(0, 80)}{note.contextualText.length > 80 ? '...' : ''}"
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(note.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        {!floatingNotes.find(fn => fn.id === note.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showNoteAsFloating(note.id);
                            }}
                            className="p-1.5 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                            title="Show as floating note"
                          >
                            <ArrowsPointingOutIcon className="h-4 w-4" />
                          </button>
                        )}
                        {floatingNotes.find(fn => fn.id === note.id) && (
                          <span className="p-1.5 rounded-md text-green-600 bg-green-100 text-xs">
                            Visible
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNoteSharing(note.id);
                          }}
                          className={`p-1.5 rounded-md ${
                            note.isShared
                              ? 'text-indigo-600 bg-indigo-100'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={note.isShared ? "Shared" : "Share note"}
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Delete note"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Template Creation Panel */}
          {showTemplates && (
            <div className="border-t border-gray-100 p-3 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Create with template</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(NOTE_TEMPLATES).map(([key, template]) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => createNote({ ...template, type: key })}
                      className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <Icon className="h-5 w-5 mb-1 text-indigo-600" />
                      <span className="text-xs text-gray-700 capitalize">{key}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default EnhancedFloatingNotes;