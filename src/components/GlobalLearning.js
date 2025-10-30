'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  GlobeAltIcon,
  EyeIcon,
  ShareIcon,
  LightBulbIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const GlobalLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('bigpicture');
  const [bigPicture, setBigPicture] = useState(null);
  const [interconnections, setInterconnections] = useState(null);

  // Automatic time tracking for ML classification
  useLearningModeTracking('globalLearning', isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    {
      key: 'bigpicture',
      name: 'Big Picture',
      icon: EyeIcon,
      description: 'Overall context and significance'
    },
    {
      key: 'interconnections',
      name: 'Interconnections',
      icon: ShareIcon,
      description: 'How everything connects together'
    }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateGlobalContent();
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'global', fileName });
    }
  }, [isActive, docxContent]);

  const generateGlobalContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for global analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/global-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setBigPicture(result.bigPicture || null);
        setInterconnections(result.interconnections || null);
      } else {
        throw new Error(result.error || 'Failed to generate global learning content');
      }
    } catch (error) {
      console.error('Error generating global content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBigPicture = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Analyzing the big picture...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Analysis Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!bigPicture) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Big Picture Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to analyze the overall context</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Big Picture
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Big Picture Explanation */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <EyeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Big Picture for Global Learners</h3>
              <p className="text-purple-800 text-sm leading-relaxed mb-3">
                Global learners need to see the <strong>forest before the trees</strong>. This view shows the overall context, 
                significance, and how everything fits into the bigger picture before diving into details.
              </p>
              <div className="text-xs text-purple-700 mb-3">
                <p><strong>Purpose:</strong> "Why does this matter? How does it all fit together? What's the bigger context?"</p>
              </div>
              {/* Enhanced Learning Tips */}
              <div className="bg-purple-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-purple-800 mb-2">🌍 Global Learning Tips:</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Start with the overall purpose and significance</li>
                  <li>• Understand how this fits into broader contexts</li>
                  <li>• See the systemic view before focusing on parts</li>
                  <li>• Connect to real-world applications and implications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Purpose Section */}
        {bigPicture.overallPurpose && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bigPicture.overallPurpose.title}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-lg leading-relaxed">{bigPicture.overallPurpose.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">🌟 Real-World Significance</h4>
                  <p className="text-sm text-purple-800">{bigPicture.overallPurpose.realWorldSignificance}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">❓ Key Question</h4>
                  <p className="text-sm text-blue-800">{bigPicture.overallPurpose.keyQuestion}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Big Picture Context Section */}
        {bigPicture.bigPictureContext && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bigPicture.bigPictureContext.title}</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{bigPicture.bigPictureContext.description}</p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🏛️ Broader Field</h4>
                  <p className="text-sm text-green-800">{bigPicture.bigPictureContext.broaderField}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">📚 Historical Context</h4>
                  <p className="text-sm text-amber-800">{bigPicture.bigPictureContext.historicalContext}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">🚀 Future Implications</h4>
                  <p className="text-sm text-indigo-800">{bigPicture.bigPictureContext.futureImplications}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Systemic View Section */}
        {bigPicture.systemicView && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
                <PuzzlePieceIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bigPicture.systemicView.title}</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{bigPicture.systemicView.description}</p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">🧩 Main Components</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {bigPicture.systemicView.mainComponents?.map((component, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{component}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔗 Relationships</h4>
                  <p className="text-sm text-blue-800">{bigPicture.systemicView.relationships}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">✨ Emergent Properties</h4>
                  <p className="text-sm text-purple-800">{bigPicture.systemicView.emergentProperties}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Practical Relevance Section */}
        {bigPicture.practicalRelevance && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bigPicture.practicalRelevance.title}</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{bigPicture.practicalRelevance.description}</p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">🏭 Industries</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {bigPicture.practicalRelevance.industries?.map((industry, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        {industry}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🏠 Daily Life</h4>
                  <p className="text-sm text-green-800">{bigPicture.practicalRelevance.dailyLife}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🌍 Global Impact</h4>
                  <p className="text-sm text-blue-800">{bigPicture.practicalRelevance.globalImpact}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Strategy Section */}
        {bigPicture.learningStrategy && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bigPicture.learningStrategy.title}</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{bigPicture.learningStrategy.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Starting Point</h4>
                  <p className="text-sm text-purple-800">{bigPicture.learningStrategy.startingPoint}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">🧠 Mental Model</h4>
                  <p className="text-sm text-purple-800">{bigPicture.learningStrategy.mentalModel}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">💡 Key Insights</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {bigPicture.learningStrategy.keyInsights?.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInterconnections = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Mapping interconnections...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Mapping Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!interconnections) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Interconnections Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to map how everything connects</p>
          </div>
          <button
            onClick={generateGlobalContent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Interconnections
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Interconnections Explanation */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShareIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Interconnections for Global Learners</h3>
              <p className="text-green-800 text-sm leading-relaxed mb-3">
                Global learners need to see <strong>how everything connects</strong>. This view reveals the web of relationships, 
                patterns, and systemic dynamics that make the content a unified whole.
              </p>
              <div className="text-xs text-green-700 mb-3">
                <p><strong>Purpose:</strong> "How do these concepts relate? What patterns emerge? What are the system dynamics?"</p>
              </div>
              {/* Enhanced Learning Strategy */}
              <div className="bg-green-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-green-800 mb-2">🕸️ Systems Thinking Tips:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Look for patterns and recurring themes</li>
                  <li>• Identify feedback loops and cause-effect chains</li>
                  <li>• See how concepts influence each other</li>
                  <li>• Understand emergent properties of the whole system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Concept Network Section */}
        {interconnections.conceptNetwork && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <ShareIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Concept Network</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-2">🎯 Central Theme</h4>
                <p className="text-green-800">{interconnections.conceptNetwork.centralTheme}</p>
              </div>

              {/* Core Nodes */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">🔗 Core Concept Nodes</h4>
                <div className="grid gap-4">
                  {interconnections.conceptNetwork.coreNodes?.map((node, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2">{node.name}</h5>
                          <p className="text-sm text-gray-700 mb-2">{node.description}</p>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded p-3">
                              <h6 className="text-xs font-semibold text-blue-900 mb-1">🔗 Connections</h6>
                              <ul className="text-xs text-blue-800 space-y-1">
                                {node.connections?.map((connection, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                    <span>{connection}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-purple-50 rounded p-3">
                              <h6 className="text-xs font-semibold text-purple-900 mb-1">⭐ Importance</h6>
                              <p className="text-xs text-purple-800">{node.importance}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergent Patterns */}
              {interconnections.conceptNetwork.emergentPatterns && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">🌟 Emergent Patterns</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {interconnections.conceptNetwork.emergentPatterns.map((pattern, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-purple-900">{pattern}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Dynamics Section */}
        {interconnections.systemDynamics && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">System Dynamics</h3>
            </div>
            
            <div className="space-y-6">
              {/* Feedback Loops */}
              {interconnections.systemDynamics.feedbackLoops && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">🔄 Feedback Loops</h4>
                  <div className="space-y-3">
                    {interconnections.systemDynamics.feedbackLoops.map((loop, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            loop.type === 'reinforcing' ? 'bg-green-600' : 'bg-orange-600'
                          }`}>
                            {loop.type === 'reinforcing' ? '+' : '='}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-blue-900 mb-1">{loop.name}</h5>
                            <p className="text-sm text-blue-800 mb-2">{loop.description}</p>
                            <div className="bg-white rounded p-2 border border-blue-200">
                              <span className="text-xs font-semibold text-blue-900">Impact: </span>
                              <span className="text-xs text-blue-800">{loop.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cause-Effect Chains */}
              {interconnections.systemDynamics.causeEffectChains && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">⚡ Cause-Effect Chains</h4>
                  <div className="space-y-3">
                    {interconnections.systemDynamics.causeEffectChains.map((chain, index) => (
                      <div key={index} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h5 className="font-semibold text-amber-900 mb-2">{chain.trigger}</h5>
                        <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                          {chain.chain?.map((effect, i) => (
                            <React.Fragment key={i}>
                              <div className="bg-white rounded-lg px-3 py-2 border border-amber-200 whitespace-nowrap">
                                <span className="text-sm text-amber-800">{effect}</span>
                              </div>
                              {i < chain.chain.length - 1 && (
                                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="bg-white rounded p-2 border border-amber-200">
                          <span className="text-xs font-semibold text-amber-900">Significance: </span>
                          <span className="text-xs text-amber-800">{chain.significance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cross-Domain Connections Section */}
        {interconnections.crossDomainConnections && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cross-Domain Connections</h3>
            </div>
            
            <div className="space-y-4">
              {/* Related Fields */}
              {interconnections.crossDomainConnections.relatedFields && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3">🔗 Related Fields</h4>
                  <div className="flex flex-wrap gap-2">
                    {interconnections.crossDomainConnections.relatedFields.map((field, index) => (
                      <span key={index} className="bg-white px-3 py-1 rounded-full text-sm text-indigo-800 border border-indigo-200">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analogies */}
              {interconnections.crossDomainConnections.analogies && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">🔍 Helpful Analogies</h4>
                  <div className="space-y-3">
                    {interconnections.crossDomainConnections.analogies.map((analogy, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-2">{analogy.comparison}</h5>
                        <p className="text-sm text-purple-800 mb-2">{analogy.explanation}</p>
                        <div className="bg-white rounded p-2 border border-purple-200">
                          <span className="text-xs font-semibold text-purple-900">Limitations: </span>
                          <span className="text-xs text-purple-800">{analogy.limitations}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applications */}
              {interconnections.crossDomainConnections.applications && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">🎯 Applications</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {interconnections.crossDomainConnections.applications.map((application, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                        <span className="text-sm text-green-800">{application}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Holistic Insights Section */}
        {interconnections.holisticInsights && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Holistic Insights</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Key Realizations */}
              {interconnections.holisticInsights.keyRealizations && (
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-3">💡 Key Realizations</h4>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.keyRealizations.map((realization, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-yellow-800">{realization}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Paradoxes */}
              {interconnections.holisticInsights.paradoxes && (
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">🤔 Paradoxes</h4>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.paradoxes.map((paradox, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-orange-800">{paradox}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unifying Principles */}
              {interconnections.holisticInsights.unifyingPrinciples && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">🎯 Unifying Principles</h4>
                  <ul className="space-y-2">
                    {interconnections.holisticInsights.unifyingPrinciples.map((principle, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-green-800">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Systemic Implications */}
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">🌐 Systemic Implications</h4>
                <p className="text-sm text-purple-800">{interconnections.holisticInsights.systemicImplications}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  console.log('🌍 GlobalLearning render - isActive:', isActive, 'docxContent length:', docxContent?.length);
  
  if (!isActive) {
    console.log('❌ GlobalLearning NOT rendering (isActive is false)');
    return null;
  }

  console.log('✅ GlobalLearning IS rendering!');

  return (
    <div className="fixed inset-0 bg-white z-[10001] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            title="Back to document"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <GlobeAltIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Global Learning</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateGlobalContent}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
            title="Regenerate global analysis"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Generate</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Selector with Explanations */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Purpose Explanation */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Global learners need to see the <strong>big picture first</strong> and understand <strong>how everything connects</strong>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === activeTab;

              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'bigpicture' ? 'Shows overall context and significance' : 'Shows how concepts connect and influence each other'}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === 'bigpicture' && renderBigPicture()}
          {activeTab === 'interconnections' && renderInterconnections()}
        </div>
      </div>
    </div>
  );
};

export default GlobalLearning;