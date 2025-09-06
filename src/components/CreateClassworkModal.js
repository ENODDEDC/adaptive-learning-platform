import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const CreateClassworkModal = ({ isOpen, onClose, courseId, onClassworkCreated, initialData = null, type: initialType = 'assignment' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState(initialType); // 'assignment', 'quiz assignment', 'question', 'material', 'reuse post', 'topic'
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDueDate(initialData.dueDate ? format(new Date(initialData.dueDate), 'yyyy-MM-dd') : '');
      setType(initialData.type || 'assignment');
      setAttachments(initialData.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setType(initialType);
      setAttachments([]);
    }
    setError('');
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim() || !type) {
      setError('Title and type are required.');
      setLoading(false);
      return;
    }

    let uploadedAttachmentUrls = [];
    try {
      // Token is now sent via HTTP-only cookie, no need to retrieve from localStorage
      // if (!token) {
      //   setError('User not authenticated.');
      //   setLoading(false);
      //   return;
      // }

      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.message || `Error uploading files: ${uploadRes.status} ${uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        uploadedAttachmentUrls = uploadData.urls.map(url => ({ url, name: url.split('/').pop() }));
      }

      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/classwork/${initialData._id}` : `/api/courses/${courseId}/classwork`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${token}`, // No longer needed, cookie is sent automatically
        },
        body: JSON.stringify({
          courseId,
          title,
          description,
          dueDate: dueDate || null,
          type,
          attachments: [...(initialData?.attachments || []), ...uploadedAttachmentUrls],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      onClassworkCreated();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Failed to save classwork:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">{initialData ? 'Edit Classwork' : 'Create New Classwork'}</h2>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="description"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="dueDate" className="block mb-2 text-sm font-medium text-gray-700">Due Date (Optional)</label>
            <input
              type="date"
              id="dueDate"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-700">Type</label>
            <select
              id="type"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="assignment">Assignment</option>
              <option value="quiz assignment">Quiz assignment</option>
              <option value="question">Question</option>
              <option value="material">Material</option>
              <option value="reuse post">Reuse post</option>
              <option value="topic">Topic</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="attachments" className="block mb-2 text-sm font-medium text-gray-700">Attachments</label>
            <input
              type="file"
              id="attachments"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files))}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Classwork')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassworkModal;