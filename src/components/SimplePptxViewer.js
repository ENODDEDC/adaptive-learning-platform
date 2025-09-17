'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const SimplePptxViewer = ({ fileUrl, title }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('fit'); // fit, width, actual
  const containerRef = useRef(null);

  useEffect(() => {
    if (!fileUrl) return;

    const fetchPptxHtml = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const filePath = fileUrl.replace(window.location.origin, '');
        const response = await fetch(`/api/convert-pptx-html5?filePath=${encodeURIComponent(filePath)}`);
        
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
          // Inject better CSS for proper rendering
          const enhancedHtml = injectBetterStyles(html);
          setHtmlContent(enhancedHtml);
        } else {
          throw new Error('PowerPoint conversion returned empty HTML.');
        }
      } catch (err) {
        console.error('Error fetching PPTX HTML:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPptxHtml();
  }, [fileUrl]);

  const injectBetterStyles = (html) => {
    // Add better CSS to fix layout issues
    const betterCSS = `
      <style>
        /* Reset and base styles */
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0 !important;
          padding: 20px !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          background: white !important;
          overflow-x: hidden !important;
          line-height: 1.4 !important;
        }
        
        /* Container styles */
        .reveal, .slides, section {
          width: 100% !important;
          height: auto !important;
          max-width: 100% !important;
        }
        
        /* Text styles - ensure readability */
        h1, h2, h3, h4, h5, h6 {
          color: #333 !important;
          margin: 15px 0 !important;
          font-weight: bold !important;
          line-height: 1.2 !important;
          word-wrap: break-word !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 10px !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        h1 { font-size: clamp(24px, 4vw, 36px) !important; }
        h2 { font-size: clamp(20px, 3.5vw, 28px) !important; }
        h3 { font-size: clamp(18px, 3vw, 24px) !important; }
        
        p, li, div {
          color: #333 !important;
          font-size: clamp(14px, 2.5vw, 18px) !important;
          margin: 10px 0 !important;
          line-height: 1.5 !important;
          word-wrap: break-word !important;
          background: rgba(255, 255, 255, 0.8) !important;
          padding: 8px !important;
          border-radius: 4px !important;
        }
        
        /* Image styles - prevent overlap */
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 15px auto !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
          z-index: 1 !important;
        }
        
        /* List styles */
        ul, ol {
          margin: 15px 0 !important;
          padding-left: 30px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 8px !important;
          padding: 15px 30px !important;
        }
        
        li {
          margin: 8px 0 !important;
          background: transparent !important;
          padding: 4px 0 !important;
        }
        
        /* Layout improvements */
        .slide-content {
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
          padding: 20px !important;
          max-width: 100% !important;
        }
        
        /* Ensure text is above images */
        h1, h2, h3, h4, h5, h6, p, ul, ol, li {
          position: relative !important;
          z-index: 10 !important;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          body {
            padding: 15px !important;
          }
          
          h1 { font-size: 20px !important; }
          h2 { font-size: 18px !important; }
          h3 { font-size: 16px !important; }
          p, li, div { font-size: 14px !important; }
        }
        
        @media (max-width: 480px) {
          body {
            padding: 10px !important;
          }
          
          h1 { font-size: 18px !important; }
          h2 { font-size: 16px !important; }
          h3 { font-size: 14px !important; }
          p, li, div { font-size: 12px !important; }
        }
        
        /* Hide any problematic elements */
        .fallback-slide {
          display: none !important;
        }
      </style>
    `;
    
    // Inject the CSS into the HTML
    if (html.includes('</head>')) {
      return html.replace('</head>', betterCSS + '</head>');
    } else if (html.includes('<body')) {
      return html.replace('<body', betterCSS + '<body');
    } else {
      return betterCSS + html;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Processing PowerPoint...</p>
          <p className="text-sm text-gray-500 mt-2">🎨 Improving layout and readability</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-6">📊</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title || 'PowerPoint Presentation'}</h3>
        <p className="text-red-600 mb-6">Error: {error}</p>
        
        <div className="space-y-4 max-w-md">
          <p className="text-gray-500">
            Unable to process this PowerPoint presentation.
          </p>
          
          <div className="flex gap-3 justify-center">
            {fileUrl && (
              <a 
                href={fileUrl} 
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

  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold truncate max-w-md text-gray-900">{title || 'PowerPoint Presentation'}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"
            >
              <option value="fit">Fit to Screen</option>
              <option value="width">Fit Width</option>
              <option value="actual">Actual Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full">
        <div 
          ref={containerRef}
          className={`h-full ${
            viewMode === 'fit' ? 'w-full' :
            viewMode === 'width' ? 'w-full' :
            'w-auto mx-auto'
          }`}
          style={{
            maxWidth: viewMode === 'actual' ? '1280px' : '100%',
            minHeight: viewMode === 'fit' ? 'calc(100vh - 80px)' : 'auto'
          }}
        >
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0 bg-white"
            title={title || "PowerPoint Presentation"}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePptxViewer;