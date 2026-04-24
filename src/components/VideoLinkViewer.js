'use client';

import React, { useState } from 'react';
import SequentialLearning from './SequentialLearning';
import GlobalLearning from './GlobalLearning';
import SensingLearning from './SensingLearning';
import IntuitiveLearning from './IntuitiveLearning';
import ActiveLearning from './ActiveLearning';
import ReflectiveLearning from './ReflectiveLearning';
import VisualDocxOverlay from './VisualDocxOverlay';
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
  const [showTranscript, setShowTranscript] = useState(false);

  // Active learning mode
  const [activeMode, setActiveMode] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);

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
    if (activeMode === modeKey) {
      setActiveMode(null);
      return;
    }
    setLoadingMode(modeKey);
    const text = await fetchTranscript();
    setLoadingMode(null);
    if (text) {
      setActiveMode(modeKey);
    }
  };

  const renderLearningMode = () => {
    if (!activeMode || !transcript) return null;
    const videoTitle = content?.title || platformLabel;
    const sharedProps = {
      isActive: true,
      docxContent: transcript,
      fileName: videoTitle,
      onClose: () => setActiveMode(null)
    };
    switch (activeMode) {
      case 'global': return <GlobalLearning {...sharedProps} />;
      case 'sequential': return <SequentialLearning {...sharedProps} />;
      case 'visual': return <VisualDocxOverlay {...sharedProps} />;
      case 'sensing': return <SensingLearning {...sharedProps} />;
      case 'intuitive': return <IntuitiveLearning {...sharedProps} />;
      case 'active': return <ActiveLearning {...sharedProps} />;
      case 'reflective': return <ReflectiveLearning {...sharedProps} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{content?.title || platformLabel}</h3>
            <p className="text-gray-400 text-xs">{platformLabel} • Video Link</p>
          </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open
        </a>
      </div>

      {/* Learning Mode Toolbar — YouTube always, non-YouTube only if description exists */}
      {(isYouTube || savedDescription) && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0 overflow-x-auto">
          <span className="text-gray-500 text-xs font-medium mr-1 flex-shrink-0">Learn:</span>
          {LEARNING_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => handleModeClick(mode.key)}
              disabled={loadingMode === mode.key || (isFetchingTranscript && loadingMode !== mode.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                activeMode === mode.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingMode === mode.key ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LearningModeToolbarIcon databaseMode={mode.db} className="w-3.5 h-3.5" />
              )}
              {mode.label}
            </button>
          ))}
          {/* Transcript toggle — YouTube only */}
          {isYouTube && (
            <button
              onClick={async () => {
                if (!transcript) await fetchTranscript();
                setShowTranscript(v => !v);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200 flex-shrink-0 ml-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Transcript
            </button>
          )}
        </div>
      )}

      {/* No description notice for non-YouTube without description */}
      {!isYouTube && !savedDescription && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/40 border-b border-amber-800/50 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-amber-300 text-xs">
            AI learning modes unavailable — instructor did not add a video description.
          </p>
        </div>
      )}

      {/* Transcript error */}
      {transcriptError && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-800 flex-shrink-0">
          <p className="text-red-300 text-xs">{transcriptError}</p>
        </div>
      )}

      {/* Main content area */}
      {activeMode ? (
        <div className="flex-1 min-h-0 overflow-auto bg-white">
          {renderLearningMode()}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Video player */}
          <div className={showTranscript ? 'h-[55%] flex-shrink-0' : 'flex-1'}>
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
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <h3 className="text-white font-semibold text-lg mb-2">Cannot embed this video</h3>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium">
                  Open Video
                </a>
              </div>
            )}
          </div>

          {/* Transcript panel */}
          {showTranscript && (
            <div className="flex-1 min-h-0 bg-gray-900 border-t border-gray-800 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-semibold">Transcript</span>
                  {transcriptSource && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      transcriptSource === 'captions' ? 'bg-green-800 text-green-300' :
                      transcriptSource === 'description' ? 'bg-blue-800 text-blue-300' :
                      'bg-amber-800 text-amber-300'
                    }`}>
                      {transcriptSource === 'captions' ? 'Full captions' :
                       transcriptSource === 'description' ? 'Instructor description' :
                       'Topic context'}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowTranscript(false)} className="text-gray-500 hover:text-gray-300 text-xs">
                  Hide
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {isFetchingTranscript ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Fetching transcript...
                  </div>
                ) : transcript ? (
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-sm">No transcript available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
