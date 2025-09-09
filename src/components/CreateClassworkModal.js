import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import FileUpload from './FileUpload';

const CreateClassworkModal = ({ isOpen, onClose, courseId, onClassworkCreated, initialData = null, type: initialType = 'assignment' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState(initialType);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setDueDate(initialData.dueDate ? format(new Date(initialData.dueDate), 'yyyy-MM-dd') : '');
        setType(initialData.type || 'assignment');
        setFiles([]);
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
        setType(initialType);
        setFiles([]);
      }
      setError('');
    }
  }, [isOpen, initialData, initialType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim() || !type) {
      setError('Title and type are required.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('dueDate', dueDate || '');
      formData.append('type', type);
      files.forEach(file => {
        formData.append('attachments', file);
      });

      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/classwork/${initialData._id}` : `/api/courses/${courseId}/classwork`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      const newClasswork = await res.json();

      if (newClasswork && newClasswork.attachments && newClasswork.attachments.length > 0) {
        for (const attachment of newClasswork.attachments) {
          try {
            await fetch('/api/generate-thumbnail', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ contentId: attachment._id }),
            });
          } catch (thumbErr) {
            console.error('Failed to generate thumbnail for:', attachment._id, thumbErr);
            // Non-critical error, so we don't show it to the user
          }
        }
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{initialData ? 'Edit Classwork' : 'Create Classwork'}</h2>
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
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
            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                id="description"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label htmlFor="dueDate" className="block mb-2 text-sm font-medium text-gray-700">Due Date (Optional)</label>
              <input
                type="date"
                id="dueDate"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-700">Type</label>
              <select
                id="type"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="material">Material</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Attachments</label>
              <FileUpload onFilesReady={setFiles} />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Classwork')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateClassworkModal;