'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DocumentIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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

// --- Main Component ---
const ContentViewer = ({ content, onClose, isModal = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!content) return;

    const processContent = async () => {
      setIsLoading(true);
      setError(null);
      setHtmlContent('');
      setHeadings([]);

      const isWordDocument = content.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isWordDocument) {
        try {
          const conversionApiUrl = `/api/convert-docx?filePath=${encodeURIComponent(content.filePath.replace(window.location.origin, ''))}`;
          const response = await fetch(conversionApiUrl);
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
          
          const html = await response.text(); // The API now returns raw HTML

          if (html) {
            // Create a temporary div to parse the HTML and extract headings
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
            const extractedHeadings = Array.from(headingElements).map((heading, index) => {
              const id = generateHeadingId(heading.textContent, index);
              heading.id = id; // Add ID to the element itself for scrolling
              return {
                id,
                text: heading.textContent,
                level: parseInt(heading.tagName.substring(1)),
              };
            });
            setHeadings(extractedHeadings);
            setHtmlContent(tempDiv.innerHTML);
          } else {
            throw new Error('Conversion returned empty HTML.');
          }
        } catch (err) {
          console.error('Error fetching or converting docx:', err);
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

  if (!content) return null;

  const readTime = calculateReadTime(htmlContent);
  const IconComponent = content.contentType === 'video' ? VideoCameraIcon : content.contentType === 'audio' ? SpeakerWaveIcon : DocumentIcon;
  const colorClasses = content.contentType === 'video' ? 'text-red-600 bg-red-100' : content.contentType === 'audio' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';

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

    switch (content.contentType) {
      case 'video': return <video controls className="w-full max-h-[70vh] rounded-lg" src={content.filePath} />;
      case 'audio': return <audio controls className="w-full" src={content.filePath} />;
      case 'document':
        if (content.mimeType === 'application/pdf') return <iframe src={content.filePath} className="w-full h-[75vh] rounded-lg border" title={content.title} />;
        if (isWordDocument) return <div className="prose prose-premium max-w-4xl mx-auto" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
      default: return <div className="text-center text-gray-500 py-12">Preview not available for this file type.</div>;
    }
  };

  const ViewerLayout = ({ children }) => (
    isModal ? (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">{children}</div>
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-xl w-full flex flex-col">{children}</div>
    )
  );

  return (
    <ViewerLayout>
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
        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full flex-shrink-0 ml-4"><XMarkIcon className="w-6 h-6" /></button>
      </div>

      <div className="w-full bg-slate-200 h-1 flex-shrink-0">
        <div className="bg-sky-600 h-1" style={{ width: `${scrollProgress}%`, transition: 'width 0.1s linear' }}></div>
      </div>

      <div className="flex-grow flex-1 flex overflow-hidden">
        {headings.length > 2 && (
          <aside className="w-64 flex-shrink-0 h-full overflow-y-auto p-8 border-r bg-slate-50/50 hidden lg:block">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">On this page</h3>
            <ul className="space-y-2">
              {headings.map(heading => (
                <li key={heading.id} className={`text-sm ${heading.level === 2 ? 'pl-3' : ''} ${heading.level === 3 ? 'pl-6' : ''}`}>
                  <a href={`#${heading.id}`} onClick={(e) => {
                    e.preventDefault();
                    contentRef.current?.querySelector(`#${heading.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }} className="text-slate-600 hover:text-sky-600 transition-colors block truncate">{heading.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="flex-grow p-8 sm:p-10 lg:p-12 overflow-y-auto" ref={contentRef}>
          {renderPreview()}
        </main>
      </div>

      <div className="flex-shrink-0 flex items-center justify-end p-4 border-t bg-slate-50 rounded-b-2xl gap-3">
        <button onClick={onClose} className="px-5 py-2.5 text-slate-700 bg-white border rounded-lg hover:bg-slate-100 font-medium">Close</button>
        <a href={content.filePath} download className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium">Download</a>
      </div>
    </ViewerLayout>
  );
};

export default ContentViewer;