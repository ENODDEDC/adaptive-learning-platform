'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  BeakerIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  CalculatorIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { trackBehavior } from '@/utils/learningBehaviorTracker';
import { useLearningModeTracking } from '@/hooks/useLearningModeTracking';

const SensingLearning = ({
  isActive,
  onClose,
  docxContent,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState('simulations');
  const [simulations, setSimulations] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSimulation, setActiveSimulation] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [simulationInputs, setSimulationInputs] = useState({});
  const [challengeProgress, setChallengeProgress] = useState({});

  // Automatic time tracking for ML classification
  useLearningModeTracking('sensingLearning', isActive);

  const tabs = [
    {
      key: 'simulations',
      name: 'Interactive Lab',
      icon: BeakerIcon,
      description: 'Hands-on simulations and experiments'
    },
    {
      key: 'challenges',
      name: 'Practical Challenges',
      icon: PuzzlePieceIcon,
      description: 'Real-world problem solving'
    }
  ];

  useEffect(() => {
    if (isActive && docxContent) {
      generateSensingContent();
      // Track mode activation
      trackBehavior('mode_activated', { mode: 'sensing', fileName });
    }
  }, [isActive, docxContent]);

  const generateSensingContent = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for hands-on analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sensing-learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSimulations(result.simulations || []);
        setChallenges(result.challenges || []);
        
        // Initialize simulation inputs
        if (result.simulations && result.simulations.length > 0) {
          const initialInputs = {};
          result.simulations.forEach((sim, simIndex) => {
            initialInputs[simIndex] = {};
            sim.interactiveElements?.forEach(element => {
              initialInputs[simIndex][element.name] = element.defaultValue;
            });
          });
          setSimulationInputs(initialInputs);
        }

        // Initialize challenge progress
        if (result.challenges && result.challenges.length > 0) {
          const initialProgress = {};
          result.challenges.forEach((challenge, challengeIndex) => {
            initialProgress[challengeIndex] = {
              currentStep: 0,
              completedCheckpoints: [],
              startTime: Date.now()
            };
          });
          setChallengeProgress(initialProgress);
        }
      } else {
        throw new Error(result.error || 'Failed to generate sensing learning content');
      }
    } catch (error) {
      console.error('Error generating sensing content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationInputChange = (simIndex, elementName, value) => {
    setSimulationInputs(prev => ({
      ...prev,
      [simIndex]: {
        ...prev[simIndex],
        [elementName]: value
      }
    }));
    // Track interaction
    trackBehavior('interactive_element_used', { 
      mode: 'sensing', 
      elementType: 'simulation_input',
      elementName,
      value 
    });
  };

  const handleChallengeStepComplete = (challengeIndex, stepIndex) => {
    setChallengeProgress(prev => ({
      ...prev,
      [challengeIndex]: {
        ...prev[challengeIndex],
        currentStep: Math.max(prev[challengeIndex]?.currentStep || 0, stepIndex + 1)
      }
    }));
    // Track step completion
    trackBehavior('step_completed', { 
      mode: 'sensing', 
      challengeIndex, 
      stepIndex 
    });
  };

  const handleCheckpointComplete = (challengeIndex, checkpointIndex) => {
    setChallengeProgress(prev => {
      const currentProgress = prev[challengeIndex] || { completedCheckpoints: [] };
      const newCheckpoints = [...currentProgress.completedCheckpoints];
      if (!newCheckpoints.includes(checkpointIndex)) {
        newCheckpoints.push(checkpointIndex);
      }
      
      return {
        ...prev,
        [challengeIndex]: {
          ...currentProgress,
          completedCheckpoints: newCheckpoints
        }
      };
    });
    // Track checkpoint completion
    trackBehavior('checkpoint_completed', { 
      mode: 'sensing', 
      challengeIndex, 
      checkpointIndex 
    });
  };

  const renderSimulations = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Setting up interactive lab...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Lab Setup Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!simulations || simulations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Simulations Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create interactive experiments</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Generate Lab
          </button>
        </div>
      );
    }

    const currentSim = simulations[activeSimulation];
    const currentInputs = simulationInputs[activeSimulation] || {};

    return (
      <div className="space-y-6">
        {/* Interactive Lab Explanation */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-teal-900 mb-2">Interactive Lab for Sensing Learners</h3>
              <p className="text-teal-800 text-sm leading-relaxed mb-3">
                Sensing learners need <strong>hands-on, concrete experiences</strong>. This lab provides interactive simulations 
                where you can manipulate variables, see immediate results, and verify concepts through direct experimentation.
              </p>
              <div className="text-xs text-teal-700 mb-3">
                <p><strong>Purpose:</strong> "Let me try it myself and see what happens when I change this..."</p>
              </div>
              {/* Enhanced Learning Tips */}
              <div className="bg-teal-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-teal-800 mb-2">🔬 Hands-On Learning Tips:</h4>
                <ul className="text-xs text-teal-700 space-y-1">
                  <li>• Experiment with different values to see what happens</li>
                  <li>• Follow the step-by-step guide for best results</li>
                  <li>• Pay attention to real-world applications</li>
                  <li>• Verify results match your expectations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Selector */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Simulations</h3>
            <span className="text-sm text-gray-600">{activeSimulation + 1} of {simulations.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {simulations.map((sim, index) => (
              <button
                key={index}
                onClick={() => setActiveSimulation(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                  index === activeSimulation
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {sim.type === 'calculator' && <CalculatorIcon className="w-4 h-4" />}
                  {sim.type === 'graph' && <ChartBarIcon className="w-4 h-4" />}
                  {sim.type === 'experiment' && <BeakerIcon className="w-4 h-4" />}
                  {sim.type === 'data_analysis' && <ChartBarIcon className="w-4 h-4" />}
                  {sim.type === 'virtual_lab' && <CogIcon className="w-4 h-4" />}
                  <span className="text-sm font-medium">{sim.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Simulation */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg">
              {currentSim.type === 'calculator' && <CalculatorIcon className="w-6 h-6 text-white" />}
              {currentSim.type === 'graph' && <ChartBarIcon className="w-6 h-6 text-white" />}
              {currentSim.type === 'experiment' && <BeakerIcon className="w-6 h-6 text-white" />}
              {currentSim.type === 'data_analysis' && <ChartBarIcon className="w-6 h-6 text-white" />}
              {currentSim.type === 'virtual_lab' && <CogIcon className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{currentSim.title}</h3>
              <p className="text-sm text-gray-600">{currentSim.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <ClockIcon className="w-4 h-4" />
              <span>{currentSim.estimatedTime}</span>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">🎛️ Interactive Controls</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {currentSim.interactiveElements?.map((element, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {element.name}
                  </label>
                  <p className="text-xs text-gray-600 mb-3">{element.description}</p>
                  
                  {element.type === 'slider' && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={element.range.split('-')[0]}
                        max={element.range.split('-')[1]}
                        value={currentInputs[element.name] || element.defaultValue}
                        onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{element.range.split('-')[0]} {element.unit}</span>
                        <span className="font-medium text-teal-600">
                          {currentInputs[element.name] || element.defaultValue} {element.unit}
                        </span>
                        <span>{element.range.split('-')[1]} {element.unit}</span>
                      </div>
                    </div>
                  )}

                  {element.type === 'input' && (
                    <input
                      type="number"
                      value={currentInputs[element.name] || element.defaultValue}
                      onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={`Enter ${element.unit}`}
                    />
                  )}

                  {element.type === 'dropdown' && (
                    <select
                      value={currentInputs[element.name] || element.defaultValue}
                      onChange={(e) => handleSimulationInputChange(activeSimulation, element.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {(Array.isArray(element.range) ? element.range : []).map((option, optIndex) => (
                        <option key={optIndex} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {element.type === 'button' && (
                    <button
                      onClick={() => {
                        // Simulate calculation or action
                        console.log('Button clicked:', element.name);
                      }}
                      className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      {element.defaultValue}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 mb-6 border border-teal-200">
            <h4 className="font-semibold text-teal-900 mb-3">📊 Live Results</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {currentSim.dataPoints?.map((dataPoint, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-teal-200">
                  <div className="text-lg font-bold text-teal-900">{dataPoint.value}</div>
                  <div className="text-sm font-medium text-teal-700">{dataPoint.label}</div>
                  <div className="text-xs text-teal-600">{dataPoint.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">📋 Step-by-Step Guide</h4>
            <ol className="space-y-2">
              {currentSim.stepByStepGuide?.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-blue-800">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Learning Objectives & Real-World Application */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">🎯 Learning Objectives</h4>
              <ul className="space-y-1">
                {currentSim.learningObjectives?.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-green-800">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">🌍 Real-World Application</h4>
              <p className="text-sm text-orange-800">{currentSim.realWorldApplication}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChallenges = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Preparing practical challenges...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Challenge Setup Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!challenges || challenges.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Challenges Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create practical challenges</p>
          </div>
          <button
            onClick={generateSensingContent}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Generate Challenges
          </button>
        </div>
      );
    }

    const currentChallenge = challenges[activeChallenge];
    const currentProgress = challengeProgress[activeChallenge] || { currentStep: 0, completedCheckpoints: [] };

    return (
      <div className="space-y-6">
        {/* Practical Challenges Explanation */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <PuzzlePieceIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-900 mb-2">Practical Challenges for Sensing Learners</h3>
              <p className="text-cyan-800 text-sm leading-relaxed mb-3">
                Sensing learners learn best through <strong>hands-on problem solving</strong>. These challenges provide 
                concrete tasks with step-by-step procedures, immediate feedback, and measurable outcomes.
              </p>
              <div className="text-xs text-cyan-700 mb-3">
                <p><strong>Purpose:</strong> "Give me a real problem to solve with clear steps and concrete results"</p>
              </div>
              {/* Enhanced Learning Strategy */}
              <div className="bg-cyan-100 rounded-lg p-3 mt-3">
                <h4 className="text-xs font-semibold text-cyan-800 mb-2">🎯 Challenge Strategy:</h4>
                <ul className="text-xs text-cyan-700 space-y-1">
                  <li>• Follow procedures step-by-step for best results</li>
                  <li>• Complete checkpoints to track your progress</li>
                  <li>• Use provided materials and resources</li>
                  <li>• Verify results against success metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Selector */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Challenges</h3>
            <span className="text-sm text-gray-600">{activeChallenge + 1} of {challenges.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {challenges.map((challenge, index) => (
              <button
                key={index}
                onClick={() => setActiveChallenge(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                  index === activeChallenge
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{challenge.title}</div>
                <div className="text-xs text-gray-500">{challenge.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Challenge */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
              <PuzzlePieceIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{currentChallenge.title}</h3>
              <p className="text-sm text-gray-600">{currentChallenge.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <ClockIcon className="w-4 h-4" />
              <span>{currentChallenge.estimatedTime}</span>
            </div>
          </div>

          {/* Challenge Info */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Materials Needed</h4>
              <ul className="space-y-1">
                {currentChallenge.materials?.map((material, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {material}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🎯 Success Metrics</h4>
              <ul className="space-y-1">
                {currentChallenge.successMetrics?.map((metric, index) => (
                  <li key={index} className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">🌍 Real-World Connection</h4>
              <p className="text-sm text-orange-800">{currentChallenge.realWorldConnection}</p>
            </div>
          </div>

          {/* Procedure Steps */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">📝 Step-by-Step Procedure</h4>
            <div className="space-y-4">
              {currentChallenge.procedure?.map((step, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 border-2 transition-all ${
                    index < currentProgress.currentStep
                      ? 'border-green-500 bg-green-50'
                      : index === currentProgress.currentStep
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index < currentProgress.currentStep
                        ? 'bg-green-600'
                        : index === currentProgress.currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-400'
                    }`}>
                      {index < currentProgress.currentStep ? '✓' : step.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-2">Step {step.step}</h5>
                      <p className="text-sm text-gray-700 mb-2">{step.instruction}</p>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded p-3 border border-blue-200">
                          <h6 className="text-xs font-semibold text-blue-900 mb-1">Expected Result</h6>
                          <p className="text-xs text-blue-800">{step.expectedResult}</p>
                        </div>
                        <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                          <h6 className="text-xs font-semibold text-yellow-900 mb-1">Tips</h6>
                          <p className="text-xs text-yellow-800">{step.tips}</p>
                        </div>
                      </div>

                      {index >= currentProgress.currentStep && (
                        <button
                          onClick={() => handleChallengeStepComplete(activeChallenge, index)}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoints */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-4">🏁 Progress Checkpoints</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {currentChallenge.checkpoints?.map((checkpoint, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-3 border-2 transition-all ${
                    currentProgress.completedCheckpoints.includes(index)
                      ? 'border-green-500 bg-green-50'
                      : 'border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleCheckpointComplete(activeChallenge, index)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                        currentProgress.completedCheckpoints.includes(index)
                          ? 'bg-green-600'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {currentProgress.completedCheckpoints.includes(index) ? '✓' : index + 1}
                    </button>
                    <div className="flex-1">
                      <h5 className="font-semibold text-purple-900 mb-1">{checkpoint.checkpoint}</h5>
                      <p className="text-xs text-purple-800 mb-2">{checkpoint.criteria}</p>
                      <p className="text-xs text-gray-600">{checkpoint.troubleshooting}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extension Activities */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-3">🚀 Extension Activities</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {currentChallenge.extensionActivities?.map((activity, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-indigo-200">
                  <span className="text-sm text-indigo-800">{activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isActive) return null;

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
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hands-On Lab</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateSensingContent}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
            title="Regenerate hands-on content"
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
              Sensing learners need <strong>hands-on experiences</strong> and <strong>concrete problem solving</strong>
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
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>

                  {/* Tooltip-style explanation */}
                  {isActive && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                      {tab.key === 'simulations' ? 'Interactive experiments you can manipulate' : 'Step-by-step challenges with concrete outcomes'}
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
          {activeTab === 'simulations' && renderSimulations()}
          {activeTab === 'challenges' && renderChallenges()}
        </div>
      </div>
    </div>
  );
};

export default SensingLearning;