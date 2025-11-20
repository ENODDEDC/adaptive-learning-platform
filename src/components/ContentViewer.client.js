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
      --text-primary: #1a202c;
      --text-secondary: #2d3748;
      --text-muted: #4a5568;
      --bg-primary: #ffffff;
      --bg-secondary: #f7fafc;
      --border-light: #e2e8f0;
      --accent-blue: #3182ce;
      --accent-blue-light: #ebf8ff;
    }
    
    html, body { 
      margin: 0 !important; 
      padding: 0 !important; 
      background: var(--bg-secondary); 
      width: 100% !important; 
      max-width: 100% !important; 
      overflow-x: hidden !important; 
      min-height: 100% !important; 
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.7; 
      color: var(--text-primary); 
      -webkit-font-smoothing: antialiased; 
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility; 
      width: 100% !important; 
      max-width: 100% !important; 
      overflow-x: hidden !important; 
      min-height: 100% !important; 
      font-size: 16px;
    }
    
    .reader-container { 
      max-width: 100% !important; 
      margin: 0 !important; 
      padding: 48px 56px 40px 56px; 
      background: var(--bg-primary); 
      border-radius: 16px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
      width: 100% !important; 
      min-width: 100% !important; 
      overflow-x: hidden !important; 
      box-sizing: border-box !important; 
    }
    
    /* Enhanced Typography */
    .reader-container p { 
      margin: 1.25em 0; 
      font-size: 1.05rem; 
      color: var(--text-secondary); 
      line-height: 1.75;
      text-align: justify;
      hyphens: auto;
      word-spacing: 0.05em;
    }
    
    .reader-container p:first-of-type {
      margin-top: 0;
    }
    
    .reader-container p:last-of-type {
      margin-bottom: 0;
    }
    
    /* Enhanced Headings with Better Hierarchy */
    .reader-container h1 { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 2.5rem; 
      font-weight: 700;
      line-height: 1.2; 
      margin: 2em 0 1em 0; 
      color: var(--text-primary); 
      letter-spacing: -0.025em;
      border-bottom: 3px solid var(--accent-blue);
      padding-bottom: 0.5em;
    }
    
    .reader-container h1:first-child {
      margin-top: 0;
    }
    
    .reader-container h2 { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 2rem; 
      font-weight: 600;
      line-height: 1.3; 
      margin: 2.5em 0 1em 0; 
      color: var(--text-primary); 
      letter-spacing: -0.02em;
      border-bottom: 2px solid var(--border-light);
      padding-bottom: 0.3em;
    }
    
    .reader-container h3 { 
      font-size: 1.5rem; 
      font-weight: 600;
      line-height: 1.4; 
      margin: 2em 0 0.75em 0; 
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    
    .reader-container h4 { 
      font-size: 1.25rem; 
      font-weight: 600;
      line-height: 1.4; 
      margin: 1.75em 0 0.5em 0; 
      color: var(--text-secondary);
    }
    
    .reader-container h5, .reader-container h6 { 
      font-size: 1.1rem; 
      font-weight: 600;
      line-height: 1.4; 
      margin: 1.5em 0 0.5em 0; 
      color: var(--text-secondary);
    }
    
    /* Enhanced Lists */
    .reader-container ul, .reader-container ol { 
      margin: 1.25em 0; 
      padding-left: 2em; 
      line-height: 1.7;
    }
    
    .reader-container li { 
      margin: 0.75em 0; 
      color: var(--text-secondary);
      line-height: 1.7;
    }
    
    .reader-container li p {
      margin: 0.5em 0;
    }
    
    .reader-container ul li {
      list-style-type: disc;
    }
    
    .reader-container ul ul li {
      list-style-type: circle;
    }
    
    .reader-container ul ul ul li {
      list-style-type: square;
    }
    
    /* Enhanced Blockquotes */
    .reader-container blockquote { 
      margin: 2em 0; 
      padding: 1.25em 1.5em; 
      background: var(--accent-blue-light); 
      border-left: 4px solid var(--accent-blue); 
      color: var(--text-secondary); 
      border-radius: 8px;
      font-style: italic;
      position: relative;
    }
    
    .reader-container blockquote::before {
      content: '"';
      font-size: 4em;
      color: var(--accent-blue);
      position: absolute;
      top: -0.2em;
      left: 0.2em;
      opacity: 0.3;
      font-family: Georgia, serif;
    }
    
    .reader-container blockquote p {
      margin: 0.5em 0;
      padding-left: 1em;
    }
    
    /* Enhanced Tables */
    .reader-container table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 2em 0;
      background: var(--bg-primary);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .reader-container table th { 
      padding: 1em 1.25em; 
      background: var(--bg-secondary);
      border-bottom: 2px solid var(--border-light);
      font-weight: 600;
      color: var(--text-primary);
      text-align: left;
    }
    
    .reader-container table td { 
      padding: 0.875em 1.25em; 
      border-bottom: 1px solid var(--border-light);
      color: var(--text-secondary);
    }
    
    .reader-container table tr:hover {
      background: rgba(59, 130, 246, 0.05);
    }
    
    /* Enhanced Code Blocks */
    .reader-container pre { 
      background: #1a202c; 
      color: #e2e8f0; 
      padding: 1.5em; 
      border-radius: 12px;
      overflow-x: auto;
      margin: 1.5em 0;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .reader-container code { 
      background: #f1f5f9; 
      color: #475569; 
      padding: 0.25em 0.5em; 
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    .reader-container pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    
    /* Enhanced Links */
    .reader-container a { 
      color: var(--accent-blue); 
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.2s ease;
    }
    
    .reader-container a:hover { 
      border-bottom-color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.1);
      padding: 0.1em 0.2em;
      border-radius: 3px;
    }
    
    /* Enhanced Images and Media */
    .reader-container img, .reader-container video, .reader-container canvas, .reader-container svg { 
      max-width: 100%; 
      height: auto; 
      border-radius: 12px;
      margin: 1.5em 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    /* Enhanced Emphasis */
    .reader-container strong, .reader-container b {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .reader-container em, .reader-container i {
      font-style: italic;
      color: var(--text-secondary);
    }
    
    /* Enhanced Horizontal Rules */
    .reader-container hr {
      border: none;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--border-light), transparent);
      margin: 3em 0;
    }
    
    /* Better Paragraph Spacing for Different Content Types */
    .reader-container p + h1,
    .reader-container p + h2,
    .reader-container p + h3 {
      margin-top: 2.5em;
    }
    
    .reader-container h1 + p,
    .reader-container h2 + p,
    .reader-container h3 + p {
      margin-top: 0.75em;
    }
    
    /* Enhanced Focus and Selection */
    .reader-container *:focus {
      outline: 2px solid var(--accent-blue);
      outline-offset: 2px;
    }
    
    .reader-container ::selection {
      background: rgba(59, 130, 246, 0.2);
      color: var(--text-primary);
    }
    
    /* Responsive Typography */
    @media (max-width: 768px) {
      .reader-container {
        padding: 32px 24px;
      }
      
      .reader-container h1 {
        font-size: 2rem;
      }
      
      .reader-container h2 {
        font-size: 1.75rem;
      }
      
      .reader-container h3 {
        font-size: 1.375rem;
      }
      
      .reader-container p {
        font-size: 1rem;
        text-align: left;
      }
    }
    
    @media (min-width: 1200px) {
      .reader-container { 
        max-width: 100% !important; 
        margin: 0 !important; 
        width: 100% !important; 
        overflow-x: hidden !important; 
      }
    }
    
    @media (min-width: 1600px) {
      .reader-container { 
        max-width: 100% !important; 
        margin: 0 !important; 
        width: 100% !important; 
        overflow-x: hidden !important; 
      }
    }
    
    /* Ensure everything is left-aligned by default */
    .reader-container h1, .reader-container h2, .reader-container h3, .reader-container h4, .reader-container h5, .reader-container h6,
    .reader-container p, .reader-container li, .reader-container td, .reader-container th, .reader-container blockquote, 
    .reader-container figure, .reader-container figcaption { 
      text-align: left !important; 
    }
    
    /* Force full width on all elements and prevent overflow */
    * { 
      max-width: 100% !important; 
      box-sizing: border-box !important; 
    }
    
    .reader-container, .reader-container * { 
      max-width: 100% !important; 
      width: auto !important; 
      overflow-x: hidden !important; 
    }
    
    .reader-container { 
      width: 100% !important; 
      min-width: 100% !important; 
      overflow-x: hidden !important; 
    }
    
    /* Enhanced Document-Specific Styles */
    .reader-container .document-content {
      line-height: 1.8;
    }
    
    .reader-container .document-title {
      text-align: center;
      margin: 0 0 2em 0;
      padding: 1em 0;
      border-bottom: 3px solid var(--accent-blue);
      font-size: 2.75rem;
      font-weight: 700;
    }
    
    .reader-container .section-heading {
      margin-top: 3em;
      margin-bottom: 1.25em;
      padding-bottom: 0.5em;
      border-bottom: 2px solid var(--border-light);
      color: var(--text-primary);
    }
    
    .reader-container .subsection-heading {
      margin-top: 2.5em;
      margin-bottom: 1em;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .reader-container .document-paragraph {
      margin: 1.5em 0;
      text-indent: 0;
      line-height: 1.8;
    }
    
    .reader-container .document-paragraph:first-of-type {
      margin-top: 0;
    }
    
    .reader-container .empty-paragraph {
      margin: 0.75em 0;
      height: 0.75em;
    }
    
    .reader-container .document-list {
      margin: 1.5em 0;
      padding-left: 2.5em;
    }
    
    .reader-container .document-list.numbered {
      list-style-type: decimal;
    }
    
    .reader-container .document-list li {
      margin: 0.75em 0;
      line-height: 1.7;
    }
    
    .reader-container .document-table {
      margin: 2.5em 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .reader-container .document-image {
      display: block;
      margin: 2em auto;
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .reader-container .subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
      margin: 1em 0 2em 0;
    }
    
    .reader-container .intense {
      background: linear-gradient(120deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
      padding: 1.5em 2em;
      border-radius: 12px;
      border-left: 4px solid var(--accent-blue);
      margin: 2em 0;
    }
    
    .reader-container .list-paragraph {
      margin: 0.5em 0;
    }
    
    /* Better spacing between different content types */
    .reader-container .document-paragraph + .section-heading,
    .reader-container .document-list + .section-heading,
    .reader-container .document-table + .section-heading {
      margin-top: 3.5em;
    }
    
    .reader-container .section-heading + .document-paragraph,
    .reader-container .subsection-heading + .document-paragraph {
      margin-top: 1em;
    }
    
    .reader-container .document-paragraph + .document-list,
    .reader-container .document-paragraph + .document-table {
      margin-top: 2em;
    }
    
    /* Enhanced readability for long documents */
    .reader-container .document-content > .document-paragraph:nth-child(4n) {
      margin-bottom: 2em;
    }
    
    /* Print Styles */
    @media print {
      .reader-container {
        box-shadow: none;
        padding: 0;
        background: white;
      }
      
      .reader-container h1, .reader-container h2 {
        border-bottom: none;
      }
      
      .reader-container .document-title {
        border-bottom: 2px solid #000;
      }
      
      .reader-container .section-heading {
        border-bottom: 1px solid #000;
      }
    }
  `;

  const wrapScript = `
    <script>
      (function() {
        function wrap() {
          if (document.getElementById('reader-container')) return;
          var container = document.createElement('div');
          container.id = 'reader-container';
          container.className = 'reader-container';
          var body = document.body;
          var nodes = Array.from(body.childNodes).filter(function(n){ return !(n.tagName && (n.tagName.toLowerCase() === 'script' || n.tagName.toLowerCase() === 'style')); });
          nodes.forEach(function(n){ container.appendChild(n); });
          body.appendChild(container);
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
          const fileUrl = attachment.cloudStorage?.url || attachment.url || attachment.filePath;
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
            
            response = await fetch('/api/files/convert', {
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
            const html = result.html;
            
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
            src={attachment.cloudStorage?.url || attachment.url || attachment.filePath} 
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
            src={attachment.cloudStorage?.url || attachment.url || attachment.filePath}
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
              src={attachment.cloudStorage?.url || attachment.url || attachment.filePath}
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
          pdfUrl={attachment.cloudStorage?.url || attachment.url || attachment.filePath}
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
          filePath={(attachment.cloudStorage?.url || attachment.url || attachment.filePath) ? (attachment.cloudStorage?.url || attachment.url || attachment.filePath).replace(window.location.origin, '') : ''}
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
              {(attachment.cloudStorage?.url || attachment.url || attachment.filePath) && (
                <a 
                  href={attachment.cloudStorage?.url || attachment.url || attachment.filePath} 
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
          const fileUrl = content.cloudStorage?.url || content.url || content.filePath;
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
            
            response = await fetch('/api/files/convert', {
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
            const html = result.html;
            
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
          const fileUrl = content.cloudStorage?.url || content.url || content.filePath;
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


    switch (fileInfo.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={content.filePath} 
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
          <div className="flex items-center justify-center h-full">
            <video 
              controls 
              className="w-full max-h-[70vh] rounded-lg bg-black"
              src={content.filePath}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            >
              Your browser does not support the video tag.
            </video>
            <div className="hidden flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-4">{fileInfo.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title || 'Video'}</h3>
              <p className="text-gray-600 mb-4">{fileInfo.category} • {fileSize}</p>
              <a 
                href={content.filePath} 
                download 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Video
              </a>
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
                src={content.filePath}
              >
                Your browser does not support the audio tag.
              </audio>
              <div className="text-center">
                <a 
                  href={content.filePath} 
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
              pdfUrl={content.url || content.filePath}
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
      {content?.contentType !== 'multi-attachment' && (
      <div className="flex-shrink-0 flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">{content.title}</h2>
            <div className="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
              <span>{formatFileSize(content.fileSize)}</span>
              {readTime > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" /><span>{readTime} min read</span></div>
                </>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full flex-shrink-0 ml-4 relative hover:text-slate-700 transition-colors"
          style={{ zIndex: 10000 }}
          title="Close viewer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      )}

      <div className="w-full bg-slate-200 h-1 flex-shrink-0">
        <div className="bg-sky-600 h-1" style={{ width: `${scrollProgress}%`, transition: 'width 0.1s linear' }}></div>
      </div>

      <div className="flex-grow flex-1 flex overflow-auto min-h-0 h-full">
        {headings.length > 2 && (
          <aside className="w-64 flex-shrink-0 h-full overflow-y-auto p-8 border-r bg-slate-50/50 hidden lg:block">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">On this page</h3>
            <ul className="space-y-2">
              {headings.map(heading => (
                <li key={heading.id} className={`text-sm ${heading.level === 2 ? 'pl-3' : ''} ${heading.level === 3 ? 'pl-6' : ''}`}>
                  <a href={`#${heading.id}`} onClick={(e) => {
                    e.preventDefault();
                    const iframe = iframeRef.current;
                    const headingElement = iframe?.contentDocument?.getElementById(heading.id);
                    headingElement?.scrollIntoView({ behavior: 'smooth' });
                  }} className="text-slate-600 hover:text-sky-600 transition-colors block truncate flex items-center gap-2">
                    {heading.text}
                    {headingsWithNotes.has(heading.id) && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" title="This section has notes"></span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="flex-grow overflow-auto min-h-0 h-full relative" ref={contentRef}>
          {renderPreview()}
        </main>
      </div>

    </ViewerLayout>
  );
};

export default ContentViewer;