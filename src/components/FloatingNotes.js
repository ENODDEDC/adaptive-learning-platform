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
  SparklesIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';

const FloatingNotes = forwardRef(({ contentId, courseId, userId, isVisible = true }, ref) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]); // Notes saved in database
  const [sharedNotes, setSharedNotes] = useState([]); // Shared notes from other files
  const [floatingNotes, setFloatingNotes] = useState([]); // Currently visible floating notes
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingNote, setResizingNote] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef(null);

  const fetchSavedNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes?contentId=${contentId}&courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        // Map API response to expected format with consistent ID field
        const mappedNotes = (data.notes || []).map(note => ({
          ...note,
          id: note._id || note.id,
          timestamp: note.createdAt || note.timestamp || new Date().toISOString()
        }));
        setSavedNotes(mappedNotes);
        // Don't automatically show saved notes as floating notes
        // Only show them in the Quick Notes panel
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  }, [contentId, courseId]);

  const fetchSharedNotes = useCallback(async () => {
    try {
      // Fetch shared notes from the entire course (all files)
      const response = await fetch(`/api/notes?courseId=${courseId}&includeShared=true&excludeContentId=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw shared notes from API:', data.sharedNotes);
        console.log('Current userId:', userId);
        
        // Map shared notes from other files, excluding own notes
        const mappedSharedNotes = (data.sharedNotes || [])
          .filter(note => {
            // Only include notes from other users
            const noteUserId = note.userId?._id || note.userId?.toString() || note.userId;
            const currentUserId = userId?.toString() || userId;
            console.log('Filtering note:', { 
              noteId: note._id, 
              noteUserId, 
              currentUserId, 
              authorName: note.userId?.name,
              shouldExclude: noteUserId === currentUserId 
            });
            return noteUserId !== currentUserId;
          })
          .map(note => ({
            ...note,
            id: note._id || note.id,
            timestamp: note.createdAt || note.timestamp || new Date().toISOString(),
            isShared: true,
            authorName: note.userId?.name || 'Unknown User'
          }));
        
        console.log('Filtered shared notes (should not include your notes):', mappedSharedNotes);
        setSharedNotes(mappedSharedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch shared notes:', error);
    }
  }, [courseId, contentId, userId]);

  // Fetch saved notes on component mount
  useEffect(() => {
    if (contentId && userId) {
      fetchSavedNotes();
      fetchSharedNotes();
    }
  }, [contentId, userId, fetchSavedNotes, fetchSharedNotes]);

  const createNote = useCallback(async () => {
    const newNote = {
      id: `temp-${Date.now()}`,
      content: '',
      position: { x: 100, y: 100 },
      timestamp: new Date().toISOString(),
      isNew: true
    };
    
    setFloatingNotes(prev => [...prev, newNote]);
    setIsCreatingNote(false);
  }, []);

  const createContextualNote = useCallback((contextualText, contextualId) => {
    const newNote = {
      id: `temp-${Date.now()}`,
      content: contextualText,
      position: { x: 100, y: 100 }, // Default position, can be adjusted
      timestamp: new Date().toISOString(),
      isNew: true,
      contextualText,
      contextualId,
    };
    setFloatingNotes(prev => [...prev, newNote]);
  }, []);

  const saveNote = useCallback(async (noteId, content, position, contextualText, contextualId, size) => {
    try {
      const noteData = {
        contentId,
        courseId,
        userId,
        content,
        position,
        size,
        type: 'floating',
        contextualText,
        contextualId,
      };

      let response;
      if (noteId.startsWith('temp-')) {
        // Create new note
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData)
        });
      } else {
        // Update existing note
        response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, position, contextualText, contextualId, size })
        });
      }

      if (response.ok) {
        const savedNote = await response.json();
        const noteWithId = { 
          ...savedNote.note, 
          id: savedNote.note._id || savedNote.note.id,
          timestamp: savedNote.note.createdAt || savedNote.note.timestamp || new Date().toISOString()
        };
        
        // Update floating notes
        setFloatingNotes(prev => prev.map(note => 
          note.id === noteId ? noteWithId : note
        ));
        
        // Update saved notes list
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

  const deleteFloatingNote = useCallback(async (noteId) => {
    try {
      // Only remove from floating notes (hide the floating note)
      setFloatingNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Failed to hide floating note:', error);
    }
  }, []);

  const deleteNoteCompletely = useCallback(async (noteId) => {
    try {
      // Ensure noteId is a string and exists
      if (noteId && typeof noteId === 'string' && !noteId.startsWith('temp-')) {
        const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
        if (!response.ok) {
          console.error('Failed to delete note from server');
          return; // Don't update local state if server deletion failed
        }
      }
      
      // Remove from both floating notes and saved notes
      setFloatingNotes(prev => prev.filter(note => note.id !== noteId));
      setSavedNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, []);

  const showFloatingNote = useCallback((noteId) => {
    const savedNote = savedNotes.find(note => note.id === noteId);
    if (savedNote && !floatingNotes.find(note => note.id === noteId)) {
      setFloatingNotes(prev => [...prev, savedNote]);
    }
  }, [savedNotes, floatingNotes]);

  const toggleNoteSharing = useCallback(async (noteId, isCurrentlyShared) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isShared: !isCurrentlyShared,
          visibility: !isCurrentlyShared ? 'course' : 'private'
        })
      });
      
      if (response.ok) {
        // Update local state
        setSavedNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, isShared: !isCurrentlyShared, visibility: !isCurrentlyShared ? 'course' : 'private' }
            : note
        ));
        
        // Refresh shared notes if we just shared/unshared a note
        fetchSharedNotes();
      }
    } catch (error) {
      console.error('Failed to toggle note sharing:', error);
    }
  }, [fetchSharedNotes]);

  const addSharedNoteToFloating = useCallback((sharedNote) => {
    // Add shared note as floating note with different styling
    const isFromOtherUser = sharedNote.authorName && (sharedNote.userId !== userId && sharedNote.userId?.toString() !== userId);
    const noteWithPosition = {
      ...sharedNote,
      position: {
        x: Math.random() * 200 + 50, // Random position
        y: Math.random() * 200 + 50
      },
      isSharedFromOther: isFromOtherUser // Only flag notes from other users as read-only
    };
    
    if (!floatingNotes.find(note => note.id === sharedNote.id)) {
      setFloatingNotes(prev => [...prev, noteWithPosition]);
    }
  }, [floatingNotes, userId]);

  const handleExport = (format) => {
    if (!contentId) {
      console.error('Cannot export without a contentId');
      return;
    }
    window.location.href = `/api/notes/export?contentId=${contentId}&format=${format}`;
    setIsExporting(false);
  };

  const handleMouseDown = useCallback((e, noteId) => {
    e.preventDefault();
    const note = floatingNotes.find(n => n.id === noteId);
    if (!note) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedNote(noteId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [floatingNotes]);

  // Use useRef for drag state to avoid re-renders during drag
  const dragStateRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    animationFrameId: null
  });

  const handleMouseMove = useCallback((e) => {
    if (!draggedNote || !containerRef.current) return;

    const noteElement = document.getElementById(`note-${draggedNote}`);
    if (!noteElement) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const noteWidth = noteElement.offsetWidth;
    const noteHeight = noteElement.offsetHeight;

    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    newX = Math.max(0, Math.min(newX, containerRect.width - noteWidth - 2));
    newY = Math.max(0, Math.min(newY, containerRect.height - noteHeight - 2));

    noteElement.style.left = `${newX}px`;
    noteElement.style.top = `${newY}px`;

    dragStateRef.current.lastX = newX;
    dragStateRef.current.lastY = newY;
  }, [draggedNote, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (draggedNote) {
      // Cancel any pending animation frame
      if (dragStateRef.current.animationFrameId) {
        cancelAnimationFrame(dragStateRef.current.animationFrameId);
      }
      
      const finalX = dragStateRef.current.lastX;
      const finalY = dragStateRef.current.lastY;

      setFloatingNotes(prev => prev.map(n =>
        n.id === draggedNote ? { ...n, position: { x: finalX, y: finalY } } : n
      ));
      
      const note = floatingNotes.find(n => n.id === draggedNote);
      if (note) {
        saveNote(note.id, note.content, { x: finalX, y: finalY }, note.contextualText, note.contextualId, note.size);
      }
      setDraggedNote(null);
      // Reset drag state
      dragStateRef.current = {
        isDragging: false,
        lastX: 0,
        lastY: 0,
        animationFrameId: null
      };
    }
  }, [draggedNote, floatingNotes, saveNote]);

  useEffect(() => {
    if (draggedNote) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Clean up any pending animation frames
        if (dragStateRef.current.animationFrameId) {
          cancelAnimationFrame(dragStateRef.current.animationFrameId);
        }
      };
    }
  }, [draggedNote, handleMouseMove, handleMouseUp]);

  const handleResizeMouseDown = useCallback((e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    const note = floatingNotes.find(n => n.id === noteId);
    if (!note) return;

    setResizingNote(noteId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: note.size?.width || 250,
      height: note.size?.height || 180,
    });
  }, [floatingNotes]);

  const handleResizeMouseMove = useCallback((e) => {
    if (!resizingNote || !containerRef.current) return;

    const noteElement = document.getElementById(`note-${resizingNote}`);
    if (!noteElement) return;

    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;
    
    let newWidth = Math.max(200, resizeStart.width + dx);
    let newHeight = Math.max(150, resizeStart.height + dy);

    noteElement.style.width = `${newWidth}px`;
    noteElement.style.height = `${newHeight}px`;

    dragStateRef.current.lastWidth = newWidth;
    dragStateRef.current.lastHeight = newHeight;
  }, [resizingNote, resizeStart]);

  const handleResizeMouseUp = useCallback(() => {
    if (resizingNote) {
      const finalWidth = dragStateRef.current.lastWidth;
      const finalHeight = dragStateRef.current.lastHeight;

      setFloatingNotes(prev => prev.map(n =>
        n.id === resizingNote ? { ...n, size: { width: finalWidth, height: finalHeight } } : n
      ));

      const note = floatingNotes.find(n => n.id === resizingNote);
      if (note) {
        saveNote(note.id, note.content, note.position, note.contextualText, note.contextualId, { width: finalWidth, height: finalHeight });
      }
      setResizingNote(null);
    }
  }, [resizingNote, floatingNotes, saveNote]);

  useEffect(() => {
    if (resizingNote) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [resizingNote, handleResizeMouseMove, handleResizeMouseUp]);

  if (!isVisible) return null;

  useImperativeHandle(ref, () => ({
    createContextualNote,
    getNotes: () => savedNotes,
  }));

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Floating Notes Icon - Right Center */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-auto">
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isNotesOpen
              ? 'bg-blue-600 text-white scale-110'
              : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105'
          } border-2 border-gray-200 hover:border-blue-300`}
          title="Toggle Notes"
        >
          <PencilSquareIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Notes Panel */}
      {isNotesOpen && (
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Quick Notes</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={createNote}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Add Note"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsExporting(!isExporting)}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Export Notes"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                  {isExporting && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                      <div className="py-1">
                        <a
                          onClick={() => handleExport('markdown')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          Export as Markdown (.md)
                        </a>
                        <a
                          onClick={() => handleExport('pdf')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          Export as PDF (.pdf)
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(() => {
                // Create a unified list of notes without duplicates
                const allNotesMap = new Map();
                
                // Add saved notes first
                savedNotes.forEach(note => {
                  allNotesMap.set(note.id, note);
                });
                
                // Add shared notes, but don't overwrite saved notes (to preserve isShared status)
                sharedNotes.forEach(note => {
                  if (!allNotesMap.has(note.id)) {
                    allNotesMap.set(note.id, note);
                  }
                });
                
                const allNotes = Array.from(allNotesMap.values());
                
                return allNotes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet. Click + to create one!
                  </p>
                ) : (
                  allNotes.map(note => {
                    const isVisible = floatingNotes.find(fn => fn.id === note.id);
                    const isSharedNote = note.isShared || note.authorName;
                    const isOwnNote = note.userId === userId || note.userId?.toString() === userId || !note.authorName;
                    const isFromOtherUser = note.authorName && (note.userId !== userId && note.userId?.toString() !== userId);
                    
                    return (
                      <div key={note.id} className={`text-xs p-2 rounded border relative group ${
                        isFromOtherUser
                          ? 'bg-blue-50 border-blue-200'
                          : note.contextualId
                          ? 'bg-purple-50 border-purple-200'
                          : isSharedNote && isOwnNote
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                             {note.contextualText && (
                              <div className="text-purple-600 text-xs mt-1 italic">
                                "{note.contextualText}"
                              </div>
                            )}
                            <div
                              className="truncate text-gray-700"
                              dangerouslySetInnerHTML={{ __html: note.content || 'Empty note' }}
                            />
                            {isFromOtherUser && (
                              <div className="text-blue-600 text-xs mt-1">
                                📎 Shared by: {note.authorName}
                              </div>
                            )}
                            {isSharedNote && isOwnNote && !isFromOtherUser && (
                              <div className="text-green-600 text-xs mt-1">
                                🌐 Shared
                              </div>
                            )}
                            <div className="text-gray-400 mt-1 text-xs">
                              {new Date(note.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isVisible ? (
                            <button
                              onClick={() => isOwnNote ? showFloatingNote(note.id) : addSharedNoteToFloating(note)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 bg-blue-100 rounded"
                              title="Show as floating note"
                            >
                              Show
                            </button>
                          ) : (
                            <span className="text-green-600 text-xs px-2 py-1 bg-green-100 rounded">Visible</span>
                          )}
                          
                          {isOwnNote && (
                            <>
                              <button
                                onClick={() => toggleNoteSharing(note.id, note.isShared)}
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                  note.isShared
                                    ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                }`}
                                title={note.isShared ? 'Unshare note' : 'Share note with course'}
                              >
                                <ShareIcon className="w-3 h-3" />
                                {note.isShared ? 'Shared' : 'Share'}
                              </button>
                              <button
                                onClick={() => deleteNoteCompletely(note.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 bg-red-100 rounded"
                                title="Delete permanently"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Floating Draggable Notes */}
      {floatingNotes.map(note => {
        // All notes are editable and draggable (collaborative approach)
        const isOwnNote = note.userId === userId || note.userId?.toString() === userId || 
                         (!note.authorName && !note.isSharedFromOther);
        
        return (
          <FloatingNote
            key={note.id}
            note={note}
            userId={userId}
            isOwnNote={isOwnNote}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
            onSave={(content) => saveNote(note.id, content, note.position, note.contextualText, note.contextualId, note.size)}
            onResizeMouseDown={handleResizeMouseDown}
            onDelete={() => deleteFloatingNote(note.id)}
            isDragging={draggedNote === note.id}
          />
        );
      })}
    </div>
  );
});

// Individual Floating Note Component
const FloatingNote = React.memo(({ 
  note, 
  userId,
  isOwnNote,
  onMouseDown, 
  onSave,
  onResizeMouseDown,
  onDelete,
  isDragging
}) => {
  const [isEditing, setIsEditing] = useState(note.isNew || false);
  const [localContent, setLocalContent] = useState(note.content || '');
  const [editorKey, setEditorKey] = useState(Date.now());
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // For a simple textarea, you might focus it.
      // For the rich text editor, focus management is handled internally.
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onSave(localContent);
    setIsEditing(false);
  }, [localContent, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalContent(note.content || '');
      setIsEditing(false);
    }
  }, [handleSave, note.content]);

  return (
    <div
      id={`note-${note.id}`}
      className={`absolute border-2 rounded-lg shadow-lg transition-all duration-75 overflow-hidden flex flex-col ${
        isDragging ? 'scale-105 shadow-xl z-50' : 'z-40'
      } pointer-events-auto ${
        note.isSharedFromOther 
          ? 'bg-blue-100 border-blue-300' 
          : 'bg-yellow-100 border-yellow-300'
      }`}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: `${note.size?.width || 250}px`,
        height: `${note.size?.height || 180}px`,
        minWidth: '200px',
        minHeight: '150px',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        transform: isDragging ? 'translateZ(0)' : 'none', // Hardware acceleration
        willChange: isDragging ? 'left, top' : 'auto' // Optimize for position changes
      }}
    >
      {/* Note Header */}
      <div 
        className={`flex items-center justify-between p-2 rounded-t-lg cursor-move ${
          note.isSharedFromOther ? 'bg-blue-200' : 'bg-yellow-200'
        }`}
        onMouseDown={onMouseDown} // All notes can be dragged
      >
        <div className="flex items-center gap-2">
          <PencilSquareIcon className={`w-4 h-4 ${
            note.isSharedFromOther ? 'text-blue-700' : 'text-yellow-700'
          }`} />
          <span className={`text-xs font-medium ${
            note.isSharedFromOther ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            {note.isSharedFromOther ? `Shared by ${note.authorName || 'Unknown'}` : 
             note.isShared ? 'Shared Note' : 'Note'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (!isEditing) {
                setLocalContent(note.content || '');
                setEditorKey(Date.now());
              }
              setIsEditing(!isEditing);
            }}
            className={`p-1 rounded transition-colors ${
              note.isSharedFromOther ? 'text-blue-700 hover:bg-blue-300' : 'text-yellow-700 hover:bg-yellow-300'
            }`}
            title="Edit"
          >
            <PencilSquareIcon className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title={!isOwnNote ? "Hide shared note" : "Delete"}
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Note Content */}
      <div className="p-3 flex-grow overflow-y-auto">
        {isEditing ? (
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <RichTextEditor
                key={editorKey}
                value={localContent}
                onChange={setLocalContent}
                placeholder="Type your note here..."
                className="w-full h-full"
              />
            </div>
            <div className="flex-shrink-0 pt-2 flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setLocalContent(note.content || '');
                  setIsEditing(false);
                }}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-700 min-h-16 prose prose-sm max-w-none h-full"
            onClick={() => {
              setLocalContent(note.content || '');
              setEditorKey(Date.now());
              setIsEditing(true);
            }}
            dangerouslySetInnerHTML={{ __html: note.content || '<span class="text-gray-400 italic">Click to add note...</span>' }}
          />
        )}
      </div>
      <div
        onMouseDown={(e) => onResizeMouseDown(e, note.id)}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400/20 hover:bg-gray-400/50 rounded-tl-lg"
        title="Resize note"
      />
    </div>
  );
});

export default FloatingNotes;