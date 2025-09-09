'use client';

import { useState } from 'react';
import { XMarkIcon, DocumentIcon, VideoCameraIcon, SpeakerWaveIcon, FolderIcon } from '@heroicons/react/24/outline';

const UploadContentModal = ({ isOpen, onClose, courseId, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'document',
    file: null
  });

  const contentTypes = [
    { value: 'document', label: 'Document', icon: DocumentIcon, accept: '.pdf,.docx,.txt,.ppt,.pptx' },
    { value: 'video', label: 'Video', icon: VideoCameraIcon, accept: '.mp4,.avi,.mov,.wmv,.flv' },
    { value: 'audio', label: 'Audio', icon: SpeakerWaveIcon, accept: '.mp3,.wav,.aac,.ogg' },
    { value: 'material', label: 'Material', icon: FolderIcon, accept: '*' }
  ];

  const validateFile = (file) => {
    const selectedType = contentTypes.find(type => type.value === formData.contentType);
    if (!selectedType) return false;

    const allowedExtensions = selectedType.accept.split(',').map(ext => ext.trim());
    const fileExtension = `.${file.name.split('.').pop()}`;

    if (!allowedExtensions.includes(fileExtension)) {
      alert(`Invalid file type. For ${selectedType.label}, please upload one of the following file types: ${allowedExtensions.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFormData(prev => ({
          ...prev,
          file,
          title: prev.title || file.name.split('.')[0]
        }));
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (validateFile(file)) {
        setFormData(prev => ({
          ...prev,
          file,
          title: prev.title || file.name.split('.')[0]
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('contentType', formData.contentType);

      const response = await fetch(`/api/courses/${courseId}/content`, {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onUploadSuccess?.(result.content);

        // Generate thumbnail
        try {
          const thumbnailResponse = await fetch('/api/generate-thumbnail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ contentId: result.content._id }),
          });

          if (!thumbnailResponse.ok) {
            console.error('Failed to start thumbnail generation');
          }
        } catch (thumbnailError) {
          console.error('Error calling thumbnail generation API:', thumbnailError);
        }

        handleClose();
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      contentType: 'document',
      file: null
    });
    setDragActive(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const selectedType = contentTypes.find(type => type.value === formData.contentType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upload Content</h2>
          <button
            onClick={handleClose}
            className="p-2 transition-colors rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Type Selection */}
          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700">Content Type</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {contentTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, contentType: type.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.contentType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <IconComponent className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700">File</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : formData.file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept={selectedType?.accept}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {formData.file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                    <DocumentIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{formData.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(formData.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
                    {selectedType && <selectedType.icon className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your {selectedType?.label.toLowerCase()} here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse files</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Supported formats: {selectedType?.accept.replace(/\./g, '').toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter content title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter content description..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.file || isUploading}
              className="px-6 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                'Upload Content'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadContentModal;