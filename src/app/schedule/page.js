"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  const displayHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const nextHour = hour + 1;
  const displayNextHour = nextHour > 12 ? nextHour - 12 : nextHour;
  const nextAmpm = nextHour >= 12 ? 'PM' : 'AM';
  return `${displayHour} ${ampm} - ${displayNextHour} ${nextAmpm}`;
});

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const SchedulePage = () => {
  const [scheduledCourses, setScheduledCourses] = useState({});
  const [joinedCourses, setJoinedCourses] = useState([]);

  useEffect(() => {
    const fetchCoursesWithSchedules = async () => {
      try {
        const response = await fetch('/api/courses');

        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        setJoinedCourses(data.courses);

        const formattedSchedule = {};
        data.courses.forEach(course => {
          if (course.schedules && course.schedules.length > 0) {
            course.schedules.forEach(schedule => {
              const startHour = parseInt(schedule.startTime.split(':')[0], 10);
              const endHour = parseInt(schedule.endTime.split(':')[0], 10);

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
      } catch (error) {
        toast.error(`Failed to load schedule: ${error.message}`);
      }
    };

    fetchCoursesWithSchedules();
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 p-4">
      <div className="flex h-full flex-col gap-4">
        <div className="mx-3 mt-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-1 rounded-t-2xl bg-blue-500"></div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h1 className="text-[1.9rem] font-bold leading-tight text-gray-900">Weekly Schedule</h1>
                  <p className="text-sm text-gray-600">A focused view of your enrolled courses across the week.</p>
                </div>
              </div>

              <div className="hidden flex-shrink-0 items-center gap-3 xl:flex">
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-semibold text-gray-800">{Object.keys(scheduledCourses).length} Scheduled</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-semibold text-gray-800">{joinedCourses.length} Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-3 mb-1 flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.35) 1px, transparent 0)`,
              backgroundSize: '18px 18px'
            }}
          ></div>

          <div className="relative flex h-full min-h-0 flex-col p-4">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-semibold text-gray-800">{Object.keys(scheduledCourses).length} Scheduled</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-semibold text-gray-800">{joinedCourses.length} Available</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select a scheduled class to open its course page
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70">
              <div className="h-full overflow-auto">
                <div className="grid min-w-[980px] grid-cols-[140px_repeat(6,minmax(150px,1fr))] gap-1 p-1">
                  <div className="sticky left-0 top-0 z-20 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-sm font-bold text-white shadow-sm">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time
                  </div>

                  {daysOfWeek.map((day, index) => (
                    <div
                      key={day}
                      className="sticky top-0 z-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-center text-sm font-bold text-white shadow-sm animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </div>
                  ))}

                  {timeSlots.map((timeSlot, timeIndex) => (
                    <React.Fragment key={timeSlot}>
                      <div className="sticky left-0 z-10 rounded-xl border-r border-gray-200 bg-gradient-to-b from-gray-100 to-white p-3 text-sm font-semibold text-gray-700 shadow-sm">
                        {timeSlot}
                      </div>

                      {daysOfWeek.map((day, dayIndex) => {
                        const cellKey = `${day}-${timeSlot}`;
                        const course = scheduledCourses[cellKey];

                        return (
                          <div
                            key={cellKey}
                            className="group relative flex h-[74px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-center transition-all duration-300 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-md animate-fade-in-up"
                            style={{ animationDelay: `${(timeIndex * 6 + dayIndex) * 0.015}s` }}
                            onClick={() => {
                              if (course) {
                                window.location.href = `/courses/${course._id}`;
                              }
                            }}
                          >
                            {!course && (
                              <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/40">
                                <span className="text-xs text-gray-400">-</span>
                              </div>
                            )}

                            {course && (
                              <div
                                className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg shadow-sm transition-all duration-300 group-hover:scale-[1.02]"
                                style={{
                                  background: `linear-gradient(135deg, ${course.color || '#3b82f6'} 0%, ${(course.color || '#3b82f6')}dd 100%)`
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-shimmer"></div>
                                <div className="relative z-10 flex flex-col items-center justify-center px-2">
                                  <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-white drop-shadow-lg">
                                    {course.subject}
                                  </span>
                                  {course.section && (
                                    <span className="mt-0.5 line-clamp-1 text-center text-[10px] text-white/80">
                                      {course.section}
                                    </span>
                                  )}
                                  <div className="mt-1 h-0.5 w-0 rounded-full bg-white/80 transition-all duration-300 group-hover:w-7"></div>
                                </div>
                                <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                              </div>
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
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
