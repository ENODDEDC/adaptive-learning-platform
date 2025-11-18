'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';

export default function FloatingAIAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Ask');
  const [promptText, setPromptText] = useState('');
  const [buttonPosition, setButtonPosition] = useState({ x: null, y: null });
  const [panelPosition, setPanelPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const handleSubmit = () => {
    if (promptText.trim()) {
      // Track AI Assistant interaction
      const tracker = getLearningBehaviorTracker();
      if (tracker) {
        const modeMap = {
          'Ask': 'ask',
          'Research': 'research',
          'Text to Docs': 'textToDocs'
        };
        tracker.trackAIAssistantInteraction(modeMap[selectedMode], promptText.length);
      }
      
      if (selectedMode === 'Ask') {
        router.push(`/ask?q=${encodeURIComponent(promptText)}`);
      } else if (selectedMode === 'Text to Docs') {
        router.push(`/text-to-docs?prompt=${encodeURIComponent(promptText)}`);
      }
      
      // Close the panel after submission
      setIsOpen(false);
      setPromptText('');
    }
  };

  const calculatePanelPosition = (btnX, btnY) => {
    if (!buttonRef.current || !panelRef.current) return { x: null, y: null };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const panelWidth = 480; // w-[480px]
    const panelHeight = panelRef.current.offsetHeight || 400; // approximate height
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let panelX, panelY;
    
    // Determine button's edge position
    const isOnLeft = btnX < viewportWidth / 2;
    const isOnTop = btnY < viewportHeight / 2;
    
    if (isOnLeft) {
      // Button on left, panel appears to the right
      panelX = btnX + buttonRect.width + margin;
    } else {
      // Button on right, panel appears to the left
      panelX = btnX - panelWidth - margin;
    }
    
    // Vertically center panel with button
    panelY = btnY + (buttonRect.height / 2) - (panelHeight / 2);
    
    // Keep panel within viewport bounds
    panelX = Math.max(margin, Math.min(panelX, viewportWidth - panelWidth - margin));
    panelY = Math.max(margin, Math.min(panelY, viewportHeight - panelHeight - margin));
    
    return { x: panelX, y: panelY };
  };

  const handleButtonMouseDown = (e) => {
    setDragStartTime(Date.now());
    setIsDragging(true);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && buttonRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - buttonRef.current.offsetWidth;
        const maxY = window.innerHeight - buttonRef.current.offsetHeight;
        
        setButtonPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      const dragDuration = Date.now() - dragStartTime;
      
      // If drag was very short (< 200ms), treat it as a click
      if (dragDuration < 200 && buttonPosition.x === null) {
        setIsDragging(false);
        setIsOpen(!isOpen);
        return;
      }
      
      // Snap to nearest edge (like Messenger chat heads)
      if (isDragging && buttonRef.current && buttonPosition.x !== null) {
        const buttonWidth = buttonRef.current.offsetWidth;
        const buttonHeight = buttonRef.current.offsetHeight;
        const centerX = buttonPosition.x + buttonWidth / 2;
        const centerY = buttonPosition.y + buttonHeight / 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const margin = 32; // 8 * 4 (same as bottom-8 right-8)
        
        // Determine which edge is closest
        const distanceToLeft = centerX;
        const distanceToRight = viewportWidth - centerX;
        const distanceToTop = centerY;
        const distanceToBottom = viewportHeight - centerY;
        
        const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
        
        let newX, newY;
        
        if (minDistance === distanceToLeft) {
          // Snap to left edge
          newX = margin;
          newY = Math.max(margin, Math.min(buttonPosition.y, viewportHeight - buttonHeight - margin));
        } else if (minDistance === distanceToRight) {
          // Snap to right edge
          newX = viewportWidth - buttonWidth - margin;
          newY = Math.max(margin, Math.min(buttonPosition.y, viewportHeight - buttonHeight - margin));
        } else if (minDistance === distanceToTop) {
          // Snap to top edge
          newY = margin;
          newX = Math.max(margin, Math.min(buttonPosition.x, viewportWidth - buttonWidth - margin));
        } else {
          // Snap to bottom edge
          newY = viewportHeight - buttonHeight - margin;
          newX = Math.max(margin, Math.min(buttonPosition.x, viewportWidth - buttonWidth - margin));
        }
        
        setButtonPosition({ x: newX, y: newY });
        
        // Update panel position to follow button
        const newPanelPos = calculatePanelPosition(newX, newY);
        setPanelPosition(newPanelPos);
      }
      
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, dragStartTime, buttonPosition.x, buttonPosition.y, isOpen]);

  // Update panel position when button position changes or panel opens
  useEffect(() => {
    if (buttonPosition.x !== null && buttonPosition.y !== null) {
      const newPanelPos = calculatePanelPosition(buttonPosition.x, buttonPosition.y);
      setPanelPosition(newPanelPos);
    }
  }, [buttonPosition.x, buttonPosition.y, isOpen]);

  // Keyboard shortcut - Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating AI Assistant Panel - Follows button position */}
      <div 
        ref={panelRef}
        style={panelPosition.x !== null ? {
          left: `${panelPosition.x}px`,
          top: `${panelPosition.y}px`,
          bottom: 'auto',
          right: 'auto'
        } : {}}
        className={`fixed ${panelPosition.x === null ? 'bottom-24 right-8' : ''} z-40 transition-all duration-700 ease-out ${
          isOpen 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="w-[480px] max-w-[calc(100vw-4rem)]">
          <div className="relative p-6 bg-white rounded-3xl border-2 border-gray-200 shadow-2xl backdrop-blur-sm">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  AI Assistant
                </h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              {/* Textarea */}
              <div className="relative mb-4">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ask or find anything from your workspace..."
                  className="w-full p-4 text-base text-gray-700 placeholder-gray-400 transition-all duration-300 border-2 border-blue-200 resize-none bg-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 hover:border-blue-300 shadow-sm"
                  rows="3"
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/90 px-2 py-1 rounded-full">
                  {promptText.length}/500
                </div>
              </div>

              {/* Mode buttons and submit */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMode('Ask');
                      const tracker = getLearningBehaviorTracker();
                      if (tracker) tracker.trackAIAssistantMode('ask');
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      selectedMode === 'Ask'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    Ask
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMode('Research');
                      const tracker = getLearningBehaviorTracker();
                      if (tracker) tracker.trackAIAssistantMode('research');
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      selectedMode === 'Research'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    Research
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMode('Text to Docs');
                      const tracker = getLearningBehaviorTracker();
                      if (tracker) tracker.trackAIAssistantMode('textToDocs');
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      selectedMode === 'Text to Docs'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-gray-600 bg-white hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    Docs
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!promptText.trim()}
                  aria-label="Submit query"
                  className="p-3 text-white transition-all duration-200 bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Additional controls */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-400 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-500">Attach files or select sources</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Button - Bottom Right */}
      <button
        ref={buttonRef}
        onMouseDown={handleButtonMouseDown}
        onClick={() => {
          // Only toggle if not dragging
          if (!isDragging && Date.now() - dragStartTime < 200) {
            setIsOpen(!isOpen);
          }
        }}
        style={buttonPosition.x !== null ? {
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          bottom: 'auto',
          right: 'auto'
        } : {}}
        className={`fixed ${buttonPosition.x === null ? 'bottom-8 right-8' : ''} z-50 group ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          isDragging ? '' : 'transition-all duration-500'
        } ${
          isOpen ? 'scale-95' : 'scale-100 hover:scale-110'
        }`}
        aria-label="Toggle AI Assistant"
      >
        {/* Main Button */}
        <div className={`relative flex items-center gap-3 px-6 py-4 bg-blue-600 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'ring-4 ring-blue-200 shadow-blue-500/30' 
            : 'hover:bg-blue-700 hover:shadow-xl'
        }`}>
          {/* Icon with rotation animation */}
          <div className="relative">
            <svg 
              className={`w-6 h-6 text-white transition-transform duration-500 ${
                isOpen ? 'rotate-180 scale-110' : 'rotate-0'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></div>
          </div>
          
          {/* Text that appears on hover */}
          <div className={`overflow-hidden transition-all duration-500 ${
            isOpen 
              ? 'max-w-0 opacity-0' 
              : 'max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100'
          }`}>
            <div className="text-left whitespace-nowrap">
              <div className="text-sm font-bold text-white">AI Assistant</div>
              <div className="text-xs text-blue-100">Ask me anything</div>
            </div>
          </div>
          
          {/* Close icon when open */}
          {isOpen && (
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
      </button>
    </>
  );
}
