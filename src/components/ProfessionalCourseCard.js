'use client';

import React from 'react';

const ProfessionalCourseCard = ({ 
  course, 
  index, 
  onPreview, 
  onDragStart, 
  onDragOver, 
  onDragEnter, 
  onDragLeave, 
  onDragEnd, 
  onDrop,
  draggedCourse,
  dragOverIndex,
  trackUserInteraction 
}) => {
  // Debug logging - log every course to see what's being received
  console.log('🎴 Course Card Rendering:', {
    title: course.title,
    instructor: course.instructor,
    instructorProfilePicture: course.instructorProfilePicture,
    hasProfilePicture: !!course.instructorProfilePicture
  });
  
  return (
    <div
      key={course.id}
      className={`block group masonry-item cursor-pointer transition-all duration-200 ${
        draggedCourse?.index === index ? 'opacity-50 rotate-[5deg] scale-105' : ''
      } ${
        dragOverIndex === index ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''
      }`}
      draggable
      data-course-id={course.id}
      data-course-name={course.title}
      onClick={(e) => {
        if (!draggedCourse) {
          onPreview(course);
          trackUserInteraction('course_click', course.id, {
            position: index,
            courseName: course.title,
            courseCode: course.code,
            courseInstructor: course.instructor
          });
        }
      }}
      onDragStart={(e) => onDragStart(e, course, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
    >
      <div className="relative flex flex-col bg-white border cursor-pointer rounded-3xl transition-all duration-700 ease-out transform hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl hover:scale-[1.02] animate-shadow-enhance" style={{ animationDelay: `${index * 0.1}s` }}>
        {/* Enhanced gradient header with multiple layers */}
        <div className={`course-card-header relative h-32 p-3 pr-4 flex flex-col justify-between overflow-hidden ${course.color || 'bg-blue-500'} bg-gradient-to-br from-current via-current to-current transition-all duration-500 group-hover:shadow-inner animate-header-transform`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Enhanced glass-morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 transition-opacity duration-300 group-hover:opacity-75 rounded-3xl" style={{paddingRight: '2rem'}}></div>

          {/* Top section with icon, drag handle and menu */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                  <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
              </div>
            </div>

            {/* Enhanced menu button */}
            <button className="relative z-10 p-2 text-white/80 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:rotate-90 backdrop-blur-sm">
              <svg className="w-4 h-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          {/* Bottom section with enhanced status and action */}
          <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="text-white flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-white/40 rounded-full animate-status-glow flex-shrink-0"></div>
                <div className="text-sm font-bold opacity-95 tracking-wider">ACTIVE</div>
              </div>
            </div>

            {/* Enhanced action button */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4 mr-2">
              <div className="action-button flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl transition-all duration-300 group-hover:bg-white/25 group-hover:scale-110 shadow-lg border border-white/20 overflow-hidden animate-action-slide">
                <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:translate-x-1 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Floating elements for depth */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Enhanced content section */}
        <div className="relative flex flex-col flex-grow p-4 bg-gradient-to-b from-white to-gray-50/50">
          {/* Course title with improved typography hierarchy */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600 leading-tight line-clamp-2 flex-1 mr-2">
                {course.title}
              </h3>
              {/* Course type indicator */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                  Course
                </div>
              </div>
            </div>

            {/* Clean metadata layout */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-semibold">{course.code}</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm">
                <div className="relative flex items-center justify-center w-5 h-5 overflow-hidden bg-emerald-600 rounded-full flex-shrink-0">
                  {course.instructorProfilePicture ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={course.instructorProfilePicture} 
                        alt={course.instructor} 
                        className="absolute inset-0 object-cover w-full h-full"
                        onError={(e) => {
                          console.error('❌ Image failed to load:', course.instructorProfilePicture);
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="text-xs font-semibold text-white">
                        {course.instructor ? course.instructor.charAt(0).toUpperCase() : 'I'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {course.instructor ? course.instructor.charAt(0).toUpperCase() : 'I'}
                    </span>
                  )}
                </div>
                <span className="font-medium">{course.instructor}</span>
              </span>
            </div>
          </div>

          {/* Course stats section */}
          <div className="mt-auto space-y-4">
            {/* Course stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-item text-center p-3 bg-blue-50/80 rounded-xl border border-blue-100 transition-all duration-300 hover:bg-blue-100/90 animate-stat-lift">
                <div className="text-lg font-bold text-blue-600 mb-0.5">{course.studentCount || 0}</div>
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Students</div>
              </div>
              <div className="stat-item text-center p-3 bg-purple-50/80 rounded-xl border border-purple-100 transition-all duration-300 hover:bg-purple-100/90 animate-stat-lift">
                <div className="text-lg font-bold text-purple-600 mb-0.5">{course.moduleCount || 0}</div>
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Modules</div>
              </div>
              <div className="stat-item text-center p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 transition-all duration-300 hover:bg-emerald-100/90 animate-stat-lift">
                <div className="text-lg font-bold text-emerald-600 mb-0.5">-</div>
                <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Weeks</div>
              </div>
            </div>
          </div>

          {/* Subtle bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-b-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCourseCard;