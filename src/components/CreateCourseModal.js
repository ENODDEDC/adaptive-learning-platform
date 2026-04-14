import React, { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';
import { XMarkIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

const CreateCourseModal = ({ isOpen, onClose, onCreateCourse, adminName }) => {
  const { refreshCourses } = useLayout();
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [coverColor, setCoverColor] = useState('#3b82f6');
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  const [isPrivate, setIsPrivate] = useState(false);

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Zinc', value: '#71717a' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Neutral', value: '#737373' },
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
      await onCreateCourse({ subject, section, teacherName: adminName, coverColor, schedules, isPrivate });
      onClose(); // Close modal after submission
      refreshCourses(); // Refresh courses on the home page
      // Reset form fields
      setSubject('');
      setSection('');
      setCoverColor('#60a5fa');
      setSchedules([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
      setIsPrivate(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div
        className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden flex"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Left Side - Preview */}
        <div className="hidden md:flex md:w-2/5 bg-gray-50 p-8 flex-col justify-between border-r border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Preview</h3>
            <div 
              className="rounded-lg p-6 shadow-sm"
              style={{ backgroundColor: coverColor }}
            >
              <div className="text-white">
                <h4 className="text-xl font-semibold mb-2">{subject || 'Course Subject'}</h4>
                <p className="text-sm opacity-90">{section || 'Section'}</p>
                <p className="text-xs opacity-75 mt-4">{adminName}</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <p>Students will see this course card on their dashboard</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">Create New Course</h2>
              <p className="text-sm text-gray-500 mt-0.5">Set up a new course for your students</p>
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                Course Subject *
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics, Physics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1.5">
                Section
              </label>
              <input
                type="text"
                id="section"
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A, B, 101"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Color
              </label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setCoverColor(color.value)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      coverColor === color.value
                        ? 'ring-2 ring-offset-2 ring-gray-900'
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {coverColor === color.value && (
                      <svg className="w-5 h-5 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Visibility
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    !isPrivate
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Public</div>
                      <div className="text-xs opacity-75">Anyone can join with key</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    isPrivate
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Private</div>
                      <div className="text-xs opacity-75">Invite only</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Class Schedule *
                </label>
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {schedules.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <select
                      value={schedule.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Monday">Mon</option>
                      <option value="Tuesday">Tue</option>
                      <option value="Wednesday">Wed</option>
                      <option value="Thursday">Thu</option>
                      <option value="Friday">Fri</option>
                      <option value="Saturday">Sat</option>
                      <option value="Sunday">Sun</option>
                    </select>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!subject.trim() || schedules.length === 0 || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;