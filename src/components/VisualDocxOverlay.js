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
    { key: 'diagram', name: 'Diagram', icon: PhotoIcon, description: 'Structured concept diagram' },
    { key: 'infographic', name: 'Infographic', icon: DocumentTextIcon, description: 'Visual information display' },
    { key: 'mindmap', name: 'Mind Map', icon: PhotoIcon, description: 'Radial concept map' },
    { key: 'flowchart', name: 'Flowchart', icon: DocumentTextIcon, description: 'Process flow diagram' }
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
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentVisualType.name}</h3>
          </div>
          
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
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentVisualType.name}</h3>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium inline-block">
              📝 Text Description
            </div>
          </div>
          
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
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentVisualType.name}</h3>
        </div>
        
        {visual.imageData && (
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <img 
              src={`data:image/png;base64,${visual.imageData}`} 
              alt={`${currentVisualType.name} for ${fileName}`}
              className="w-full h-auto max-h-96 object-contain"
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to document"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Visual Learning Mode</h2>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={generateAllVisuals}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate all visuals"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visual Type Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {visualTypes.map((type) => {
            const Icon = type.icon;
            const isActive = type.key === activeVisualType;
            const hasVisual = visuals[type.key];
            
            return (
              <button
                key={type.key}
                onClick={() => handleVisualTypeChange(type.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.name}</span>
                {hasVisual && (
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-green-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderVisualContent()}
      </div>
    </div>
  );
};

export default VisualDocxOverlay;
