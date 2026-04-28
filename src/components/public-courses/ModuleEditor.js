'use client';

import { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentIcon,
  VideoCameraIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

export default function ModuleEditor({ courseId, module, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null); // 'video' or 'file'
  const [editingItem, setEditingItem] = useState(null);

  const handleUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const title = prompt(`Enter ${type} title:`);
    if (!title) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('file', file);
      formData.append('isPreview', 'false');

      if (type === 'video') {
        const duration = prompt('Enter video duration in seconds (optional):') || '0';
        formData.append('duration', duration);
      }

      const response = await fetch(
        `/api/public-courses/${courseId}/modules/${module._id}/items`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        await onUpdate();
        setUploadType(null);
      } else {
        alert(data.message || 'Failed to upload');
      }
    } catch (err) {
      alert('Failed to upload');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(
        `/api/public-courses/${courseId}/modules/${module._id}/items/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        await onUpdate();
      } else {
        alert(data.message || 'Failed to delete item');
      }
    } catch (err) {
      alert('Failed to delete item');
      console.error(err);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await fetch(
        `/api/public-courses/${courseId}/modules/${module._id}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await onUpdate();
        setEditingItem(null);
      } else {
        alert(data.message || 'Failed to update item');
      }
    } catch (err) {
      alert('Failed to update item');
      console.error(err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Module Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{module.title}</h2>
        {module.description && (
          <p className="text-gray-600 mt-1">{module.description}</p>
        )}
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-3 mb-6">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
          <VideoCameraIcon className="w-5 h-5" />
          Add Video
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleUpload(e, 'video')}
            className="hidden"
            disabled={uploading}
          />
        </label>

        <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
          <DocumentIcon className="w-5 h-5" />
          Add File
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={(e) => handleUpload(e, 'file')}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Uploading...
        </div>
      )}

      {/* Items List */}
      {module.items && module.items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No content yet</p>
          <p className="text-xs mt-1">Add videos or files to this module</p>
        </div>
      )}

      <div className="space-y-3">
        {module.items?.sort((a, b) => a.order - b.order).map((item) => (
          <div
            key={item._id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${
                item.type === 'video' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {item.type === 'video' ? (
                  <VideoCameraIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <DocumentIcon className="w-5 h-5 text-green-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                {editingItem === item._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue={item.title}
                      onBlur={(e) => handleUpdateItem(item._id, { title: e.target.value })}
                      className="w-full px-3 py-1 border border-gray-300 rounded"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      {item.type === 'video' && (
                        <span>{formatDuration(item.videoDuration)}</span>
                      )}
                      {item.type === 'file' && (
                        <>
                          <span>{item.fileType?.toUpperCase()}</span>
                          <span>{formatFileSize(item.fileSize)}</span>
                        </>
                      )}
                      {item.isPreview && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          Preview
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingItem(editingItem === item._id ? null : item._id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
