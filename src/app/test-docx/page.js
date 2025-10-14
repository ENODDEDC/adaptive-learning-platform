'use client';

import { useState } from 'react';

export default function TestDocxPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConversion = async (fileKey) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 Testing conversion with file key:', fileKey);
      
      const response = await fetch('/api/files/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Success response:', data);
      setResult(data);
    } catch (err) {
      console.error('🔍 Conversion test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test DOCX Conversion</h1>
      
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Available DOCX Files:</h2>
        
        <button
          onClick={() => testConversion('classwork/68b8014d03be11901eaf95d4/1759469976311_Progress-report-1.docx')}
          disabled={loading}
          className="block w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <div className="font-medium">Progress-report-1.docx</div>
          <div className="text-sm text-gray-600">Size: 13,966 bytes</div>
        </button>
        
        <button
          onClick={() => testConversion('classwork/68b8014d03be11901eaf95d4/1759470816311_What_is_Bitcoin___2_.docx')}
          disabled={loading}
          className="block w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <div className="font-medium">What_is_Bitcoin___2_.docx</div>
          <div className="text-sm text-gray-600">Size: 11,608 bytes</div>
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            Converting document...
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">Conversion Successful!</h3>
            <p className="text-green-700">Document converted to HTML successfully.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">Converted HTML Preview:</h3>
              <button
                onClick={() => setResult(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Close preview"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={result.html}
                className="w-full h-96 border border-gray-300 rounded overflow-auto"
                title="Converted Document"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}