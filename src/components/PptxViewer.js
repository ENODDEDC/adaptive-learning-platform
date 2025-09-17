'use client';

import { useEffect, useState } from 'react';

const PptxViewer = ({ fileUrl, title }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setHtmlContent(html);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Processing PowerPoint with Gemini AI...</p>
          <p className="text-sm text-gray-500 mt-2">🧠 Analyzing layout and structure</p>
          <p className="text-xs text-gray-400 mt-1">Using gemini-2.5-flash for intelligent positioning</p>
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
    <iframe
      srcDoc={htmlContent}
      className="w-full h-full border-0"
      title={title || "PowerPoint Presentation"}
      sandbox="allow-scripts allow-same-origin"
      style={{ minHeight: '600px' }}
    />
  );
};

export default PptxViewer;