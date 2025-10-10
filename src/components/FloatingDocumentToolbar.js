'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const FloatingDocumentToolbar = ({ 
  isVisible = true, 
  onAITutorClick, 
  onNotesClick,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const toolbarRef = useRef(null);

  // Clean dragging functionality (same as AI Tutor Active panel)
  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar-content')) return; // Don't drag when clicking on content
    
    // Only handle left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    // Capture starting positions
    const startX = position.x;
    const startY = position.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    setIsDragging(true);

    // Mouse move handler
    const handleMove = (moveEvent) => {
      const newX = startX + (moveEvent.clientX - startMouseX);
      const newY = startY + (moveEvent.clientY - startMouseY);

      // Boundary check
      const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 280);
      const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 400);

      const finalX = Math.max(0, Math.min(newX, maxX));
      const finalY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: finalX, y: finalY });
    };

    // Mouse up handler
    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Cleanup effect - simple and safe
  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      setIsDragging(false);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded ? '280px' : '48px'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <DocumentTextIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Document Tools</span>
            </>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={isExpanded ? "Collapse toolbar" : "Expand toolbar"}
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="toolbar-content p-3 space-y-3">
          {/* AI Tutor Section */}
          <div className="space-y-2">
            <button
              onClick={onAITutorClick}
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 flex-1">
                <SparklesIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">AI Tutor</div>
                  <div className="text-xs opacity-90">Learn with AI assistance</div>
                </div>
              </div>
              <AcademicCapIcon className="w-5 h-5 opacity-80 group-hover:opacity-100" />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Notes Section */}
          <div className="space-y-2">
            <button
              onClick={onNotesClick}
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 flex-1">
                <PencilSquareIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Notes</div>
                  <div className="text-xs opacity-90">View and manage notes</div>
                </div>
              </div>
            </button>
          </div>

          {/* Drag Handle Indicator */}
          <div className="flex justify-center pt-2 border-t border-gray-100">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state indicator */}
      {!isExpanded && (
        <div className="p-3 flex flex-col items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <PencilSquareIcon className="w-5 h-5 text-orange-500" />
        </div>
      )}
    </div>
  );
};

export default FloatingDocumentToolbar;