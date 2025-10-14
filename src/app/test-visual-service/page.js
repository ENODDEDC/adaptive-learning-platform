'use client';

import React, { useState } from 'react';

const TestVisualService = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testService = async () => {
    setLoading(true);
    setResult('Testing visual content service...');
    
    try {
      const response = await fetch('/api/visual-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docxText: 'This is a test document about machine learning concepts.',
          contentType: 'diagram'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success! Visual content generated. Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Visual Content Service Test
          </h1>
          
          <div className="mb-6">
            <button
              onClick={testService}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Test Visual Service
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">
              {result || 'Click the button above to test the visual content service.'}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Environment Check:</h3>
            <p className="text-sm text-yellow-800">
              Make sure you have GOOGLE_API_KEY or NEXT_PUBLIC_GOOGLE_API_KEY set in your environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVisualService;
