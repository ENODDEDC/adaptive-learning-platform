'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  DocumentIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import PowerPointViewer from './PowerPointViewer';
import EnhancedPDFViewer from './EnhancedPDFViewer';
import AITutorModal from './AITutorModal';
import DocxPreviewWithAI from './DocxPreviewWithAI';
import PdfPreviewWithAI from './PdfPreviewWithAI';
import fileContentCache from '@/utils/fileContentCache';
import { getAttachmentFileUrl } from '@/utils/thumbnailUtils';

// --- Helper Functions ---
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const calculateReadTime = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, '');
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = wordCount / wordsPerMinute;
  return Math.ceil(minutes);
};

const generateHeadingId = (text, index) => {
  const safeText = text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-');
  return `heading-${index}-${safeText}`;
};

// Enhanced CSS overrides for better DOCX formatting and readability
const injectOverrideStyles = (rawHtml) => {
  const overrideCss = `
    :root {
      color-scheme: light;
      --doc-bg: #eef2f7;
      --paper-bg: #ffffff;
      --paper-border: #d9e2ec;
      --paper-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      --text-primary: #1f2937;
      --text-secondary: #374151;
      --text-muted: #6b7280;
      --rule: #dbe3ee;
      --accent: #2563eb;
      --quote-bg: #f8fbff;
      --table-head: #f6f8fb;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: linear-gradient(180deg, #f4f7fb 0%, var(--doc-bg) 100%);
      width: 100% !important;
      max-width: 100% !important;
      min-height: 100% !important;
      overflow-x: hidden !important;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 17px;
      line-height: 1.72;
      color: var(--text-secondary);
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    * {
      box-sizing: border-box !important;
      max-width: 100% !important;
    }

    .reader-container {
      width: min(960px, calc(100% - 48px)) !important;
      min-width: 0 !important;
      margin: 28px auto 40px auto !important;
      padding: 56px 72px !important;
      background: var(--paper-bg);
      border: 1px solid var(--paper-border);
      border-radius: 20px;
      box-shadow: var(--paper-shadow);
      overflow-x: hidden !important;
    }

    .reader-container,
    .reader-container * {
      width: auto !important;
      overflow-x: visible !important;
    }

    .reader-container .document-content {
      max-width: 100%;
    }

    .reader-container h1,
    .reader-container h2,
    .reader-container h3,
    .reader-container h4,
    .reader-container h5,
    .reader-container h6,
    .reader-container p,
    .reader-container li,
    .reader-container td,
    .reader-container th,
    .reader-container blockquote,
    .reader-container figure,
    .reader-container figcaption {
      text-align: left !important;
    }

    .reader-container p,
    .reader-container .document-paragraph {
      margin: 0 0 1.05em 0;
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.76;
      word-break: break-word;
    }

    .reader-container p:first-of-type,
    .reader-container .document-paragraph:first-of-type {
      margin-top: 0;
    }

    .reader-container h1,
    .reader-container .document-title {
      margin: 0 0 1.2em 0;
      padding: 0 0 0.45em 0;
      font-family: 'Segoe UI', 'Inter', sans-serif;
      font-size: clamp(2rem, 3vw, 2.6rem);
      line-height: 1.16;
      font-weight: 700;
      color: var(--text-primary);
      border-bottom: 1px solid var(--rule);
      letter-spacing: -0.03em;
    }

    .reader-container h2,
    .reader-container .section-heading {
      margin: 2em 0 0.75em 0;
      padding-bottom: 0.3em;
      font-family: 'Segoe UI', 'Inter', sans-serif;
      font-size: clamp(1.45rem, 2.1vw, 1.8rem);
      line-height: 1.26;
      font-weight: 650;
      color: var(--text-primary);
      border-bottom: 1px solid var(--rule);
      letter-spacing: -0.02em;
    }

    .reader-container h3,
    .reader-container .subsection-heading {
      margin: 1.65em 0 0.55em 0;
      font-family: 'Segoe UI', 'Inter', sans-serif;
      font-size: 1.2rem;
      line-height: 1.34;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    .reader-container h4,
    .reader-container h5,
    .reader-container h6 {
      margin: 1.4em 0 0.45em 0;
      font-family: 'Segoe UI', 'Inter', sans-serif;
      font-size: 1.02rem;
      line-height: 1.4;
      font-weight: 600;
      color: var(--text-primary);
    }

    .reader-container ul,
    .reader-container ol,
    .reader-container .document-list {
      margin: 0.8em 0 1.1em 0;
      padding-left: 1.45em;
    }

    .reader-container li,
    .reader-container .document-list li {
      margin: 0.3em 0;
      line-height: 1.7;
    }

    .reader-container li p,
    .reader-container .list-paragraph {
      margin: 0.25em 0;
    }

    .reader-container blockquote {
      margin: 1.5em 0;
      padding: 1em 1.15em;
      background: var(--quote-bg);
      border-left: 3px solid var(--accent);
      border-radius: 12px;
      color: var(--text-secondary);
      font-style: italic;
    }

    .reader-container blockquote::before {
      content: none;
    }

    .reader-container blockquote p {
      margin: 0;
      padding-left: 0;
    }

    .reader-container table,
    .reader-container .document-table {
      width: 100%;
      margin: 1.5em 0;
      border-collapse: collapse;
      border: 1px solid var(--paper-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: none;
      background: #fff;
    }

    .reader-container table th {
      padding: 0.8em 0.95em;
      background: var(--table-head);
      border-bottom: 1px solid var(--paper-border);
      font-family: 'Segoe UI', 'Inter', sans-serif;
      font-weight: 600;
      color: var(--text-primary);
    }

    .reader-container table td {
      padding: 0.8em 0.95em;
      border-bottom: 1px solid #e9eef5;
      color: var(--text-secondary);
      vertical-align: top;
    }

    .reader-container table tr:last-child td {
      border-bottom: none;
    }

    .reader-container pre {
      margin: 1.4em 0;
      padding: 1em 1.15em;
      border-radius: 12px;
      background: #111827;
      color: #f3f4f6;
      overflow-x: auto;
      font-size: 0.92rem;
      line-height: 1.65;
      box-shadow: none;
    }

    .reader-container code {
      padding: 0.15em 0.4em;
      border-radius: 6px;
      background: #f3f4f6;
      color: #374151;
      font-size: 0.92em;
      font-family: 'Consolas', 'Courier New', monospace;
    }

    .reader-container pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }

    .reader-container a {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 2px;
      border-bottom: none;
    }

    .reader-container a:hover {
      background: transparent;
      padding: 0;
      border-radius: 0;
    }

    .reader-container img,
    .reader-container video,
    .reader-container canvas,
    .reader-container svg,
    .reader-container .document-image {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1.35em auto;
      border: 1px solid var(--paper-border);
      border-radius: 14px;
      box-shadow: none;
      background: #fff;
    }

    .reader-container strong,
    .reader-container b {
      color: var(--text-primary);
      font-weight: 700;
    }

    .reader-container em,
    .reader-container i,
    .reader-container .subtitle {
      color: var(--text-muted);
      font-style: italic;
    }

    .reader-container hr {
      height: 1px;
      margin: 2em 0;
      border: none;
      background: var(--rule);
    }

    .reader-container .empty-paragraph {
      height: 0.55em;
      margin: 0;
    }

    .reader-container .intense {
      margin: 1.2em 0;
      padding: 1em 1.1em;
      background: #f8fbff;
      border: 1px solid #dbeafe;
      border-left: 3px solid var(--accent);
      border-radius: 12px;
    }

    .reader-container *:focus {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }

    .reader-container ::selection {
      background: rgba(37, 99, 235, 0.16);
      color: var(--text-primary);
    }

    @media (max-width: 900px) {
      .reader-container {
        width: calc(100% - 24px) !important;
        margin: 12px auto 20px auto !important;
        padding: 28px 20px !important;
        border-radius: 16px;
      }

      .reader-container h1,
      .reader-container .document-title {
        font-size: 1.7rem;
      }

      .reader-container h2,
      .reader-container .section-heading {
        font-size: 1.35rem;
      }

      .reader-container p,
      .reader-container .document-paragraph {
        font-size: 0.98rem;
      }
    }

    @media print {
      html, body {
        background: white !important;
      }

      .reader-container {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    }
  `;

  const wrapScript = `
    <script>
      (function() {
        function removeLeadingEyebrow(container) {
          var headings = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6'));
          if (headings.length < 2) return;
          var first = headings[0];
          var second = headings[1];
          var firstLevel = parseInt(first.tagName.replace('H', ''), 10);
          var secondLevel = parseInt(second.tagName.replace('H', ''), 10);
          if (Number.isNaN(firstLevel) || Number.isNaN(secondLevel)) return;
          if (firstLevel <= secondLevel) return;
          var firstText = (first.textContent || '').trim();
          if (!firstText || firstText.length > 120) return;
          first.remove();
        }

        function wrap() {
          if (document.getElementById('reader-container')) return;
          var container = document.createElement('div');
          container.id = 'reader-container';
          container.className = 'reader-container';
          var body = document.body;
          var nodes = Array.from(body.childNodes).filter(function(n){ return !(n.tagName && (n.tagName.toLowerCase() === 'script' || n.tagName.toLowerCase() === 'style')); });
          nodes.forEach(function(n){ container.appendChild(n); });
          body.appendChild(container);
          removeLeadingEyebrow(container);
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', wrap);
        } else {
          wrap();
        }
      })();
    </script>
  `;

  if (rawHtml.includes('</head>')) {
    return rawHtml.replace('</head>', `<style>${overrideCss}</style></head>`).replace('</body>', `${wrapScript}</body>`);
  }
  if (rawHtml.includes('</body>')) {
    return rawHtml.replace('</body>', `<style>${overrideCss}</style>${wrapScript}</body>`);
  }
  // Fallback: wrap as full document
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${overrideCss}</style></head><body>${rawHtml}${wrapScript}</body></html>`;
};

// --- Attachment Preview Component ---
const AttachmentPreviewContent = ({ attachment, disableTools = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);
  const [headings, setHeadings] = useState([]);
  const [notes, setNotes] = useState([]);

  const headingsWithNotes = useMemo(() => {
    const headingIds = new Set();
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        if (note.contextualId) {
          headingIds.add(note.contextualId);
        }
      });
    }
    return headingIds;
  }, [notes]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileTypeInfo = (mimeType, fileName) => {
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      return { type: 'image', icon: '🖼️', category: 'Image' };
    }
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
      return { type: 'video', icon: '🎥', category: 'Video' };
    }
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(fileExtension)) {
      return { type: 'audio', icon: '🎵', category: 'Audio' };
    }
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      return { type: 'pdf', icon: '📄', category: 'PDF Document' };
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
      return { type: 'docx', icon: '📝', category: 'Word Document' };
    }
    if (mimeType?.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(fileExtension)) {
      return { type: 'text', icon: '📝', category: 'Text File' };
    }
    return { type: 'unknown', icon: '📄', category: 'File' };
  };

  useEffect(() => {
    if (!attachment) return;

    const processContent = async () => {
      if (attachment && attachment.contentType === 'docx' && attachment._id) {
        const fetchNotesForContent = async () => {
          try {
            const response = await fetch(`/api/notes?contentId=${attachment._id}`);
            if (response.ok) {
              const fetchedNotes = await response.json();
              setNotes(fetchedNotes.notes || []);
            }
          } catch (error) {
            console.error('Failed to fetch notes for attachment:', error);
          }
        };
        fetchNotesForContent();
      }
      setIsLoading(true);
      setError(null);
      setHtmlContent('');

      const isWordDocument = attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const fileInfo = getFileTypeInfo(attachment.mimeType, attachment.title || attachment.originalName);
      
      if (isWordDocument) {
        try {
          console.log('🔍 Processing Word document:', attachment);
          
          // Validate that we have some way to access the file
          if (!attachment.filePath && !attachment.url && !attachment.cloudStorage?.key) {
            throw new Error('File location not found. The attachment is missing required file location properties.');
          }
          
          // Check if this is a Backblaze B2 file (URL contains /api/files/)
          console.log('🔍 Attachment object:', attachment);
          console.log('🔍 Attachment URL:', attachment.url);
          console.log('🔍 Attachment filePath:', attachment.filePath);
          console.log('🔍 Attachment cloudStorage:', attachment.cloudStorage);
          
          // Check both url and filePath for Backblaze B2 files
          // Priority: cloudStorage.url > url > filePath
          const fileUrl = getAttachmentFileUrl(attachment);
          const fileKey = attachment.cloudStorage?.key;
          
          const isBackblazeFile = (fileUrl && fileUrl.includes('/api/files/')) || fileKey;
          console.log('🔍 File URL to check:', fileUrl);
          console.log('🔍 File key:', fileKey);
          console.log('🔍 Is Backblaze file:', isBackblazeFile);
          
          let response;
          
          if (isBackblazeFile) {
            // Extract file key from URL or use direct cloudStorage key
            let extractedKey = fileKey;
            
            if (!extractedKey && fileUrl) {
              const urlParts = fileUrl.split('/api/files/');
              console.log('🔍 URL parts:', urlParts);
              extractedKey = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;
            }
            
            console.log('🔍 Extracted file key:', extractedKey);
            
            if (!extractedKey) {
              throw new Error('Could not extract file key from attachment');
            }
            
            console.log('🔍 Converting Backblaze B2 Word document with key:', extractedKey);
            
            response = await fetch('/api/docx-extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fileKey: extractedKey }),
            });
            
            if (!response.ok) {
              let errorDetails = `Server error: ${response.statusText}`;
              try {
                const responseText = await response.text();
                console.error('🔍 Raw error response (attachment):', responseText);
                
                if (responseText) {
                  try {
                    const errData = JSON.parse(responseText);
                    console.error('🔍 Parsed error response (attachment):', errData);
                    errorDetails = errData.message || errData.error || errorDetails;
                    
                    // Add more context to the error
                    if (errData.fileKey) {
                      errorDetails += ` (File key: ${errData.fileKey})`;
                    }
                  } catch (parseError) {
                    console.error('🔍 Could not parse error response as JSON (attachment):', parseError);
                    errorDetails = responseText || errorDetails;
                  }
                } else {
                  console.error('🔍 Empty response from server');
                  errorDetails = 'Empty error response from server. Please check if the file exists and you have permission to access it.';
                }
              } catch (textError) {
                console.error('🔍 Could not read error response as text (attachment):', textError);
              }
              throw new Error(errorDetails);
            }
            
            let result;
            try {
              const responseText = await response.text();
              console.log('🔍 Raw success response (attachment):', responseText);
              
              if (!responseText) {
                throw new Error('Empty response from conversion API');
              }
              
              result = JSON.parse(responseText);
              console.log('🔍 Parsed success response (attachment):', result);
            } catch (jsonError) {
              console.error('🔍 Could not parse success response as JSON (attachment):', jsonError);
              throw new Error('Invalid JSON response from conversion API');
            }
            const html = result.html || result.content?.html;
            
            if (html) {
              // Create a temporary element to extract headings from the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
              const extractedHeadings = Array.from(headingElements).map((heading, index) => {
                const id = `heading-${index}`;
                heading.id = id;
                return {
                  id,
                  text: cleanHeadingText(heading.textContent),
                  level: parseInt(heading.tagName.substring(1)),
                };
              });
              setHeadings(extractedHeadings);
              setHtmlContent(html);
            } else {
              throw new Error('Conversion returned empty HTML.');
            }
          } else {
            // Legacy local file conversion
            const conversionApiUrl = `/api/convert-docx?filePath=${encodeURIComponent(attachment.filePath.replace(window.location.origin, ''))}`;
            response = await fetch(conversionApiUrl);
            
            if (!response.ok) {
              let errorDetails = `Server error: ${response.statusText}`;
              try {
                const errData = await response.json();
                errorDetails = errData.details || errData.error || errorDetails;
              } catch (jsonError) {
                // Ignore if the error response is not JSON
              }
              throw new Error(errorDetails);
            }
            
            const html = await response.text();
            if (html) {
              // Create a temporary element to extract headings from the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
              const extractedHeadings = Array.from(headingElements).map((heading, index) => {
                const id = `heading-${index}`;
                heading.id = id;
                return {
                  id,
                  text: cleanHeadingText(heading.textContent),
                  level: parseInt(heading.tagName.substring(1)),
                };
              });
              setHeadings(extractedHeadings);
              setHtmlContent(html);
            } else {
              throw new Error('Conversion returned empty HTML.');
            }
          }
        } catch (err) {
          console.error('Error fetching or converting docx:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else if (fileInfo.type === 'text') {
        try {
          const response = await fetch(attachment.filePath);
          if (!response.ok) {
            throw new Error(`Failed to load file: ${response.statusText}`);
          }
          const text = await response.text();
          const html = `
            <html>
              <head>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    font-size: 16px; 
                    line-height: 1.6; 
                    margin: 0; 
                    padding: 40px; 
                    background: #fff;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                  }
                  pre { 
                    background: #f8f9fa; 
                    border: 1px solid #e1e5e9; 
                    border-radius: 8px; 
                    padding: 20px; 
                    overflow-x: auto; 
                    white-space: pre-wrap;
                    word-wrap: break-word;
                  }
                </style>
              </head>
              <body>
                <pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              </body>
            </html>
          `;
          setHtmlContent(html);
        } catch (err) {
          console.error('Error loading text file:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    processContent();
  }, [attachment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-6 bg-red-50 rounded-lg"><strong>Error:</strong> {error}</div>;
  }

  const fileInfo = getFileTypeInfo(attachment.mimeType, attachment.title || attachment.originalName);
  const fileSize = attachment.fileSize ? formatFileSize(attachment.fileSize) : 'Unknown size';

  switch (fileInfo.type) {
    case 'image':
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={getAttachmentFileUrl(attachment)} 
            alt={attachment.title || 'Image'} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );

    case 'video':
      return (
        <div className="flex items-center justify-center h-full">
          <video 
            controls 
            className="w-full max-h-full rounded-lg bg-black"
            src={getAttachmentFileUrl(attachment)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );

    case 'audio':
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{fileInfo.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{attachment.title || 'Audio'}</h3>
              <p className="text-gray-600 mb-4">{fileInfo.category} • {fileSize}</p>
            </div>
            <audio 
              controls 
              className="w-full mb-4"
              src={getAttachmentFileUrl(attachment)}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );

    case 'pdf':
      return (
        <PdfPreviewWithAI
          content={attachment}
          pdfUrl={getAttachmentFileUrl(attachment)}
          notes={notes}
          injectOverrideStyles={injectOverrideStyles}
          disableTools={disableTools}
        />
      );

    case 'docx':
      return (
        <DocxPreviewWithAI
          content={attachment}
          htmlContent={htmlContent}
          headings={headings}
          notes={notes}
          headingsWithNotes={headingsWithNotes}
          injectOverrideStyles={injectOverrideStyles}
          disableTools={disableTools}
        />
      );

    case 'text':
      return (
        <iframe
          className="w-full h-full border-0"
          title={attachment.title}
          srcDoc={injectOverrideStyles(htmlContent)}
        />
      );

    case 'pptx':
    case 'ppt':
      const EnhancedPowerPointViewer = dynamic(() => import('./EnhancedPowerPointViewer'), {
        loading: () => <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      });
      return (
        <EnhancedPowerPointViewer
          filePath={getAttachmentFileUrl(attachment) ? getAttachmentFileUrl(attachment).replace(window.location.origin, '') : ''}
          fileName={attachment.title || attachment.originalName}
          onClose={() => {}}
          isModal={false}
        />
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-6xl mb-6">{fileInfo.icon}</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{attachment.title || 'File'}</h3>
          <p className="text-gray-600 mb-6">{fileInfo.category} • {fileSize}</p>
          
          <div className="space-y-4 max-w-md">
            <p className="text-gray-500">
              This file type cannot be previewed directly in the browser.
            </p>
            
            <div className="flex gap-3 justify-center">
              {getAttachmentFileUrl(attachment) && (
                <a 
                  href={getAttachmentFileUrl(attachment)} 
                  download 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Download File
                </a>
              )}
            </div>
          </div>
        </div>
      );
  }
};

// --- Main Component ---
const ContentViewer = ({ content, onClose, isModal = true, disableTools = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const contentRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const iframeRef = useRef(null);

  const iframeSrcDoc = useMemo(() => (htmlContent ? injectOverrideStyles(htmlContent) : ''), [htmlContent]);

  useEffect(() => {
    if (content && content.contentType === 'docx' && content._id) {
      const fetchNotesForContent = async () => {
        try {
          const response = await fetch(`/api/notes?contentId=${content._id}`);
          if (response.ok) {
            const fetchedNotes = await response.json();
            setNotes(fetchedNotes.notes || []);
          }
        } catch (error) {
          console.error('Failed to fetch notes for content:', error);
        }
      };
      fetchNotesForContent();
    }
  }, [content]);

  const headingsWithNotes = useMemo(() => {
    const headingIds = new Set();
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        if (note.contextualId) {
          headingIds.add(note.contextualId);
        }
      });
    }
    return headingIds;
  }, [notes]);

  useEffect(() => {
    if (!content) return;

    const processContent = async () => {
      setIsLoading(true);
      setError(null);
      setHtmlContent('');
      setHeadings([]);

      const isWordDocument = content.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const fileInfo = getFileTypeInfo(content.mimeType, content.title || content.originalName);

      if (isWordDocument) {
        try {
          console.log('🔍 Processing Word document (content):', content);
          console.log('🔍 Content object details:', {
            url: content.url,
            filePath: content.filePath,
            cloudStorage: content.cloudStorage,
            mimeType: content.mimeType
          });
          
          // Validate that we have some way to access the file
          if (!content.filePath && !content.url && !content.cloudStorage?.key) {
            throw new Error('File location not found. The content is missing required file location properties.');
          }
          
          // Check if this is a Backblaze B2 file (URL contains /api/files/)
          // Priority: cloudStorage.url > url > filePath
          const fileUrl = getAttachmentFileUrl(content);
          const fileKey = content.cloudStorage?.key;
          
          const isBackblazeFile = (fileUrl && fileUrl.includes('/api/files/')) || fileKey;
          console.log('🔍 File URL to check (content):', fileUrl);
          console.log('🔍 File key (content):', fileKey);
          console.log('🔍 Is Backblaze file (content):', isBackblazeFile);
          
          let response;
          
          if (isBackblazeFile) {
            // Extract file key from URL or use direct cloudStorage key
            let extractedKey = fileKey;
            
            if (!extractedKey && fileUrl) {
              const urlParts = fileUrl.split('/api/files/');
              console.log('🔍 URL parts (content):', urlParts);
              extractedKey = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;
            }
            
            console.log('🔍 Extracted file key (content):', extractedKey);
            
            if (!extractedKey) {
              throw new Error('Could not extract file key from content');
            }
            
            console.log('🔍 Converting Backblaze B2 Word document with key (content):', extractedKey);
            
            response = await fetch('/api/docx-extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fileKey: extractedKey }),
            });
            
            if (!response.ok) {
              let errorDetails = `Server error: ${response.statusText}`;
              try {
                const responseText = await response.text();
                console.error('🔍 Raw error response:', responseText);
                
                if (responseText) {
                  try {
                    const errData = JSON.parse(responseText);
                    console.error('🔍 Parsed error response:', errData);
                    errorDetails = errData.message || errData.error || errorDetails;
                    
                    // Add more context to the error
                    if (errData.fileKey) {
                      errorDetails += ` (File key: ${errData.fileKey})`;
                    }
                  } catch (parseError) {
                    console.error('🔍 Could not parse error response as JSON:', parseError);
                    errorDetails = responseText || errorDetails;
                  }
                } else {
                  console.error('🔍 Empty response from server (content)');
                  errorDetails = 'Empty error response from server. Please check if the file exists and you have permission to access it.';
                }
              } catch (textError) {
                console.error('🔍 Could not read error response as text:', textError);
              }
              throw new Error(errorDetails);
            }
            
            let result;
            try {
              const responseText = await response.text();
              console.log('🔍 Raw success response:', responseText);
              
              if (!responseText) {
                throw new Error('Empty response from conversion API');
              }
              
              result = JSON.parse(responseText);
              console.log('🔍 Parsed success response:', result);
            } catch (jsonError) {
              console.error('🔍 Could not parse success response as JSON:', jsonError);
              throw new Error('Invalid JSON response from conversion API');
            }
            const html = result.html || result.content?.html;
            
            if (html) {
              // Create a temporary element to extract headings from the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
              const extractedHeadings = Array.from(headingElements).map((heading, index) => {
                const id = generateHeadingId(heading.textContent, index);
                heading.id = id; // Add ID to the element itself for scrolling
                return {
                  id,
                  text: cleanHeadingText(heading.textContent),
                  level: parseInt(heading.tagName.substring(1)),
                };
              });
              setHeadings(extractedHeadings);
              // Keep the raw HTML intact so we can render it inside an isolated iframe via srcDoc
              setHtmlContent(html);
            } else {
              throw new Error('Conversion returned empty HTML.');
            }
          } else {
            // Legacy local file conversion
            const conversionApiUrl = `/api/convert-docx?filePath=${encodeURIComponent(content.filePath.replace(window.location.origin, ''))}`;
            response = await fetch(conversionApiUrl);
            
            if (!response.ok) {
              // Try to get error details from JSON, otherwise use status text
              let errorDetails = `Server error: ${response.statusText}`;
              try {
                const errData = await response.json();
                errorDetails = errData.details || errData.error || errorDetails;
              } catch (jsonError) {
                // Ignore if the error response is not JSON
              }
              throw new Error(errorDetails);
            }
            
            const html = await response.text(); // The API returns full HTML (may contain <head> with styles)

            if (html) {
              // Create a temporary element to extract headings from the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
              const extractedHeadings = Array.from(headingElements).map((heading, index) => {
                const id = generateHeadingId(heading.textContent, index);
                heading.id = id; // Add ID to the element itself for scrolling
                return {
                  id,
                  text: cleanHeadingText(heading.textContent),
                  level: parseInt(heading.tagName.substring(1)),
                };
              });
              setHeadings(extractedHeadings);
              // Keep the raw HTML intact so we can render it inside an isolated iframe via srcDoc
              setHtmlContent(html);
            } else {
              throw new Error('Conversion returned empty HTML.');
            }
          }
        } catch (err) {
          console.error('Error fetching or converting docx:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else if (fileInfo.type === 'text' || fileInfo.type === 'code') {
        // Handle text and code files
        try {
          const fileUrl = getAttachmentFileUrl(content);
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to load file: ${response.statusText}`);
          }
          
          const text = await response.text();
          
          // Create HTML with syntax highlighting for code files
          let html = '';
          if (fileInfo.type === 'code') {
            // For code files, wrap in pre with basic styling
            html = `
              <html>
                <head>
                  <style>
                    body { 
                      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                      font-size: 14px; 
                      line-height: 1.5; 
                      margin: 0; 
                      padding: 20px; 
                      background: #f8f9fa;
                      color: #333;
                    }
                    pre { 
                      background: #fff; 
                      border: 1px solid #e1e5e9; 
                      border-radius: 8px; 
                      padding: 20px; 
                      overflow-x: auto; 
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    }
                    .line-numbers {
                      counter-reset: line;
                    }
                    .line-numbers .line {
                      counter-increment: line;
                      position: relative;
                      padding-left: 3em;
                    }
                    .line-numbers .line:before {
                      content: counter(line);
                      position: absolute;
                      left: 0;
                      color: #999;
                      font-size: 12px;
                      width: 2em;
                      text-align: right;
                    }
                  </style>
                </head>
                <body>
                  <pre class="line-numbers">${text.split('\n').map(line => `<span class="line">${escapeHtml(line)}</span>`).join('\n')}</pre>
                </body>
              </html>
            `;
          } else {
            // For text files, simple formatting
            html = `
              <html>
                <head>
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                      font-size: 16px; 
                      line-height: 1.6; 
                      margin: 0; 
                      padding: 40px; 
                      background: #fff;
                      color: #333;
                      max-width: 800px;
                      margin: 0 auto;
                    }
                    pre { 
                      background: #f8f9fa; 
                      border: 1px solid #e1e5e9; 
                      border-radius: 8px; 
                      padding: 20px; 
                      overflow-x: auto; 
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    }
                  </style>
                </head>
                <body>
                  <pre>${escapeHtml(text)}</pre>
                </body>
              </html>
            `;
          }
          
          setHtmlContent(html);
        } catch (err) {
          console.error('Error loading text file:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    processContent();
  }, [content]);

  // Scroll Progress Effect
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentEl;
      const progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 100;
      setScrollProgress(progress);
    };

    contentEl.addEventListener('scroll', handleScroll);
    return () => contentEl.removeEventListener('scroll', handleScroll);
  }, [htmlContent]); // Rerun when HTML content is available

  // Effect for handling text selection and highlighting
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const highlightNotes = (notes) => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      notes.forEach(note => {
        if (note.contextualId) {
          const element = iframeDoc.getElementById(note.contextualId);
          if (element) {
            element.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'; // purple-400 with opacity
          }
        }
      });
    };

    const handleSelection = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const selection = iframeDoc.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text: selection.toString(),
          rect: {
            top: rect.top + iframe.offsetTop,
            left: rect.left + iframe.offsetLeft,
            width: rect.width,
            height: rect.height,
          },
          range,
        });
      } else {
        setSelection(null);
      }
    };

    const iframeDoc = iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.addEventListener('mouseup', handleSelection);
    }

    return () => {
      if (iframeDoc) {
        iframeDoc.removeEventListener('mouseup', handleSelection);
      }
    };
  }, [htmlContent]);

  if (!content) return null;

  const readTime = calculateReadTime(htmlContent);
  const IconComponent = content.contentType === 'video' ? VideoCameraIcon : content.contentType === 'audio' ? SpeakerWaveIcon : DocumentIcon;
  const colorClasses = content.contentType === 'video' ? 'text-red-600 bg-red-100' : content.contentType === 'audio' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Normalize heading text for TOC: strip leading numbering like "1.", "1.2.", "1)"
  const cleanHeadingText = (text) => {
    if (!text) return '';
    return text.replace(/^\s*\d+(?:\.\d+)*[.)]?\s+/, '').trim();
  };

  const getFileTypeInfo = (mimeType, fileName) => {
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();


    // Image types
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      return { type: 'image', icon: '🖼️', category: 'Image' };
    }

    // Video types
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
      return { type: 'video', icon: '🎥', category: 'Video' };
    }

    // Audio types
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(fileExtension)) {
      return { type: 'audio', icon: '🎵', category: 'Audio' };
    }

    // Document types
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      return { type: 'pdf', icon: '📄', category: 'PDF Document' };
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
      return { type: 'docx', icon: '📝', category: 'Word Document' };
    }

    // PowerPoint files - check both MIME types and extensions
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mimeType === 'application/vnd.ms-powerpoint' ||
        fileExtension === 'pptx' ||
        fileExtension === 'ppt') {
      return { type: 'pptx', icon: '📊', category: 'PowerPoint Presentation' };
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileExtension === 'xlsx') {
      return { type: 'xlsx', icon: '📈', category: 'Excel Spreadsheet' };
    }

    // Text files
    if (mimeType?.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(fileExtension)) {
      return { type: 'text', icon: '📝', category: 'Text File' };
    }

    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'm', 'pl', 'sh', 'bash', 'ps1', 'bat', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf'].includes(fileExtension)) {
      return { type: 'code', icon: '💻', category: 'Code File' };
    }

    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(fileExtension)) {
      return { type: 'archive', icon: '📦', category: 'Archive' };
    }

    // Default
    return { type: 'unknown', icon: '📄', category: 'File' };
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    if (error) {
      return <div className="text-red-600 p-6 bg-red-50 rounded-lg"><strong>Error:</strong> {error}</div>;
    }

    const isWordDocument = content.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const fileInfo = getFileTypeInfo(content.mimeType, content.title || content.originalName);
    const fileSize = content.fileSize ? formatFileSize(content.fileSize) : 'Unknown size';

    // Handle video-link type (YouTube, Google Drive, Vimeo, direct URL)
    if (content.type === 'video-link' || content.contentType === 'video-link') {
      const url = content.url || content.filePath || content.cloudStorage?.url || '';
      const platform = content.platform || content.cloudStorage?.metadata?.platform || 'unknown';

      const getEmbedUrl = () => {
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        // Google Drive
        if (/drive\.google\.com/.test(url)) {
          const driveMatch = url.match(/\/d\/([^/]+)/);
          if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }
        return null;
      };

      const embedUrl = getEmbedUrl();
      const isDirectVideo = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
      const platformLabel = { youtube: 'YouTube', gdrive: 'Google Drive', vimeo: 'Vimeo', direct: 'Video', unknown: 'Video' }[platform] || 'Video';

      return (
        <div className="flex flex-col h-full bg-gray-950">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{content.title || platformLabel}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{platformLabel} • Video Link</p>
              </div>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </a>
          </div>

          {/* Player */}
          <div className="flex-1 min-h-0">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={content.title || platformLabel}
              />
            ) : isDirectVideo ? (
              <video
                controls
                className="w-full h-full object-contain bg-black"
                src={url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <h3 className="text-white font-semibold text-lg mb-2">Cannot embed this video</h3>
                <p className="text-gray-400 text-sm mb-4">Open it directly in a new tab.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Open Video
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (fileInfo.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={getAttachmentFileUrl(content)} 
              alt={content.title || 'Image'} 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-4">{fileInfo.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title || 'Image'}</h3>
              <p className="text-gray-600 mb-4">{fileInfo.category} • {fileSize}</p>
              <a 
                href={content.filePath} 
                download 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Image
              </a>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="flex flex-col h-full bg-gray-950">
            {/* Video Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{content.title || content.originalName || 'Video'}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{fileSize} • Video</p>
                </div>
              </div>
              <a
                href={getAttachmentFileUrl(content)}
                download
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>

            {/* Video Player — fills remaining height, video centered */}
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
              <video
                controls
                autoPlay={false}
                className="w-full h-full object-contain bg-black"
                src={getAttachmentFileUrl(content)}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
              {/* Error fallback */}
              <div className="hidden w-full h-full flex-col items-center justify-center text-center p-12 bg-gray-900">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <h3 className="text-white font-semibold text-lg mb-2">Unable to play video</h3>
                <p className="text-gray-400 text-sm mb-6">Your browser may not support this format.</p>
                <a
                  href={getAttachmentFileUrl(content)}
                  download
                  className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Download to watch
                </a>
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{fileInfo.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title || 'Audio'}</h3>
                <p className="text-gray-600 mb-4">{fileInfo.category} • {fileSize}</p>
              </div>
              <audio 
                controls 
                className="w-full mb-4"
                src={getAttachmentFileUrl(content)}
              >
                Your browser does not support the audio tag.
              </audio>
              <div className="text-center">
                <a 
                  href={getAttachmentFileUrl(content)} 
                  download 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Audio
                </a>
              </div>
            </div>
          </div>
        );

      case 'pdf':
          return (
            <PdfPreviewWithAI
              content={content}
              pdfUrl={getAttachmentFileUrl(content)}
              notes={notes}
              injectOverrideStyles={injectOverrideStyles}
            />
          );

      case 'docx':
          return (
            <DocxPreviewWithAI
              content={content}
              htmlContent={htmlContent}
              headings={headings}
              notes={notes}
              headingsWithNotes={headingsWithNotes}
              injectOverrideStyles={injectOverrideStyles}
              disableTools={disableTools}
            />
          );

      case 'text':
      case 'code':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
              <div className="text-2xl">{fileInfo.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{content.title || 'Text File'}</h3>
                <p className="text-sm text-gray-600">{fileInfo.category} • {fileSize}</p>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {htmlContent ? (
                <iframe
                  className="w-full h-full border-0"
                  title={content.title}
                  srcDoc={iframeSrcDoc}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>Loading text content...</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'pptx':
      case 'ppt':
        console.log('🎯 ContentViewer: Loading PowerPoint file with Canvas-Based Viewer (Zero Scrolling)');
        console.log('🎯 ContentViewer: File path:', content.filePath);
        console.log('🎯 ContentViewer: Content ID:', content._id);
        
        const CanvasBasedPowerPointViewer = dynamic(() => import('./CanvasBasedPowerPointViewer'), {
          loading: () => (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Canvas PowerPoint Viewer...</p>
              </div>
            </div>
          )
        });
        
        return (
          <CanvasBasedPowerPointViewer
            filePath={content.filePath ? content.filePath.replace(window.location.origin, '') : ''}
            fileName={content.title || content.originalName}
            contentId={content._id}
            onClose={onClose}
            isModal={isModal}
          />
        );

      case 'xlsx':
      case 'archive':
      default:
        // Handle multi-attachment content type
        if (content.contentType === 'multi-attachment') {
          const currentAttachment = content.attachments[currentAttachmentIndex];
          const totalAttachments = content.attachments.length;
          
          return (
            <div className="h-screen flex flex-col">
              {/* Multi-attachment header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📎</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{content.title}</h3>
                    <p className="text-sm text-gray-600">
                      {totalAttachments} attachment{totalAttachments > 1 ? 's' : ''} • 
                      File {currentAttachmentIndex + 1} of {totalAttachments}
                    </p>
                  </div>
                </div>
                
                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentAttachmentIndex(Math.max(0, currentAttachmentIndex - 1))}
                    disabled={currentAttachmentIndex === 0}
                    className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg">
                    {currentAttachmentIndex + 1} / {totalAttachments}
                  </span>
                  
                  <button
                    onClick={() => setCurrentAttachmentIndex(Math.min(totalAttachments - 1, currentAttachmentIndex + 1))}
                    disabled={currentAttachmentIndex === totalAttachments - 1}
                    className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Current attachment preview - reuse full viewer for parity */}
              <div className="flex-1 min-h-0">
                <ContentViewer content={currentAttachment} onClose={onClose} isModal={false} disableTools={disableTools} />
              </div>
              
              {/* Attachment list removed (pagination arrows are sufficient) */}
            </div>
          );
        }
        
        // Handle assignment content type
        if (content.contentType === 'assignment') {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{content.title || 'Assignment'}</h3>
              <p className="text-gray-600 mb-6">Assignment • No file attached</p>
              
              <div className="space-y-4 max-w-md">
                <p className="text-gray-500">
                  This assignment doesn&rsquo;t have any file attachments. The assignment details and instructions are shown in the assignment card.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-6xl mb-6">{fileInfo.icon}</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{content.title || 'File'}</h3>
            <p className="text-gray-600 mb-6">{fileInfo.category} • {fileSize}</p>
            
            <div className="space-y-4 max-w-md">
              <p className="text-gray-500">
                {fileInfo.type === 'pptx' && "PowerPoint presentations can be viewed by downloading and opening in Microsoft PowerPoint or Google Slides."}
                {fileInfo.type === 'xlsx' && "Excel spreadsheets can be viewed by downloading and opening in Microsoft Excel or Google Sheets."}
                {fileInfo.type === 'archive' && "Archive files need to be downloaded and extracted using appropriate software."}
                {fileInfo.type === 'unknown' && "This file type cannot be previewed directly in the browser."}
              </p>
              
              <div className="flex gap-3 justify-center">
                {content.filePath && (
                  <a 
                    href={content.filePath} 
                    download 
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Download File
                  </a>
                )}
                {(fileInfo.type === 'pptx' || fileInfo.type === 'xlsx') && content.filePath && (
                  <a 
                    href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + content.filePath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    View Online
                  </a>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const ViewerLayout = ({ children }) => {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const res = await fetch('/api/auth/profile');
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // For testing purposes, set a mock user
            setUser({ id: 'test-user-123', name: 'Test User' });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // For testing purposes, set a mock user
          setUser({ id: 'test-user-123', name: 'Test User' });
        }
      };
      
      fetchUserProfile();
    }, []);
    
    return isModal ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-none max-h-none flex flex-col m-0 overflow-hidden relative">
          {children}
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-xl w-full h-full flex flex-col relative">
        {children}
      </div>
    )
  };

  return (
    <ViewerLayout>
      <div className="w-full bg-slate-200 h-1 flex-shrink-0">
        <div className="bg-sky-600 h-1" style={{ width: `${scrollProgress}%`, transition: 'width 0.1s linear' }}></div>
      </div>

      <div className="flex-grow flex-1 flex overflow-auto min-h-0 h-full">
        <main className="flex-grow overflow-auto min-h-0 h-full relative" ref={contentRef}>
          {renderPreview()}
        </main>
      </div>

    </ViewerLayout>
  );
};

export default ContentViewer;
