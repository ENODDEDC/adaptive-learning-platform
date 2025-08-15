import React, { useState } from 'react';

const CreateCourseModal = ({ isOpen, onClose, onCreateCourse }) => {
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [teacherName, setTeacherName] = useState('');
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
    onCreateCourse({ subject, section, teacherName, coverColor });
    onClose(); // Close modal after submission
    // Reset form fields
    setSubject('');
    setSection('');
    setTeacherName('');
    setCoverColor('#60a5fa');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">
              Subject:
            </label>
            <input
              type="text"
              id="subject"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="section" className="block text-gray-700 text-sm font-bold mb-2">
              Section:
            </label>
            <input
              type="text"
              id="section"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="teacherName" className="block text-gray-700 text-sm font-bold mb-2">
              Teacher Name:
            </label>
            <input
              type="text"
              id="teacherName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="coverColor" className="block text-gray-700 text-sm font-bold mb-2">
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
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2 focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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