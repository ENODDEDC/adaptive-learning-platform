'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import VisualWireframe from './VisualWireframe';

const VisualDocxOverlay = ({ 
  isActive, 
  onClose, 
  docxContent, 
  fileName,
  onVisualTypeChange,
  activeVisualType = 'diagram'
}) => {
  const [visuals, setVisuals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [concepts, setConcepts] = useState(null);

  const visualTypes = [
    {
      key: 'diagram',
      name: 'Diagram',
      icon: PhotoIcon,
      description: 'Concept relationships & structures',
      tooltip: 'Creates visual concept maps showing relationships between ideas',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'from-blue-600 to-blue-700',
      activeColor: 'bg-blue-600'
    },
    {
      key: 'infographic',
      name: 'Infographic',
      icon: DocumentTextIcon,
      description: 'Summary with visual elements & icons',
      tooltip: 'Creates engaging summaries with icons, charts, and visual elements',
      color: 'from-emerald-500 to-emerald-600',
      hoverColor: 'from-emerald-600 to-emerald-700',
      activeColor: 'bg-emerald-600'
    },
    {
      key: 'mindmap',
      name: 'Mind Map',
      icon: PhotoIcon,
      description: 'Radial concept hierarchy & connections',
      tooltip: 'Creates radial maps showing concept hierarchy and connections',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'from-purple-600 to-purple-700',
      activeColor: 'bg-purple-600'
    },
    {
      key: 'flowchart',
      name: 'Flowchart',
      icon: DocumentTextIcon,
      description: 'Step-by-step process visualization',
      tooltip: 'Creates process flows with decision points and step sequences',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'from-orange-600 to-orange-700',
      activeColor: 'bg-orange-600'
    }
  ];

  const currentVisualType = visualTypes.find(v => v.key === activeVisualType) || visualTypes[0];

  useEffect(() => {
    if (isActive && docxContent) {
      generateAllVisuals();
    }
  }, [isActive, docxContent]);

  const generateAllVisuals = async () => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for visual generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visual-content/generate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setVisuals(result.visuals || {});
        setConcepts(result.concepts || null);
      } else {
        throw new Error(result.error || 'Failed to generate visuals');
      }
    } catch (error) {
      console.error('Error generating visuals:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSingleVisual = async (type) => {
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available for visual generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visual-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docxText: docxContent,
          contentType: type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setVisuals(prev => ({
          ...prev,
          [type]: result.visual
        }));
        setConcepts(result.concepts || concepts);
      } else {
        throw new Error(result.error || 'Failed to generate visual');
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualTypeChange = (newType) => {
    onVisualTypeChange(newType);
    
    // Generate the visual if it doesn't exist
    if (!visuals[newType]) {
      generateSingleVisual(newType);
    }
  };

  const renderVisualContent = () => {
    const visual = visuals[activeVisualType];
    
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Generating {currentVisualType.name}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Visual Generation Failed</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <button
            onClick={generateAllVisuals}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!visual) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-semibold">No Visual Available</p>
            <p className="text-sm text-gray-600 mt-2">Click generate to create {currentVisualType.name}</p>
          </div>
          <button
            onClick={() => generateSingleVisual(activeVisualType)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate {currentVisualType.name}
          </button>
        </div>
      );
    }

    // Handle wireframe visual
    if (visual.isWireframe && visual.wireframeData) {
      return (
        <div className="space-y-4">
          <VisualWireframe
            wireframeData={visual.wireframeData}
            contentType={activeVisualType}
          />
        </div>
      );
    }

    // Handle fallback text description
    if (visual.isFallback && visual.textDescription) {
      return (
        <div className="space-y-4">
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-3">Visual Design Description</h4>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdownText(visual.textDescription) }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle normal image content
    return (
      <div className="space-y-6">
        {visual.imageData && (
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
            <img
              src={`data:image/png;base64,${visual.imageData}`}
              alt={`${currentVisualType.name} for ${fileName}`}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '500px' }}
            />
          </div>
        )}
      </div>
    );
  };

  const formatMarkdownText = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n/g, '<br>');

    formatted = formatted.replace(/(<li class="ml-4 mb-1">.*?<\/li>(?:<br>)*)+/g, (match) => {
      const cleanMatch = match.replace(/<br>/g, '');
      return `<ul class="list-disc list-inside space-y-1 my-3">${cleanMatch}</ul>`;
    });

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
    return formatted;
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            title="Back to document"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <PhotoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Visual Learning Mode</h2>
              <p className="text-sm text-gray-600 font-medium">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateAllVisuals}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl font-medium"
            title="Regenerate all visuals"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Generate All</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Visual Type Selector */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-center space-x-3 overflow-x-auto pb-2">
          {visualTypes.map((type) => {
            const Icon = type.icon;
            const isActive = type.key === activeVisualType;
            const hasVisual = visuals[type.key];

            return (
              <div key={type.key} className="relative group">
                <button
                  onClick={() => handleVisualTypeChange(type.key)}
                  className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap shadow-sm border-2 ${
                    isActive
                      ? `${type.activeColor} text-white shadow-xl border-transparent transform scale-105`
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  title={type.tooltip}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{type.name}</div>
                    <div className={`text-xs ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                      {type.description}
                    </div>
                  </div>
                  {hasVisual && (
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-white' : 'bg-green-500'} animate-pulse`} />
                  )}
                </button>

                {/* Tooltip */}
                {!isActive && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {type.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto p-8">
          <div className="w-full">
            {renderVisualContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualDocxOverlay;
