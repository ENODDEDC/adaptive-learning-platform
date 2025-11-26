'use client';

import { useState } from 'react';

export default function ThumbnailDebugPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailResult, setThumbnailResult] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const fetchRecentFiles = async () => {
    addLog('Fetching recent files from database...', 'info');
    try {
      const response = await fetch('/api/test-thumbnail-debug/list-files');
      const data = await response.json();
      
      if (response.ok) {
        setFiles(data.files);
        addLog(`Found ${data.files.length} files`, 'success');
      } else {
        addLog(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`Fetch error: ${error.message}`, 'error');
    }
  };

  const testThumbnailGeneration = async (file) => {
    setSelectedFile(file);
    setThumbnailResult(null);
    addLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
    addLog(`Testing thumbnail for: ${file.title}`, 'info');
    addLog(`File ID: ${file._id}`, 'info');
    addLog(`Cloud Storage Key: ${file.cloudStorage?.key || 'N/A'}`, 'info');
    addLog(`MIME Type: ${file.mimeType}`, 'info');
    
    setLoading(true);
    
    try {
      let endpoint;
      if (file.mimeType === 'application/pdf') {
        endpoint = '/api/pdf-thumbnail';
      } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        endpoint = '/api/docx-thumbnail';
      } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        endpoint = '/api/pptx-thumbnail';
      } else {
        addLog('Unsupported file type for thumbnail generation', 'error');
        setLoading(false);
        return;
      }
      
      addLog(`Using endpoint: ${endpoint}`, 'info');
      addLog('Sending request...', 'info');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: file.cloudStorage?.key,
          contentId: file._id
        })
      });
      
      addLog(`Response status: ${response.status}`, response.ok ? 'success' : 'error');
      
      const result = await response.json();
      setThumbnailResult(result);
      
      if (response.ok) {
        addLog('✅ Thumbnail generated successfully!', 'success');
        addLog(`Thumbnail URL: ${result.thumbnailUrl}`, 'success');
        addLog(`Thumbnail Key: ${result.thumbnailKey}`, 'success');
        addLog(`Method: ${result.method}`, 'info');
        
        // Refresh file list to show updated thumbnail
        await fetchRecentFiles();
      } else {
        addLog(`❌ Error: ${result.error}`, 'error');
        if (result.details) {
          addLog(`Details: ${result.details}`, 'error');
        }
      }
    } catch (error) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = async () => {
    addLog('Checking environment configuration...', 'info');
    try {
      const response = await fetch('/api/test-thumbnail-debug/check-env');
      const data = await response.json();
      
      addLog('\n━━━ Environment Check ━━━', 'info');
      addLog(`B2_KEY_ID: ${data.env.B2_KEY_ID ? '✅ Set' : '❌ Missing'}`, data.env.B2_KEY_ID ? 'success' : 'error');
      addLog(`B2_APPLICATION_KEY: ${data.env.B2_APPLICATION_KEY ? '✅ Set' : '❌ Missing'}`, data.env.B2_APPLICATION_KEY ? 'success' : 'error');
      addLog(`B2_BUCKET_NAME: ${data.env.B2_BUCKET_NAME || '❌ Missing'}`, data.env.B2_BUCKET_NAME ? 'success' : 'error');
      addLog(`B2_ENDPOINT: ${data.env.B2_ENDPOINT || '❌ Missing'}`, data.env.B2_ENDPOINT ? 'success' : 'error');
      addLog(`Base URL: ${data.env.baseUrl}`, 'info');
    } catch (error) {
      addLog(`Environment check failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ marginBottom: '20px' }}>🔍 Thumbnail Generation Debug Interface</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Control Panel */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h2 style={{ marginTop: 0 }}>Control Panel</h2>
          
          <button
            onClick={fetchRecentFiles}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              marginBottom: '10px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📁 Load Recent Files
          </button>
          
          <button
            onClick={checkEnvironment}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              marginBottom: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔧 Check Environment
          </button>
          
          <button
            onClick={clearLogs}
            style={{
              padding: '10px 20px',
              marginBottom: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Logs
          </button>
          
          <h3 style={{ marginTop: '20px' }}>Recent Files ({files.length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {files.map(file => (
              <div
                key={file._id}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedFile(file)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{file.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div>ID: {file._id}</div>
                  <div>Type: {file.mimeType}</div>
                  <div>Provider: {file.cloudStorage?.provider || 'N/A'}</div>
                  <div>Key: {file.cloudStorage?.key || 'N/A'}</div>
                  <div>Thumbnail: {file.thumbnailUrl ? '✅ Yes' : '❌ No'}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testThumbnailGeneration(file);
                  }}
                  disabled={loading}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    backgroundColor: file.thumbnailUrl ? '#f59e0b' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {file.thumbnailUrl ? '🔄 Regenerate' : '🖼️ Generate'} Thumbnail
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected File Details */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h2 style={{ marginTop: 0 }}>Selected File Details</h2>
          
          {selectedFile ? (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Title:</strong> {selectedFile.title}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Original Name:</strong> {selectedFile.originalName}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>File ID:</strong> {selectedFile._id}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>MIME Type:</strong> {selectedFile.mimeType}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>File Size:</strong> {(selectedFile.fileSize / 1024).toFixed(2)} KB
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Uploaded:</strong> {new Date(selectedFile.createdAt).toLocaleString()}
              </div>
              
              <h3>Cloud Storage</h3>
              <div style={{ marginBottom: '10px' }}>
                <strong>Provider:</strong> {selectedFile.cloudStorage?.provider || 'N/A'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Key:</strong> {selectedFile.cloudStorage?.key || 'N/A'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Bucket:</strong> {selectedFile.cloudStorage?.bucket || 'N/A'}
              </div>
              
              <h3>Thumbnail</h3>
              <div style={{ marginBottom: '10px' }}>
                <strong>URL:</strong> {selectedFile.thumbnailUrl || '❌ Not generated'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Key:</strong> {selectedFile.thumbnailKey || 'N/A'}
              </div>
              
              {selectedFile.thumbnailUrl && (
                <div style={{ marginTop: '20px' }}>
                  <h3>Thumbnail Preview</h3>
                  <img 
                    src={selectedFile.thumbnailUrl} 
                    alt="Thumbnail"
                    style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: '5px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', padding: '20px', backgroundColor: '#fee', color: '#c00', borderRadius: '5px' }}>
                    Failed to load thumbnail image
                  </div>
                </div>
              )}
              
              {thumbnailResult && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '5px' }}>
                  <h3>Last Generation Result</h3>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(thumbnailResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              Select a file from the list to view details
            </div>
          )}
        </div>
      </div>
      
      {/* Logs Panel */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
        <h2 style={{ marginTop: 0, color: '#fff' }}>📋 Debug Logs</h2>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '13px',
          lineHeight: '1.6'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#888', fontStyle: 'italic' }}>No logs yet. Click "Load Recent Files" or "Check Environment" to start.</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '5px',
                  color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#4ade80' : '#d4d4d4'
                }}
              >
                <span style={{ color: '#888' }}>[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
      
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>Generating thumbnail...</div>
          </div>
        </div>
      )}
    </div>
  );
}
