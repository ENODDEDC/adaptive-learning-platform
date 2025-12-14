'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CourseDetailTour({ show, onComplete, isInstructor }) {
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
            const hasSeenTour = localStorage.getItem('hasSeenCourseDetailTour');
            if (!hasSeenTour) {
                setTimeout(() => setIsVisible(true), 800);
            }
        }
    }, [show]);

    const baseSteps = [
        {
            target: '[data-tour="course-header"]',
            title: 'Course Information',
            content: 'This shows your course name and class code. You can share the class code with others to invite them to join.',
        },
        {
            target: '[data-tour="stream-tab"]',
            title: 'Activity Feed',
            content: 'View all course announcements, updates, and recent activities here. Stay informed about what\'s happening in your class.',
        },
        {
            target: '[data-tour="classwork-tab"]',
            title: 'Classwork & Activities',
            content: isInstructor
                ? 'Create and manage assignments, materials, and course content here. Track student submissions and provide feedback.'
                : 'Access all your assignments, materials, and course content here. Click to view details and submit your work.',
        },
        {
            target: '[data-tour="people-tab"]',
            title: 'Class Members',
            content: isInstructor
                ? 'Manage your class roster here. View all enrolled students and co-teachers, and invite new members to join.'
                : 'See all students and instructors in this course. View who\'s enrolled and connect with your classmates.',
        },
    ];

    // Add Scores tab step only for instructors
    const instructorSteps = isInstructor ? [
        {
            target: '[data-tour="scores-tab"]',
            title: 'Scores & Grading',
            content: 'View and manage student grades here. Track submission rates, grade assignments, and export grade reports.',
        },
    ] : [];

    const finalSteps = [
        {
            target: '[data-tour="upcoming-tasks"]',
            title: 'Upcoming Tasks',
            content: isInstructor
                ? 'View upcoming assignment deadlines and course milestones. Keep track of what\'s due next in your course.'
                : 'Track your deadlines and assignments here. Click on any task to start working on it.',
        },
    ];

    const steps = [...baseSteps, ...instructorSteps, ...finalSteps];

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
        localStorage.setItem('hasSeenCourseDetailTour', 'true');
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
                        borderRadius: '16px',
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
                    // Smart positioning
                    ...(currentStep === 4 && targetRect ? {
                        // Upcoming tasks - position to the left with more spacing
                        top: `${Math.max(20, targetRect.top)}px`,
                        left: `${Math.max(20, targetRect.left - 450)}px`,
                        transform: 'none',
                        maxWidth: '24rem',
                    } : {
                        // Default positioning
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

    return createPortal(tourContent, document.body);
}
