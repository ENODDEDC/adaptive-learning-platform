'use client';

import { useState, useEffect, useRef } from 'react';

export default function SimpleSmartNotes({ onClose, userId, courseId, contentId, buttonPosition, buttonRef }) {
  const [notes, setNotes] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [minimizedNotes, setMinimizedNotes] = useState(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const notesRef = useRef([]);

  // Load notes from database on mount - GLOBAL NOTES (no filtering by course/content)
  useEffect(() => {
    fetchNotes();
  }, []); // Empty dependency array - load ALL notes once

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + N - Create new note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        addNote();
        return;
      }

      // Ctrl/Cmd + Shift + H - Hide/Show all notes
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        if (minimizedNotes.size === notes.length) {
          // Show all
          setMinimizedNotes(new Set());
        } else {
          // Hide all
          setMinimizedNotes(new Set(notes.map(n => n.id)));
        }
        return;
      }

      // Ctrl/Cmd + Shift + P - Toggle panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsPanelOpen(prev => !prev);
        return;
      }

      // Escape - Close panel
      if (e.key === 'Escape' && isPanelOpen) {
        e.preventDefault();
        onClose();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notes, minimizedNotes, isPanelOpen, onClose]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      // Fetch ALL notes for the user (global) - no courseId or contentId filter
      const response = await fetch('/api/notes', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Transform database notes to match component format
        const transformedNotes = data.notes.map(note => ({
          id: note._id || note.id,
          content: note.content,
          position: note.position || { x: 100, y: 100 },
          size: note.size || { width: 280, height: 200 },
          isEditing: false,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        }));
        setNotes(transformedNotes);
        notesRef.current = transformedNotes;
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async () => {
    const tempId = `temp-${Date.now()}`;
    const newNote = {
      id: tempId,
      content: '',
      position: { x: 100 + notesRef.current.length * 30, y: 100 + notesRef.current.length * 30 },
      size: { width: 280, height: 200 },
      isEditing: true,
      createdAt: new Date().toISOString()
    };

    // Optimistically add to UI
    const updatedNotes = [...notesRef.current, newNote];
    setNotes(updatedNotes);
    notesRef.current = updatedNotes;

    try {
      // Save to database
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: ' ', // Empty space to satisfy validation
          position: newNote.position,
          size: newNote.size,
          courseId: courseId || 'general',
          contentId: contentId || 'global',
          type: 'floating'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Note created successfully:', data.note);
        // Replace temp note with real note from database
        const updatedNotes = notesRef.current.map(note =>
          note.id === tempId ? {
            ...note,
            id: data.note._id || data.note.id,
            content: data.note.content || '',
            isEditing: true
          } : note
        );
        setNotes(updatedNotes);
        notesRef.current = updatedNotes;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create note. Status:', response.status, 'Error:', errorData);
        throw new Error('Failed to create note');
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      // Remove temp note on error
      const updatedNotes = notesRef.current.filter(note => note.id !== tempId);
      setNotes(updatedNotes);
      notesRef.current = updatedNotes;
    }
  };

  const updateNote = async (id, content) => {
    // Find the note from ref (most current state)
    const note = notesRef.current.find(n => n.id === id);
    if (!note) {
      console.error('Note not found:', id);
      return;
    }

    // Check if this is a temp note (not yet saved to database)
    if (typeof id === 'string' && id.startsWith('temp-')) {
      console.log('Cannot update temp note, saving as new note instead');
      // This is a temp note, we need to create it first
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: content || ' ',
            position: note.position || { x: 100, y: 100 },
            size: note.size || { width: 280, height: 200 },
            courseId: courseId || 'general',
            contentId: contentId || 'global',
            type: 'floating'
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Replace temp note with real note
          const updatedNotes = notesRef.current.map(n =>
            n.id === id ? {
              ...n,
              id: data.note._id || data.note.id,
              content,
              isEditing: false,
              updatedAt: new Date().toISOString()
            } : n
          );
          setNotes(updatedNotes);
          notesRef.current = updatedNotes;
          setIsSaving(true);
          setTimeout(() => setIsSaving(false), 500);
        }
      } catch (error) {
        console.error('Failed to create note:', error);
      }
      return;
    }

    // Optimistically update UI
    const updatedNotes = notesRef.current.map(n =>
      n.id === id ? { ...n, content, isEditing: false, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updatedNotes);
    notesRef.current = updatedNotes;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content,
          position: note.position || { x: 100, y: 100 },
          size: note.size || { width: 280, height: 200 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update note. Status:', response.status, 'Error:', errorData);
        throw new Error('Failed to update note');
      }

      const data = await response.json();
      console.log('Note updated successfully:', data);
    } catch (error) {
      console.error('Failed to update note:', error);
      // Revert on error
      await fetchNotes();
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const deleteNote = async (id) => {
    // Optimistically remove from UI
    const previousNotes = [...notesRef.current];
    const updatedNotes = notesRef.current.filter(note => note.id !== id);
    setNotes(updatedNotes);
    notesRef.current = updatedNotes;
    setDeleteConfirmId(null);

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Revert on error
      setNotes(previousNotes);
      notesRef.current = previousNotes;
    }
  };

  const startEditing = (id) => {
    const updatedNotes = notesRef.current.map(note =>
      note.id === id ? { ...note, isEditing: true } : note
    );
    setNotes(updatedNotes);
    notesRef.current = updatedNotes;
  };

  const toggleMinimize = (id) => {
    setMinimizedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMouseDown = (e, noteId) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    const note = notesRef.current.find(n => n.id === noteId);
    if (!note) return;

    setDraggedNote(noteId);
    setDragOffset({
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y
    });
  };

  useEffect(() => {
    let rafId = null;

    const handleMouseMove = (e) => {
      if (draggedNote && !isResizing) {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;

          const updatedNotes = notesRef.current.map(note =>
            note.id === draggedNote
              ? { ...note, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
              : note
          );
          setNotes(updatedNotes);
          notesRef.current = updatedNotes;
        });
      }
    };

    const handleMouseUp = async () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (!isResizing && draggedNote) {
        // Save the new position to database
        const note = notesRef.current.find(n => n.id === draggedNote);
        if (note) {
          fetch(`/api/notes/${draggedNote}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: note.content || '',
              position: note.position || { x: 100, y: 100 },
              size: note.size || { width: 280, height: 200 }
            })
          }).catch(error => {
            console.error('Failed to save note position:', error);
          });
        }
        setDraggedNote(null);
      }
    };

    if (draggedNote && !isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNote, dragOffset, isResizing]);

  // Handle panel resize
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panelSize.width,
      height: panelSize.height
    });
  };

  // Handle note resize with RAF - resize from bottom-right corner only
  useEffect(() => {
    let rafId = null;

    const handleResizeMove = (e) => {
      if (isResizing && draggedNote) {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;

          // Only change size, not position
          const newWidth = Math.max(200, Math.min(600, resizeStart.width + deltaX));
          const newHeight = Math.max(150, Math.min(500, resizeStart.height + deltaY));

          const updatedNotes = notesRef.current.map(note =>
            note.id === draggedNote
              ? {
                ...note,
                size: { width: newWidth, height: newHeight }
                // Position stays the same - only size changes
              }
              : note
          );
          setNotes(updatedNotes);
          notesRef.current = updatedNotes;
        });
      }
    };

    const handleResizeEnd = async () => {
      if (isResizing && draggedNote) {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        // Save the new size to database
        const note = notesRef.current.find(n => n.id === draggedNote);
        if (note) {
          fetch(`/api/notes/${draggedNote}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: note.content || '',
              position: note.position || { x: 100, y: 100 },
              size: note.size || { width: 280, height: 200 }
            })
          }).catch(error => {
            console.error('Failed to save note size:', error);
          });
        }

        setIsResizing(false);
        setDraggedNote(null);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, draggedNote, resizeStart]);

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Notes */}
      {notes.map(note => {
        // Hide minimized notes completely
        if (minimizedNotes.has(note.id)) {
          return null;
        }

        return (
          <div
            key={note.id}
            data-note-id={note.id}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
            className={`absolute bg-white rounded-lg shadow-xl border-2 p-4 group flex flex-col ${isResizing && draggedNote === note.id
              ? 'border-purple-500 shadow-2xl'
              : draggedNote === note.id
                ? 'border-purple-400 shadow-2xl cursor-grabbing'
                : 'border-purple-200 cursor-grab hover:shadow-2xl hover:border-purple-300'
              }`}
            style={{
              left: note.position.x,
              top: note.position.y,
              width: note.size?.width || 280,
              height: note.size?.height || 200,
              zIndex: draggedNote === note.id ? 10002 : 10001,
              cursor: isResizing && draggedNote === note.id ? 'se-resize' : draggedNote === note.id ? 'grabbing' : 'grab',
              transition: 'none',
              willChange: isResizing && draggedNote === note.id ? 'width, height' : 'auto'
            }}
          >
            {/* Resize handle - larger hit area */}
            {(
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                  setDraggedNote(note.id);
                  setResizeStart({
                    x: e.clientX,
                    y: e.clientY,
                    width: note.size?.width || 280,
                    height: note.size?.height || 200
                  });
                }}
                className={`absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1 ${isResizing && draggedNote === note.id
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
                  }`}
                title="Drag to resize"
              >
                <div className={`w-5 h-5 rounded-tl-lg ${isResizing && draggedNote === note.id
                  ? 'bg-purple-500'
                  : 'bg-purple-400 hover:bg-purple-500'
                  } flex items-center justify-center`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 14V11h1v3a1 1 0 0 1-1 1h-3v-1h3zM11 14H8v-1h3v1zm-3 0v1H5v-1h3zM5 14H2a1 1 0 0 1-1-1v-3h1v3h3v1zm9-3V8h1v3h-1zM1 8V5h1v3H1zm13-3V2a1 1 0 0 0-1-1h-3v1h3v3h1zM8 2V1h3v1H8zM5 2V1h3v1H5zM2 2h3V1H2a1 1 0 0 0-1 1v3h1V2z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Size indicator when resizing */}
            {isResizing && draggedNote === note.id && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-md font-mono shadow-lg">
                {Math.round(note.size?.width || 280)} × {Math.round(note.size?.height || 200)}
              </div>
            )}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 select-none cursor-move flex-shrink-0">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <div className="w-3 h-3 rounded-full bg-pink-400"></div>
              </div>
              <div className="flex gap-1.5">
                {note.isEditing ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const textarea = document.querySelector(`#note-${note.id}`);
                        if (textarea) updateNote(note.id, textarea.value);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                      title="Save Note"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotes(notes.map(n => n.id === note.id ? { ...n, isEditing: false } : n));
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMinimize(note.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                      title={minimizedNotes.has(note.id) ? "Maximize" : "Minimize"}
                    >
                      {minimizedNotes.has(note.id) ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(note.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {note.isEditing ? (
              <textarea
                id={`note-${note.id}`}
                autoFocus
                defaultValue={note.content}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNotes(notes.map(n => n.id === note.id ? { ...n, isEditing: false } : n));
                  }
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    const textarea = document.querySelector(`#note-${note.id}`);
                    if (textarea) updateNote(note.id, textarea.value);
                  }
                }}
                className="w-full flex-1 p-2 text-sm border-none focus:outline-none resize-none"
                placeholder="Type your note here... (Ctrl+S to save, Esc to cancel)"
                style={{ minHeight: '120px' }}
              />
            ) : (
              <div
                onClick={() => startEditing(note.id)}
                className="cursor-text hover:bg-gray-50 p-2 rounded flex-1 text-sm whitespace-pre-wrap overflow-auto"
                style={{ minHeight: '120px' }}
              >
                {note.content || <span className="text-gray-400 italic">Click to edit...</span>}
              </div>
            )}

            {note.updatedAt && !note.isEditing && (
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                {new Date(note.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        );
      })}

      {/* Control Panel - Positioned relative to unified button */}
      {isPanelOpen && (
        <div
          className="fixed w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[10001] max-h-[600px] flex flex-col"
          style={(() => {
            if (buttonRef?.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              const x = buttonPosition.x !== null ? buttonPosition.x : rect.left;
              const y = buttonPosition.y !== null ? buttonPosition.y : rect.top;
              return {
                left: `${x - 384 - 16}px`, // 384px = w-96, 16px gap
                bottom: `${window.innerHeight - y - rect.height}px`
              };
            }
            return {
              right: '6rem',
              bottom: '1.5rem'
            };
          })()}
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Smart Notes
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addNote}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                  title="Add note"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

              </div>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div>
                <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
                {minimizedNotes.size > 0 && (
                  <span className="ml-2 text-xs text-blue-600">
                    {minimizedNotes.size} hidden
                  </span>
                )}
              </div>
              {isSaving && <span className="text-green-600 text-xs">✓ Saved</span>}
              {isLoading && <span className="text-blue-600 text-xs">Loading...</span>}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading your notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Click + to add a note</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="p-3 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors cursor-pointer group"
                    onClick={() => {
                      // If minimized, restore it
                      if (minimizedNotes.has(note.id)) {
                        toggleMinimize(note.id);
                        return;
                      }
                      // Scroll to note
                      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
                      if (noteElement) {
                        noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Highlight briefly
                        noteElement.classList.add('ring-4', 'ring-purple-400');
                        setTimeout(() => {
                          noteElement.classList.remove('ring-4', 'ring-purple-400');
                        }, 1000);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {minimizedNotes.has(note.id) && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                          <p className={`text-sm line-clamp-2 ${minimizedNotes.has(note.id) ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                            {note.content || <span className="text-gray-400 italic">Empty note</span>}
                          </p>
                        </div>
                        {note.updatedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(note.updatedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-3">
            {/* Keyboard Shortcuts */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Keyboard Shortcuts
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span>New note</span>
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+N</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Save note</span>
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hide/Show all</span>
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+Shift+H</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Toggle panel</span>
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+Shift+P</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Close</span>
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Close Smart Notes
            </button>
          </div>
        </div>
      )}

      {/* Minimized button - Hidden, not needed since unified button is always visible */}
      {false && !isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-[10001]"
          style={(() => {
            if (buttonRef?.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              const x = buttonPosition.x !== null ? buttonPosition.x : rect.left;
              const y = buttonPosition.y !== null ? buttonPosition.y : rect.top;
              return {
                left: `${x - 64 - 16}px`, // 64px = button width, 16px gap
                bottom: `${window.innerHeight - y - rect.height}px`
              };
            }
            return {
              right: '6rem',
              bottom: '1.5rem'
            };
          })()}
          title="Open Smart Notes"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {notes.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notes.length}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this note? All content will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNote(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
