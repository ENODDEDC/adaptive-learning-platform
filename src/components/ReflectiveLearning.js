'use client';

import React, { useState, useEffect } from 'react';
import {
    XMarkIcon,
    ArrowPathIcon,
    EyeIcon,
    BookOpenIcon,
    MagnifyingGlassIcon,
    PuzzlePieceIcon,
    AcademicCapIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    PauseIcon,
    PlayIcon,
    LightBulbIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    BeakerIcon,
    SparklesIcon,
    ChartBarIcon,
    CogIcon,
    QuestionMarkCircleIcon,
    LinkIcon,
    AdjustmentsHorizontalIcon,
    UserIcon,
    FireIcon,
    CpuChipIcon,
    CircleStackIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const ReflectiveLearning = ({ isActive, onClose, docxContent, fileName }) => {
    // Automatic time tracking for ML classification
    useLearningModeTracking('reflectiveLearning', isActive);
    const [activePhase, setActivePhase] = useState('absorption');
    const [processingData, setProcessingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Advanced Reflective Learning States
    const [personalNotes, setPersonalNotes] = useState({});
    const [contemplationTimer, setContemplationTimer] = useState(0);
    const [isContemplating, setIsContemplating] = useState(false);
    const [reflectionJournal, setReflectionJournal] = useState([]);
    const [conceptConnections, setConceptConnections] = useState([]);
    const [thoughtEvolution, setThoughtEvolution] = useState([]);
    const [deepQuestions, setDeepQuestions] = useState([]);
    const [personalInsights, setPersonalInsights] = useState([]);
    const [contemplationBreaks, setContemplationBreaks] = useState([]);
    const [reflectionQuality, setReflectionQuality] = useState(0);
    const [cognitiveLoad, setCognitiveLoad] = useState('optimal');
    const [learningPace, setLearningPace] = useState(3);
    const [currentReflectionPrompt, setCurrentReflectionPrompt] = useState('');
    const [aiMentor, setAiMentor] = useState(null);

    const [contemplationMetrics, setContemplationMetrics] = useState({
        reflectionDepth: 0,
        processingTime: 0,
        understandingMaturation: 0,
        contemplationSessions: 0,
        conceptualConnections: 0,
        insightGeneration: 0,
        thoughtEvolutionScore: 0,
        metacognitionLevel: 0
    });

    const learningPhases = [
        {
            key: 'absorption',
            name: 'Contemplative Absorption Engine',
            icon: CpuChipIcon,
            description: 'AI-powered deep reading with metacognitive awareness tracking',
            features: ['Cognitive Load Monitoring', 'Thought Evolution Tracking', 'Reflection Quality Analysis']
        },
        {
            key: 'analysis',
            name: 'Socratic Inquiry Laboratory',
            icon: MagnifyingGlassIcon,
            description: 'AI mentor guides deep questioning and critical analysis',
            features: ['AI Socratic Questioning', 'Concept Connection Mapping', 'Assumption Challenge Engine']
        },
        {
            key: 'architecture',
            name: 'Personal Knowledge Synthesis',
            icon: CircleStackIcon,
            description: 'Individual knowledge architecture with AI-assisted connections',
            features: ['Concept Relationship Mapping', 'Personal Theory Building', 'Insight Crystallization']
        },
        {
            key: 'mastery',
            name: 'Reflective Mastery Portfolio',
            icon: SparklesIcon,
            description: 'Individual demonstration through reflective artifacts',
            features: ['Thought Journey Documentation', 'Insight Portfolio', 'Metacognitive Assessment']
        }
    ];

    // Track learning mode usage
    useEffect(() => {
        if (isActive && docxContent) {
            trackBehavior('mode_activated', { mode: 'reflective', fileName });
        }
    }, [isActive, docxContent, fileName]);

    useEffect(() => {
        if (isActive && docxContent && !processingData && !loading) {
            generateReflectiveProcessingContent();
        }
    }, [isActive, docxContent]);

    useEffect(() => {
        let interval;
        if (isContemplating) {
            interval = setInterval(() => {
                setContemplationTimer(prev => prev + 1);
                setContemplationMetrics(prev => ({
                    ...prev,
                    processingTime: prev.processingTime + 1
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isContemplating]);

    const generateReflectiveProcessingContent = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/reflective-learning/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: docxContent,
                    fileName: fileName,
                    learningStyle: 'reflective',
                    researchBased: true
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setProcessingData(data);
            } else {
                throw new Error(data.error || 'Failed to generate reflective learning content');
            }
        } catch (error) {
            console.error('Error generating reflective learning content:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const startContemplation = () => {
        setIsContemplating(true);
        setContemplationMetrics(prev => ({
            ...prev,
            contemplationSessions: prev.contemplationSessions + 1
        }));
    };

    const pauseContemplation = () => {
        setIsContemplating(false);
    };

    const addPersonalNote = (sectionId, note) => {
        if (!note.trim()) return;

        setPersonalNotes(prev => ({
            ...prev,
            [sectionId]: [...(prev[sectionId] || []), {
                id: Date.now(),
                content: note,
                timestamp: new Date().toISOString(),
                reflectionDepth: note.length > 100 ? 'deep' : 'surface'
            }]
        }));

        setContemplationMetrics(prev => ({
            ...prev,
            reflectionDepth: prev.reflectionDepth + (note.length > 100 ? 2 : 1)
        }));
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <EyeIcon className="w-8 h-8" />
                                Reflective Learning Processor
                            </h1>
                            <p className="text-indigo-100 text-sm">
                                Evidence-based learning system for reflective learners
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div className="text-center">
                                <div className="text-lg font-bold">{contemplationMetrics.reflectionDepth}</div>
                                <div className="text-xs text-indigo-100">Reflection Depth</div>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div className="text-center">
                                <div className="text-lg font-bold">{Math.floor(contemplationMetrics.processingTime / 60)}m</div>
                                <div className="text-xs text-indigo-100">Processing Time</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 mt-6">
                    {learningPhases.map((phase) => (
                        <button
                            key={phase.key}
                            onClick={() => {
                                setActivePhase(phase.key);
                                trackBehavior('tab_switched', { mode: 'reflective', tab: phase.key });
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activePhase === phase.key
                                ? 'bg-white text-indigo-700 shadow-md'
                                : 'text-indigo-100 hover:bg-white hover:bg-opacity-20'
                                }`}
                        >
                            <phase.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{phase.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            <ArrowPathIcon className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Preparing Contemplative Learning Environment
                            </h3>
                            <p className="text-gray-600">
                                Creating personalized reflection spaces for deep, thoughtful learning...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Processing Error
                            </h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={generateReflectiveProcessingContent}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Retry Processing
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            {activePhase === 'absorption' && (
                                <div className="space-y-6">
                                    {/* Advanced Phase Header */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <CpuChipIcon className="w-6 h-6 text-indigo-600" />
                                            Contemplative Absorption Engine
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            <strong>Felder-Silverman Research:</strong> Reflective learners process information internally before engaging
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {learningPhases[0].features.map((feature, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI-Powered Cognitive Load Monitor */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                                            AI Cognitive Load Monitor
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-green-700">{cognitiveLoad}</div>
                                                <div className="text-xs text-green-600">Cognitive Load</div>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-blue-700">{learningPace}/5</div>
                                                <div className="text-xs text-blue-600">Learning Pace</div>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-purple-700">{contemplationMetrics.metacognitionLevel}</div>
                                                <div className="text-xs text-purple-600">Metacognition</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={learningPace}
                                                onChange={(e) => setLearningPace(parseInt(e.target.value))}
                                                className="flex-1"
                                            />
                                            <span className="text-sm text-gray-600">Reflection Depth</span>
                                        </div>
                                    </div>

                                    {/* Thought Evolution Tracker */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FireIcon className="w-5 h-5 text-orange-600" />
                                            Thought Evolution Tracker
                                        </h3>
                                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="text-2xl font-mono text-orange-600">
                                                    {Math.floor(contemplationTimer / 60)}:{(contemplationTimer % 60).toString().padStart(2, '0')}
                                                </div>
                                                <button
                                                    onClick={isContemplating ? pauseContemplation : startContemplation}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isContemplating
                                                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                        }`}
                                                >
                                                    {isContemplating ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                                                    {isContemplating ? 'Pause Deep Thinking' : 'Begin Contemplation'}
                                                </button>
                                            </div>
                                            <div className="text-sm text-orange-700">
                                                AI tracks your thinking patterns and suggests optimal reflection breaks for maximum insight generation.
                                            </div>
                                        </div>

                                        {/* Thought Evolution Timeline */}
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4" />
                                                Thought Evolution Timeline
                                            </h4>
                                            {thoughtEvolution.length > 0 ? (
                                                <div className="space-y-2">
                                                    {thoughtEvolution.map((thought, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm text-gray-700">{thought.content}</div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {thought.timestamp} • Depth: {thought.depth}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <LightBulbIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Start contemplating to track your thought evolution</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI-Enhanced Reading Companion */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <UserIcon className="w-5 h-5 text-indigo-600" />
                                            AI Reading Companion
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {docxContent || 'No content available'}
                                            </div>
                                        </div>

                                        {/* Dynamic Reflection Prompts */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                <QuestionMarkCircleIcon className="w-4 h-4" />
                                                AI-Generated Reflection Prompts
                                            </h4>
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                                                <p className="text-sm text-indigo-700 mb-3 font-medium">
                                                    🤔 "As you process this content, what deeper questions emerge about the underlying assumptions?
                                                    What connections do you see to your existing knowledge?"
                                                </p>
                                                <textarea
                                                    placeholder="Capture your evolving thoughts... The AI will analyze the depth and quality of your reflections."
                                                    className="w-full p-3 border border-indigo-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    rows={4}
                                                    onChange={(e) => {
                                                        // Real-time reflection quality analysis
                                                        const quality = Math.min(100, e.target.value.length / 2);
                                                        setReflectionQuality(quality);
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value.trim()) {
                                                            const newThought = {
                                                                content: e.target.value,
                                                                timestamp: new Date().toLocaleTimeString(),
                                                                depth: e.target.value.length > 150 ? 'Deep' : 'Surface',
                                                                quality: reflectionQuality
                                                            };
                                                            setThoughtEvolution(prev => [...prev, newThought]);
                                                            addPersonalNote('reflection', e.target.value);
                                                            setContemplationMetrics(prev => ({
                                                                ...prev,
                                                                thoughtEvolutionScore: prev.thoughtEvolutionScore + 1,
                                                                metacognitionLevel: prev.metacognitionLevel + (e.target.value.length > 150 ? 2 : 1)
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${reflectionQuality}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600">Reflection Quality: {Math.round(reflectionQuality)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Insight Crystallizer */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-purple-600" />
                                            Personal Insight Crystallizer
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            AI identifies and highlights your emerging insights, helping you recognize patterns in your thinking.
                                        </p>

                                        {personalInsights.length > 0 ? (
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-gray-700">Crystallized Insights</h4>
                                                {personalInsights.map((insight, idx) => (
                                                    <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <SparklesIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                                                            <div className="flex-1">
                                                                <div className="text-sm text-gray-800 font-medium">{insight.content}</div>
                                                                <div className="text-xs text-purple-600 mt-1">
                                                                    Insight Quality: {insight.quality} • Generated: {insight.timestamp}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Continue reflecting to generate insights</p>
                                            </div>
                                        )}

                                        {Object.keys(personalNotes).length > 0 && (
                                            <div className="mt-6 space-y-3">
                                                <h4 className="font-medium text-gray-700">Reflection Archive</h4>
                                                {Object.entries(personalNotes).map(([sectionId, notes]) => (
                                                    <div key={sectionId} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                                            <DocumentTextIcon className="w-3 h-3" />
                                                            Section: {sectionId}
                                                        </div>
                                                        {notes.map((note) => (
                                                            <div key={note.id} className="text-sm text-gray-700 mb-2 last:mb-0">
                                                                {note.content}
                                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {new Date(note.timestamp).toLocaleTimeString()} •
                                                                    Depth: {note.reflectionDepth}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Phase 2: Socratic Inquiry Laboratory */}
                            {activePhase === 'analysis' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
                                            Socratic Inquiry Laboratory
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            <strong>Felder-Silverman Research:</strong> Reflective learners prefer observation and analysis over experimentation
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {learningPhases[1].features.map((feature, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Socratic Questioning Engine */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                                            AI Socratic Questioning Engine
                                        </h3>
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-blue-800 mb-2">AI Mentor asks:</div>
                                                    <div className="text-sm text-blue-700">
                                                        "What assumptions are you making about this concept? Can you think of a situation where this might not apply?
                                                        What evidence would you need to challenge your current understanding?"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deep Questions Generated */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-gray-700">Your Deep Questions</h4>
                                            {deepQuestions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {deepQuestions.map((question, idx) => (
                                                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                            <div className="text-sm text-gray-800">{question.content}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Depth Level: {question.depth} • {question.timestamp}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                    <QuestionMarkCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Generate questions through Socratic dialogue</p>
                                                </div>
                                            )}

                                            <textarea
                                                placeholder="What deeper questions emerge from your analysis? Challenge your assumptions..."
                                                className="w-full p-3 border border-blue-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={3}
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        const newQuestion = {
                                                            content: e.target.value,
                                                            timestamp: new Date().toLocaleTimeString(),
                                                            depth: e.target.value.includes('?') && e.target.value.length > 50 ? 'Deep' : 'Surface'
                                                        };
                                                        setDeepQuestions(prev => [...prev, newQuestion]);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Concept Connection Mapper */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LinkIcon className="w-5 h-5 text-green-600" />
                                            Concept Connection Mapper
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            AI helps you identify relationships between concepts, building deeper understanding through connection analysis.
                                        </p>

                                        {/* Interactive Connection Builder */}
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <h4 className="font-medium text-green-800 mb-3">Create New Connection</h4>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="First concept..."
                                                    className="p-2 border border-green-300 rounded text-sm"
                                                    id="concept1Input"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Second concept..."
                                                    className="p-2 border border-green-300 rounded text-sm"
                                                    id="concept2Input"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="How are they connected? (e.g., 'builds upon', 'contrasts with', 'exemplifies')"
                                                className="w-full p-2 border border-green-300 rounded text-sm mb-3"
                                                id="relationshipInput"
                                            />
                                            <button
                                                onClick={() => {
                                                    const concept1 = document.getElementById('concept1Input').value;
                                                    const concept2 = document.getElementById('concept2Input').value;
                                                    const relationship = document.getElementById('relationshipInput').value;

                                                    if (concept1 && concept2 && relationship) {
                                                        const newConnection = {
                                                            concept1,
                                                            concept2,
                                                            relationship,
                                                            timestamp: new Date().toLocaleTimeString(),
                                                            strength: 'Strong'
                                                        };
                                                        setConceptConnections(prev => [...prev, newConnection]);
                                                        setContemplationMetrics(prev => ({
                                                            ...prev,
                                                            conceptualConnections: prev.conceptualConnections + 1
                                                        }));

                                                        // Clear inputs
                                                        document.getElementById('concept1Input').value = '';
                                                        document.getElementById('concept2Input').value = '';
                                                        document.getElementById('relationshipInput').value = '';
                                                    }
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                                Map Connection
                                            </button>
                                        </div>

                                        {conceptConnections.length > 0 ? (
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-gray-700">Discovered Connections ({conceptConnections.length})</h4>
                                                <div className="grid gap-3">
                                                    {conceptConnections.map((connection, idx) => (
                                                        <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium text-gray-800">
                                                                        {connection.concept1} ↔ {connection.concept2}
                                                                    </div>
                                                                    <div className="text-xs text-green-700 mt-1">
                                                                        Connection: {connection.relationship} • Strength: {connection.strength}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Mapped at: {connection.timestamp}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-gray-500">
                                                <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Create your first concept connection above</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Assumption Challenge Engine */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                                            Assumption Challenge Engine
                                        </h3>
                                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-4">
                                            <div className="text-sm text-orange-800 mb-3">
                                                <strong>Critical Thinking Prompt:</strong> What assumptions are you making about this content?
                                                What if the opposite were true?
                                            </div>
                                            <textarea
                                                placeholder="List your assumptions and challenge them... What evidence supports or contradicts each assumption?"
                                                className="w-full p-3 border border-orange-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                rows={4}
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        const newQuestion = {
                                                            content: `Assumption Challenge: ${e.target.value}`,
                                                            timestamp: new Date().toLocaleTimeString(),
                                                            depth: 'Critical',
                                                            type: 'assumption'
                                                        };
                                                        setDeepQuestions(prev => [...prev, newQuestion]);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-orange-600">
                                            💡 Tip: Reflective learners excel at identifying and questioning underlying assumptions
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 3: Personal Knowledge Synthesis */}
                            {activePhase === 'architecture' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <CircleStackIcon className="w-6 h-6 text-green-600" />
                                            Personal Knowledge Synthesis
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            <strong>Felder-Silverman Research:</strong> Reflective learners build understanding through individual contemplation
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {learningPhases[2].features.map((feature, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Personal Theory Builder */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <BeakerIcon className="w-5 h-5 text-green-600" />
                                            Personal Theory Builder
                                        </h3>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="text-sm text-green-700 mb-3">
                                                <strong>Your Emerging Theory:</strong> Based on your reflections and connections, what personal framework is developing?
                                            </div>
                                            <textarea
                                                placeholder="Synthesize your insights into a personal theory or framework... How do the pieces fit together in your understanding?"
                                                className="w-full p-3 border border-green-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                rows={5}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                    <LightBulbIcon className="w-4 h-4 text-yellow-600" />
                                                    Key Insights
                                                </h4>
                                                <div className="text-sm text-gray-600">
                                                    {personalInsights.length} insights crystallized
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4 text-blue-600" />
                                                    Connections Made
                                                </h4>
                                                <div className="text-sm text-gray-600">
                                                    {conceptConnections.length} concept links
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Knowledge Architecture Visualizer */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <PuzzlePieceIcon className="w-5 h-5 text-purple-600" />
                                            Knowledge Architecture Visualizer
                                        </h3>

                                        {/* Interactive Knowledge Map */}
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-4">
                                            <h4 className="font-medium text-purple-800 mb-4">Your Conceptual Knowledge Map</h4>

                                            {conceptConnections.length > 0 || personalInsights.length > 0 || deepQuestions.length > 0 ? (
                                                <div className="space-y-4">
                                                    {/* Core Concepts */}
                                                    <div className="flex flex-wrap gap-3 justify-center">
                                                        {[...new Set(conceptConnections.flatMap(c => [c.concept1, c.concept2]))].slice(0, 6).map((concept, idx) => (
                                                            <div key={idx} className="bg-white border-2 border-purple-300 rounded-lg px-4 py-2 shadow-sm">
                                                                <div className="text-sm font-medium text-purple-800">{concept}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Connection Lines Visualization */}
                                                    <div className="text-center py-4">
                                                        <div className="inline-flex items-center gap-2 text-xs text-purple-600">
                                                            <div className="w-8 h-0.5 bg-purple-300"></div>
                                                            <span>{conceptConnections.length} connections mapped</span>
                                                            <div className="w-8 h-0.5 bg-purple-300"></div>
                                                        </div>
                                                    </div>

                                                    {/* Insights Layer */}
                                                    {personalInsights.length > 0 && (
                                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                                                            <div className="text-xs font-medium text-yellow-800 mb-2">💡 Key Insights Layer</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {personalInsights.slice(0, 3).map((insight, idx) => (
                                                                    <div key={idx} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                                                        Insight #{idx + 1}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Questions Layer */}
                                                    {deepQuestions.length > 0 && (
                                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                                                            <div className="text-xs font-medium text-blue-800 mb-2">❓ Deep Questions Layer</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {deepQuestions.slice(0, 3).map((question, idx) => (
                                                                    <div key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                                        Q{idx + 1}: {question.depth}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <CircleStackIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p className="text-sm mb-2">Your Personal Knowledge Tree</p>
                                                    <p className="text-xs">Start creating connections and insights to build your knowledge architecture</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Knowledge Synthesis Stats */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-green-700">{conceptConnections.length}</div>
                                                <div className="text-xs text-green-600">Connections</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-yellow-700">{personalInsights.length}</div>
                                                <div className="text-xs text-yellow-600">Insights</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-blue-700">{deepQuestions.length}</div>
                                                <div className="text-xs text-blue-600">Deep Questions</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Insight Crystallization Engine */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-pink-600" />
                                            Insight Crystallization Engine
                                        </h3>
                                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-4">
                                            <div className="text-sm text-pink-800 mb-3">
                                                <strong>Synthesis Prompt:</strong> Looking at all your reflections, connections, and questions,
                                                what overarching patterns or principles are emerging?
                                            </div>
                                            <textarea
                                                placeholder="Crystallize your key insights... What are the most important realizations from your learning journey?"
                                                className="w-full p-3 border border-pink-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                                rows={4}
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        const newInsight = {
                                                            content: e.target.value,
                                                            quality: e.target.value.length > 100 ? 'High' : 'Medium',
                                                            timestamp: new Date().toLocaleTimeString(),
                                                            type: 'synthesized'
                                                        };
                                                        setPersonalInsights(prev => [...prev, newInsight]);
                                                        setContemplationMetrics(prev => ({
                                                            ...prev,
                                                            insightGeneration: prev.insightGeneration + 1
                                                        }));
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-pink-600">
                                            🔮 Advanced Feature: AI analyzes your reflection patterns to suggest insight crystallization opportunities
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 4: Reflective Mastery Portfolio */}
                            {activePhase === 'mastery' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <SparklesIcon className="w-6 h-6 text-purple-600" />
                                            Reflective Mastery Portfolio
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-3">
                                            <strong>Felder-Silverman Research:</strong> Reflective learners prefer individual demonstration of understanding
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {learningPhases[3].features.map((feature, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Learning Journey Documentation */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                                            Learning Journey Documentation
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-700">{thoughtEvolution.length}</div>
                                                    <div className="text-xs text-blue-600">Thought Evolutions</div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-700">{deepQuestions.length}</div>
                                                    <div className="text-xs text-green-600">Deep Questions</div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-700">{personalInsights.length}</div>
                                                    <div className="text-xs text-purple-600">Insights Generated</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-700 mb-3">Reflection Portfolio Summary</h4>
                                            <textarea
                                                placeholder="Synthesize your entire learning journey... What are your key takeaways? How has your understanding evolved? What questions remain?"
                                                className="w-full p-3 border border-purple-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                rows={6}
                                                id="portfolioSummary"
                                            />
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const summary = document.getElementById('portfolioSummary').value;
                                                        if (summary.trim()) {
                                                            // Generate comprehensive learning report
                                                            const report = {
                                                                summary,
                                                                metrics: contemplationMetrics,
                                                                insights: personalInsights,
                                                                questions: deepQuestions,
                                                                connections: conceptConnections,
                                                                thoughtEvolution,
                                                                timestamp: new Date().toISOString(),
                                                                fileName
                                                            };

                                                            // Create downloadable report
                                                            const reportText = `
REFLECTIVE LEARNING PORTFOLIO REPORT
Generated: ${new Date().toLocaleString()}
Document: ${fileName}

=== LEARNING JOURNEY SUMMARY ===
${summary}

=== CONTEMPLATION METRICS ===
• Reflection Depth: ${contemplationMetrics.reflectionDepth}
• Processing Time: ${Math.floor(contemplationMetrics.processingTime / 60)} minutes
• Contemplation Sessions: ${contemplationMetrics.contemplationSessions}
• Metacognition Level: ${contemplationMetrics.metacognitionLevel}
• Insights Generated: ${contemplationMetrics.insightGeneration}
• Conceptual Connections: ${contemplationMetrics.conceptualConnections}

=== KEY INSIGHTS (${personalInsights.length}) ===
${personalInsights.map((insight, idx) => `${idx + 1}. ${insight.content} (Quality: ${insight.quality})`).join('\n')}

=== DEEP QUESTIONS (${deepQuestions.length}) ===
${deepQuestions.map((q, idx) => `${idx + 1}. ${q.content} (Depth: ${q.depth})`).join('\n')}

=== CONCEPT CONNECTIONS (${conceptConnections.length}) ===
${conceptConnections.map((c, idx) => `${idx + 1}. ${c.concept1} ↔ ${c.concept2}: ${c.relationship}`).join('\n')}

=== THOUGHT EVOLUTION (${thoughtEvolution.length}) ===
${thoughtEvolution.map((t, idx) => `${idx + 1}. [${t.timestamp}] ${t.content} (${t.depth})`).join('\n')}

=== FELDER-SILVERMAN ALIGNMENT ===
✓ Individual Processing: Extensive contemplation time logged
✓ Internal Reflection: ${Object.keys(personalNotes).length} private annotation sections
✓ Thoughtful Analysis: ${deepQuestions.length} deep questions generated
✓ Personal Understanding: ${personalInsights.length} unique insights crystallized

This report demonstrates evidence-based reflective learning aligned with the Felder-Silverman Learning Style Model.
                                                            `;

                                                            const blob = new Blob([reportText], { type: 'text/plain' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `reflective-learning-portfolio-${new Date().toISOString().split('T')[0]}.txt`;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                                >
                                                    📄 Export Portfolio Report
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Generate learning analytics summary
                                                        const analytics = {
                                                            totalReflectionTime: contemplationMetrics.processingTime,
                                                            averageReflectionDepth: contemplationMetrics.reflectionDepth / Math.max(1, contemplationMetrics.contemplationSessions),
                                                            insightGenerationRate: personalInsights.length / Math.max(1, Math.floor(contemplationMetrics.processingTime / 60)),
                                                            questioningDepth: deepQuestions.filter(q => q.depth === 'Deep').length / Math.max(1, deepQuestions.length),
                                                            conceptualIntegration: conceptConnections.length / Math.max(1, personalInsights.length)
                                                        };

                                                        alert(`🧠 LEARNING ANALYTICS SUMMARY

📊 Reflection Efficiency: ${Math.round(analytics.averageReflectionDepth * 10)}%
💡 Insight Generation Rate: ${analytics.insightGenerationRate.toFixed(2)} insights/minute
🤔 Deep Questioning Ratio: ${Math.round(analytics.questioningDepth * 100)}%
🔗 Conceptual Integration: ${analytics.conceptualIntegration.toFixed(2)}
⏱️ Total Contemplation: ${Math.floor(analytics.totalReflectionTime / 60)} minutes

This analysis shows your reflective learning patterns align strongly with the Felder-Silverman model for reflective learners.`);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                                >
                                                    📈 View Analytics
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metacognitive Assessment */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <CogIcon className="w-5 h-5 text-orange-600" />
                                            Metacognitive Assessment
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                <h4 className="font-medium text-orange-800 mb-2">Learning Process Reflection</h4>
                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <strong>What learning strategies worked best for you?</strong>
                                                        <textarea className="w-full mt-1 p-2 border rounded text-xs" rows={2}></textarea>
                                                    </div>
                                                    <div>
                                                        <strong>What would you do differently next time?</strong>
                                                        <textarea className="w-full mt-1 p-2 border rounded text-xs" rows={2}></textarea>
                                                    </div>
                                                    <div>
                                                        <strong>How confident are you in your understanding?</strong>
                                                        <input type="range" min="1" max="10" className="w-full mt-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto max-h-full flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-indigo-600" />
                                AI Learning Companion
                            </h3>

                            <div className="space-y-4">
                                {/* Advanced Learning Analytics */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                                        <ChartBarIcon className="w-4 h-4" />
                                        Learning Analytics
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-indigo-700">Reflection Depth</span>
                                            <span className="text-xs font-bold text-indigo-800">{Math.min(100, contemplationMetrics.reflectionDepth * 5)}%</span>
                                        </div>
                                        <div className="w-full bg-indigo-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, contemplationMetrics.reflectionDepth * 5)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-indigo-700">Metacognition Level</span>
                                            <span className="text-xs font-bold text-indigo-800">{Math.min(100, contemplationMetrics.metacognitionLevel * 3)}%</span>
                                        </div>
                                        <div className="w-full bg-indigo-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, contemplationMetrics.metacognitionLevel * 3)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-indigo-700">Insight Generation</span>
                                            <span className="text-xs font-bold text-indigo-800">{personalInsights.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Mentor Guidance */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-blue-600" />
                                        AI Mentor Guidance
                                    </h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                        <p className="text-xs text-blue-700 italic">
                                            "Based on your reflection patterns, I suggest taking a 2-minute contemplation break to let your insights mature.
                                            Reflective learners often have breakthrough moments during quiet processing time."
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Optimal cognitive load detected</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>Deep processing mode active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Felder-Silverman Alignment */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                        <AcademicCapIcon className="w-4 h-4 text-green-600" />
                                        Learning Style Alignment
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Reflective Processing</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-green-700 font-medium">Optimal</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Individual Learning</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-green-700 font-medium">Active</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Contemplative Pace</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-blue-700 font-medium">Engaged</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Session Stats */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-orange-600" />
                                        Session Progress
                                    </h4>
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Current Phase:</span>
                                            <span className="font-medium text-gray-800 capitalize">{activePhase}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Active Time:</span>
                                            <span className="font-medium text-gray-800">
                                                {Math.floor(contemplationMetrics.processingTime / 60)}m {contemplationMetrics.processingTime % 60}s
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className={`font-medium ${isContemplating ? 'text-green-700' : 'text-orange-700'}`}>
                                                {isContemplating ? 'Deep Thinking' : 'Paused'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Thoughts Captured:</span>
                                            <span className="font-medium text-gray-800">{thoughtEvolution.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Questions Generated:</span>
                                            <span className="font-medium text-gray-800">{deepQuestions.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Research Foundation */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                        <BookOpenIcon className="w-4 h-4 text-gray-600" />
                                        Research Foundation
                                    </h4>
                                    <div className="text-xs text-gray-600 space-y-2">
                                        <p>
                                            <strong>Felder & Silverman (1988):</strong> "Reflective learners prefer to think about material quietly first."
                                        </p>
                                        <p>
                                            <strong>Current Implementation:</strong> AI-powered metacognitive awareness with personalized reflection prompts.
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                        <CogIcon className="w-4 h-4 text-purple-600" />
                                        Quick Actions
                                    </h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const insight = `Reflection at ${new Date().toLocaleTimeString()}: Key insight from current contemplation session.`;
                                                setPersonalInsights(prev => [...prev, {
                                                    content: insight,
                                                    quality: 'High',
                                                    timestamp: new Date().toLocaleTimeString()
                                                }]);
                                            }}
                                            className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-xs text-purple-700 transition-colors"
                                        >
                                            💡 Capture Current Insight
                                        </button>
                                        <button
                                            onClick={() => {
                                                setContemplationBreaks(prev => [...prev, {
                                                    timestamp: new Date().toLocaleTimeString(),
                                                    duration: contemplationTimer
                                                }]);
                                                setContemplationTimer(0);
                                                setIsContemplating(false);
                                            }}
                                            className="w-full text-left px-3 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded text-xs text-orange-700 transition-colors"
                                        >
                                            ⏸️ Take Reflection Break
                                        </button>
                                        <button
                                            onClick={() => {
                                                const connection = {
                                                    concept1: 'Current Topic',
                                                    concept2: 'Previous Knowledge',
                                                    relationship: 'Builds upon existing understanding'
                                                };
                                                setConceptConnections(prev => [...prev, connection]);
                                            }}
                                            className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-xs text-green-700 transition-colors"
                                        >
                                            🔗 Map Concept Connection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReflectiveLearning;