'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function HomeTour({ show, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      const hasSeenTour = localStorage.getItem('hasSeenHomeTour');
      if (!hasSeenTour) {
        setTimeout(() => setIsVisible(true), 800);
      }
    }
  }, [show]);

  const steps = [
    {
      target: '.welcome-header',
      title: 'Welcome to Your Dashboard',
      content: 'This is your personalized learning dashboard. At the top, you\'ll see a welcome message with your name and the current date.',
    },
    {
      target: '.joined-courses-section',
      title: 'Your Joined Courses',
      content: 'Below the welcome header, you\'ll find all the courses you\'ve enrolled in. Each course card shows the course name, instructor, schedule, and quick stats.',
    },
    {
      target: '.add-course-button',
      title: 'Add New Courses',
      content: 'Look for the blue "+" button in the top-right corner of the Joined Courses section. Click it to create a new course or join an existing one with a course code.',
    },
    {
      target: '.recent-activities',
      title: 'Recent Activities',
      content: 'On the right side, you\'ll see your recent activities panel. This keeps you updated with your latest course activities, assignments, and deadlines.',
    },
    {
      target: 'nav',
      title: 'Navigation Sidebar',
      content: 'On the left side of your screen, you\'ll find the navigation sidebar. Use it to quickly access Home, Courses, Schedule, and Settings.',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('hasSeenHomeTour', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible || !mounted) return null;

  const step = steps[currentStep];
  const targetElement = step.target ? document.querySelector(step.target) : null;
  const targetRect = targetElement?.getBoundingClientRect();

  const tourContent = (
    <>
      {/* Spotlight cutout effect - the boxShadow creates the dark overlay everywhere EXCEPT the target */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none transition-all duration-500"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 60px 10px rgba(59, 130, 246, 0.9)',
            borderRadius: '16px',
            border: '4px solid #3b82f6',
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* Fallback overlay if no target */}
      {!targetRect && (
        <div className="fixed inset-0 bg-black/60 z-[9998]" />
      )}

      {/* Smart positioned modal */}
      <div
        className="fixed z-[10000]"
        style={{
          // For step 2 (courses section), position to the right
          ...(currentStep === 1 && targetRect ? {
            top: `${targetRect.top}px`,
            left: `${targetRect.right + 20}px`,
            transform: 'none',
            maxWidth: '24rem',
          } : currentStep === 4 && targetRect ? {
            // For step 5 (sidebar), position to the right of sidebar
            top: `${Math.max(20, targetRect.top + 50)}px`,
            left: `${targetRect.right + 20}px`,
            transform: 'none',
            maxWidth: '24rem',
          } : {
            // Default positioning for other steps
            top: targetRect
              ? (targetRect.bottom + 20 + 400 < window.innerHeight
                ? `${targetRect.bottom + 20}px`
                : targetRect.top > 450
                  ? `${Math.max(20, targetRect.top - 430)}px`
                  : '50%')
              : '50%',
            left: '50%',
            transform: targetRect && (targetRect.bottom + 420 < window.innerHeight || targetRect.top > 450)
              ? 'translateX(-50%)'
              : 'translate(-50%, -50%)',
            maxWidth: '28rem',
          }),
          width: 'calc(100% - 2rem)',
          margin: '0 1rem',
        }}
      >
        <div className="bg-white rounded-xl shadow-lg w-full border border-gray-200">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">{currentStep + 1}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                <p className="text-xs text-gray-500">{currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <button
              onClick={skipTour}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
            <button
              onClick={skipTour}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 transition-colors"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Done'}
                <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render at body level, escaping the page container
  return createPortal(tourContent, document.body);
}
