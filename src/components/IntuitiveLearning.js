'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  SparklesIcon,
  EyeIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  ArrowsPointingOutIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const IntuitiveLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('universe');
  const [conceptUniverse, setConceptUniverse] = useState(null);
  const [insightPatterns, setInsightPatterns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [universeView, setUniverseView] = useState('constellation');
  const [insightView, setInsightView] = useState('moments');

  // Automatic time tracking for ML classification
  useLearningModeTracking('intuitiveLearning', isActive);

  const tabs = [
    {
      key: 'universe',
      name: 'Concept Universe',
      icon: SparklesIcon,
      description: 'Interactive constellation of interconnected concepts'
    },
    {
      key: 'insights',
      name: 'Pattern Discovery',
      icon: LightBulbIcon,
      description: 'Hidden patterns and creative insights'
    }
  ];

  const universeViews = [
    { key: 'constellation', name: 'Constellation View', icon: StarIcon },
    { key: 'clusters', name: 'Concept Clusters', icon: PuzzlePieceIcon },
    { key: 'frameworks', name: 'Theoretical Frameworks', icon: ArrowsPointingOutIcon },
    { key: 'innovations', name: 'Innovation Opportunities', icon: BoltIcon }
  ];

  const insightViews = [
    { key: 'moments', name: 'Insight Moments', icon: LightBulbIcon },
    { key: 'bridges', name: 'Conceptual Bridges', icon: ArrowsPointingOutIcon },
    { key: 'themes', name: 'Emergent Themes', icon: EyeIcon },
    { key: 'futures', name: 'Future Scenarios', icon: SparklesIcon }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateIntuitivContent();
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'intuitive', fileName });
    }
  }, [isActive, docxContent]);

  const generateIntuitivContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for conceptual analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intuitive-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setConceptUniverse(result.conceptUniverse || null);
        setInsightPatterns(result.insightPatterns || null);
      } else {
        throw new Error(result.error || 'Failed to generate conceptual pattern discovery content');
      }
    } catch (error) {
      console.error('Error generating intuitive content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderConceptUniverse = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Mapping concept constellation...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Constellation Mapping Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateIntuitivContent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!conceptUniverse) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Concept Universe Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create conceptual constellation</p>
          </div>
          <button
            onClick={generateIntuitivContent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate Universe
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Concept Universe Explanation */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Concept Universe for Intuitive Learners</h3>
              <p className="text-indigo-800 text-sm leading-relaxed mb-3">
                Intuitive learners excel at seeing <strong>abstract patterns and big-picture connections</strong>. 
                This universe reveals hidden relationships, theoretical frameworks, and future possibilities within the content.
              </p>
              <div className="text-xs text-indigo-700 mb-3">
                <p><strong>Purpose:</strong> "Show me the patterns, connections, and possibilities I can't see at first glance"</p>
              </div>
              {/* Enhanced Learning Tips */}
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-indigo-800 mb-2">🌌 Intuitive Exploration Tips:</h4>
                <ul className="text-xs text-indigo-700 space-y-1">
                  <li>• Follow your curiosity - click concepts that intrigue you</li>
                  <li>• Look for unexpected connections and patterns</li>
                  <li>• Explore different views to see various perspectives</li>
                  <li>• Focus on implications and future possibilities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Universe View Selector */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exploration Views</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {universeViews.map((view) => {
              const Icon = view.icon;
              const isActive = view.key === universeView;
              
              return (
                <button
                  key={view.key}
                  onClick={() => {
                    setUniverseView(view.key);
                    trackBehavior('tab_switched', { mode: 'intuitive', tab: view.key });
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{view.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Universe Content */}
        {universeView === 'constellation' && renderConstellation()}
        {universeView === 'clusters' && renderConceptClusters()}
        {universeView === 'frameworks' && renderTheoreticalFrameworks()}
        {universeView === 'innovations' && renderInnovationOpportunities()}
      </div>
    );
  };

  const renderConstellation = () => {
    if (!conceptUniverse?.conceptClusters) return null;

    return (
      <div className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 rounded-xl p-6 min-h-96 relative overflow-hidden">
        {/* Starfield Background */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <StarIcon className="w-6 h-6 text-yellow-400" />
            Concept Constellation
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conceptUniverse.conceptClusters.map((cluster, clusterIndex) => (
              <div key={clusterIndex} className="space-y-4">
                {/* Cluster Header */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
                  <h4 className="text-lg font-semibold text-white mb-2">{cluster.name}</h4>
                  <p className="text-sm text-gray-300 mb-3">{cluster.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-indigo-500 bg-opacity-30 rounded-full">
                      {cluster.abstractionLevel} abstraction
                    </span>
                    <span className="px-2 py-1 bg-purple-500 bg-opacity-30 rounded-full">
                      {cluster.concepts?.length || 0} concepts
                    </span>
                  </div>
                </div>

                {/* Concepts in Cluster */}
                <div className="space-y-3">
                  {cluster.concepts?.map((concept, conceptIndex) => (
                    <button
                      key={conceptIndex}
                      onClick={() => {
                        setSelectedConcept(concept);
                        trackBehavior('concept_explored', { mode: 'intuitive', conceptName: concept.name });
                      }}
                      className="w-full bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-10 hover:bg-opacity-15 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: concept.color || '#6366f1' }}
                        />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-white group-hover:text-yellow-300 transition-colors">
                            {concept.name}
                          </h5>
                          <p className="text-xs text-gray-400 mt-1">{concept.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">{concept.type}</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-indigo-400 to-purple-400 h-1 rounded-full"
                                style={{ width: `${(concept.energy || 0.5) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hidden Patterns */}
          {conceptUniverse.hiddenPatterns && conceptUniverse.hiddenPatterns.length > 0 && (
            <div className="mt-8 bg-yellow-500 bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-yellow-400 border-opacity-30">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                Hidden Patterns Detected
              </h4>
              <div className="space-y-3">
                {conceptUniverse.hiddenPatterns.map((pattern, index) => (
                  <div key={index} className="bg-white bg-opacity-5 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-yellow-200 mb-1">{pattern.name}</h5>
                    <p className="text-xs text-gray-300 mb-2">{pattern.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Strength:</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1 max-w-20">
                        <div 
                          className="bg-yellow-400 h-1 rounded-full"
                          style={{ width: `${(pattern.strength || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-yellow-300">{Math.round((pattern.strength || 0.5) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConceptClusters = () => {
    if (!conceptUniverse?.conceptClusters) return null;

    return (
      <div className="space-y-6">
        {conceptUniverse.conceptClusters.map((cluster, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <PuzzlePieceIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cluster.name}</h3>
                <p className="text-gray-700 mb-3">{cluster.description}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                    {cluster.theme}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                    {cluster.abstractionLevel} abstraction
                  </span>
                </div>
              </div>
            </div>

            {/* Concepts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {cluster.concepts?.map((concept, conceptIndex) => (
                <div key={conceptIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: concept.color || '#6366f1' }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{concept.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{concept.description}</p>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {concept.type}
                      </span>
                    </div>
                  </div>

                  {concept.implications && concept.implications.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Future Implications:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {concept.implications.slice(0, 2).map((implication, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>{implication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Emergent Properties */}
            {cluster.emergentProperties && cluster.emergentProperties.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">✨ Emergent Properties</h4>
                <div className="flex flex-wrap gap-2">
                  {cluster.emergentProperties.map((property, i) => (
                    <span key={i} className="text-sm text-green-800 bg-green-100 px-3 py-1 rounded-full">
                      {property}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Future Directions */}
            {cluster.futureDirections && cluster.futureDirections.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 mt-4">
                <h4 className="font-semibold text-blue-900 mb-2">🚀 Future Directions</h4>
                <div className="flex flex-wrap gap-2">
                  {cluster.futureDirections.map((direction, i) => (
                    <span key={i} className="text-sm text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                      {direction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTheoreticalFrameworks = () => {
    if (!conceptUniverse?.theoreticalFrameworks) return null;

    return (
      <div className="space-y-6">
        {conceptUniverse.theoreticalFrameworks.map((framework, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{framework.name}</h3>
                <p className="text-gray-700 mb-3">{framework.description}</p>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {framework.scope} scope
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Concepts & Principles */}
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">🧠 Core Concepts</h4>
                  <ul className="space-y-2">
                    {framework.concepts?.map((concept, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-purple-800">{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">⚖️ Underlying Principles</h4>
                  <ul className="space-y-2">
                    {framework.principles?.map((principle, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-blue-800">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Applications & Extensions */}
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">🎯 Applications</h4>
                  <ul className="space-y-2">
                    {framework.applications?.map((application, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-green-800">{application}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">🚀 Possible Extensions</h4>
                  <ul className="space-y-2">
                    {framework.extensions?.map((extension, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-orange-800">{extension}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitations */}
            {framework.limitations && framework.limitations.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 mt-4">
                <h4 className="font-semibold text-red-900 mb-3">⚠️ Limitations</h4>
                <ul className="space-y-2">
                  {framework.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm text-red-800">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInnovationOpportunities = () => {
    if (!conceptUniverse?.innovationOpportunities) return null;

    return (
      <div className="space-y-6">
        {conceptUniverse.innovationOpportunities.map((opportunity, index) => (
          <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                <BoltIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.name}</h3>
                <p className="text-gray-700 mb-3">{opportunity.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {opportunity.timeline}
                  </span>
                </div>
              </div>
            </div>

            {/* Concept Combination */}
            <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">🧩 Concept Combination</h4>
              <div className="flex items-center gap-3">
                {opportunity.conceptCombination?.map((concept, i) => (
                  <React.Fragment key={i}>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {concept}
                    </span>
                    {i < opportunity.conceptCombination.length - 1 && (
                      <span className="text-gray-400">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {Math.round((opportunity.novelty || 0.5) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Novelty</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.round((opportunity.feasibility || 0.5) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Feasibility</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.round((opportunity.impact || 0.5) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Impact</div>
              </div>
            </div>

            {/* Requirements */}
            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-3">📋 Requirements</h4>
                <ul className="space-y-2">
                  {opportunity.requirements.map((requirement, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderInsightPatterns = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Discovering hidden patterns...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Pattern Discovery Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateIntuitivContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!insightPatterns) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Insight Patterns Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to discover hidden patterns</p>
          </div>
          <button
            onClick={generateIntuitivContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Insights
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Pattern Discovery Explanation */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <LightBulbIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Pattern Discovery for Intuitive Learners</h3>
              <p className="text-purple-800 text-sm leading-relaxed mb-3">
                Intuitive learners thrive on <strong>discovering hidden connections and abstract patterns</strong>. 
                This reveals non-obvious insights, creative bridges between concepts, and future possibilities.
              </p>
              <div className="text-xs text-purple-700 mb-3">
                <p><strong>Purpose:</strong> "Help me see the patterns and connections that aren't immediately obvious"</p>
              </div>
              {/* Enhanced Learning Strategy */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-purple-800 mb-2">🔮 Pattern Recognition Tips:</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Look for recurring themes across different contexts</li>
                  <li>• Explore conceptual bridges between unrelated ideas</li>
                  <li>• Consider future implications and possibilities</li>
                  <li>• Embrace paradoxes as sources of deeper insight</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Insight View Selector */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Views</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {insightViews.map((view) => {
              const Icon = view.icon;
              const isActive = view.key === insightView;
              
              return (
                <button
                  key={view.key}
                  onClick={() => setInsightView(view.key)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{view.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Insight Content */}
        {insightView === 'moments' && renderInsightMoments()}
        {insightView === 'bridges' && renderConceptualBridges()}
        {insightView === 'themes' && renderEmergentThemes()}
        {insightView === 'futures' && renderFutureScenarios()}
      </div>
    );
  };

  const renderInsightMoments = () => {
    if (!insightPatterns?.insightMoments) return null;

    return (
      <div className="space-y-6">
        {insightPatterns.insightMoments.map((insight, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-gray-700 mb-3">{insight.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {insight.type}
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                    {insight.depth} insight
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Concepts */}
            {insight.conceptsConnected && insight.conceptsConnected.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h4 className="font-semibold text-blue-900 mb-3">🔗 Connected Concepts</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.conceptsConnected.map((concept, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning & Implications */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">🧠 Why This Matters</h4>
                <p className="text-sm text-green-800">{insight.reasoning}</p>
              </div>
              
              {insight.implications && insight.implications.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">🚀 Implications</h4>
                  <ul className="space-y-1">
                    {insight.implications.map((implication, i) => (
                      <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        {implication}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Questions & Exploration Paths */}
            {insight.questions && insight.questions.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-3">❓ Thought-Provoking Questions</h4>
                <ul className="space-y-2">
                  {insight.questions.map((question, i) => (
                    <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">?</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderConceptualBridges = () => {
    if (!insightPatterns?.conceptualBridges) return null;

    return (
      <div className="space-y-6">
        {insightPatterns.conceptualBridges.map((bridge, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
                <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{bridge.name}</h3>
            </div>

            {/* Bridge Visualization */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2">
                    FROM
                  </div>
                  <p className="text-sm font-medium text-cyan-900">{bridge.fromConcept}</p>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 flex-1 w-20"></div>
                    <div className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium">
                      {bridge.bridgeType}
                    </div>
                    <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 flex-1 w-20"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2">
                    TO
                  </div>
                  <p className="text-sm font-medium text-blue-900">{bridge.toConcept}</p>
                </div>
              </div>
            </div>

            {/* Bridge Details */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🌉 Connection Explanation</h4>
                <p className="text-sm text-gray-700">{bridge.explanation}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">💡 What This Reveals</h4>
                  <ul className="space-y-1">
                    {bridge.implications?.map((implication, i) => (
                      <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        {implication}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">📝 Examples</h4>
                  <ul className="space-y-1">
                    {bridge.examples?.map((example, i) => (
                      <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strength & Novelty Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-cyan-600 mb-1">
                    {Math.round((bridge.strength || 0.5) * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Connection Strength</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {Math.round((bridge.novelty || 0.5) * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Novelty</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmergentThemes = () => {
    if (!insightPatterns?.emergentThemes) return null;

    return (
      <div className="space-y-6">
        {insightPatterns.emergentThemes.map((theme, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <EyeIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{theme.name}</h3>
                <p className="text-gray-700 mb-3">{theme.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    {theme.abstractionLevel} abstraction
                  </span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full">
                    {theme.universality}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributing Concepts */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mb-4">
              <h4 className="font-semibold text-emerald-900 mb-3">🧩 Contributing Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {theme.concepts?.map((concept, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Manifestations */}
            {theme.manifestations && theme.manifestations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h4 className="font-semibold text-blue-900 mb-3">🌟 How This Theme Appears</h4>
                <ul className="space-y-2">
                  {theme.manifestations.map((manifestation, i) => (
                    <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {manifestation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evolution & Cross-Domain Applications */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">📈 Evolution</h4>
                <p className="text-sm text-purple-800">{theme.evolution}</p>
              </div>
              
              {theme.crossDomainApplications && theme.crossDomainApplications.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">🌐 Cross-Domain Applications</h4>
                  <ul className="space-y-1">
                    {theme.crossDomainApplications.map((application, i) => (
                      <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        {application}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFutureScenarios = () => {
    if (!insightPatterns?.futureScenarios) return null;

    return (
      <div className="space-y-6">
        {insightPatterns.futureScenarios.map((scenario, index) => (
          <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{scenario.name}</h3>
                <p className="text-gray-700 mb-3">{scenario.description}</p>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {scenario.timeline}
                </span>
              </div>
            </div>

            {/* Foundational Concepts */}
            <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-4">
              <h4 className="font-semibold text-indigo-900 mb-3">🏗️ Based On Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {scenario.basedOnConcepts?.map((concept, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Probability & Impact */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((scenario.probability || 0.5) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Probability</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-200 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {Math.round((scenario.impact || 0.5) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Impact</div>
              </div>
            </div>

            {/* Requirements & Indicators */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-3">📋 Requirements</h4>
                <ul className="space-y-2">
                  {scenario.requirements?.map((requirement, i) => (
                    <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-purple-900 mb-3">🔍 Early Indicators</h4>
                <ul className="space-y-2">
                  {scenario.indicators?.map((indicator, i) => (
                    <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Implications */}
            {scenario.implications && scenario.implications.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3">🚀 What This Would Mean</h4>
                <ul className="space-y-2">
                  {scenario.implications.map((implication, i) => (
                    <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      {implication}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 z-[10001] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-3 text-white hover:text-yellow-300 hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200"
            title="Back to document"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Concept Constellation</h2>
              <p className="text-sm text-gray-300 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateIntuitivContent}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            title="Regenerate concept constellation"
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
      <div className="p-4 border-b border-white border-opacity-20 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {/* Purpose Explanation */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-300">
              Intuitive learners need <strong>abstract patterns</strong> and <strong>creative connections</strong>
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
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20 border border-white border-opacity-20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'universe' ? 'Interactive constellation of interconnected concepts' : 'Hidden patterns and creative insights'}
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {activeTab === 'universe' && renderConceptUniverse()}
          {activeTab === 'insights' && renderInsightPatterns()}
        </div>
      </div>
    </div>
  );
};

export default IntuitiveLearning;