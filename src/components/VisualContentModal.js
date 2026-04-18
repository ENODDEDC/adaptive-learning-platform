'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  MapIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import VisualWireframe from './VisualWireframe';

const IMMERSIVE_VISUAL_EVENT = 'assist-ed-immersive-visual-learning';

const VisualContentModal = ({ isOpen, onClose, docxContent, fileName }) => {
  const [activeTab, setActiveTab] = useState('diagram');
  const [visuals, setVisuals] = useState({});
  const [concepts, setConcepts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !isOpen) return undefined;
    document.body.setAttribute('data-immersive-visual-learning', 'true');
    window.dispatchEvent(new CustomEvent(IMMERSIVE_VISUAL_EVENT, { detail: { open: true } }));
    try {
      window.dispatchEvent(new Event('collapseMainSidebar'));
    } catch {
      // ignore
    }
    return () => {
      document.body.removeAttribute('data-immersive-visual-learning');
      window.dispatchEvent(new CustomEvent(IMMERSIVE_VISUAL_EVENT, { detail: { open: false } }));
    };
  }, [isOpen]);

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

  const generateAllVisuals = useCallback(async () => {
    setGeneratingAll(true);
    setError('');

    if (!docxContent || !docxContent.trim()) {
      setError('No document content available. Please ensure the document is properly loaded.');
      setGeneratingAll(false);
      return;
    }

    try {
      const response = await fetch('/api/visual-content/generate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docxText: docxContent })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate visual content');
      }

      const data = await response.json();
      setVisuals(data.visuals || {});
      setConcepts(data.concepts);
    } catch (err) {
      console.error('Error generating visual content:', err);
      setError(`Visual content generation failed: ${err.message}`);
    } finally {
      setGeneratingAll(false);
    }
  }, [docxContent]);

  const generateSingleVisual = useCallback(async (contentType) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/visual-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docxText: docxContent,
          contentType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate visual content');
      }

      const data = await response.json();
      const piece = data.visualContent ?? data.visual;
      if (!piece) throw new Error('Empty response');
      setVisuals((prev) => ({
        ...prev,
        [contentType]: piece
      }));
      if (data.concepts) setConcepts(data.concepts);
    } catch (err) {
      console.error(`Error generating ${contentType}:`, err);
      setError(`Failed to generate ${contentType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [docxContent]);

  useEffect(() => {
    if (isOpen && !concepts) {
      if (docxContent && docxContent.trim()) {
        generateAllVisuals();
      } else {
        setError('No document content available. Please ensure the document is properly loaded.');
      }
    }
  }, [isOpen, docxContent, generateAllVisuals]);

  useEffect(() => {
    if (!isOpen) {
      setVisuals({});
      setConcepts(null);
      setError('');
      setActiveTab('diagram');
    }
  }, [isOpen]);

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

  const getVisualConfig = (type) => {
    switch (type) {
      case 'diagram':
        return {
          color: 'from-blue-500 to-blue-600',
          hoverColor: 'from-blue-600 to-blue-700',
          activeColor: 'bg-blue-600',
          icon: DocumentTextIcon
        };
      case 'infographic':
        return {
          color: 'from-emerald-500 to-emerald-600',
          hoverColor: 'from-emerald-600 to-emerald-700',
          activeColor: 'bg-emerald-600',
          icon: ChartBarIcon
        };
      case 'mindmap':
        return {
          color: 'from-purple-500 to-purple-600',
          hoverColor: 'from-purple-600 to-purple-700',
          activeColor: 'bg-purple-600',
          icon: MapIcon
        };
      case 'flowchart':
        return {
          color: 'from-orange-500 to-orange-600',
          hoverColor: 'from-orange-600 to-orange-700',
          activeColor: 'bg-orange-600',
          icon: ArrowPathIcon
        };
      default:
        return {
          color: 'from-gray-500 to-gray-600',
          hoverColor: 'from-gray-600 to-gray-700',
          activeColor: 'bg-gray-600',
          icon: PhotoIcon
        };
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

        <div className="inline-block w-full max-w-7xl my-6 overflow-hidden text-left align-middle transition-all transform rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl sm:my-8">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/90 text-white">
                <PhotoIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white sm:text-lg">Visual</h2>
                <p className="truncate text-xs text-slate-500 sm:text-sm">{fileName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/50">
            {[
              { id: 'diagram', label: 'Diagram', icon: DocumentTextIcon, config: getVisualConfig('diagram') },
              { id: 'infographic', label: 'Infographic', icon: ChartBarIcon, config: getVisualConfig('infographic') },
              { id: 'mindmap', label: 'Mind Map', icon: MapIcon, config: getVisualConfig('mindmap') },
              { id: 'flowchart', label: 'Flowchart', icon: ArrowPathIcon, config: getVisualConfig('flowchart') }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-100'
                      : 'border-transparent text-slate-500 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                  title={`${tab.label}: ${getVisualDescription(tab.id)}`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="max-h-[min(78vh,900px)] overflow-y-auto bg-slate-950 p-4 sm:p-6">
            {generatingAll && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">Building visuals from your document…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl border border-red-900/40 bg-red-950/25 p-5">
                <p className="text-sm font-medium text-red-200">Could not generate</p>
                <p className="mt-2 text-sm text-red-200/80">{error}</p>
                <button
                  type="button"
                  onClick={generateAllVisuals}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
                >
                  Try again
                </button>
              </div>
            )}

            {!generatingAll && !error && (
              <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
                {concepts ? (
                  <aside className="w-full shrink-0 space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300 lg:w-56">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">From your document</p>
                    <p className="text-sm font-medium text-emerald-100/95">{concepts.mainTopic}</p>
                    {concepts.keyConcepts?.length ? (
                      <ul className="space-y-1 border-t border-slate-800 pt-3">
                        {concepts.keyConcepts.slice(0, 8).map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono text-slate-600">{i + 1}.</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </aside>
                ) : null}
                <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-white p-4 text-gray-900 sm:p-5">
                  {getTabContent()}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/60 px-4 py-3 sm:px-6">
            <p className="text-xs text-slate-500">{concepts ? `Topic: ${concepts.mainTopic}` : ' '}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateAllVisuals}
                disabled={generatingAll}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-50 sm:text-sm"
              >
                {generatingAll ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                ) : (
                  <PhotoIcon className="h-4 w-4" />
                )}
                Refresh all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 sm:text-sm"
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
