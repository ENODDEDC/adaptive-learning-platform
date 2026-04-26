/**
 * Cold Start Interest Overlay Component
 * Shows interactive overlay when genuine student interest is detected
 * Guides users from cold start preview to full learning mode
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ColdStartInterestOverlay = ({ 
  isVisible, 
  targetMode, 
  onDismiss, 
  onActivateMode,
  buttonRef, // Reference to the learning mode button to highlight
  excludeRightPx = 0 // Keep right-side panel visually untouched
}) => {
  const [animationPhase, setAnimationPhase] = useState('entering');
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const calloutRef = useRef(null);

  const buttonElement = useMemo(() => {
    if (!buttonRef) return null;
    if (typeof buttonRef.getBoundingClientRect === 'function') return buttonRef;
    if (buttonRef.current && typeof buttonRef.current.getBoundingClientRect === 'function') return buttonRef.current;
    return null;
  }, [buttonRef]);

  // Calculate spotlight position based on target button
  useEffect(() => {
    if (!isVisible) return;

    const buttonRect = buttonElement?.getBoundingClientRect?.();
    if (buttonRect) {
      setSpotlightPosition({
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2
      });
    } else {
      // Fallback position when the button is not mounted yet
      setSpotlightPosition({
        x: 120,
        y: 220
      });
    }

    setAnimationPhase('entering');
    const t1 = setTimeout(() => setAnimationPhase('spotlight'), 150);
    const t2 = setTimeout(() => setAnimationPhase('callout'), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isVisible, buttonElement]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onDismiss]);

  // Get mode-specific content
  const getModeContent = (mode) => {
    const content = {
      'Global Learning': {
        title: 'Ready for the Big Picture?',
        description: 'Get comprehensive overviews and see how everything connects',
        icon: '🌐',
        color: 'from-blue-500 to-indigo-600'
      },
      'Sequential Learning': {
        title: 'Want Step-by-Step Guidance?',
        description: 'Break down complex topics into manageable, sequential steps',
        icon: '📋',
        color: 'from-green-500 to-emerald-600'
      },
      'Visual Learning': {
        title: 'Love Visual Content?',
        description: 'Transform information into diagrams, charts, and visual aids',
        icon: '🎨',
        color: 'from-purple-500 to-violet-600'
      },
      'Hands-On Lab': {
        title: 'Ready for Hands-On Practice?',
        description: 'Dive into practical examples and real-world applications',
        icon: '🔬',
        color: 'from-orange-500 to-red-600'
      },
      'Concept Constellation': {
        title: 'Explore Abstract Patterns?',
        description: 'Discover theoretical frameworks and hidden connections',
        icon: '🌟',
        color: 'from-indigo-500 to-purple-600'
      },
      'Active Learning Hub': {
        title: 'Want Interactive Practice?',
        description: 'Engage with discussions, challenges, and active exercises',
        icon: '🎯',
        color: 'from-cyan-500 to-blue-600'
      },
      'Reflective Learning': {
        title: 'Ready to Think Deeper?',
        description: 'Reflect, analyze, and develop deeper understanding',
        icon: '🤔',
        color: 'from-teal-500 to-green-600'
      }
    };

    return content[mode] || content['Global Learning'];
  };

  const modeContent = getModeContent(targetMode);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-all duration-300 pointer-events-none ${
        animationPhase === 'entering' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle target highlight */}
      {animationPhase !== 'entering' && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            left: spotlightPosition.x - 34,
            top: spotlightPosition.y - 34,
            width: 68,
            height: 68,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 0 0 8px rgba(255,255,255,0.18)',
            borderRadius: '50%',
            transform: animationPhase === 'spotlight' ? 'scale(0.95)' : 'scale(1)',
            opacity: 0.95
          }}
        />
      )}

      {/* Main Callout */}
      {animationPhase === 'callout' && (
        <div
          ref={calloutRef}
          className="absolute animate-fade-in-up pointer-events-auto"
          style={{
            left: Math.min(spotlightPosition.x + 120, Math.max(window.innerWidth - 400, 20)),
            top: Math.max(spotlightPosition.y - 100, 20),
            maxWidth: 360
          }}
        >
          {/* Connector line */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: -110,
              top: '50%',
              width: 98,
              height: 2,
              marginTop: -1,
              backgroundColor: 'rgba(255,255,255,0.85)'
            }}
          />

          {/* Callout */}
          <div className="relative rounded-xl border border-gray-200 bg-white shadow-xl p-4 text-gray-900">
            {/* Pointer */}
            <div
              className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"
              style={{
                left: -7,
                top: '50%',
                marginTop: -6
              }}
            />

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 pr-5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-base">
                  {modeContent.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{modeContent.title}</h3>
                  <p className="text-xs text-gray-500">You seem interested in this section</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-600">
                {modeContent.description}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onActivateMode(targetMode);
                    onDismiss();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Open Learning Mode
                </button>

                <button
                  onClick={onDismiss}
                  className="px-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle instruction at bottom */}
      {animationPhase === 'callout' && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm animate-fade-in-up pointer-events-none">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
            <span>Press ESC to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdStartInterestOverlay;
