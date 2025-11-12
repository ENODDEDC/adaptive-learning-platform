'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';
import SimpleSmartNotes from './SimpleSmartNotes';

export default function UnifiedFloatingAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null); // 'ai' or 'notes'
  const [selectedMode, setSelectedMode] = useState('Ask');
  const [promptText, setPromptText] = useState('');
  const [buttonPosition, setButtonPosition] = useState({ x: null, y: null });
  const [panelPosition, setPanelPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [user, setUser] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [contentId, setContentId] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const expandTimeoutRef = useRef(null);
  const notesRef = useRef(null);

  // Fetch user data - try multiple endpoints
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try multiple endpoints to get user data
        const endpoints = ['/api/user/profile', '/api/auth/me', '/api/auth/session'];
        
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              const userData = data.user || data;
              if (userData && (userData._id || userData.id)) {
                setUser(userData);
                console.log('✅ User fetched from', endpoint, ':', userData);
                return;
              }
            }
          } catch (err) {
            console.log('❌ Failed to fetch from', endpoint);
          }
        }
        
        // If all fail, create a mock user for development
        console.log('⚠️ No user found, using mock user for Smart Notes');
        setUser({ _id: 'mock-user', name: 'Guest User' });
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser({ _id: 'mock-user', name: 'Guest User' });
      }
    };
    fetchUser();
  }, []);

  // Extract courseId and contentId from URL
  useEffect(() => {
    if (pathname) {
      console.log('📍 Current pathname:', pathname);
      
      const courseMatch = pathname.match(/\/courses\/([^\/]+)/);
      if (courseMatch) {
        setCourseId(courseMatch[1]);
        console.log('📚 Course ID found:', courseMatch[1]);
      } else {
        // For development, use a mock courseId
        setCourseId('mock-course-id');
        console.log('📚 Using mock course ID');
      }
      
      const contentMatch = pathname.match(/\/content\/([^\/]+)/);
      if (contentMatch) {
        setContentId(contentMatch[1]);
        console.log('📄 Content ID found:', contentMatch[1]);
      } else {
        // For development, use a mock contentId
        setContentId('mock-content-id');
        console.log('📄 Using mock content ID');
      }
    }
  }, [pathname]);

  const handleSubmit = () => {
    if (promptText.trim()) {
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
      
      setSelectedTool(null);
      setPromptText('');
    }
  };

  const calculatePanelPosition = (btnX, btnY) => {
    if (!buttonRef.current) return { x: null, y: null };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const panelWidth = 420;
    const panelHeight = 450;
    const gap = 20;
    const margin = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Determine button's actual position
    const buttonCenterX = btnX + buttonRect.width / 2;
    const buttonCenterY = btnY + buttonRect.height / 2;
    
    let panelX, panelY;
    
    // Smart positioning based on available space
    const spaceRight = viewportWidth - (btnX + buttonRect.width);
    const spaceLeft = btnX;
    const spaceTop = btnY;
    const spaceBottom = viewportHeight - (btnY + buttonRect.height);
    
    // Prefer horizontal placement (left or right)
    if (spaceRight >= panelWidth + gap + margin) {
      // Place on right
      panelX = btnX + buttonRect.width + gap;
      panelY = Math.max(margin, Math.min(btnY - (panelHeight / 2) + (buttonRect.height / 2), viewportHeight - panelHeight - margin));
    } else if (spaceLeft >= panelWidth + gap + margin) {
      // Place on left
      panelX = btnX - panelWidth - gap;
      panelY = Math.max(margin, Math.min(btnY - (panelHeight / 2) + (buttonRect.height / 2), viewportHeight - panelHeight - margin));
    } else if (spaceBottom >= panelHeight + gap + margin) {
      // Place below
      panelY = btnY + buttonRect.height + gap;
      panelX = Math.max(margin, Math.min(btnX - (panelWidth / 2) + (buttonRect.width / 2), viewportWidth - panelWidth - margin));
    } else if (spaceTop >= panelHeight + gap + margin) {
      // Place above
      panelY = btnY - panelHeight - gap;
      panelX = Math.max(margin, Math.min(btnX - (panelWidth / 2) + (buttonRect.width / 2), viewportWidth - panelWidth - margin));
    } else {
      // Fallback: center on screen
      panelX = (viewportWidth - panelWidth) / 2;
      panelY = (viewportHeight - panelHeight) / 2;
    }
    
    return { x: panelX, y: panelY };
  };

  const handleButtonMouseDown = (e) => {
    // Don't start drag if clicking on option buttons
    if (e.target.closest('.option-button')) {
      return;
    }
    
    setDragStartTime(Date.now());
    setIsDragging(true);
    setIsDraggingButton(true);
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
      
      if (dragDuration < 200 && buttonPosition.x === null) {
        setIsDragging(false);
        return;
      }
      
      if (isDragging && buttonRef.current && buttonPosition.x !== null) {
        const buttonWidth = buttonRef.current.offsetWidth;
        const buttonHeight = buttonRef.current.offsetHeight;
        const centerX = buttonPosition.x + buttonWidth / 2;
        const centerY = buttonPosition.y + buttonHeight / 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const margin = 32;
        
        const distanceToLeft = centerX;
        const distanceToRight = viewportWidth - centerX;
        const distanceToTop = centerY;
        const distanceToBottom = viewportHeight - centerY;
        
        const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
        
        let newX, newY;
        
        if (minDistance === distanceToLeft) {
          newX = margin;
          newY = Math.max(margin, Math.min(buttonPosition.y, viewportHeight - buttonHeight - margin));
        } else if (minDistance === distanceToRight) {
          newX = viewportWidth - buttonWidth - margin;
          newY = Math.max(margin, Math.min(buttonPosition.y, viewportHeight - buttonHeight - margin));
        } else if (minDistance === distanceToTop) {
          newY = margin;
          newX = Math.max(margin, Math.min(buttonPosition.x, viewportWidth - buttonWidth - margin));
        } else {
          newY = viewportHeight - buttonHeight - margin;
          newX = Math.max(margin, Math.min(buttonPosition.x, viewportWidth - buttonWidth - margin));
        }
        
        setButtonPosition({ x: newX, y: newY });
        
        const newPanelPos = calculatePanelPosition(newX, newY);
        setPanelPosition(newPanelPos);
      }
      
      setIsDragging(false);
      setIsDraggingButton(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, dragStartTime, buttonPosition.x, buttonPosition.y]);

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (!isDraggingButton && !selectedTool) {
      expandTimeoutRef.current = setTimeout(() => {
        setIsExpanded(true);
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    if (!selectedTool) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    if (buttonPosition.x !== null && buttonPosition.y !== null) {
      const newPanelPos = calculatePanelPosition(buttonPosition.x, buttonPosition.y);
      setPanelPosition(newPanelPos);
    }
  }, [buttonPosition.x, buttonPosition.y, selectedTool]);

  return (
    <>
      {/* AI Assistant Panel */}
      {selectedTool === 'ai' && (
        <div 
          ref={panelRef}
          style={(() => {
            if (buttonRef?.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              const x = buttonPosition.x !== null ? buttonPosition.x : rect.left;
              const y = buttonPosition.y !== null ? buttonPosition.y : rect.top;
              return {
                left: `${x - 420 - 16}px`, // 420px = panel width, 16px gap
                bottom: `${window.innerHeight - y - rect.height}px`
              };
            }
            return {
              right: '2rem',
              bottom: '6rem'
            };
          })()}
          className="fixed z-40 transition-all duration-500 ease-out"
        >
          <div className="w-[420px] max-w-[calc(100vw-2rem)]">
            <div className="relative p-5 bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    AI Assistant
                  </h3>
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative mb-3">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ask anything..."
                    className="w-full p-3 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 border border-gray-200 resize-none bg-white rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    rows="4"
                    maxLength={500}
                    autoFocus
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {promptText.length}/500
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => {
                      setSelectedMode('Ask');
                      const tracker = getLearningBehaviorTracker();
                      if (tracker) tracker.trackAIAssistantMode('ask');
                    }}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                      selectedMode === 'Ask'
                        ? 'text-white bg-blue-600'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
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
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                      selectedMode === 'Research'
                        ? 'text-white bg-blue-600'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
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
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                      selectedMode === 'Text to Docs'
                        ? 'text-white bg-blue-600'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    Docs
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!promptText.trim()}
                  className="w-full py-2.5 text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Notes - Direct access like AI Assistant */}
      {selectedTool === 'notes' && (
        <SimpleSmartNotes 
          onClose={() => setSelectedTool(null)}
          userId={user?._id || user?.id}
          courseId={courseId}
          contentId={contentId}
          buttonPosition={buttonPosition}
          buttonRef={buttonRef}
        />
      )}

      {/* Smart Notes - Info Panel when not in course content */}
      {selectedTool === 'notes' && (!user || !courseId || !contentId) && (
        <div 
          style={panelPosition.x !== null ? {
            left: `${panelPosition.x}px`,
            top: `${panelPosition.y}px`,
            bottom: 'auto',
            right: 'auto'
          } : {}}
          className={`fixed ${panelPosition.x === null ? 'bottom-24 right-8' : ''} z-40 transition-all duration-500 ease-out`}
        >
          <div className="w-[420px] max-w-[calc(100vw-2rem)]">
            <div className="relative p-5 bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    Smart Notes
                  </h3>
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Smart Notes</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Navigate to a course content page to use Smart Notes
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className={user ? '✅' : '❌'}>{user ? 'Logged in' : 'Not logged in'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className={courseId ? '✅' : '❌'}>{courseId ? 'In course' : 'Not in course'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className={contentId ? '✅' : '❌'}>{contentId ? 'Viewing content' : 'No content open'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Floating Button - Always visible with highest z-index */}
      {(
        <div
          ref={buttonRef}
          onMouseDown={handleButtonMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={buttonPosition.x !== null ? {
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            bottom: 'auto',
            right: 'auto'
          } : {}}
          className={`fixed ${buttonPosition.x === null ? 'bottom-8 right-8' : ''} z-[10010] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isDragging ? '' : 'transition-all duration-500'
          }`}
        >
        {/* Expanded Options */}
        <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <button
            onClick={() => {
              console.log('AI Assistant clicked');
              setSelectedTool(selectedTool === 'ai' ? null : 'ai');
              setIsExpanded(true);
            }}
            className={`option-button flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 ${
              selectedTool === 'ai'
                ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                : 'bg-white text-gray-700 hover:bg-blue-50 hover:shadow-xl'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium whitespace-nowrap">AI Assistant</span>
          </button>

          <button
            onClick={() => {
              console.log('Smart Notes clicked, user:', user, 'courseId:', courseId, 'contentId:', contentId);
              setSelectedTool(selectedTool === 'notes' ? null : 'notes');
              setIsExpanded(true);
            }}
            className={`option-button flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 ${
              selectedTool === 'notes'
                ? 'bg-purple-600 text-white ring-4 ring-purple-200'
                : 'bg-white text-gray-700 hover:bg-purple-50 hover:shadow-xl'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm font-medium whitespace-nowrap">Smart Notes</span>
          </button>
        </div>

        {/* Main Button */}
        <button
          className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg transition-all duration-300 ${
            isExpanded ? 'scale-110 rotate-180' : 'scale-100 hover:scale-110'
          }`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>


        </div>
      )}
    </>
  );
}
