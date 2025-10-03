"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { api } from '../../services/apiService';

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7; // Starting from 7 AM
  const displayHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const nextHour = hour + 1;
  const displayNextHour = nextHour > 12 ? nextHour - 12 : nextHour;
  const nextAmpm = nextHour >= 12 ? 'PM' : 'AM';
  return `${displayHour} ${ampm} - ${displayNextHour} ${nextAmpm}`;
});

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const SchedulePage = () => {
  const [scheduledCourses, setScheduledCourses] = useState({}); // { 'MONDAY-7AM-8AM': { _id: 'courseId', subject: 'Math' }, ... }
  const [showModal, setShowModal] = useState(false);
  const [currentCell, setCurrentCell] = useState(null); // { day: 'MONDAY', timeSlot: '7AM-8AM' }
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [joinedCourses, setJoinedCourses] = useState([]);

  useEffect(() => {
    console.log('SchedulePage useEffect triggered.');
    const fetchJoinedCourses = async () => {
      console.log('Fetching joined courses...');
      try {
        const response = await api.getCourses();

        if (!response.ok) {
          throw new Error('Failed to fetch joined courses');
        }

        const data = await response.json();
        setJoinedCourses(data.courses);
        console.log('Successfully fetched joined courses:', data.courses);
      } catch (error) {
        console.error('Error fetching joined courses:', error);
        toast.error(`Failed to load joined courses: ${error.message}`);
      }
    };

    const fetchScheduledCourses = async () => {
      try {
        const response = await api.getSchedule();

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch scheduled courses');
        }

        const data = await response.json();
        const formattedSchedule = data.scheduledCourses.reduce((acc, item) => {
          acc[`${item.day}-${item.timeSlot}`] = {
            _id: item.courseId._id,
            subject: item.courseId.subject,
          };
          return acc;
        }, {});
        setScheduledCourses(formattedSchedule);
        console.log('Successfully fetched scheduled courses:', formattedSchedule);
      } catch (error) {
        console.error('Error fetching scheduled courses:', error);
        toast.error(`Failed to load schedule: ${error.message}`);
      }
    };

    fetchJoinedCourses();
    fetchScheduledCourses();
  }, []); // Empty dependency array to run once on mount

  const handleCellClick = (day, timeSlot) => {
    setCurrentCell({ day, timeSlot });
    const courseInCell = scheduledCourses[`${day}-${timeSlot}`];
    setSelectedCourseId(courseInCell ? courseInCell._id : '');
    setShowModal(true);
  };

  const handleSaveCourse = async () => {
    if (currentCell && selectedCourseId) {
      const courseToAdd = joinedCourses.find(course => course._id === selectedCourseId);
      if (courseToAdd) {
        try {
          const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              day: currentCell.day,
              timeSlot: currentCell.timeSlot,
              courseId: selectedCourseId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save course to schedule');
          }

          setScheduledCourses(prev => ({
            ...prev,
            [`${currentCell.day}-${currentCell.timeSlot}`]: {
              _id: courseToAdd._id,
              subject: courseToAdd.subject,
            },
          }));
          toast.success('Course scheduled successfully!');
        } catch (error) {
          console.error('Error saving course to schedule:', error);
          toast.error(`Failed to save course: ${error.message}`);
        }
      }
    } else if (currentCell && !selectedCourseId) {
      // If no course is selected, clear the cell
      handleClearCourse();
    }
    setShowModal(false);
    setSelectedCourseId('');
  };

  const handleClearCourse = async () => {
    if (currentCell) {
      try {
        const response = await fetch('/api/schedule', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            day: currentCell.day,
            timeSlot: currentCell.timeSlot,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete course from schedule');
        }

        setScheduledCourses(prev => {
          const newState = { ...prev };
          delete newState[`${currentCell.day}-${currentCell.timeSlot}`];
          return newState;
        });
        toast.success('Course cleared successfully!');
      } catch (error) {
        console.error('Error clearing course from schedule:', error);
        toast.error(`Failed to clear course: ${error.message}`);
      }
      setShowModal(false);
      setSelectedCourseId('');
    }
  };

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50">
      {/* Modern Header */}
      <div className="p-6 mx-4 mt-4 mb-8 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Weekly Schedule</h1>
            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">Organize your courses and manage your time effectively</p>
            <div className="w-0 h-0.5 bg-blue-500 rounded-full mt-2 group-hover:w-32 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Schedule Container */}
      <div className="mx-4 bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative p-6">
          {/* Quick Stats */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 group">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse group-hover:scale-125 transition-transform duration-300"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                  {Object.keys(scheduledCourses).length} Scheduled
                </span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-3 h-3 bg-green-500 rounded-full group-hover:scale-125 group-hover:bg-green-600 transition-all duration-300"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors duration-300">
                  {joinedCourses.length} Available
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300 flex items-center gap-1">
              <svg className="w-3 h-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Click any cell to schedule
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="grid grid-cols-[auto_repeat(6,minmax(160px,1fr))] gap-1">
                {/* Header Row */}
                <div className="sticky top-0 left-0 z-20 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-sm font-bold text-white shadow-lg rounded-tl-xl flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Time
                </div>
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-center text-sm font-bold text-white shadow-lg animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </div>
                ))}

                {/* Schedule Grid */}
                {timeSlots.map((timeSlot, timeIndex) => (
                  <React.Fragment key={timeSlot}>
                    <div className="sticky left-0 z-10 bg-gradient-to-b from-gray-100 to-gray-50 p-4 text-sm font-semibold text-gray-700 border-r border-gray-200 shadow-sm">
                      {timeSlot}
                    </div>
                    {daysOfWeek.map((day, dayIndex) => {
                      const cellKey = `${day}-${timeSlot}`;
                      const course = scheduledCourses[cellKey];
                      return (
                        <div
                          key={cellKey}
                          className="relative h-20 p-3 border border-gray-200 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer flex items-center justify-center text-center rounded-lg group animate-fade-in-up overflow-hidden"
                          style={{ animationDelay: `${(timeIndex * 6 + dayIndex) * 0.02}s` }}
                          onClick={() => handleCellClick(day, timeSlot)}
                        >
                          {/* Background particles for empty cells */}
                          {!course && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                              <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
                              <div className="absolute bottom-3 left-1/2 w-0.5 h-0.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                            </div>
                          )}

                          {course ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-500 relative overflow-hidden">
                              {/* Animated background gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:animate-shimmer"></div>

                              {/* Course content */}
                              <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-white text-center leading-tight px-1 drop-shadow-lg">
                                  {course.subject}
                                </span>
                                {/* Animated underline */}
                                <div className="w-0 h-0.5 bg-white/80 rounded-full mt-1 group-hover:w-8 transition-all duration-500"></div>
                              </div>

                              {/* Hover glow effect */}
                              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                            </div>
                          ) : (
                            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all duration-500 relative">
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>

                              {/* Ripple effect on hover */}
                              <div className="absolute inset-0 bg-blue-400/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                            </div>
                          )}

                          {/* Cell selection indicator */}
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Schedule Course
                </h2>
                <p className="text-sm text-gray-600">
                  {currentCell?.day.toLowerCase()} • {currentCell?.timeSlot}
                </p>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-3 mb-8">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Select Course
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <select
                  className="relative w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all duration-300 appearance-none shadow-sm hover:shadow-md cursor-pointer"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="" className="text-gray-500">Choose a course to schedule</option>
                  {joinedCourses.map(course => (
                    <option key={course._id} value={course._id} className="py-2">
                      📚 {course.subject} • {course.section}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-transparent to-purple-400/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {selectedCourseId && (
                <div className="flex items-center gap-2 text-sm text-green-600 animate-fade-in">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Course selected successfully
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {(scheduledCourses[`${currentCell?.day}-${currentCell?.timeSlot}`] || selectedCourseId) && (
                <button
                  onClick={handleClearCourse}
                  className="px-6 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-300 font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={!selectedCourseId}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;