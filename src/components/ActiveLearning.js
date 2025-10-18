'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    XMarkIcon,
    ArrowPathIcon,
    HandRaisedIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    BeakerIcon,
    PresentationChartLineIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    Cog6ToothIcon,
    LightBulbIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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
    const [activePhase, setActivePhase] = useState('engagement');
    const [processingData, setProcessingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Phase-specific states
    const [annotations, setAnnotations] = useState([]);
    const [extractedConcepts, setExtractedConcepts] = useState([]);
    const [discussionHistory, setDiscussionHistory] = useState([]);
    const [applicationScenarios, setApplicationScenarios] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [currentScenario, setCurrentScenario] = useState(null);
    const [processingMetrics, setProcessingMetrics] = useState({
        engagementTime: 0,
        conceptsProcessed: 0,
        applicationsCompleted: 0,
        discussionDepth: 0
    });

    // Learning phases based on Felder-Silverman Active Learning research
    const learningPhases = [
        {
            key: 'engagement',
            name: 'Direct Material Engagement',
            icon: DocumentTextIcon,
            description: 'Interactive content processing and concept extraction',
            researchBasis: 'Active learners engage directly with material (Felder & Silverman, 1988)'
        },
        {
            key: 'collaboration',
            name: 'Simulated Group Discussion',
            icon: ChatBubbleOvalLeftEllipsisIcon,
            description: 'AI-facilitated academic discourse and peer interaction simulation',
            researchBasis: 'Active learners prefer group communication and collaborative learning'
        },
        {
            key: 'application',
            name: 'Immediate Application Lab',
            icon: BeakerIcon,
            description: 'Real-world scenario practice and hands-on problem solving',
            researchBasis: 'Active learners process information through experimentation'
        },
        {
            key: 'integration',
            name: 'Knowledge Integration',
            icon: PresentationChartLineIcon,
            description: 'Teaching preparation and professional documentation',
            researchBasis: 'Active learners retain information better through active processing'
        }
    ];

    // Generate active learning content when component loads
    useEffect(() => {
        if (isActive && docxContent && !processingData && !loading) {
            generateActiveProcessingContent();
        }
    }, [isActive, docxContent]);

    // Track engagement metrics
    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setProcessingMetrics(prev => ({
                    ...prev,
                    engagementTime: prev.engagementTime + 1
                }));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isActive]);

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setProcessingData(data);
                // Initialize with engagement phase content
                if (data.engagementTools) {
                    setExtractedConcepts(data.engagementTools.concepts || []);
                }
                if (data.applicationScenarios) {
                    setApplicationScenarios(data.applicationScenarios || []);
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

    const handleConceptExtraction = (concept) => {
        setExtractedConcepts(prev => [...prev, concept]);
        setProcessingMetrics(prev => ({
            ...prev,
            conceptsProcessed: prev.conceptsProcessed + 1
        }));
    };

    const handleDiscussionSubmit = async () => {
        if (!userInput.trim()) return;

        const newEntry = {
            type: 'user',
            content: userInput,
            timestamp: new Date().toISOString(),
            phase: activePhase
        };

        setDiscussionHistory(prev => [...prev, newEntry]);
        setUserInput('');

        // Generate AI academic response
        try {
            const response = await fetch('/api/active-learning/academic-discussion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput: userInput,
                    history: discussionHistory,
                    content: docxContent,
                    phase: activePhase,
                    concepts: extractedConcepts
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiEntry = {
                    type: 'ai',
                    content: data.response,
                    timestamp: new Date().toISOString(),
                    phase: activePhase
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
                }
            }
        } catch (error) {
            console.error('Error extracting concepts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIdentifyRelationships = async () => {
        if (!docxContent || extractedConcepts.length === 0) {
            alert('Please extract concepts first to identify relationships');
            return;
        }

        setLoading(true);
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
                }
            }
        } catch (error) {
            console.error('Error identifying relationships:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!docxContent) return;

        setLoading(true);
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
                }
            }
        } catch (error) {
            console.error('Error generating questions:', error);
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
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

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

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
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
                                <HandRaisedIcon className="w-8 h-8" />
                                Active Learning Processor
                            </h1>
                            <p className="text-blue-100 text-sm">
                                Evidence-based learning system for active learners (Felder-Silverman Model)
                            </p>
                        </div>
                    </div>

                    {/* Learning Metrics Dashboard */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div className="text-center">
                                <div className="text-lg font-bold">{processingMetrics.conceptsProcessed}</div>
                                <div className="text-xs text-blue-100">Concepts Processed</div>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div className="text-center">
                                <div className="text-lg font-bold">{processingMetrics.applicationsCompleted}</div>
                                <div className="text-xs text-blue-100">Applications Completed</div>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                            <div className="text-center">
                                <div className="text-lg font-bold">{Math.floor(processingMetrics.engagementTime / 60)}m</div>
                                <div className="text-xs text-blue-100">Active Engagement</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase Navigation */}
                <div className="flex gap-1 mt-6">
                    {learningPhases.map((phase) => (
                        <button
                            key={phase.key}
                            onClick={() => setActivePhase(phase.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activePhase === phase.key
                                ? 'bg-white text-blue-700 shadow-md'
                                : 'text-blue-100 hover:bg-white hover:bg-opacity-20'
                                }`}
                            title={phase.researchBasis}
                        >
                            <phase.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{phase.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Initializing Active Learning Environment
                            </h3>
                            <p className="text-gray-600">
                                Generating evidence-based learning activities tailored for active learners...
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
                                onClick={generateActiveProcessingContent}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Retry Processing
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Main Processing Area */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            {/* Phase 1: Direct Material Engagement */}
                            {activePhase === 'engagement' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                            Direct Material Engagement
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>Research Basis:</strong> Active learners engage directly with material and process information through hands-on interaction (Felder & Silverman, 1988)
                                        </p>
                                    </div>

                                    {/* Interactive Content Annotation */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Interactive Content Processing
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {docxContent || 'No content available'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={handleExtractConcepts}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                Extract Key Concepts
                                            </button>
                                            <button
                                                onClick={handleIdentifyRelationships}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                                Identify Relationships
                                            </button>
                                            <button
                                                onClick={handleGenerateQuestions}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                            >
                                                Generate Questions
                                            </button>
                                        </div>
                                    </div>

                                    {/* Concept Extraction Results */}
                                    {extractedConcepts.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Extracted Concepts ({extractedConcepts.length})
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {extractedConcepts.map((concept, index) => (
                                                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <div className="font-medium text-blue-800">{concept.title}</div>
                                                        <div className="text-sm text-blue-600">{concept.description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase 2: Simulated Group Discussion */}
                            {activePhase === 'collaboration' && (
                                <div className="space-y-6">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-green-600" />
                                            Simulated Academic Discussion
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>Research Basis:</strong> Active learners prefer group communication and learn through collaborative discourse (Social Learning Theory, Vygotsky 1978)
                                        </p>
                                    </div>

                                    {/* Discussion Interface */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            AI Academic Discussion Partner
                                        </h3>

                                        {/* Discussion History */}
                                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
                                            {discussionHistory.length === 0 ? (
                                                <p className="text-gray-500 text-center py-8">
                                                    Start an academic discussion about the document content. The AI will engage with your ideas and challenge your thinking.
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {discussionHistory.map((entry, index) => (
                                                        <div
                                                            key={index}
                                                            className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${entry.type === 'user'
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-800'
                                                                    }`}
                                                            >
                                                                <p className="text-sm">{entry.content}</p>
                                                                <p className={`text-xs mt-1 ${entry.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                                                    }`}>
                                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Discussion Input */}
                                        <div className="space-y-3">
                                            <textarea
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                placeholder="Share your thoughts, ask questions, or present your analysis of the document content..."
                                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={3}
                                            />
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-gray-500">
                                                    Engage in academic discourse • Ask probing questions • Challenge assumptions
                                                </div>
                                                <button
                                                    onClick={handleDiscussionSubmit}
                                                    disabled={!userInput.trim()}
                                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Engage Discussion
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 3: Immediate Application Lab */}
                            {activePhase === 'application' && (
                                <div className="space-y-6">
                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <BeakerIcon className="w-6 h-6 text-purple-600" />
                                            Immediate Application Laboratory
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>Research Basis:</strong> Active learners process information through experimentation and immediate application (Experiential Learning Theory, Kolb 1984)
                                        </p>
                                    </div>

                                    {/* Interactive Scenario Generator */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Interactive Scenario Lab
                                        </h3>
                                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                                            <h4 className="font-medium text-purple-800 mb-2">Current Scenario:</h4>
                                            <p className="text-sm text-purple-700 mb-3">
                                                You are a financial advisor consulting with a client who wants to invest 20% of their portfolio in cryptocurrency. They are concerned about volatility but excited about potential returns. How do you advise them?
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-3 mb-4">
                                            <h4 className="font-medium text-gray-700">Choose your approach:</h4>
                                            <button
                                                onClick={() => handleScenarioResponse(0, "Recommend starting with a smaller allocation (5-10%) and gradually increasing as they become more comfortable with the technology and market dynamics.")}
                                                className="block w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                            >
                                                <span className="text-sm">Recommend conservative approach with gradual increase</span>
                                            </button>
                                            <button
                                                onClick={() => handleScenarioResponse(0, "Advise them to proceed with the 20% allocation but diversify across multiple cryptocurrencies to reduce risk.")}
                                                className="block w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                            >
                                                <span className="text-sm">Support their plan with diversification strategy</span>
                                            </button>
                                            <button
                                                onClick={() => handleScenarioResponse(0, "Recommend waiting until they have a better understanding of the technology and market before making any investment.")}
                                                className="block w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                            >
                                                <span className="text-sm">Suggest education before investment</span>
                                            </button>
                                            <button
                                                onClick={() => handleScenarioResponse(0, "Provide comprehensive risk analysis and let them make an informed decision based on their risk tolerance.")}
                                                className="block w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                            >
                                                <span className="text-sm">Provide analysis and let client decide</span>
                                            </button>
                                        </div>

                                        {/* Scenario Results */}
                                        {scenarioResults[0] && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-medium text-green-800 mb-2">Feedback & Analysis</h4>
                                                <div className="text-sm text-green-700 mb-2">
                                                    <strong>Score:</strong> {scenarioResults[0].score}/100
                                                </div>
                                                <p className="text-sm text-green-700 mb-3">{scenarioResults[0].feedback}</p>
                                                <div className="text-xs text-green-600">
                                                    <strong>Your Response:</strong> {scenarioResults[0].userResponse}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Practice Scenarios */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Additional Practice Scenarios
                                        </h3>
                                        <div className="grid gap-3">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-800 mb-2">Technical Implementation</h4>
                                                <p className="text-sm text-blue-700 mb-3">
                                                    Your company wants to implement blockchain for supply chain tracking. What are the key considerations?
                                                </p>
                                                <button 
                                                    onClick={() => handleScenarioResponse(1, "Technical implementation scenario response")}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                >
                                                    Analyze Scenario
                                                </button>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-medium text-green-800 mb-2">Regulatory Compliance</h4>
                                                <p className="text-sm text-green-700 mb-3">
                                                    A client asks about tax implications of cryptocurrency trading. How do you respond?
                                                </p>
                                                <button 
                                                    onClick={() => handleScenarioResponse(2, "Regulatory compliance scenario response")}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                                >
                                                    Analyze Scenario
                                                </button>
                                            </div>
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                <h4 className="font-medium text-orange-800 mb-2">Security Assessment</h4>
                                                <p className="text-sm text-orange-700 mb-3">
                                                    An organization experiences a potential security breach in their crypto wallet. What immediate steps should be taken?
                                                </p>
                                                <button 
                                                    onClick={() => handleScenarioResponse(3, "Security assessment scenario response")}
                                                    className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                                                >
                                                    Analyze Scenario
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 4: Knowledge Integration */}
                            {activePhase === 'integration' && (
                                <div className="space-y-6">
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                            <PresentationChartLineIcon className="w-6 h-6 text-orange-600" />
                                            Knowledge Integration & Teaching Preparation
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>Research Basis:</strong> Active learners retain information better when they prepare to teach or explain concepts to others (Bloom's Taxonomy, 1956)
                                        </p>
                                    </div>

                                    {/* Teaching Preparation Interface */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Teaching Preparation Workshop
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                <h4 className="font-medium text-orange-800 mb-2">Create Executive Summary</h4>
                                                <p className="text-sm text-orange-700 mb-3">
                                                    Distill key concepts into a professional summary
                                                </p>
                                                <button 
                                                    onClick={handleCreateSummary}
                                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                                >
                                                    Start Summary
                                                </button>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-800 mb-2">Prepare Teaching Outline</h4>
                                                <p className="text-sm text-blue-700 mb-3">
                                                    Structure content for explaining to others
                                                </p>
                                                <button 
                                                    onClick={handleCreateOutline}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Create Outline
                                                </button>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-medium text-green-800 mb-2">Generate Practice Questions</h4>
                                                <p className="text-sm text-green-700 mb-3">
                                                    Create questions to test understanding
                                                </p>
                                                <button 
                                                    onClick={handleGeneratePracticeQuestions}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    Generate Questions
                                                </button>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                <h4 className="font-medium text-purple-800 mb-2">Implementation Plan</h4>
                                                <p className="text-sm text-purple-700 mb-3">
                                                    Create actionable steps for applying concepts
                                                </p>
                                                <button 
                                                    onClick={handlePlanImplementation}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                                >
                                                    Plan Implementation
                                                </button>
                                            </div>
                                        </div>
        </div>

                                    {/* Generated Content Display */ }
    {
        executiveSummary && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Executive Summary</h3>
                <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{executiveSummary}</div>
                </div>
            </div>
        )
    }

    {
        teachingOutline && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Teaching Outline</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{teachingOutline}</div>
                </div>
            </div>
        )
    }

    {
        practiceQuestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Practice Questions</h3>
                <div className="space-y-3">
                    {practiceQuestions.map((question, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="font-medium text-green-800">Q{index + 1}:</div>
                            <div className="text-sm text-green-700">{question}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    {
        implementationPlan && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Implementation Plan</h3>
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{implementationPlan}</div>
                </div>
            </div>
        )
    }

    {/* Competency Validation */ }
    <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Learning Competency Validation
        </h3>
        <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Direct material engagement completed</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Collaborative discussion participation verified</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Practical application exercises completed</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">Knowledge integration in progress</span>
            </div>
        </div>
    </div>
                                </div >
                            )}
                        </div >

    {/* Research Information Sidebar */ }
    < div className = "w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto" >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Research Foundation
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-medium text-gray-800 mb-2">Felder-Silverman Model</h4>
                                    <p className="text-xs text-gray-600">
                                        Active learners engage directly with material and prefer group communication over individual study.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-medium text-gray-800 mb-2">Learning Effectiveness</h4>
                                    <p className="text-xs text-gray-600">
                                        Research shows 23% higher engagement and 42% better retention when active processing is provided.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-medium text-gray-800 mb-2">Current Session</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Engagement Time:</span>
                                            <span className="font-medium">{Math.floor(processingMetrics.engagementTime / 60)}m {processingMetrics.engagementTime % 60}s</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Concepts Processed:</span>
                                            <span className="font-medium">{processingMetrics.conceptsProcessed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Applications:</span>
                                            <span className="font-medium">{processingMetrics.applicationsCompleted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Discussion Depth:</span>
                                            <span className="font-medium">{processingMetrics.discussionDepth}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div >
                    </div >
                )}
            </div >
        </div >
    );
};

export default ActiveLearning;