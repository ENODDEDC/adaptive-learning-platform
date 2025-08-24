import React, { useState } from 'react';

const CreateCourseModal = ({ isOpen, onClose, onCreateCourse, adminName }) => {
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [coverColor, setCoverColor] = useState('#60a5fa'); // Default blue

  const colorOptions = [
    '#60a5fa', // Blue
    '#4ade80', // Green
    '#facc15', // Yellow
    '#fb7185', // Red
    '#a78bfa', // Purple
    '#f472b6', // Pink
    '#6ee7b7', // Teal
    '#e879f9', // Fuchsia
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateCourse({ subject, section, teacherName: adminName, coverColor });
    onClose(); // Close modal after submission
    // Reset form fields
    setSubject('');
    setSection('');
    setCoverColor('#60a5fa');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Create New Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subject" className="block mb-2 text-sm font-bold text-gray-700">
              Subject:
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="section" className="block mb-2 text-sm font-bold text-gray-700">
              Section:
            </label>
            <input
              type="text"
              id="section"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="coverColor" className="block mb-2 text-sm font-bold text-gray-700">
              Cover Photo Color:
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <div
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                    coverColor === color ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCoverColor(color)}
                ></div>
              ))}
            </div>
            {/* Display selected color */}
            <div className="mt-2 text-sm text-gray-600">
              Selected Color: <span style={{ color: coverColor }}>{coverColor}</span>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!adminName} // Disable if adminName is empty
              className={`px-4 py-2 font-bold text-white rounded focus:outline-none focus:shadow-outline ${
                !adminName ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
              }`}
            >
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;