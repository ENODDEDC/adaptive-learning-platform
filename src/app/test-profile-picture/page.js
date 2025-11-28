'use client';

import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function TestProfilePicture() {
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const testUpload = async () => {
    try {
      setResult('Creating test image...');
      
      // Create a simple test image
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Draw a colorful test pattern
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '30px Arial';
      ctx.fillText('TEST', 60, 110);
      
      setResult('Converting to blob...');
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      setResult(`Blob created: ${blob.size} bytes\nUploading...`);
      
      const formData = new FormData();
      formData.append('profilePicture', blob, 'test.jpg');
      
      const res = await fetch('/api/auth/profile/picture', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult(`✅ SUCCESS!\n\nStatus: ${res.status}\nImage URL: ${data.imageUrl}\n\nFull Response:\n${JSON.stringify(data, null, 2)}`);
        setImageUrl(data.imageUrl);
        toast.success('Upload successful!');
      } else {
        setResult(`❌ FAILED!\n\nStatus: ${res.status}\nError: ${data.message}\n\nFull Response:\n${JSON.stringify(data, null, 2)}`);
        toast.error('Upload failed!');
      }
    } catch (error) {
      setResult(`💥 ERROR!\n\n${error.message}\n\nStack:\n${error.stack}`);
      toast.error(`Error: ${error.message}`);
    }
  };

  const testFetchProfile = async () => {
    try {
      setResult('Fetching profile...');
      const res = await fetch('/api/auth/profile');
      const data = await res.json();
      
      if (res.ok) {
        setResult(`✅ Profile fetched!\n\n${JSON.stringify(data, null, 2)}`);
        if (data.profilePicture) {
          setImageUrl(data.profilePicture);
        }
      } else {
        setResult(`❌ Failed to fetch profile\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`💥 ERROR!\n\n${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Picture Upload Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button 
              onClick={testUpload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Test Upload
            </button>
            <button 
              onClick={testFetchProfile}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Fetch Profile
            </button>
          </div>
        </div>

        {imageUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Profile Picture</h2>
            <div className="flex items-center gap-4">
              <img 
                src={imageUrl} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
              />
              <div>
                <p className="text-sm text-gray-600 break-all">{imageUrl}</p>
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result || 'Click "Test Upload" to start...'}
          </pre>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Click "Test Upload" to upload a test image</li>
            <li>Check the result box for response details</li>
            <li>Click "Fetch Profile" to verify the image was saved</li>
            <li>If successful, the image should appear above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
