import React, { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';
import { BookOpenIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const CreateCourseModal = ({ isOpen, onClose, onCreateCourse, adminName }) => {
  const { refreshCourses } = useLayout();
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [coverColor, setCoverColor] = useState('#60a5fa'); // Default blue color
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);

  const colorOptions = [
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Green', value: '#34d399' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Red', value: '#f87171' },
    { name: 'Teal', value: '#2dd4bf' },
    { name: 'Indigo', value: '#818cf8' },
  ];

  const handleAddSchedule = () => {
    setSchedules([...schedules, { day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  };

  const handleRemoveSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onCreateCourse({ subject, section, teacherName: adminName, coverColor, schedules });
      onClose(); // Close modal after submission
      refreshCourses(); // Refresh courses on the home page
      // Reset form fields
      setSubject('');
      setSection('');
      setCoverColor('#60a5fa');
      setSchedules([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first input
      setTimeout(() => {
        document.getElementById('subject')?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
              <BookOpenIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">Create New Course</h2>
              <p className="text-sm text-gray-500">Set up a new course for your students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <input
              type="text"
              id="subject"
              className="w-full px-4 pt-6 pb-3 text-gray-900 placeholder-transparent border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer transition-all duration-200"
              placeholder="Course Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <label
              htmlFor="subject"
              className={`absolute left-4 text-gray-500 text-sm transition-all duration-200 pointer-events-none ${
                subject ? 'top-2 text-xs text-blue-600' : 'top-4 text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600'
              }`}
            >
              Course Subject *
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              id="section"
              className="w-full px-4 pt-6 pb-3 text-gray-900 placeholder-transparent border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer transition-all duration-200"
              placeholder="Section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
            <label
              htmlFor="section"
              className={`absolute left-4 text-gray-500 text-sm transition-all duration-200 pointer-events-none ${
                section ? 'top-2 text-xs text-blue-600' : 'top-4 text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600'
              }`}
            >
              Section
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Course Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setCoverColor(color.value)}
                  className={`relative h-12 rounded-xl transition-all duration-200 hover:scale-110 ${
                    coverColor === color.value
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {coverColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Class Schedule *
              </label>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Schedule
              </button>
            </div>

            {schedules.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {schedules.map((schedule, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <select
                          value={schedule.day}
                          onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subject.trim() || schedules.length === 0 || isLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;