'use client';

import React, { useState, useEffect } from 'react';
import SequentialLearning from './SequentialLearning';
import GlobalLearning from './GlobalLearning';
import SensingLearning from './SensingLearning';
import IntuitiveLearning from './IntuitiveLearning';
import ActiveLearning from './ActiveLearning';
import ReflectiveLearning from './ReflectiveLearning';
import VisualDocxOverlay from './VisualDocxOverlay';
import MermaidDiagram from './MermaidDiagram';
import { LEARNING_MODE_LABELS } from '@/constants/learningModeLabels';
import { LearningModeToolbarIcon } from '@/constants/learningModeUi';

function extractYouTubeId(url) {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#\s]+)/);
  return match ? match[1] : null;
}

function getEmbedUrl(url) {
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
  const vimeoMatch = url?.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (/drive\.google\.com/.test(url || '')) {
    const driveMatch = url.match(/\/d\/([^/]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return null;
}
const LEARNING_MODES = [
  { key: 'global', db: 'Global Learning', label: LEARNING_MODE_LABELS['Global Learning'] },
  { key: 'sequential', db: 'Sequential Learning', label: LEARNING_MODE_LABELS['Sequential Learning'] },
  { key: 'visual', db: 'Visual Learning', label: LEARNING_MODE_LABELS['Visual Learning'] },
  { key: 'sensing', db: 'Hands-On Lab', label: LEARNING_MODE_LABELS['Hands-On Lab'] },
  { key: 'intuitive', db: 'Concept Constellation', label: LEARNING_MODE_LABELS['Concept Constellation'] },
  { key: 'active', db: 'Active Learning Hub', label: LEARNING_MODE_LABELS['Active Learning Hub'] },
  { key: 'reflective', db: 'Reflective Learning', label: LEARNING_MODE_LABELS['Reflective Learning'] },
];

export default function VideoLinkViewer({ content }) {
  const url = content?.url || content?.filePath || content?.cloudStorage?.url || '';
  const platform = content?.platform || content?.cloudStorage?.metadata?.platform || 'unknown';
  const platformLabel = { youtube: 'YouTube', gdrive: 'Google Drive', vimeo: 'Vimeo', direct: 'Video', unknown: 'Video' }[platform] || 'Video';
  const embedUrl = getEmbedUrl(url);
  // Direct video or unknown/other platform — use native <video> player
  const isDirectVideo = platform === 'direct' || platform === 'other' ||
    /\.(mp4|webm|mov|avi|mkv|ogv|wmv|flv|3gp|mpeg|mpg)(\?|#|$)/i.test(url || '');
  const isYouTube = platform === 'youtube' || !!extractYouTubeId(url);

  // For non-YouTube: use saved description as transcript context
  const savedDescription = content?.description ||
    content?.cloudStorage?.metadata?.videoDescription || '';

  // Transcript state
  const [transcript, setTranscript] = useState(
    // Pre-populate with saved description for non-YouTube
    !isYouTube && savedDescription ? savedDescription : ''
  );
  const [transcriptSource, setTranscriptSource] = useState(
    !isYouTube && savedDescription ? 'description' : ''
  );
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState('');

  // Active learning mode and right panel state
  const [activeMode, setActiveMode] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [rightPanelCache, setRightPanelCache] = useState({});
  const [rightPanelDismissed, setRightPanelDismissed] = useState(false);

  const fetchTranscript = async () => {
    if (transcript) return transcript;

    // Non-YouTube: use saved description
    if (!isYouTube) {
      if (savedDescription) {
        setTranscript(savedDescription);
        setTranscriptSource('description');
        return savedDescription;
      }
      return null;
    }

    // YouTube: fetch via API
    setIsFetchingTranscript(true);
    setTranscriptError('');
    try {
      const res = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url }),
      });
      const data = await res.json();
      if (!res.ok || !data.transcript) {
        throw new Error(data.error || 'Could not fetch transcript');
      }
      setTranscript(data.transcript);
      setTranscriptSource(data.source);
      return data.transcript;
    } catch (err) {
      setTranscriptError(err.message);
      return null;
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const handleModeClick = async (modeKey) => {
    // Check cache first
    if (rightPanelCache[modeKey]) {
      setActiveMode(modeKey);
      setRightPanelContent(rightPanelCache[modeKey]);
      return;
    }

    // If clicking the same mode, toggle it off
    if (activeMode === modeKey) {
      setActiveMode(null);
      setRightPanelContent(null);
      return;
    }

    setLoadingMode(modeKey);
    const text = await fetchTranscript();
    setLoadingMode(null);
    
    if (text) {
      setActiveMode(modeKey);
      // Generate content for right panel
      await generateRightPanelContent(modeKey, text);
    }
  };

  const generateRightPanelContent = async (modeKey, text) => {
    try {
      const mode = LEARNING_MODES.find(m => m.key === modeKey);
      if (!mode) return;

      const response = await fetch('/api/generate-cold-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: text, 
          mode: mode.db,
          title: content?.title || platformLabel
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const generatedContent = data.content || '';
        setRightPanelContent(generatedContent);
        
        // Store in cache
        setRightPanelCache(prev => ({
          ...prev,
          [modeKey]: generatedContent
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to generate content:', errorData);
        setRightPanelContent('Failed to generate content. Please try again.');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setRightPanelContent('Network error occurred. Please try again.');
    }
  };

  // Helper functions for parsing content (matching PdfPreviewWithAI)
  const stripColdStartDecorators = (value = '') => value
    .replace(/^[\s\u{1F300}-\u{1FAFF}❓💭💡✍️🔍🧠🔗🌐🔑📋🖼️📌🗂️🔄🎯🤔🌟🔬🛠️📊]+/gu, '')
    .trim();

  const normalizeColdStartLine = (value = '') => {
    const cleaned = value
      .replace(/\r/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s*/, '')
      .trim();

    return stripColdStartDecorators(cleaned);
  };

  const parseTaggedColdStartLine = (line) => {
    if (line.startsWith('SECTION_HEADER:')) {
      return { type: 'section', title: normalizeColdStartLine(line.replace('SECTION_HEADER:', '')) };
    }

    if (line.startsWith('EXAMPLE_CARD:') || line.startsWith('EXERCISE_BLOCK:') || line.startsWith('SCENARIO_BLOCK:') || line.startsWith('CARD:')) {
      const payload = line.replace(/^(EXAMPLE_CARD:|EXERCISE_BLOCK:|SCENARIO_BLOCK:|CARD:)/, '');
      const [title = '', description = ''] = payload.split('|');
      return {
        type: 'card',
        title: normalizeColdStartLine(title),
        description: normalizeColdStartLine(description)
      };
    }

    if (line.startsWith('STEP:')) {
      return { type: 'step', text: normalizeColdStartLine(line.replace('STEP:', '')) };
    }

    return null;
  };

  // Auto-load first learning mode when component mounts (like PDF Cold Start panel)
  useEffect(() => {
    if (!activeMode && !rightPanelDismissed && (isYouTube || savedDescription)) {
      // Auto-trigger the first mode (Global Learning)
      const firstMode = LEARNING_MODES[0];
      handleModeClick(firstMode.key);
    }
  }, [url]); // Trigger when URL changes (new video loaded)



  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header - Matching PDF Preview Style */}
      <div className="relative px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Platform Badge - Modern Style */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Title Section */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{content?.title || platformLabel}</h3>
              <p className="text-xs text-gray-500">{platformLabel} • Video Content</p>
            </div>
          </div>
          
          {/* Action Button */}
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </a>
        </div>
      </div>

      {/* Learning Mode Toolbar - Matching PDF Preview Style */}
      {(isYouTube || savedDescription) && (
        <div className="px-4 py-3 bg-white/60 backdrop-blur-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-semibold text-gray-600 mr-2 flex-shrink-0">Learning Modes:</span>
            {LEARNING_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => handleModeClick(mode.key)}
                disabled={loadingMode === mode.key || (isFetchingTranscript && loadingMode !== mode.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                  activeMode === mode.key
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingMode === mode.key ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LearningModeToolbarIcon databaseMode={mode.db} className="w-3.5 h-3.5" />
                )}
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No description notice for non-YouTube without description - Matching PDF Style */}
      {!isYouTube && !savedDescription && (
        <div className="mx-4 mt-3 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Learning Modes Unavailable</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              The instructor did not add a video description. AI learning modes require text content to generate personalized learning experiences.
            </p>
          </div>
        </div>
      )}

      {/* Transcript error - Matching PDF Style */}
      {transcriptError && (
        <div className="mx-4 mt-3 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Transcript Error</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{transcriptError}</p>
          </div>
        </div>
      )}

      {/* Main Split-Screen Content Area - Matching PDF Preview Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side: Video Player */}
        <div className={activeMode && !rightPanelDismissed ? 'flex-1 min-w-0' : 'flex-1'}>
          <div className="w-full h-full p-4">
            <div className="w-full h-full bg-black rounded-xl shadow-2xl overflow-hidden">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content?.title || platformLabel}
                />
              ) : isDirectVideo ? (
                <video controls className="w-full h-full object-contain bg-black" src={url}>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-2">Cannot embed this video</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-md">This video cannot be displayed directly. Click below to open it in a new tab.</p>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Video in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: AI-Generated Content Panel - Matching Cold Start Panel */}
        {activeMode && !rightPanelDismissed && (
          <div
            className="w-80 flex-shrink-0 bg-white flex flex-col backdrop-blur-sm border-l border-gray-200 shadow-xl"
            style={{ minWidth: '300px', maxWidth: '340px', height: '100%' }}
          >
            {/* Modern Header with Clean Design */}
            <div className="relative px-4 py-3 bg-gray-50/80 backdrop-blur-md border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center shadow-lg">
                    <LearningModeToolbarIcon databaseMode={LEARNING_MODES.find(m => m.key === activeMode)?.db} className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {LEARNING_MODES.find(m => m.key === activeMode)?.label}
                    </h3>
                    <p className="text-xs text-gray-500">AI-Generated Content</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveMode(null);
                    setRightPanelContent(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center justify-center shadow-sm"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modern Mode Switcher */}
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {LEARNING_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => handleModeClick(mode.key)}
                    disabled={loadingMode === mode.key}
                    className={`text-xs px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-200 font-medium ${
                      activeMode === mode.key 
                        ? 'bg-gray-900 text-white shadow-lg' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modern Content Area */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ minHeight: 0 }}
            >
              {loadingMode === activeMode || !rightPanelContent ? (
                <div className="p-4 space-y-4">
                  {/* Modern Loading Skeleton */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-lg animate-pulse w-2/3"></div>
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2.5">
                  {/* Special handling for Visual Learning mode - render Mermaid diagram */}
                  {activeMode === 'visual' ? (
                    (() => {
                      // Try to extract diagram code - look for flowchart/graph keywords
                      let diagramCode = '';
                      let descLines = [];
                      
                      // Check if content has DIAGRAM: marker
                      if (rightPanelContent.includes('DIAGRAM:')) {
                        const diagramMatch = rightPanelContent.match(/DIAGRAM:\s*([\s\S]*?)(?=DESCRIPTIONS:|$)/);
                        const descMatch = rightPanelContent.match(/DESCRIPTIONS:\s*([\s\S]*?)$/);
                        diagramCode = diagramMatch?.[1]?.trim() || '';
                        descLines = descMatch?.[1]?.trim().split('\n').filter((l) => l.trim()) || [];
                      } else {
                        // Try to find flowchart/graph code directly
                        const lines = rightPanelContent.split('\n');
                        let inDiagram = false;
                        let diagramLines = [];
                        
                        for (const line of lines) {
                          const trimmed = line.trim();
                          // Start of diagram
                          if (/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)/i.test(trimmed)) {
                            inDiagram = true;
                            diagramLines.push(trimmed);
                          } else if (inDiagram) {
                            // Check if line looks like diagram syntax (has arrows, brackets, etc.)
                            if (/[\[\]\(\)\{\}]|-->|---|-\.-|==>|===/.test(trimmed) || /^\s+[A-Z]/.test(line)) {
                              diagramLines.push(line); // Keep original indentation
                            } else if (trimmed.length === 0) {
                              // Empty line might end diagram
                              if (diagramLines.length > 1) {
                                break;
                              }
                            } else {
                              // Non-diagram line, stop
                              break;
                            }
                          }
                        }
                        
                        diagramCode = diagramLines.join('\n');
                      }

                      // Clean up diagram code - remove emojis and extra text
                      diagramCode = diagramCode
                        .replace(/^[\s\u{1F300}-\u{1FAFF}❓💭💡✍️🔍🧠🔗🌐🔑📋🖼️📌🗂️🔄🎯🤔🌟🔬🛠️📊]+/gmu, '')
                        .replace(/🌐 BIG PICTURE[\s\S]*?(?=flowchart|graph|sequenceDiagram|classDiagram)/i, '')
                        .replace(/🔑 KEY CONCEPTS[\s\S]*?(?=flowchart|graph|sequenceDiagram|classDiagram)/i, '')
                        .replace(/🔗 HOW THEY CONNECT[\s\S]*?(?=flowchart|graph|sequenceDiagram|classDiagram)/i, '')
                        .trim();

                      return (
                        <div className="space-y-3">
                          {diagramCode && (
                            <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm" style={{ minHeight: '220px' }}>
                              <MermaidDiagram chart={diagramCode} />
                            </div>
                          )}

                          {descLines.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Diagram Concepts</p>
                              {descLines.map((line, i) => {
                                const colonIdx = line.indexOf(':');
                                if (colonIdx === -1) return null;
                                const desc = normalizeColdStartLine(line.slice(colonIdx + 1).replace(/^\[|\]$/g, ''));
                                const nodeId = normalizeColdStartLine(line.slice(0, colonIdx));
                                const nodeLabel = normalizeColdStartLine(diagramCode.match(new RegExp(`${nodeId}\\[([^\\]]+)\\]`))?.[1] || nodeId);

                                return (
                                  <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                                    <p className="text-xs font-semibold text-gray-800">{nodeLabel}</p>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{desc}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    /* Regular text-based content for other modes */
                    rightPanelContent.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;

                      // Check for tagged lines first
                      const taggedLine = parseTaggedColdStartLine(trimmed);
                      if (taggedLine?.type === 'section') {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <h3 className="text-xs font-semibold tracking-wide text-gray-800 uppercase">{taggedLine.title}</h3>
                          </div>
                        );
                      }

                      if (taggedLine?.type === 'card') {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                            {taggedLine.title && <h4 className="text-xs font-semibold text-gray-900">{taggedLine.title}</h4>}
                            {taggedLine.description && <p className="text-xs text-gray-600 leading-relaxed mt-1">{taggedLine.description}</p>}
                          </div>
                        );
                      }

                      if (taggedLine?.type === 'step') {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                            <p className="text-xs text-gray-700 leading-relaxed">{taggedLine.text}</p>
                          </div>
                        );
                      }

                      // Normalize the line to remove markdown formatting
                      const normalized = normalizeColdStartLine(trimmed);
                      if (!normalized) return null;

                      // Check for markdown table rows
                      if (normalized.includes('|')) {
                        // This is a table row - render as a simple table-like card
                        const cells = normalized.split('|').map(cell => cell.trim()).filter(cell => cell && cell !== '---');
                        if (cells.length > 0) {
                          return (
                            <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <div className="flex gap-2 text-xs">
                                {cells.map((cell, idx) => (
                                  <span key={idx} className={`flex-1 ${idx === 0 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                    {cell}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }

                      // Section headers (all caps or ending with colon)
                      if (/^[A-Z][A-Z\s&-]{3,}$/.test(normalized) || /^.+:\s*$/.test(normalized)) {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <h3 className="text-xs font-semibold tracking-wide text-gray-800 uppercase">
                              {normalized.replace(/:\s*$/, '')}
                            </h3>
                          </div>
                        );
                      }

                      // Numbered steps
                      const stepMatch = normalized.match(/^Step\s+(\d+):\s*(.*)$/i);
                      if (stepMatch) {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                            <p className="text-xs font-semibold text-gray-800">Step {stepMatch[1]}</p>
                            <p className="text-xs text-gray-600 leading-relaxed mt-1">{normalizeColdStartLine(stepMatch[2])}</p>
                          </div>
                        );
                      }

                      // Bullet points
                      if (/^[•\-]\s+/.test(normalized)) {
                        return (
                          <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-xs text-gray-700 leading-relaxed">{normalized.replace(/^[•\-]\s+/, '')}</p>
                          </div>
                        );
                      }

                      // Regular content
                      return (
                        <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                          <p className="text-xs text-gray-700 leading-relaxed">{normalized}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modern Footer */}
            <div className="px-4 py-3 bg-gray-50 backdrop-blur-sm border-t border-gray-100">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-500 font-medium">Switch between learning modes above</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
