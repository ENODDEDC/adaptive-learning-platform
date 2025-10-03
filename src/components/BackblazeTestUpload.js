import React, { useState } from 'react';

const BackblazeTestUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('folder', 'test-uploads');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadResults(result.files);
      setFiles([]);
      
      // Clear file input
      const fileInput = document.getElementById('test-file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileKey) => {
    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      setUploadResults(prev => prev.filter(file => file.key !== fileKey));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Backblaze B2 Upload Test</h2>
      
      {/* Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Files to Upload
        </label>
        <input
          id="test-file-input"
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {files.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Selected files:</p>
            <ul className="text-sm text-gray-500">
              {files.map((file, index) => (
                <li key={index}>• {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload to Backblaze B2'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadResults.map((file, index) => (
              <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{file.originalName}</p>
                    <p className="text-sm text-green-600">Size: {(file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-sm text-green-600">Type: {file.contentType}</p>
                    <p className="text-xs text-green-500 break-all">Key: {file.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(file.key)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Configuration</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Bucket: {process.env.NEXT_PUBLIC_B2_BUCKET_NAME || 'CAPSTONE-INTELEVO'}</p>
          <p>• Endpoint: {process.env.NEXT_PUBLIC_B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com'}</p>
          <p>• Upload folder: test-uploads</p>
        </div>
      </div>
    </div>
  );
};

export default BackblazeTestUpload;