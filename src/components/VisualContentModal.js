'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  MapIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import VisualWireframe from './VisualWireframe';

const VisualContentModal = ({ isOpen, onClose, docxContent, fileName }) => {
  const [activeTab, setActiveTab] = useState('diagram');
  const [visuals, setVisuals] = useState({});
  const [concepts, setConcepts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);

  // Function to format markdown text to HTML
  const formatMarkdownText = (text) => {
    if (!text) return '';
    
    let formatted = text
      // Convert ### headers to <h3>
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      // Convert ## headers to <h2>
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      // Convert # headers to <h1>
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      // Convert bullet points to HTML lists (handle both * and -)
      .replace(/^[\s]*[\*\-] (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      // Convert numbered lists
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');

    // Wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(/(<li class="ml-4 mb-1">.*?<\/li>(?:<br>)*)+/g, (match) => {
      const cleanMatch = match.replace(/<br>/g, '');
      return `<ul class="list-disc list-inside space-y-1 my-3">${cleanMatch}</ul>`;
    });

    // Convert **text** to <strong>text</strong> (after list processing)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Convert *text* to <em>text</em> (but not if it's already bold)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');

    // Clean up any remaining markdown artifacts
    formatted = formatted.replace(/\$\#([A-F0-9]{6})\$/g, '<code class="bg-gray-100 px-1 rounded text-sm">#$1</code>');

    return formatted;
  };

  // Initialize content when modal opens
  useEffect(() => {
    if (isOpen && !concepts) {
      if (docxContent && docxContent.trim()) {
        generateAllVisuals();
      } else {
        setError('No document content available. Please ensure the document is properly loaded.');
      }
    }
  }, [isOpen, docxContent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setVisuals({});
      setConcepts(null);
      setError('');
      setActiveTab('diagram');
    }
  }, [isOpen]);

  const generateAllVisuals = async () => {
    setGeneratingAll(true);
    setError('');
    
    // Validate content before making API call
    if (!docxContent || !docxContent.trim()) {
      setError('No document content available. Please ensure the document is properly loaded.');
      setGeneratingAll(false);
      return;
    }
    
    try {
      console.log('🎨 Generating all visual content...');
      console.log('📝 Content length:', docxContent.length);
      console.log('📄 Content preview:', docxContent.substring(0, 100) + '...');
      
      const response = await fetch('/api/visual-content/generate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate visual content');
      }

      const data = await response.json();
      setVisuals(data.visuals || {});
      setConcepts(data.concepts);
      console.log('✅ All visual content generated successfully');
    } catch (err) {
      console.error('Error generating visual content:', err);
      setError(`Visual content generation failed: ${err.message}`);
    } finally {
      setGeneratingAll(false);
    }
  };

  const generateSingleVisual = async (contentType) => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`🎨 Generating ${contentType}...`);
      const response = await fetch('/api/visual-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docxText: docxContent,
          contentType 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate visual content');
      }

      const data = await response.json();
      setVisuals(prev => ({
        ...prev,
        [contentType]: data.visualContent
      }));
      console.log(`✅ ${contentType} generated successfully`);
    } catch (err) {
      console.error(`Error generating ${contentType}:`, err);
      setError(`Failed to generate ${contentType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageData, filename) => {
    try {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageData}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const getVisualIcon = (type) => {
    switch (type) {
      case 'diagram': return DocumentTextIcon;
      case 'infographic': return ChartBarIcon;
      case 'mindmap': return MapIcon;
      case 'flowchart': return ArrowPathIcon;
      default: return PhotoIcon;
    }
  };

  const getVisualTitle = (type) => {
    switch (type) {
      case 'diagram': return 'Concept Diagram';
      case 'infographic': return 'Summary Infographic';
      case 'mindmap': return 'Mind Map';
      case 'flowchart': return 'Process Flowchart';
      default: return 'Visual Content';
    }
  };

  const getVisualDescription = (type) => {
    switch (type) {
      case 'diagram': return 'Visual representation of key concepts and their relationships';
      case 'infographic': return 'Comprehensive summary with visual elements and icons';
      case 'mindmap': return 'Radial map showing concept hierarchy and connections';
      case 'flowchart': return 'Step-by-step process visualization with decision points';
      default: return 'AI-generated visual learning content';
    }
  };

  const renderVisualContent = (type) => {
    const visual = visuals[type];
    
    if (!visual) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <PhotoIcon className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No {getVisualTitle(type)} Generated</p>
          <p className="text-sm mb-4">Click the generate button to create visual content</p>
          <button
            onClick={() => generateSingleVisual(type)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PhotoIcon className="w-4 h-4" />
            )}
            Generate {getVisualTitle(type)}
          </button>
        </div>
      );
    }

    if (visual.error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-red-500">
          <PhotoIcon className="w-16 h-16 mb-4 text-red-300" />
          <p className="text-lg font-medium mb-2">Generation Failed</p>
          <p className="text-sm mb-4">{visual.error}</p>
          <button
            onClick={() => generateSingleVisual(type)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <PhotoIcon className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    // Handle wireframe visual
    if (visual.isWireframe && visual.wireframeData) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getVisualTitle(type)}</h3>
              <p className="text-sm text-gray-600">{getVisualDescription(type)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generateSingleVisual(type)}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <VisualWireframe 
            wireframeData={visual.wireframeData} 
            contentType={type}
          />
        </div>
      );
    }

    // Handle fallback text description (legacy)
    if (visual.isFallback && visual.textDescription) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getVisualTitle(type)}</h3>
              <p className="text-sm text-gray-600">{getVisualDescription(type)}</p>
              <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                📝 Text Description (Legacy fallback)
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generateSingleVisual(type)}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getVisualTitle(type)}</h3>
            <p className="text-sm text-gray-600">{getVisualDescription(type)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadImage(visual.imageData, `${fileName}_${type}.png`)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download image"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => generateSingleVisual(type)}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Regenerate"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <img
            src={`data:${visual.mimeType || 'image/png'};base64,${visual.imageData}`}
            alt={getVisualTitle(type)}
            className="w-full h-auto rounded-lg shadow-sm"
            style={{ maxHeight: '600px', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  };

  const getTabContent = () => {
    return renderVisualContent(activeTab);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <PhotoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Visual Learning Content</h2>
                <p className="text-purple-100 text-sm">{fileName}</p>
                <p className="text-purple-200 text-xs mt-1">AI-generated visual representations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'diagram', label: 'Diagram', icon: DocumentTextIcon },
              { id: 'infographic', label: 'Infographic', icon: ChartBarIcon },
              { id: 'mindmap', label: 'Mind Map', icon: MapIcon },
              { id: 'flowchart', label: 'Flowchart', icon: ArrowPathIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {generatingAll && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Generating visual content...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={generateAllVisuals}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Try Again
                </button>
              </div>
            )}

            {!generatingAll && !error && getTabContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {concepts && (
                <p>Main Topic: <span className="font-medium">{concepts.mainTopic}</span></p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={generateAllVisuals}
                disabled={generatingAll}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
              >
                {generatingAll ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PhotoIcon className="w-4 h-4" />
                )}
                Generate All
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualContentModal;
