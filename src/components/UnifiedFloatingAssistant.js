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
  const collapseTimeoutRef = useRef(null);
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

  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [docGenerating, setDocGenerating] = useState(false);

  // Format AI response text into readable structure
  const formatMessage = (text, role) => {
    if (role === 'user') return <span>{text}</span>;

    // Split into lines and process
    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    return (
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          // Numbered step: "1. Something" or "1) Something"
          const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
          if (numberedMatch) {
            return (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                  {numberedMatch[1]}
                </span>
                <span className="text-sm leading-relaxed">{numberedMatch[2]}</span>
              </div>
            );
          }
          // Bullet: "- Something" or "• Something"
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span className="text-sm leading-relaxed">{trimmed.replace(/^[-•]\s+/, '')}</span>
              </div>
            );
          }
          // Regular paragraph
          return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
        })}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!promptText.trim()) return;

    const tracker = getLearningBehaviorTracker();
    if (tracker) {
      const modeMap = { 'Ask': 'ask', 'Research': 'research', 'Text to Docs': 'textToDocs' };
      tracker.trackAIAssistantInteraction(modeMap[selectedMode], promptText.length);
    }

    // Text to Docs — generate inline floating panel
    if (selectedMode === 'Text to Docs') {
      const docPrompt = promptText.trim();
      setPromptText('');
      setDocGenerating(true);
      setGeneratedDoc(null);
      try {
        const res = await fetch('/api/generate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: docPrompt })
        });
        const data = await res.json();
        console.log('🔍 generate-document response:', data);
        if (data.content) {
          setGeneratedDoc({ content: data.content, prompt: docPrompt });
        } else {
          setGeneratedDoc({ content: `Error: ${data.error || 'No content returned from AI'}`, prompt: docPrompt });
        }
      } catch (err) {
        console.error('Doc generation error:', err);
        setGeneratedDoc({ content: 'Failed to generate document. Please try again.', prompt: docPrompt });
      } finally {
        setDocGenerating(false);
      }
      return;
    }

    // Ask & Research — answer inline in the panel
    const userMessage = promptText.trim();
    setPromptText('');
    setAiLoading(true);
    setAiResponse('');

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          mode: selectedMode,
          conversationHistory: chatHistory
        })
      });

      const data = await res.json();
      const reply = data.response || 'Sorry, I could not generate a response.';
      setAiResponse(reply);
      setChatHistory(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setAiResponse('Something went wrong. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const calculatePanelPosition = (btnX, btnY) => {
    if (!buttonRef.current) return { x: null, y: null };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const panelWidth = 420;
    const panelHeight = 450;
    const gap = 20;
    const margin = 20;
    const expandedButtonsWidth = 200; // Approximate width of expanded buttons
    const expandedButtonsHeight = 180; // Approximate height of expanded buttons (2 buttons + gap)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let panelX, panelY;
    
    // Calculate available space, accounting for expanded buttons
    const isOnRightSide = btnX > viewportWidth / 2;
    const spaceRight = viewportWidth - (btnX + buttonRect.width);
    const spaceLeft = isOnRightSide ? btnX - expandedButtonsWidth : btnX; // Account for buttons on left when on right side
    const spaceTop = btnY - expandedButtonsHeight; // Account for buttons above
    const spaceBottom = viewportHeight - (btnY + buttonRect.height);
    
    // Prefer horizontal placement (left or right), avoiding expanded buttons
    if (spaceLeft >= panelWidth + gap + margin && !isOnRightSide) {
      // Place on left (when button is on left side)
      panelX = btnX - panelWidth - gap;
      panelY = Math.max(margin, Math.min(btnY - (panelHeight / 2) + (buttonRect.height / 2), viewportHeight - panelHeight - margin));
    } else if (spaceRight >= panelWidth + gap + margin && isOnRightSide) {
      // Place on right (when button is on right side, buttons are on left)
      panelX = btnX + buttonRect.width + gap;
      panelY = Math.max(margin, Math.min(btnY - (panelHeight / 2) + (buttonRect.height / 2), viewportHeight - panelHeight - margin));
    } else if (spaceBottom >= panelHeight + gap + margin) {
      // Place below
      panelY = btnY + buttonRect.height + gap;
      panelX = Math.max(margin, Math.min(btnX - (panelWidth / 2) + (buttonRect.width / 2), viewportWidth - panelWidth - margin));
    } else if (spaceTop >= panelHeight + gap + margin) {
      // Place above (but below the expanded buttons)
      panelY = btnY - panelHeight - gap - expandedButtonsHeight - 20;
      panelX = Math.max(margin, Math.min(btnX - (panelWidth / 2) + (buttonRect.width / 2), viewportWidth - panelWidth - margin));
    } else {
      // Fallback: place to the side that has more space
      if (isOnRightSide) {
        // Button on right, place panel on right (expanded buttons are on left)
        panelX = Math.min(btnX + buttonRect.width + gap, viewportWidth - panelWidth - margin);
      } else {
        // Button on left, place panel on left
        panelX = Math.max(btnX - panelWidth - gap, margin);
      }
      panelY = Math.max(margin, Math.min(btnY, viewportHeight - panelHeight - margin));
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
    // Clear any pending collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    
    if (!isDraggingButton && !selectedTool) {
      expandTimeoutRef.current = setTimeout(() => {
        setIsExpanded(true);
      }, 200);
    }
  };

  const handleMouseLeave = (e) => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    
    // Don't collapse if hovering over the expanded buttons
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (
      relatedTarget.closest('.expanded-options') || 
      relatedTarget.closest('.option-button')
    )) {
      return;
    }
    
    // Add delay before collapsing to give time to move cursor to buttons
    if (!selectedTool) {
      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 300); // 300ms delay
    }
  };

  useEffect(() => {
    if (buttonPosition.x !== null && buttonPosition.y !== null) {
      const newPanelPos = calculatePanelPosition(buttonPosition.x, buttonPosition.y);
      setPanelPosition(newPanelPos);
    }
  }, [buttonPosition.x, buttonPosition.y, selectedTool]);

  // Keyboard shortcut - Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTool) {
        e.preventDefault();
        setSelectedTool(null);
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTool]);

  const downloadDocument = async (content, title) => {
    try {
      const res = await fetch('/api/create-word-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title: title || 'Document' })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download document');
    }
  };

  return (
    <>
      {/* Generated Document Preview Panel - Left Side */}
      {generatedDoc && (
        <div className="fixed left-0 top-0 bottom-0 w-[600px] bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Generated Document</h3>
                <p className="text-xs text-gray-500">AI-generated · Review before use</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadDocument(generatedDoc.content, generatedDoc.prompt)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={() => setGeneratedDoc(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {/* Paper-style container */}
            <div className="max-w-2xl mx-auto my-8 bg-white shadow-md rounded px-16 py-12 min-h-full">
              {(() => {
                const content = generatedDoc.content;

                const cleanText = (text) => text
                  .replace(/\*\*/g, '')
                  .replace(/\*/g, '')
                  .replace(/`/g, '')
                  .replace(/~/g, '')
                  .replace(/#{1,6}\s*/g, '')
                  .replace(/^\s*[-*+]\s*/gm, '')
                  .replace(/^\s*\d+\.\s*/gm, '')
                  .trim();

                const lines = content.split('\n');
                const elements = [];
                let currentList = null;
                let listItems = [];
                let firstContentLine = true;

                lines.forEach((line, i) => {
                  const trimmed = line.trim();

                  if (!trimmed) {
                    if (currentList) {
                      elements.push(<ul key={`list-${i}`} className="mb-6 ml-8 space-y-2">{listItems}</ul>);
                      currentList = null; listItems = [];
                    }
                    return;
                  }

                  if (trimmed.startsWith('#')) {
                    if (currentList) { elements.push(<ul key={`list-${i}`} className="mb-6 ml-8 space-y-2">{listItems}</ul>); currentList = null; listItems = []; }
                    firstContentLine = false;
                    const level = (trimmed.match(/^#+/) || [''])[0].length;
                    const text = cleanText(trimmed);
                    if (level === 1) elements.push(<h1 key={i} className="text-3xl font-bold text-gray-900 mt-10 mb-6 text-center border-b-2 border-gray-300 pb-4">{text}</h1>);
                    else if (level === 2) elements.push(<h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">{text}</h2>);
                    else elements.push(<h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-3">{text}</h3>);
                    return;
                  }

                  if (trimmed.match(/^[-*•]\s+/)) {
                    listItems.push(<li key={i} className="text-base leading-7 text-gray-800 list-disc">{cleanText(trimmed)}</li>);
                    currentList = true; return;
                  }

                  if (trimmed.match(/^\d+\.\s+/)) {
                    if (currentList) { elements.push(<ul key={`list-${i}`} className="mb-6 ml-8 space-y-2">{listItems}</ul>); currentList = null; listItems = []; }
                    const num = (trimmed.match(/^\d+/) || ['1'])[0];
                    elements.push(<div key={i} className="mb-3 text-base leading-7 text-gray-800 ml-4"><span className="font-bold mr-2">{num}.</span>{cleanText(trimmed)}</div>);
                    return;
                  }

                  if (currentList) { elements.push(<ul key={`list-${i}`} className="mb-6 ml-8 space-y-2">{listItems}</ul>); currentList = null; listItems = []; }

                  const cleaned = cleanText(trimmed);
                  // First non-empty line = document title
                  if (firstContentLine) {
                    firstContentLine = false;
                    elements.push(<h1 key={i} className="text-2xl font-bold text-gray-900 mt-4 mb-8 text-center border-b-2 border-gray-300 pb-4">{cleaned}</h1>);
                  } else if (trimmed.match(/^[A-Z\s]+:?\s*$/) && trimmed.length < 100) {
                    elements.push(<h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3 uppercase tracking-wide">{cleaned.replace(/:$/, '')}</h3>);
                  } else {
                    elements.push(<p key={i} className="mb-5 text-base leading-7 text-gray-800 text-justify indent-6">{cleaned}</p>);
                  }
                });

                if (currentList && listItems.length > 0) elements.push(<ul key="list-final" className="mb-6 ml-8 space-y-2">{listItems}</ul>);

                return elements;
              })()}
            </div>
          </div>
        </div>
      )}

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
                left: `${x - 420 - 16}px`,
                bottom: `${window.innerHeight - y - rect.height}px`
              };
            }
            return {
              right: '2rem',
              bottom: '6rem'
            };
          })()}
          className="fixed z-40"
        >
          <div className="w-[400px] max-w-[calc(100vw-2rem)]">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-xs text-gray-500">Knows IntelEvo platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {chatHistory.length > 0 && (
                    <button
                      onClick={() => { setChatHistory([]); setAiResponse(''); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Clear chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="px-5 pt-4">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                  {[
                    { label: 'Ask', mode: 'Ask', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
                    { label: 'Research', mode: 'Research', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
                    { label: 'Docs', mode: 'Text to Docs', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                  ].map(({ label, mode, icon }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSelectedMode(mode);
                        const tracker = getLearningBehaviorTracker();
                        if (tracker) tracker.trackAIAssistantMode(mode === 'Ask' ? 'ask' : mode === 'Research' ? 'research' : 'textToDocs');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                        selectedMode === mode
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="px-5 pt-4 max-h-64 overflow-y-auto space-y-3">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {formatMessage(msg.text, msg.role)}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-bl-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea */}
              <div className="px-5 pt-3 pb-4">
                <div className="relative">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
                    }}
                    placeholder={
                      selectedMode === 'Ask' ? 'Ask me anything...' :
                      selectedMode === 'Research' ? 'What do you want to research?' :
                      'Describe the document you want to generate...'
                    }
                    className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    rows="4"
                    maxLength={500}
                    autoFocus
                  />
                  <div className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                    {promptText.length}/500
                  </div>
                </div>

                {/* Docs mode disclaimer */}
                {selectedMode === 'Text to Docs' && (
                  <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Beta Feature:</strong> This mode is under development. Generated documents may contain inaccuracies or incomplete information. Please review and verify content before use. Note that the preview display may differ in formatting from the actual downloaded document.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-mono">Ctrl+Enter</kbd> to submit
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!promptText.trim() || aiLoading || docGenerating}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {docGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {selectedMode === 'Text to Docs' ? 'Generate' : 'Send'}
                      </>
                    )}
                  </button>
                </div>
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
        {/* Expanded Options - Positioned to the side based on screen position */}
        {/* Hide when a tool is selected to avoid overlap */}
        {!selectedTool && (
          <div 
            className="expanded-options absolute flex flex-col gap-3 mb-3 transition-all duration-300"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              bottom: '72px', // 56px (button height) + 16px gap
              // Default position (right side): show buttons on the left
              // If button is on left side, show buttons on the right
              ...(buttonPosition.x === null || buttonPosition.x > window.innerWidth / 2 ? {
                right: '0', // Align to right edge of button (buttons appear on left)
              } : {
                left: '0', // Align to left edge of button (buttons appear on right)
              }),
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateY(0)' : 'translateY(16px)',
              pointerEvents: isExpanded ? 'auto' : 'none'
            }}
          >
          <button
            onClick={() => {
              console.log('AI Assistant clicked');
              setSelectedTool(selectedTool === 'ai' ? null : 'ai');
              setIsExpanded(true);
            }}
            className={`option-button flex items-center gap-3 px-5 py-3 rounded-xl shadow-md transition-all duration-300 border ${
              selectedTool === 'ai'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-lg'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-semibold whitespace-nowrap">AI Assistant</span>
          </button>

          <button
            onClick={() => {
              console.log('Smart Notes clicked, user:', user, 'courseId:', courseId, 'contentId:', contentId);
              setSelectedTool(selectedTool === 'notes' ? null : 'notes');
              setIsExpanded(true);
            }}
            className={`option-button flex items-center gap-3 px-5 py-3 rounded-xl shadow-md transition-all duration-300 border ${
              selectedTool === 'notes'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:shadow-lg'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm font-semibold whitespace-nowrap">Smart Notes</span>
          </button>
        </div>
        )}

        {/* Main Button */}
        <button
          className={`flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl shadow-lg transition-all duration-300 ${
            isExpanded ? 'scale-110' : 'scale-100 hover:scale-110 hover:bg-gray-800'
          }`}
        >
          {isExpanded ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>


        </div>
      )}
    </>
  );
}
