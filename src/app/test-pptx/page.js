'use client';

import { useState } from 'react';
import SimplePresentationViewer from '@/components/SimplePresentationViewer';

export default function TestPPTXPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testConversion = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/convert-pptx-html5?filePath=/uploads/courses/68b8014d03be11901eaf95d4/1757815439008_Lesson1.pptx');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">PowerPoint HTML5 Conversion Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <button
              onClick={testConversion}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Converting...' : 'Test PowerPoint Conversion'}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800"><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            {htmlContent && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800"><strong>Success:</strong> PowerPoint converted to HTML5 presentation!</p>
              </div>
            )}
          </div>
        </div>
        
        {htmlContent && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">HTML5 Presentation Viewer</h2>
              <p className="text-gray-600">Use arrow keys, space bar, or the controls to navigate</p>
            </div>
            
            <div className="h-[75vh]">
              <SimplePresentationViewer 
                htmlContent={htmlContent}
                title="Test PowerPoint Presentation"
                onClose={() => setHtmlContent('')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
