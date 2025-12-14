'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function DocumentViewerTour({ show, onComplete }) {
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
      const hasSeenTour = localStorage.getItem('hasSeenDocumentViewerTour');
      if (!hasSeenTour) {
        setTimeout(() => setIsVisible(true), 1000);
      }
    }
  }, [show]);

  const steps = [
    {
      target: '[data-tour="learning-modes"]',
      title: '8 AI Learning Modes',
      content: 'Choose from 8 personalized AI learning modes tailored to your learning style. Each mode offers unique ways to understand and interact with your course materials.',
    },
    {
      target: '[data-tour="ai-narrator"]',
      title: 'AI Narrator',
      content: 'Listen to AI-generated audio narration of your document. Perfect for auditory learners or when you want to learn on the go.',
    },
    {
      target: '[data-tour="visual-learning"]',
      title: 'Visual Learning',
      content: 'Get visual representations, diagrams, and infographics generated from your content to enhance understanding.',
    },
    {
      target: '[data-tour="step-by-step"]',
      title: 'Step-by-Step Guide',
      content: 'Break down complex topics into easy-to-follow sequential steps for better comprehension.',
    },
    {
      target: '[data-tour="big-picture"]',
      title: 'Big Picture View',
      content: 'See the overall context and connections between concepts for a holistic understanding.',
    },
    {
      target: '[data-tour="hands-on"]',
      title: 'Hands-On Practice',
      content: 'Get practical exercises and real-world applications to reinforce your learning.',
    },
    {
      target: '[data-tour="theory"]',
      title: 'Theory & Concepts',
      content: 'Dive deep into theoretical foundations and conceptual frameworks.',
    },
    {
      target: '[data-tour="practice"]',
      title: 'Practice Mode',
      content: 'Test your knowledge with practice questions and interactive exercises.',
    },
    {
      target: '[data-tour="reflect"]',
      title: 'Reflective Learning',
      content: 'Engage in self-reflection and critical thinking about what you\'ve learned.',
    },
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
    localStorage.setItem('hasSeenDocumentViewerTour', 'true');
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
      {/* Spotlight cutout effect */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none transition-all duration-500"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 60px 10px rgba(59, 130, 246, 0.9)',
            borderRadius: '12px',
            border: '4px solid #3b82f6',
            backgroundColor: 'transparent',
          }}
        />
      )}
      
      {/* Fallback overlay */}
      {!targetRect && (
        <div className="fixed inset-0 bg-black/60 z-[9998]" />
      )}

      {/* Smart positioned modal */}
      <div
        className="fixed z-[10000]"
        style={{
          top: targetRect
            ? (targetRect.bottom + 20 + 350 < window.innerHeight
              ? `${targetRect.bottom + 20}px`
              : targetRect.top > 400
                ? `${Math.max(20, targetRect.top - 380)}px`
                : '50%')
            : '50%',
          left: '50%',
          transform: targetRect && (targetRect.bottom + 370 < window.innerHeight || targetRect.top > 400)
            ? 'translateX(-50%)'
            : 'translate(-50%, -50%)',
          maxWidth: '28rem',
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

  return createPortal(tourContent, document.body);
}
