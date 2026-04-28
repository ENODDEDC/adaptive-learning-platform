'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowPathIcon,
    ChevronLeftIcon,
    HandRaisedIcon,
    DocumentTextIcon,
    BeakerIcon,
    PresentationChartLineIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const IMMERSIVE_ACTIVE_LEARNING_EVENT = 'assist-ed-immersive-active-learning';

/** Single-scroll workspace; phased tab state removed. */

/**
 * Active Learning Component - Evidence-Based Implementation
 * Based on Felder-Silverman Learning Style Model
 * 
 * Research Foundation:
 * - Active learners engage directly with material (Felder & Silverman, 1988)
 * - Active learners prefer group communication and discussion
 * - Active learners process information through experimentation
 * - Active learners retain information better through immediate application
 */
const ActiveLearning = ({
    isActive,
    onClose,
    docxContent,
    fileName
}) => {
    // Core state management
    const [processingData, setProcessingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Activity states
    const [extractedConcepts, setExtractedConcepts] = useState([]);
    const [discussionHistory, setDiscussionHistory] = useState([]);
    const [applicationScenarios, setApplicationScenarios] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [processingMetrics, setProcessingMetrics] = useState({
        conceptsProcessed: 0,
        applicationsCompleted: 0,
        discussionDepth: 0
    });

    // Button feedback states
    const [buttonFeedback, setButtonFeedback] = useState('');

    useLayoutEffect(() => {
        if (typeof document === 'undefined' || !isActive) return undefined;
        document.body.setAttribute('data-immersive-active-learning', 'true');
        window.dispatchEvent(new CustomEvent(IMMERSIVE_ACTIVE_LEARNING_EVENT, { detail: { open: true } }));
        try {
            window.dispatchEvent(new Event('collapseMainSidebar'));
        } catch {
            // ignore
        }
        return () => {
            document.body.removeAttribute('data-immersive-active-learning');
            window.dispatchEvent(new CustomEvent(IMMERSIVE_ACTIVE_LEARNING_EVENT, { detail: { open: false } }));
        };
    }, [isActive]);

    // Generate active learning content when component loads
    useEffect(() => {
        if (isActive && docxContent && !processingData && !loading) {
            generateActiveProcessingContent();
        }
    }, [isActive, docxContent]);

    // Track mode activation
    // Automatic time tracking for ML classification
    useLearningModeTracking('activeLearning', isActive);

    useEffect(() => {
        if (isActive && docxContent) {
            trackBehavior('mode_activated', { mode: 'active', fileName });
        }
    }, [isActive, docxContent, fileName]);

    const generateActiveProcessingContent = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/active-learning/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    fileName: fileName,
                    learningStyle: 'active',
                    researchBased: true
                }),
            });

            if (!response.ok) {
                let detail = `HTTP ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.error) detail = errJson.error;
                } catch {
                    // ignore
                }
                throw new Error(detail);
            }

            const data = await response.json();

            if (data.success) {
                setProcessingData(data);
                setScenarioResults({});
                // Initialize with engagement phase content
                if (data.engagementTools) {
                    setExtractedConcepts(data.engagementTools.concepts || []);
                }
                if (data.applicationScenarios) {
                    setApplicationScenarios(data.applicationScenarios || []);
                    setActiveScenarioIndex(0);
                }
            } else {
                throw new Error(data.error || 'Failed to generate active learning content');
            }
        } catch (error) {
            console.error('Error generating active learning content:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const requestRegenerate = () => {
        if (!window.confirm('Regenerate? Uses more API quota.')) return;
        setProcessingData(null);
        setScenarioResults({});
        setDiscussionHistory([]);
        setActiveScenarioIndex(0);
        setActiveTab('work');
        generateActiveProcessingContent();
    };

    const handleConceptExtraction = (concept) => {
        setExtractedConcepts(prev => [...prev, concept]);
        setProcessingMetrics(prev => ({
            ...prev,
            conceptsProcessed: prev.conceptsProcessed + 1
        }));
    };

    const handleDiscussionSubmit = async () => {
        const message = userInput.trim();
        if (!message) return;

        trackBehavior('discussion_participated', { mode: 'active', phase: 'verbal_sparring' });

        const newEntry = {
            type: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            phase: 'verbal_sparring'
        };

        const historyBefore = discussionHistory;
        setDiscussionHistory(prev => [...prev, newEntry]);
        setUserInput('');

        // Generate AI academic response
        try {
            const response = await fetch('/api/active-learning/academic-discussion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput: message,
                    history: historyBefore,
                    content: docxContent,
                    phase: 'collaboration',
                    concepts: extractedConcepts
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiEntry = {
                    type: 'ai',
                    content: data.response,
                    timestamp: new Date().toISOString(),
                    phase: 'verbal_sparring'
                };
                setDiscussionHistory(prev => [...prev, aiEntry]);
                setProcessingMetrics(prev => ({
                    ...prev,
                    discussionDepth: prev.discussionDepth + 1
                }));
            }
        } catch (error) {
            console.error('Error in academic discussion:', error);
        }
    };

    const handleScenarioCompletion = (scenario, response) => {
        setProcessingMetrics(prev => ({
            ...prev,
            applicationsCompleted: prev.applicationsCompleted + 1
        }));
    };

    // Button handler functions for interactive content processing
    const handleExtractConcepts = async () => {
        if (!docxContent) return;

        setLoading(true);
        setButtonFeedback('');

        try {
            const response = await fetch('/api/active-learning/extract-concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.concepts) {
                    setExtractedConcepts(prev => [...prev, ...data.concepts]);
                    setProcessingMetrics(prev => ({
                        ...prev,
                        conceptsProcessed: prev.conceptsProcessed + data.concepts.length
                    }));
                    setButtonFeedback(`✅ Successfully extracted ${data.concepts.length} new concepts!`);

                    // Clear feedback after 3 seconds
                    setTimeout(() => setButtonFeedback(''), 3000);
                } else {
                    setButtonFeedback('⚠️ No new concepts found in the content.');
                }
            } else {
                setButtonFeedback('❌ Failed to extract concepts. Please try again.');
            }
        } catch (error) {
            console.error('Error extracting concepts:', error);
            setButtonFeedback('❌ Error occurred while extracting concepts.');
        } finally {
            setLoading(false);
        }
    };

    const handleIdentifyRelationships = async () => {
        if (!docxContent || extractedConcepts.length === 0) {
            setButtonFeedback('⚠️ Please extract concepts first to identify relationships');
            setTimeout(() => setButtonFeedback(''), 3000);
            return;
        }

        setLoading(true);
        setButtonFeedback('');

        try {
            const response = await fetch('/api/active-learning/identify-relationships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Update concepts with relationship information
                if (data.relationships) {
                    setExtractedConcepts(prev => prev.map(concept => {
                        const relationship = data.relationships.find(r => r.conceptId === concept.id);
                        return relationship ? { ...concept, relationships: relationship.connections } : concept;
                    }));
                    setButtonFeedback(`✅ Successfully identified relationships between ${data.relationships.length} concepts!`);
                    setTimeout(() => setButtonFeedback(''), 3000);
                } else {
                    setButtonFeedback('⚠️ No relationships found between concepts.');
                    setTimeout(() => setButtonFeedback(''), 3000);
                }
            } else {
                setButtonFeedback('❌ Failed to identify relationships. Please try again.');
                setTimeout(() => setButtonFeedback(''), 3000);
            }
        } catch (error) {
            console.error('Error identifying relationships:', error);
            setButtonFeedback('❌ Error occurred while identifying relationships.');
            setTimeout(() => setButtonFeedback(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!docxContent) return;

        setLoading(true);
        setButtonFeedback('');

        try {
            const response = await fetch('/api/active-learning/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.questions) {
                    // Add questions to discussion history as AI prompts
                    const questionEntries = data.questions.map(question => ({
                        type: 'ai',
                        content: `Discussion Question: ${question}`,
                        timestamp: new Date().toISOString(),
                        phase: 'engagement'
                    }));
                    setDiscussionHistory(prev => [...prev, ...questionEntries]);
                    setActiveTab('talk');
                    setButtonFeedback(`✅ Added ${data.questions.length} prompts — switched to Talk tab.`);
                    setTimeout(() => setButtonFeedback(''), 4000);
                } else {
                    setButtonFeedback('⚠️ No questions could be generated from the content.');
                    setTimeout(() => setButtonFeedback(''), 3000);
                }
            } else {
                setButtonFeedback('❌ Failed to generate questions. Please try again.');
                setTimeout(() => setButtonFeedback(''), 3000);
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            setButtonFeedback('❌ Error occurred while generating questions.');
            setTimeout(() => setButtonFeedback(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Knowledge Integration handlers
    const [executiveSummary, setExecutiveSummary] = useState('');
    const [teachingOutline, setTeachingOutline] = useState('');
    const [practiceQuestions, setPracticeQuestions] = useState([]);
    const [implementationPlan, setImplementationPlan] = useState('');

    const handleCreateSummary = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/active-learning/create-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setExecutiveSummary(data.summary);
            }
        } catch (error) {
            console.error('Error creating summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOutline = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/active-learning/create-outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTeachingOutline(data.outline);
            }
        } catch (error) {
            console.error('Error creating outline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePracticeQuestions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/active-learning/practice-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setPracticeQuestions(data.questions);
            }
        } catch (error) {
            console.error('Error generating practice questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanImplementation = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/active-learning/implementation-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    concepts: extractedConcepts,
                    applicationScenarios: applicationScenarios,
                    fileName: fileName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setImplementationPlan(data.plan);
            }
        } catch (error) {
            console.error('Error creating implementation plan:', error);
        } finally {
            setLoading(false);
        }
    };

    // Application Lab handlers
    const [scenarioResults, setScenarioResults] = useState({});
    const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('work');
    const discussionEndRef = useRef(null);

    const playbook = useMemo(
        () => [
            {
                tabKey: 'work',
                step: '1',
                title: 'Your page',
                tabLabel: 'Page',
                hint: 'Use the file itself—pull out ideas and links.',
                Icon: DocumentTextIcon
            },
            {
                tabKey: 'talk',
                step: '2',
                title: 'Talk it through',
                tabLabel: 'Talk',
                hint: 'Say what you think out loud; test if it holds up.',
                Icon: ChatBubbleOvalLeftEllipsisIcon
            },
            {
                tabKey: 'try',
                step: '3',
                title: 'Try a choice',
                tabLabel: 'Try',
                hint: 'Pick what you would do in a tight moment.',
                Icon: BeakerIcon
            },
            {
                tabKey: 'teach',
                step: '4',
                title: 'Explain it',
                tabLabel: 'Explain',
                hint: 'If you can teach it, you probably get it.',
                Icon: PresentationChartLineIcon
            }
        ],
        []
    );

    const discussionStarters = useMemo(
        () => [
            'What is the single strongest claim in this reading—and where does the text support it?',
            'Where might a thoughtful reader disagree, and what would you say back using the document?',
            'If I had to explain this to a friend in two minutes, what is the one idea I would stress?'
        ],
        []
    );

    useEffect(() => {
        if (!applicationScenarios?.length) {
            setActiveScenarioIndex(0);
            return;
        }
        setActiveScenarioIndex((i) => Math.min(Math.max(0, i), applicationScenarios.length - 1));
    }, [applicationScenarios]);

    useEffect(() => {
        discussionEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [discussionHistory]);

    const handleScenarioResponse = async (scenarioIndex, response) => {
        setLoading(true);
        try {
            const response_api = await fetch('/api/active-learning/scenario-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: applicationScenarios[scenarioIndex],
                    userResponse: response,
                    content: docxContent
                }),
            });

            if (response_api.ok) {
                const data = await response_api.json();
                setScenarioResults(prev => ({
                    ...prev,
                    [scenarioIndex]: {
                        userResponse: response,
                        feedback: data.feedback,
                        score: data.score,
                        completed: true
                    }
                }));

                setProcessingMetrics(prev => ({
                    ...prev,
                    applicationsCompleted: prev.applicationsCompleted + 1
                }));
            }
        } catch (error) {
            console.error('Error processing scenario response:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isActive) return null;

    const hasFullContent = Boolean(processingData?.engagementTools);
    const teachDone = Boolean(executiveSummary || teachingOutline || practiceQuestions.length || implementationPlan);
    const tryDone =
        processingMetrics.applicationsCompleted > 0 || Object.keys(scenarioResults).length > 0;
    const talkDone = discussionHistory.length > 0;
    const workDone = extractedConcepts.length > 0;
    const stepDoneFlags = [workDone, talkDone, tryDone, teachDone];
    const scenarioCount = applicationScenarios?.length ?? 0;
    const scenarioSafeIndex = scenarioCount > 0 ? Math.min(activeScenarioIndex, scenarioCount - 1) : 0;
    const activeScenario = scenarioCount > 0 ? applicationScenarios[scenarioSafeIndex] : null;

    const shell = (
        <div
            className="fixed inset-0 left-0 top-0 z-[100020] flex flex-col overflow-hidden bg-stone-950 text-stone-100 antialiased"
            style={{
                paddingTop: typeof document !== 'undefined' && document.body.hasAttribute('data-has-ml-nav') ? '16px' : '0',
                backgroundImage:
                    'radial-gradient(ellipse 90% 55% at 50% -20%, rgba(251,191,36,0.07), transparent 55%), radial-gradient(ellipse 55% 45% at 100% 100%, rgba(217,119,6,0.06), transparent 50%)'
            }}
            data-active-learning-root
        >
            <header className="border-b border-amber-950/40 bg-stone-950/95 px-3 py-2 backdrop-blur-md sm:px-4">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-lg p-2 text-stone-400 transition hover:bg-stone-800 hover:text-amber-100"
                            title="Back"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-900/40 bg-amber-950/40 text-amber-400">
                            <HandRaisedIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-semibold text-stone-50 sm:text-base">Learn by doing</h2>
                            <p className="truncate text-xs text-stone-500">{fileName}</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:ml-auto">
                            {!hasFullContent && !loading && (
                                <button
                                    type="button"
                                    onClick={generateActiveProcessingContent}
                                    className="rounded-lg border border-amber-600 bg-amber-600 px-3 py-1.5 text-xs font-medium text-stone-950 hover:bg-amber-500 sm:text-sm"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Generate
                                    </span>
                                </button>
                            )}
                            {hasFullContent && !loading && (
                                <button
                                    type="button"
                                    onClick={requestRegenerate}
                                    className="rounded-lg border border-stone-600 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-800 sm:px-3 sm:text-sm"
                                    title="Uses more API quota"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <ArrowPathIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Regenerate</span>
                                    </span>
                                </button>
                            )}
                            {loading && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-400">
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-600 border-t-amber-400 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">…</span>
                                </div>
                            )}
                    </div>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {loading ? (
                    <div className="active-learning-scroll flex flex-1 items-center justify-center">
                        <div className="max-w-md px-4 text-center">
                            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-stone-600 border-t-amber-400" />
                            <h3 className="mb-2 text-lg font-semibold text-stone-100">Preparing your practice set</h3>
                            <p className="text-sm text-stone-400">
                                Generating activities grounded in this document…
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="active-learning-scroll flex flex-1 items-center justify-center px-4">
                        <div className="max-w-md rounded-2xl border border-red-900/40 bg-red-950/30 p-6 text-center">
                            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-400" />
                            <h3 className="mb-2 text-lg font-semibold text-stone-100">Could not generate</h3>
                            <p className="mb-4 text-sm text-stone-400">{error}</p>
                            <button
                                type="button"
                                onClick={generateActiveProcessingContent}
                                className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-stone-950 transition hover:bg-amber-500"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <nav
                            className="shrink-0 border-b border-stone-800/90 bg-stone-950/98 px-2 py-2 backdrop-blur-md sm:px-4"
                            role="tablist"
                            aria-label="Practice sections"
                        >
                            <div className="mx-auto flex max-w-[min(1120px,calc(100%-0.25rem))] gap-1 sm:gap-2">
                                {playbook.map((row, i) => {
                                    const Icon = row.Icon;
                                    const selected = activeTab === row.tabKey;
                                    return (
                                        <button
                                            key={row.tabKey}
                                            id={`al-tab-${row.tabKey}`}
                                            type="button"
                                            role="tab"
                                            aria-selected={selected}
                                            onClick={() => {
                                                setActiveTab(row.tabKey);
                                                trackBehavior('tab_switched', { mode: 'active', tab: row.tabKey });
                                            }}
                                            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-left text-[11px] font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${selected
                                                ? 'border-amber-600/55 bg-amber-950/50 text-amber-50 shadow-inner ring-1 ring-amber-500/35'
                                                : 'border-stone-800/90 bg-stone-900/60 text-stone-400 hover:border-stone-600 hover:bg-stone-800/80 hover:text-stone-200'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                            <span className="truncate sm:hidden">{row.tabLabel}</span>
                                            <span className="hidden min-w-0 truncate sm:inline">{row.title}</span>
                                            {stepDoneFlags[i] ? (
                                                <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="Started" />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        <div className="active-learning-scroll min-h-0 flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                            <div className="mx-auto w-full max-w-[min(1120px,calc(100%-0.5rem))] px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
                                        {activeTab === 'work' ? (
                                        <section role="tabpanel" aria-labelledby="al-tab-work" className="min-h-0">
                                            <div className="overflow-hidden rounded-2xl border border-stone-800/85 bg-stone-900/45 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]">
                                                <header className="flex flex-wrap items-start gap-3 border-b border-stone-800/80 bg-stone-950/40 px-4 py-4 sm:px-5">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-800/50 bg-amber-950/35 text-amber-300">
                                                        <DocumentTextIcon className="h-6 w-6" aria-hidden />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">Work with your page</h3>
                                                        <p className="mt-1 text-sm text-stone-500">Skim the passage, then let the tools pull ideas out for you. You stay in control—each button adds to your notes below.</p>
                                                    </div>
                                                </header>
                                                <div className="active-learning-scroll max-h-[min(52vh,34rem)] min-h-[11rem] overflow-y-auto border-b border-stone-800/70 bg-stone-950/55 p-4 sm:p-5">
                                                    <div className="text-sm leading-relaxed text-stone-300 whitespace-pre-wrap">{docxContent || 'No content available'}</div>
                                                </div>
                                                <div className="space-y-3 p-4 sm:p-5">
                                                    <p className="text-xs font-medium text-stone-500">What do you want to do first?</p>
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                        <button
                                                            type="button"
                                                            onClick={handleExtractConcepts}
                                                            disabled={loading}
                                                            className="rounded-xl border border-amber-600/50 bg-amber-600/90 px-4 py-2.5 text-left text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {loading ? 'Working…' : 'Find main ideas'}
                                                            <span className="mt-0.5 block text-xs font-normal text-stone-800/90">Pulls key points from the text</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleIdentifyRelationships}
                                                            disabled={loading || extractedConcepts.length === 0}
                                                            className="rounded-xl border border-emerald-800/45 bg-emerald-950/30 px-4 py-2.5 text-left text-sm font-medium text-emerald-50 transition hover:bg-emerald-950/50 disabled:cursor-not-allowed disabled:opacity-45"
                                                        >
                                                            {loading ? 'Working…' : 'Connect the ideas'}
                                                            <span className="mt-0.5 block text-xs font-normal text-emerald-200/70">Needs at least one idea above</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleGenerateQuestions}
                                                            disabled={loading}
                                                            className="rounded-xl border border-violet-800/45 bg-violet-950/30 px-4 py-2.5 text-left text-sm font-medium text-violet-50 transition hover:bg-violet-950/50 disabled:cursor-not-allowed disabled:opacity-45"
                                                        >
                                                            {loading ? 'Working…' : 'Drop questions into chat'}
                                                            <span className="mt-0.5 block text-xs font-normal text-violet-200/70">Opens talking points for step 2</span>
                                                        </button>
                                                    </div>
                                                    {buttonFeedback ? (
                                                        <div className="rounded-xl border border-emerald-900/35 bg-emerald-950/20 p-3 text-sm text-emerald-100/90">{buttonFeedback}</div>
                                                    ) : null}
                                                </div>
                                                {extractedConcepts.length > 0 ? (
                                                    <div className="border-t border-stone-800/80 bg-stone-950/35 p-4 sm:p-5">
                                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Your notes from the text</p>
                                                        <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto active-learning-scroll sm:grid-cols-2">
                                                            {extractedConcepts.map((concept, index) => (
                                                                <div key={index} className="rounded-xl border border-stone-700/80 bg-stone-900/90 p-3">
                                                                    <div className="font-medium text-amber-200/95 text-sm">{concept.title}</div>
                                                                    <div className="mt-1 text-xs leading-relaxed text-stone-500">{concept.description}</div>
                                                                    {concept.relationships && concept.relationships.length > 0 ? (
                                                                        <div className="mt-2 border-t border-stone-800 pt-2 text-[11px] text-stone-500">
                                                                            <span className="font-medium text-stone-400">How they connect: </span>
                                                                            <ul className="mt-1 list-inside list-disc">
                                                                                {concept.relationships.map((rel, relIndex) => (
                                                                                    <li key={relIndex}>
                                                                                        {typeof rel === 'string' ? rel : `${rel.type}: ${rel.target} (${rel.strength})`}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </section>
                                        ) : null}
                                        {activeTab === 'talk' ? (
                                        <section id="al-talk" role="tabpanel" aria-labelledby="al-tab-talk" className="scroll-mt-28">
                                            <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-stone-800/85 bg-stone-900/45 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]">
                                                <header className="flex flex-wrap items-start gap-3 border-b border-stone-800/80 bg-stone-950/40 px-4 py-4 sm:px-5">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-800/45 bg-sky-950/35 text-sky-200">
                                                        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" aria-hidden />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">Talk it through</h3>
                                                        <p className="mt-1 text-sm text-stone-500">Say what you believe about the reading. A partner here will push back so you notice gaps—like study group, not a lecture.</p>
                                                    </div>
                                                </header>
                                                <div className="active-learning-scroll max-h-[min(48vh,26rem)] min-h-[12rem] flex-1 overflow-y-auto bg-stone-950/45 p-4 sm:p-5">
                                                    {discussionHistory.length === 0 ? (
                                                        <p className="py-8 text-center text-sm text-stone-500">Start with a sentence you could defend in class, or tap a starter below.</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {discussionHistory.map((entry, index) => (
                                                                <div key={index} className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                    <div
                                                                        className={`max-w-[min(100%,30rem)] rounded-2xl px-4 py-2.5 ${entry.type === 'user'
                                                                            ? 'border border-amber-700/40 bg-amber-950/45 text-stone-50'
                                                                            : 'border border-stone-700 bg-stone-900 text-stone-200'
                                                                            }`}
                                                                    >
                                                                        <p className="text-sm leading-relaxed">{entry.content}</p>
                                                                        <p className={`mt-1 text-[10px] ${entry.type === 'user' ? 'text-amber-200/65' : 'text-stone-500'}`}>
                                                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div ref={discussionEndRef} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-t border-stone-800/80 bg-stone-950/30 p-4 sm:p-5">
                                                    <p className="mb-2 text-xs font-medium text-stone-500">Try a starter (tap to edit, then Send)</p>
                                                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                        {discussionStarters.map((s, si) => (
                                                            <button
                                                                key={si}
                                                                type="button"
                                                                onClick={() => setUserInput(s)}
                                                                className="rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-2 text-left text-xs leading-snug text-stone-300 transition hover:border-amber-700/45 hover:text-stone-100"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        value={userInput}
                                                        onChange={(e) => setUserInput(e.target.value)}
                                                        placeholder="Type in your own words what you think—and what might be wrong with that view."
                                                        className="w-full resize-none rounded-xl border border-stone-700 bg-stone-950/90 p-3 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-600/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                        rows={3}
                                                    />
                                                    <div className="mt-3 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleDiscussionSubmit}
                                                            disabled={!userInput.trim()}
                                                            className="rounded-xl border border-emerald-600/55 bg-emerald-700/90 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            Send message
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                        ) : null}
                                        {activeTab === 'try' ? (
                                        <section id="al-try" role="tabpanel" aria-labelledby="al-tab-try" className="scroll-mt-28">
                                            <div className="overflow-hidden rounded-2xl border border-stone-800/85 bg-stone-900/45 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]">
                                                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 bg-stone-950/40 px-4 py-4 sm:px-5">
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-800/45 bg-amber-950/35 text-amber-200">
                                                            <BeakerIcon className="h-6 w-6" aria-hidden />
                                                        </span>
                                                        <div>
                                                            <h3 className="text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">Try a quick choice</h3>
                                                            <p className="mt-1 text-sm text-stone-500">One short situation at a time. Pick what you would do, then read the feedback—fast practice beats rereading.</p>
                                                        </div>
                                                    </div>
                                                    {scenarioCount > 1 ? (
                                                        <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/60 px-2 py-1">
                                                            <button
                                                                type="button"
                                                                aria-label="Previous situation"
                                                                disabled={scenarioSafeIndex <= 0}
                                                                onClick={() => setActiveScenarioIndex((i) => Math.max(0, i - 1))}
                                                                className="rounded-md px-2 py-1 text-sm text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
                                                            >
                                                                ←
                                                            </button>
                                                            <span className="tabular-nums text-xs text-stone-400">
                                                                {scenarioSafeIndex + 1} / {scenarioCount}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                aria-label="Next situation"
                                                                disabled={scenarioSafeIndex >= scenarioCount - 1}
                                                                onClick={() => setActiveScenarioIndex((i) => Math.min(scenarioCount - 1, i + 1))}
                                                                className="rounded-md px-2 py-1 text-sm text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
                                                            >
                                                                →
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </header>
                                                {activeScenario ? (
                                                    <div className="p-4 sm:p-6">
                                                        <h4 className="text-base font-semibold text-stone-50 sm:text-lg">{activeScenario.title || `Situation ${scenarioSafeIndex + 1}`}</h4>
                                                        {activeScenario.description ? (
                                                            <p className="mt-1 text-sm text-stone-500">{activeScenario.description}</p>
                                                        ) : null}
                                                        <div className="mt-4 rounded-xl border border-amber-900/30 bg-amber-950/15 p-4">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">What is happening</p>
                                                            <p className="mt-2 text-sm leading-relaxed text-stone-300">{activeScenario.situation}</p>
                                                        </div>
                                                        {!scenarioResults[scenarioSafeIndex] ? (
                                                            <div className="mt-4 space-y-2">
                                                                <p className="text-sm font-medium text-stone-400">What would you do?</p>
                                                                {(activeScenario.options || []).map((opt, optIdx) => (
                                                                    <button
                                                                        key={optIdx}
                                                                        type="button"
                                                                        onClick={() => handleScenarioResponse(scenarioSafeIndex, opt)}
                                                                        className="block w-full rounded-xl border border-stone-700 bg-stone-900/90 p-3 text-left text-sm text-stone-200 transition hover:border-amber-600/45 hover:bg-stone-800"
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 rounded-xl border border-emerald-900/35 bg-emerald-950/20 p-4">
                                                                <p className="text-sm font-semibold text-emerald-200">Feedback · {scenarioResults[scenarioSafeIndex].score}/100</p>
                                                                <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">{scenarioResults[scenarioSafeIndex].feedback}</p>
                                                                <p className="mt-3 text-xs text-stone-500">
                                                                    <span className="text-stone-400">Your choice: </span>
                                                                    {scenarioResults[scenarioSafeIndex].userResponse}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-12 text-center text-sm text-stone-500 sm:px-6">
                                                        No practice situations yet. Use Regenerate if this stays empty.
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                        ) : null}
                                        {activeTab === 'teach' ? (
                                        <section id="al-teach" role="tabpanel" aria-labelledby="al-tab-teach" className="scroll-mt-28">
                                            <div className="overflow-hidden rounded-2xl border border-stone-800/85 bg-stone-900/45 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]">
                                                <header className="flex flex-wrap items-start gap-3 border-b border-stone-800/80 bg-stone-950/40 px-4 py-4 sm:px-5">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-800/45 bg-amber-950/35 text-amber-200">
                                                        <PresentationChartLineIcon className="h-6 w-6" aria-hidden />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">Explain it simply</h3>
                                                        <p className="mt-1 text-sm text-stone-500">Teaching forces clarity. Build a short summary, a how-I-would-explain outline, questions you would ask yourself, and a tiny action plan.</p>
                                                    </div>
                                                </header>
                                                <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:p-5">
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateSummary}
                                                        className="rounded-xl border border-amber-800/40 bg-amber-950/25 px-4 py-4 text-left transition hover:bg-amber-950/40"
                                                    >
                                                        <span className="block text-sm font-semibold text-amber-100">Short summary</span>
                                                        <span className="mt-1 block text-xs text-amber-200/70">Plain-language version</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateOutline}
                                                        className="rounded-xl border border-sky-800/40 bg-sky-950/25 px-4 py-4 text-left transition hover:bg-sky-950/40"
                                                    >
                                                        <span className="block text-sm font-semibold text-sky-100">Talk track</span>
                                                        <span className="mt-1 block text-xs text-sky-200/70">Bullets you would say aloud</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleGeneratePracticeQuestions}
                                                        className="rounded-xl border border-emerald-800/40 bg-emerald-950/25 px-4 py-4 text-left transition hover:bg-emerald-950/40"
                                                    >
                                                        <span className="block text-sm font-semibold text-emerald-100">Check yourself</span>
                                                        <span className="mt-1 block text-xs text-emerald-200/70">Questions to test recall</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handlePlanImplementation}
                                                        className="rounded-xl border border-violet-800/40 bg-violet-950/25 px-4 py-4 text-left transition hover:bg-violet-950/40"
                                                    >
                                                        <span className="block text-sm font-semibold text-violet-100">Do one thing</span>
                                                        <span className="mt-1 block text-xs text-violet-200/70">Small next step with the ideas</span>
                                                    </button>
                                                </div>
                                                <div className="space-y-4 border-t border-stone-800/70 bg-stone-950/25 p-4 sm:p-5">
                                                    {executiveSummary ? (
                                                        <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4">
                                                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Summary</h4>
                                                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">{executiveSummary}</div>
                                                        </div>
                                                    ) : null}
                                                    {teachingOutline ? (
                                                        <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4">
                                                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Talk track</h4>
                                                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">{teachingOutline}</div>
                                                        </div>
                                                    ) : null}
                                                    {practiceQuestions.length > 0 ? (
                                                        <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4">
                                                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Check yourself</h4>
                                                            <div className="space-y-2">
                                                                {practiceQuestions.map((question, index) => (
                                                                    <div key={index} className="rounded-lg border border-emerald-900/25 bg-emerald-950/10 p-2.5 text-sm text-stone-300">
                                                                        <span className="font-medium text-emerald-300/90">Q{index + 1}. </span>
                                                                        {question}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {implementationPlan ? (
                                                        <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4">
                                                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Next step</h4>
                                                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">{implementationPlan}</div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </section>
                                        ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(shell, document.body) : null;
};

export default ActiveLearning;
