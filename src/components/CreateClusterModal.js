import React, { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

const CreateClusterModal = ({ isOpen, onClose, onCreateCluster, userName }) => {
  const { refreshCourses } = useLayout();
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [coverColor, setCoverColor] = useState('#60a5fa');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [sectionSuggestions, setSectionSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    '#60a5fa', '#4ade80', '#facc15', '#fb7185', '#a78bfa', '#f472b6', '#6ee7b7', '#e879f9',
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      fetchSectionSuggestions();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      console.log('Fetched courses:', data.courses);
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSectionSuggestions = async () => {
    try {
      const response = await fetch('/api/clusters/suggestions');
      const data = await response.json();
      setSectionSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const clusterData = {
      name,
      section,
      coverColor,
      courseIds: selectedCourses,
    };

    console.log('Sending cluster data:', clusterData);

    try {
      await onCreateCluster(clusterData);
      onClose();
      refreshCourses();
      resetForm();
    } catch (error) {
      console.error('Error creating cluster:', error);
      alert('Failed to create cluster. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSection('');
    setCoverColor('#60a5fa');
    setSelectedCourses([]);
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Create New Cluster</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-bold text-gray-700">
              Cluster Name:
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              list="section-suggestions"
            />
            <datalist id="section-suggestions">
              {sectionSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion.section} />
              ))}
            </datalist>
            {sectionSuggestions.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Suggested sections based on your courses
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Cover Color:
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
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Select Courses ({selectedCourses.length} selected) - Optional:
            </label>
            <div className="p-2 overflow-y-auto border rounded max-h-48">
              {availableCourses.length === 0 ? (
                <p className="text-gray-500">No courses available. Create some courses first.</p>
              ) : (
                availableCourses.map((course) => (
                  <div key={course._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`course-${course._id}`}
                      checked={selectedCourses.includes(course._id)}
                      onChange={() => toggleCourseSelection(course._id)}
                      className="mr-2"
                    />
                    <label htmlFor={`course-${course._id}`} className="flex-1">
                      <span className="font-medium">{course.subject}</span>
                      {course.section && <span className="ml-2 text-gray-500">({course.section})</span>}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className={`px-4 py-2 font-bold text-white rounded focus:outline-none focus:shadow-outline ${
                loading || !name
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Cluster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClusterModal;