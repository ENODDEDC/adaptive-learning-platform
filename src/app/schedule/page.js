"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
        const token = localStorage.getItem('token');
        console.log('Token for joined courses:', token ? 'Exists' : 'Does not exist');
        if (!token) {
          console.warn('No token found for fetching joined courses. Redirecting to login.');
          router.push('/login');
          return;
        }

        const response = await fetch('/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

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
      console.log('Fetching scheduled courses...');
      try {
        const token = localStorage.getItem('token');
        console.log('Token for scheduled courses:', token ? 'Exists' : 'Does not exist');
        if (!token) {
          console.warn('No token found for fetching scheduled courses. Redirecting to login.');
          router.push('/login');
          return;
        }

        const response = await fetch('/api/schedule', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

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
          const token = localStorage.getItem('token');
          const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
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
        const token = localStorage.getItem('token');
        const response = await fetch('/api/schedule', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Weekly Schedule</h1>

        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-200">
            <div className="grid grid-cols-[auto_repeat(6,minmax(150px,1fr))] gap-px">
              {/* Header Row */}
              <div className="sticky top-0 left-0 z-20 bg-blue-700 p-3 text-sm font-semibold text-white rounded-tl-lg">Time</div>
              {daysOfWeek.map(day => (
                <div key={day} className="sticky top-0 z-10 bg-blue-600 p-3 text-center text-sm font-semibold text-white">
                  {day}
                </div>
              ))}

              {/* Schedule Grid */}
              {timeSlots.map(timeSlot => (
                <React.Fragment key={timeSlot}>
                  <div className="sticky left-0 z-10 bg-blue-50 p-3 text-sm font-medium text-gray-800 border-r border-gray-200">
                    {timeSlot}
                  </div>
                  {daysOfWeek.map(day => {
                    const cellKey = `${day}-${timeSlot}`;
                    const course = scheduledCourses[cellKey];
                    return (
                      <div
                        key={cellKey}
                        className="relative h-24 p-2 border-b border-r border-gray-200 bg-white hover:bg-blue-50 transition-colors duration-150 cursor-pointer flex items-center justify-center text-center rounded-sm"
                        onClick={() => handleCellClick(day, timeSlot)}
                      >
                        {course && (
                          <span className="text-sm font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-md shadow-sm">
                            {course.subject}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Course Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">
              {currentCell?.day} - {currentCell?.timeSlot}
            </h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select a course</option>
              {joinedCourses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.subject} ({course.section})
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              {(scheduledCourses[`${currentCell?.day}-${currentCell?.timeSlot}`] || selectedCourseId) && (
                <button
                  onClick={handleClearCourse}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;