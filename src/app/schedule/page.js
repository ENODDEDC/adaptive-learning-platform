"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
  const [joinedCourses, setJoinedCourses] = useState([]);

  useEffect(() => {
    console.log('SchedulePage useEffect triggered.');
    const fetchCoursesWithSchedules = async () => {
      console.log('Fetching courses with schedules...');
      try {
        const response = await fetch('/api/courses');

        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        setJoinedCourses(data.courses);
        
        // Build schedule grid from course schedules
        const formattedSchedule = {};
        data.courses.forEach(course => {
          if (course.schedules && course.schedules.length > 0) {
            course.schedules.forEach(schedule => {
              // Convert time format to match grid (e.g., "09:00" to "9 AM - 10 AM")
              const startHour = parseInt(schedule.startTime.split(':')[0]);
              const endHour = parseInt(schedule.endTime.split(':')[0]);
              
              const displayStartHour = startHour > 12 ? startHour - 12 : startHour;
              const startAmpm = startHour >= 12 ? 'PM' : 'AM';
              const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
              const endAmpm = endHour >= 12 ? 'PM' : 'AM';
              
              const timeSlot = `${displayStartHour} ${startAmpm} - ${displayEndHour} ${endAmpm}`;
              const day = schedule.day.toUpperCase();
              
              formattedSchedule[`${day}-${timeSlot}`] = {
                _id: course._id,
                subject: course.subject,
                section: course.section,
                color: course.coverColor,
              };
            });
          }
        });
        
        setScheduledCourses(formattedSchedule);
        console.log('Successfully built schedule from courses:', formattedSchedule);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error(`Failed to load schedule: ${error.message}`);
      }
    };

    fetchCoursesWithSchedules();
  }, []); // Empty dependency array to run once on mount



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
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click a course to view details
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
                          onClick={() => {
                            if (course) {
                              window.location.href = `/courses/${course._id}`;
                            }
                          }}
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
                            <div 
                              className="w-full h-full rounded-lg flex flex-col items-center justify-center shadow-lg transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-500 relative overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${course.color || '#3b82f6'} 0%, ${course.color || '#3b82f6'}dd 100%)`
                              }}
                            >
                              {/* Animated background gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:animate-shimmer"></div>

                              {/* Course content */}
                              <div className="relative z-10 flex flex-col items-center justify-center px-2">
                                <span className="text-xs font-bold text-white text-center leading-tight drop-shadow-lg">
                                  {course.subject}
                                </span>
                                {course.section && (
                                  <span className="text-[10px] text-white/80 text-center mt-0.5">
                                    {course.section}
                                  </span>
                                )}
                                {/* Animated underline */}
                                <div className="w-0 h-0.5 bg-white/80 rounded-full mt-1 group-hover:w-8 transition-all duration-500"></div>
                              </div>

                              {/* Hover glow effect */}
                              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                            </div>
                          ) : (
                            <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center transition-all duration-300 relative">
                              <span className="text-xs text-gray-400">—</span>
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


    </div>
  );
};

export default SchedulePage;