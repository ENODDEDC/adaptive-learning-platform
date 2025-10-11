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
import EnhancedFloatingNotes from './EnhancedFloatingNotes';
import EnhancedPDFViewer from './EnhancedPDFViewer';
import AITutorModal from './AITutorModal';
import DocxPreviewWithAI from './DocxPreviewWithAI';
import PdfPreviewWithAI from './PdfPreviewWithAI';

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

// Inject CSS overrides into Pandoc HTML so it renders cleanly and left-aligned
const injectOverrideStyles = (rawHtml) => {
  const overrideCss = `
    :root { color-scheme: light; }
    html, body { margin: 0 !important; padding: 0 !important; background: #f7f8fb; width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; height: 100% !important; min-height: 100% !important; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; line-height: 1.75; color: #0f172a; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; height: 100% !important; min-height: 100% !important; }
    .reader-container { max-width: 100% !important; margin: 0 !important; padding: 32px 40px 20px 40px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06); width: 100% !important; min-width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; min-height: calc(100vh - 200px) !important; }
    .reader-container p { margin: 1.1em 0; font-size: 1rem; color: #0b1324; }
    .reader-container h1 { font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 2.25rem; line-height: 1.2; margin: 0.6em 0 0.4em; color: #0b1324; letter-spacing: -0.01em; }
    .reader-container h2 { font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 1.75rem; line-height: 1.25; margin: 1.4em 0 0.5em; color: #0b1324; letter-spacing: -0.01em; }
    .reader-container h3 { font-size: 1.35rem; line-height: 1.3; margin: 1.2em 0 0.5em; color: #111827; }
    .reader-container h4, .reader-container h5, .reader-container h6 { margin: 1em 0 0.4em; color: #111827; }
    .reader-container ul, .reader-container ol { margin: 0.8em 0 0.8em 1.25em; padding: 0; }
    .reader-container li { margin: 0.35em 0; }
    .reader-container blockquote { margin: 1.2em 0; padding: 0.75em 1em; background: #f0f6ff; border-left: 4px solid #3b82f6; color: #0b1324; border-radius: 6px; }
    .reader-container img, .reader-container video, .reader-container canvas, .reader-container svg { max-width: 100%; height: auto; border-radius: 10px; }
    .reader-container table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    .reader-container table th, .reader-container table td { padding: 10px 12px; border: 1px solid #e5e7eb; }
    .reader-container pre, .reader-container code { white-space: pre-wrap; word-break: break-word; background: #0b1220; color: #e2e8f0; padding: 10px 12px; border-radius: 8px; }
    .reader-container a { color: #1d4ed8; text-decoration: none; }
    .reader-container a:hover { text-decoration: underline; }
    /* Responsive layout - use more space on larger screens */
    @media (min-width: 1200px) {
      .reader-container { max-width: 100% !important; margin: 0 !important; width: 100% !important; overflow-x: hidden !important; }
    }
    @media (min-width: 1600px) {
      .reader-container { max-width: 100% !important; margin: 0 !important; width: 100% !important; overflow-x: hidden !important; }
    }
    /* Ensure everything is left-aligned by default */
    .reader-container h1, .reader-container h2, .reader-container h3, .reader-container h4, .reader-container h5, .reader-container h6,
    .reader-container p, .reader-container li, .reader-container td, .reader-container th, .reader-container blockquote, .reader-container figure, .reader-container figcaption { text-align: left !important; }
    
    /* Force full width on all elements and prevent overflow */
    * { max-width: 100% !important; box-sizing: border-box !important; }
    .reader-container, .reader-container * { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
    .reader-container { width: 100% !important; min-width: 100% !important; overflow-x: hidden !important; }
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
const AttachmentPreviewContent = ({ attachment }) => {
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
          
          // Check if this is a Backblaze B2 file (URL contains /api/files/)
          console.log('🔍 Attachment object:', attachment);
          console.log('🔍 Attachment URL:', attachment.url);
          console.log('🔍 Attachment filePath:', attachment.filePath);
          
          // Check both url and filePath for Backblaze B2 files
          const fileUrl = attachment.url || attachment.filePath;
          const isBackblazeFile = fileUrl && fileUrl.includes('/api/files/');
          console.log('🔍 File URL to check:', fileUrl);
          console.log('🔍 Is Backblaze file:', isBackblazeFile);
          
          let response;
          
          if (isBackblazeFile) {
            // Extract file key from URL for Backblaze B2 files
            const urlParts = fileUrl.split('/api/files/');
            console.log('🔍 URL parts:', urlParts);
            const fileKey = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;
            console.log('🔍 Extracted file key:', fileKey);
            
            if (!fileKey) {
              throw new Error('Could not extract file key from URL');
            }
            
            console.log('🔍 Converting Backblaze B2 Word document with key:', fileKey);
            
            response = await fetch('/api/files/convert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fileKey }),
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
                  errorDetails = 'Empty error response from server';
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
            src={attachment.filePath} 
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
            src={attachment.filePath}
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
              src={attachment.filePath}
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
          pdfUrl={attachment.url || attachment.filePath}
          notes={notes}
          injectOverrideStyles={injectOverrideStyles}
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
          filePath={attachment.filePath ? attachment.filePath.replace(window.location.origin, '') : ''}
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
              {attachment.filePath && (
                <a 
                  href={attachment.filePath} 
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
const ContentViewer = ({ content, onClose, isModal = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const contentRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const floatingNotesRef = useRef(null);
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
          
          // Check if this is a Backblaze B2 file (URL contains /api/files/)
          const fileUrl = content.url || content.filePath;
          const isBackblazeFile = fileUrl && fileUrl.includes('/api/files/');
          console.log('🔍 File URL to check (content):', fileUrl);
          console.log('🔍 Is Backblaze file (content):', isBackblazeFile);
          
          let response;
          
          if (isBackblazeFile) {
            // Extract file key from URL for Backblaze B2 files
            const urlParts = fileUrl.split('/api/files/');
            console.log('🔍 URL parts (content):', urlParts);
            const fileKey = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;
            console.log('🔍 Extracted file key (content):', fileKey);
            
            if (!fileKey) {
              throw new Error('Could not extract file key from URL');
            }
            
            console.log('🔍 Converting Backblaze B2 Word document with key (content):', fileKey);
            
            response = await fetch('/api/files/convert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fileKey }),
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
                  errorDetails = 'Empty error response from server';
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
          const response = await fetch(content.filePath);
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

    if (floatingNotesRef.current) {
      const notes = floatingNotesRef.current.getNotes();
      highlightNotes(notes);
    }

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
  }, [htmlContent, floatingNotesRef.current?.getNotes()]);

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
                <ContentViewer content={currentAttachment} onClose={onClose} isModal={false} />
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
          {/* Enhanced FloatingNotes component */}
          <EnhancedFloatingNotes
            ref={floatingNotesRef}
            contentId={content?._id || content?.id || 'test-content'}
            courseId={content?.courseId || 'test-course'}
            userId={user?.id || 'test-user-123'}
            isVisible={true}
          />
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-xl w-full h-full flex flex-col relative">
        {children}
        {/* Enhanced FloatingNotes component */}
        <EnhancedFloatingNotes
          ref={floatingNotesRef}
          contentId={content?._id || content?.id || 'test-content'}
          courseId={content?.courseId || 'test-course'}
          userId={user?.id || 'test-user-123'}
          isVisible={true}
        />
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

      <div className="flex-grow flex-1 flex overflow-hidden min-h-0 h-full">
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
        <main className="flex-grow overflow-hidden min-h-0 h-full relative" ref={contentRef}>
          {renderPreview()}
          {selection && (
            <button
              onClick={() => {
                if (floatingNotesRef.current) {
                  const { text, range } = selection;
                  let parent = range.commonAncestorContainer;
                  if (parent.nodeType !== Node.ELEMENT_NODE) {
                    parent = parent.parentNode;
                  }
                  let contextualId = parent.id;
                  if (!contextualId) {
                    contextualId = `selection-${Date.now()}`;
                    parent.id = contextualId;
                  }
                  floatingNotesRef.current.createContextualNote(text, contextualId);
                  setSelection(null);
                }
              }}
              className="absolute bg-blue-500 text-white px-3 py-1 rounded-md text-sm shadow-lg hover:bg-blue-600"
              style={{
                top: `${selection.rect.top - 40}px`,
                left: `${selection.rect.left + selection.rect.width / 2}px`,
                transform: 'translateX(-50%)',
              }}
            >
              Add Note
            </button>
          )}
        </main>
      </div>

    </ViewerLayout>
  );
};

export default ContentViewer;