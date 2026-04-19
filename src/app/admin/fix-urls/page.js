'use client';

import { useState } from 'react';

export default function FixUrlsPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFixUrls = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/fix-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fix File URLs</h1>
      
      <div className="mb-6">
        <button
          onClick={handleFixUrls}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fixing URLs...' : 'Fix File URLs'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}