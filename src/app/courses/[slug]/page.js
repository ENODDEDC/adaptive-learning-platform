'use client';

import React, { useState } from 'react';

const CourseDetailPage = ({ params }) => {
  const { slug } = params;
  const [expandedActivities, setExpandedActivities] = useState({});
  
  // Format course title from slug
  const courseTitle = slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('-');

  // Toggle activity expansion
  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  return (
    <div className="h-full bg-gray-50 p-8 overflow-y-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Course-1</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">People</span>
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs font-semibold">U1</span>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs font-semibold">U2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-1 gap-6">
        {/* Left Sidebar - Course Modules */}
        <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Course Modules</h2>
          <div className="space-y-4">
            {/* Module 1 */}
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
              </div>
              <span className="text-sm font-medium text-gray-800">Intro to Programming I</span>
            </div>
            
            {/* Module 2 */}
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
              </div>
              <span className="text-sm font-medium text-gray-800">Intro to Programming II</span>
            </div>
            
            {/* Module 3 - Current */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full ring-2 ring-blue-200"></div>
              </div>
              <span className="text-sm font-semibold text-blue-700">Intro to Programming III</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Show full-screen document if any activity is expanded */}
          {expandedActivities['activity1'] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative min-h-screen">
              {/* AI Enhancement Icon - Bottom Right Corner */}
              <div className="absolute bottom-6 right-6 z-20">
                <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-lg cursor-pointer transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              
              {/* Document Header with Zoom and Close */}
              <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-600 font-medium border border-gray-200">
                  25%
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActivityExpansion('activity1');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 font-bold transition-colors border border-gray-200"
                >
                  ×
                </button>
              </div>
              
              {/* Document Content */}
              <div className="max-w-4xl mx-auto pt-4">
                <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">Background of the Study</h3>
                <div className="space-y-6 text-justify leading-relaxed text-gray-700">
                  <p className="text-lg leading-8">
                    To meet the demands of a fast-changing technological landscape, educational 
                    systems must integrate technological tools and online learning opportunities. 
                    The integration of technology in education has opened new frontiers in academic 
                    for engagement and learner achievement, allowing learners to explore new ideas 
                    from global and local science, and hence creating and measuring educational 
                    behaviours in a pathway to Academic and develop educational materials.
                  </p>
                  <p className="text-lg leading-8">
                    One of 2022(22) defined artificial intelligence as the combination of computers, 
                    computational technologies, heuristics, and educational mechanisms and technology 
                    aimed at enabling computers to perform these human-like functions.
                  </p>
                  <p className="text-lg leading-8">
                    Several days therefore, he said with any use of his technology, artificial intelligence has 
                    he been connected adapted to the education sector, artificial intelligence has a lot of 
                    application, including adaptive learning. Papadopoulos et al., 2022() note that 
                    adaptive learning provides students with the means to explore educational according to 
                    their individual needs and cognitive differences.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show full-screen document for Activity 2 */}
          {expandedActivities['activity2'] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative min-h-screen">
              {/* AI Enhancement Icon - Bottom Right Corner */}
              <div className="absolute bottom-6 right-6 z-20">
                <div className="bg-green-600 hover:bg-green-700 rounded-full p-3 shadow-lg cursor-pointer transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              
              {/* Document Header with Zoom and Close */}
              <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-600 font-medium border border-gray-200">
                  25%
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActivityExpansion('activity2');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 font-bold transition-colors border border-gray-200"
                >
                  ×
                </button>
              </div>
              
              {/* Document Content */}
              <div className="max-w-4xl mx-auto pt-4">
                <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">Activity 3 - Programming Fundamentals</h3>
                <div className="space-y-6 text-justify leading-relaxed text-gray-700">
                  <p className="text-lg leading-8">
                    This activity focuses on understanding the core concepts of programming languages 
                    and their applications in modern software development. Students will explore 
                    various programming paradigms and learn how to implement basic algorithms.
                  </p>
                  <p className="text-lg leading-8">
                    Programming fundamentals include understanding variables, data types, control 
                    structures, functions, and object-oriented programming principles. These concepts 
                    form the foundation for more advanced programming topics.
                  </p>
                  <p className="text-lg leading-8">
                    Through practical exercises and hands-on coding activities, students will develop 
                    problem-solving skills and learn to write clean, efficient, and maintainable code. 
                    The activity emphasizes best practices in software development and debugging techniques.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show normal course content when no activities are expanded */}
          {!expandedActivities['activity1'] && !expandedActivities['activity2'] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">MF</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">Mr. Fernandez</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Instructor</span>
                  </div>
                  <span className="text-sm text-gray-500">Aug 26, 2025</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Intro To Programming III</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">Good morning class! Please read the module below and complete the activities. This module covers fundamental programming concepts essential for your development as programmers.</p>
              
              {/* Activity Cards - Always Visible */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Activity 1 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                  <div className="w-12 h-12 bg-white rounded-xl mb-4 shadow-sm border border-blue-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-3 text-gray-900">Intro to Programming III</h3>
                  <p className="text-sm text-gray-600 mb-4">Study the background and fundamentals of programming concepts.</p>
                  <button 
                    onClick={() => toggleActivityExpansion('activity1')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Expand View
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                
                {/* Activity 2 */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                  <div className="w-12 h-12 bg-white rounded-xl mb-4 shadow-sm border border-green-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-3 text-gray-900">Activity 3</h3>
                  <p className="text-sm text-gray-600 mb-4">Practical programming exercises and implementation tasks.</p>
                  <button 
                    onClick={() => toggleActivityExpansion('activity2')}
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Expand View
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Comment Section */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">U</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Ongoing Tasks */}
        <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ongoing Task</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View All
            </button>
          </div>
          
          {/* Empty state for tasks */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">No Recent Activity</h4>
            <p className="text-sm text-gray-500 leading-relaxed">You don&apos;t have any recent activity to show here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;