'use client';

import { useState, useEffect, useRef } from 'react';

export default function SimpleSmartNotes({ onClose, userId, courseId, contentId, buttonPosition, buttonRef }) {
  const [notes, setNotes] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 384, height: 600 }); // w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load notes from localStorage on mount
  useEffect(() => {
    const storageKey = `smart-notes-${userId || 'guest'}-${courseId || 'general'}-${contentId || 'all'}`;
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    }
  }, [userId, courseId, contentId]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    const storageKey = `smart-notes-${userId || 'guest'}-${courseId || 'general'}-${contentId || 'all'}`;
    if (notes.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [notes, userId, courseId, contentId]);

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      content: '',
      position: { x: 100 + notes.length * 30, y: 100 + notes.length * 30 },
      size: { width: 280, height: 200 },
      isEditing: true,
      createdAt: new Date().toISOString()
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id, content) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content, isEditing: false, updatedAt: new Date().toISOString() } : note
    ));
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 500);
  };

  const deleteNote = (id) => {
    if (confirm('Delete this note?')) {
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      
      // Immediately update localStorage
      const storageKey = `smart-notes-${userId || 'guest'}-${courseId || 'general'}-${contentId || 'all'}`;
      if (updatedNotes.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
      }
    }
  };

  const startEditing = (id) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: true } : note
    ));
  };

  const handleMouseDown = (e, noteId) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    const note = notes.find(n => n.id === noteId);
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
          
          setNotes(prevNotes => prevNotes.map(note =>
            note.id === draggedNote
              ? { ...note, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
              : note
          ));
        });
      }
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (!isResizing) {
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
          
          setNotes(prevNotes => prevNotes.map(note =>
            note.id === draggedNote
              ? { 
                  ...note, 
                  size: { width: newWidth, height: newHeight }
                  // Position stays the same - only size changes
                }
              : note
          ));
        });
      }
    };

    const handleResizeEnd = () => {
      if (isResizing) {
        if (rafId) {
          cancelAnimationFrame(rafId);
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
      {notes.map(note => (
        <div
          key={note.id}
          data-note-id={note.id}
          onMouseDown={(e) => handleMouseDown(e, note.id)}
          className={`absolute bg-white rounded-lg shadow-xl border-2 p-4 group flex flex-col ${
            isResizing && draggedNote === note.id
              ? 'border-purple-500 shadow-2xl'
              : draggedNote === note.id 
              ? 'border-purple-400 shadow-2xl cursor-grabbing' 
              : 'border-purple-200 cursor-grab hover:shadow-2xl hover:border-purple-300 transition-all duration-200'
          }`}
          style={{
            left: note.position.x,
            top: note.position.y,
            width: note.size?.width || 280,
            height: note.size?.height || 200,
            zIndex: draggedNote === note.id ? 10002 : 10001,
            cursor: isResizing && draggedNote === note.id ? 'se-resize' : draggedNote === note.id ? 'grabbing' : 'grab',
            transition: isResizing && draggedNote === note.id ? 'none' : 'all 0.2s ease',
            willChange: isResizing && draggedNote === note.id ? 'width, height' : 'auto'
          }}
        >
          {/* Resize handle - larger hit area */}
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
            className={`absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-1 ${
              isResizing && draggedNote === note.id 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-100'
            } transition-opacity duration-200`}
            title="Drag to resize"
          >
            <div className={`w-5 h-5 rounded-tl-lg ${
              isResizing && draggedNote === note.id 
                ? 'bg-purple-500' 
                : 'bg-purple-400 hover:bg-purple-500'
            } transition-colors flex items-center justify-center`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 14V11h1v3a1 1 0 0 1-1 1h-3v-1h3zM11 14H8v-1h3v1zm-3 0v1H5v-1h3zM5 14H2a1 1 0 0 1-1-1v-3h1v3h3v1zm9-3V8h1v3h-1zM1 8V5h1v3H1zm13-3V2a1 1 0 0 0-1-1h-3v1h3v3h1zM8 2V1h3v1H8zM5 2V1h3v1H5zM2 2h3V1H2a1 1 0 0 0-1 1v3h1V2z"/>
              </svg>
            </div>
          </div>
          
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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
      ))}

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
              <h3 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Smart Notes
              </h3>
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
              <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
              {isSaving && <span className="text-green-600 text-xs">✓ Saved</span>}
            </div>
            
            {notes.length === 0 ? (
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
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {note.content || <span className="text-gray-400 italic">Empty note</span>}
                        </p>
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
                          deleteNote(note.id);
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

          <div className="p-4 border-t border-gray-100 flex-shrink-0">
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
    </div>
  );
}
