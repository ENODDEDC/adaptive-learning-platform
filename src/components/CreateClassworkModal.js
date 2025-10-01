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
        setFiles(initialData.attachments || []);
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
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('dueDate', dueDate || '');
      formData.append('type', type);
      
      const newFiles = files.filter(file => !file._id); // Filter out existing files
      const existingAttachments = files.filter(file => file._id); // Filter for existing files

      formData.append('existingAttachments', JSON.stringify(existingAttachments));
      
      newFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/classwork/${initialData._id}` : `/api/courses/${courseId}/classwork`;

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
      }

      console.log('🔍 CLASSWORK: Calling onClassworkCreated callback');
      if (onClassworkCreated && typeof onClassworkCreated === 'function') {
        onClassworkCreated();
        console.log('🔍 CLASSWORK: onClassworkCreated callback executed successfully');
      } else {
        console.warn('🔍 CLASSWORK: onClassworkCreated is not a function or is undefined');
      }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="w-full max-w-2xl p-6 sm:p-8 bg-white rounded-2xl shadow-xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{initialData ? 'Edit Classwork' : 'Create Classwork'}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <form onSubmit={handleSubmit} className="flex-grow mt-6 overflow-y-auto pr-2 space-y-5">
            <div>
              <label htmlFor="title" className="block mb-1.5 text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block mb-1.5 text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                id="description"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dueDate" className="block mb-1.5 text-sm font-medium text-gray-700">Due Date (Optional)</label>
                <input
                  type="date"
                  id="dueDate"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="type" className="block mb-1.5 text-sm font-medium text-gray-700">Type</label>
                <select
                  id="type"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="assignment">Assignment</option>
                  <option value="form">Form</option>
                  <option value="material">Material</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Attachments</label>
              <FileUpload onFilesReady={setFiles} initialFiles={files} />
            </div>
          </form>

          <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Classwork')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateClassworkModal;