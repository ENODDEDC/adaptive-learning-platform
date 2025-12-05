import React, { useState, useCallback, useEffect, useRef } from 'react';

const FileUpload = ({ onFilesReady, initialFiles = [], folder = 'classwork', courseId = null }) => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const previousFilesRef = useRef(null);

  useEffect(() => {
    // Initialize files state with initialFiles when component mounts or initialFiles changes
    if (initialFiles.length > 0) {
      // Separate uploaded files from new files
      const uploaded = initialFiles.filter(file => file.url || file._id);
      const newFiles = initialFiles.filter(file => !file.url && !file._id);
      
      setUploadedFiles(uploaded);
      setFiles(newFiles);
    }
  }, [initialFiles]);

  // Update parent component when files change
  useEffect(() => {
    const allFiles = [...uploadedFiles, ...files];
    const previousFiles = previousFilesRef.current;

    // Only call onFilesReady if files have actually changed
    if (JSON.stringify(allFiles) !== JSON.stringify(previousFiles)) {
      if (onFilesReady) {
        onFilesReady(allFiles);
      }
      previousFilesRef.current = allFiles;
    }
  }, [files, uploadedFiles, onFilesReady]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    // Files are now added to pending state, user must click "Upload Files" button
  };

  const handleRemoveFile = (fileIdentifier, isUploaded = false) => {
    if (isUploaded) {
      setUploadedFiles((prevFiles) => 
        prevFiles.filter((file) => (file._id || file.key) !== fileIdentifier)
      );
    } else {
      setFiles((prevFiles) => 
        prevFiles.filter((file) => file.name !== fileIdentifier)
      );
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadToBackblaze = useCallback(async (filesToUpload) => {
    setIsUploading(true);
    const formData = new FormData();
    
    filesToUpload.forEach(file => {
      formData.append('files', file);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    });
    
    formData.append('folder', folder);
    if (courseId) {
      formData.append('courseId', courseId);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update progress to 100% for all files
      filesToUpload.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      });

      // Move uploaded files to uploadedFiles array
      setUploadedFiles(prev => [...prev, ...result.files]);
      
      // Remove uploaded files from pending files
      setFiles(prev => prev.filter(file => 
        !filesToUpload.some(uploaded => uploaded.name === file.name)
      ));

      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress({});
      }, 1000);

      return result.files;
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        filesToUpload: filesToUpload.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      // Reset progress on error
      filesToUpload.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [folder, courseId]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
      e.dataTransfer.clearData();
      // Files are now added to pending state, user must click "Upload Files" button
    }
  }, []);

  const handleUploadFiles = async () => {
    if (files.length === 0) return;
    
    try {
      await uploadToBackblaze(files);
    } catch (error) {
      console.error('Upload process failed:', error);
      alert(`Failed to upload files: ${error.message}. Please check the console for more details.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-500">
              {isUploading ? 'Uploading...' : 'Drag and drop files here, or click to select files'}
            </p>
          </div>
        </label>
      </div>

      {/* Pending Files (not yet uploaded) */}
      {files.length > 0 && (
        <div className="w-full mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Files to Upload:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <svg className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                {uploadProgress[file.name] !== undefined && (
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    ></div>
                  </div>
                )}
                <button
                  onClick={() => handleRemoveFile(file.name, false)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1"
                  disabled={isUploading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="w-full mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files:</h3>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li
                key={file._id || file.key || index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate text-sm">{file.originalName || file.fileName || file.name}</span>
                  {file.url && (
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFile(file._id || file.key, true)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUploadFiles}
          disabled={isUploading}
          className="w-full px-4 py-3 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default FileUpload;