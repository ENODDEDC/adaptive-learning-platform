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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-600 text-white px-8 py-6 mx-4 mt-4 rounded-lg flex justify-between items-center">
        <h1 className="text-xl font-medium">Course-1</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">People</span>
          <div className="flex items-center -space-x-2">
            <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white"></div>
            <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden mt-4">
        {/* Left Sidebar - Course Modules */}
        <div className="w-80 bg-gray-100 border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Module 1 */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-400 mt-1"></div>
              </div>
              <span className="text-base font-medium text-gray-800">Intro to Programming I</span>
            </div>
            
            {/* Module 2 */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-400 mt-1"></div>
              </div>
              <span className="text-base font-medium text-gray-800">Intro to Programming II</span>
            </div>
            
            {/* Module 3 */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              </div>
              <span className="text-base font-medium text-gray-800">Intro to Programming III</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          <div className="max-w-none mx-auto">
            {/* Show full-screen document if any activity is expanded */}
            {expandedActivities['activity1'] && (
              <div className="bg-white rounded-lg p-8 relative shadow-sm border border-gray-200 min-h-screen">
                {/* AI Enhancement Icon - Bottom Right Corner */}
                <div className="absolute bottom-6 right-6 z-20">
                  <div className="bg-gray-400 hover:bg-gray-500 rounded-full p-2 shadow-lg cursor-pointer transition-colors duration-200">
                    <img 
                      src="/enhance.png" 
                      alt="AI Enhancement" 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                </div>
                
                {/* Document Header with Zoom and Close */}
                <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                  <div className="bg-gray-100 px-3 py-1 rounded-md text-sm text-gray-600 font-medium">
                    25%
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActivityExpansion('activity1');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-md flex items-center justify-center text-gray-600 font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                {/* Document Content */}
                <div className="max-w-4xl mx-auto pt-4">
                  <h3 className="text-2xl font-bold mb-8 text-center text-gray-900">Background of the Study</h3>
                  <div className="space-y-6 text-justify leading-relaxed text-gray-700">
                    <p>
                      To meet the demands of a fast-changing technological landscape, educational 
                      systems must integrate technological tools and online learning opportunities. 
                      The integration of technology in education has opened new frontiers in academic 
                      for engagement and learner achievement, allowing learners to explore new ideas 
                      from global and local science, and hence creating and measuring educational 
                      behaviours in a pathway to Academic and develop educational materials. Similarly, 2020 
                      marked a of COVID-2020 saw that the system had no C-19(1) learning due a more advanced 
                      framework to students who and training more effort from students and increasing the interest of 
                      technology and the importance of their latest technology, doesn't apply, provides 
                      insight into the utilization of educational technology.
                    </p>
                    <p>
                      One of 2022(22) defined artificial intelligence as the combination of computers, 
                      computational technologies, heuristics, and educational mechanisms and technology 
                      aimed at enabling computers to perform these human-like functions.
                    </p>
                    <p>
                      Several days therefore, he said with any use of his technology, artificial intelligence has 
                      he been connected adapted to the education sector, artificial intelligence has a lot of 
                      application, including adaptive learning. Papadopoulos et al., 2022() note that 
                      adaptive learning provides students with the means to explore educational according to 
                      their individual needs and cognitive differences. Also facilitating the learning process of 
                      both individual learners in a positive manner, at education and making easier and 
                      new artificial Intelligence in predicated methods to education and creating added 
                      to content C(1) platforms.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show full-screen document for Activity 2 */}
            {expandedActivities['activity2'] && (
              <div className="bg-white rounded-lg p-8 relative shadow-sm border border-gray-200 min-h-screen">
                {/* AI Enhancement Icon - Bottom Right Corner */}
                <div className="absolute bottom-6 right-6 z-20">
                  <div className="bg-gray-400 hover:bg-gray-500 rounded-full p-2 shadow-lg cursor-pointer transition-colors duration-200">
                    <img 
                      src="/enhance.png" 
                      alt="AI Enhancement" 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                </div>
                
                {/* Document Header with Zoom and Close */}
                <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                  <div className="bg-gray-100 px-3 py-1 rounded-md text-sm text-gray-600 font-medium">
                    25%
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActivityExpansion('activity2');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-md flex items-center justify-center text-gray-600 font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                {/* Document Content */}
                <div className="max-w-4xl mx-auto pt-4">
                  <h3 className="text-2xl font-bold mb-8 text-center text-gray-900">Activity 3 - Programming Fundamentals</h3>
                  <div className="space-y-6 text-justify leading-relaxed text-gray-700">
                    <p>
                      This activity focuses on understanding the core concepts of programming languages 
                      and their applications in modern software development. Students will explore 
                      various programming paradigms and learn how to implement basic algorithms.
                    </p>
                    <p>
                      Programming fundamentals include understanding variables, data types, control 
                      structures, functions, and object-oriented programming principles. These concepts 
                      form the foundation for more advanced programming topics.
                    </p>
                    <p>
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
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">MF</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Mr. Fernandez</span>
                    </div>
                    <span className="text-sm text-gray-500">Aug 26, 2025</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-3 text-gray-900">Intro To Programming III</h2>
                <p className="text-gray-600 mb-8">Good morning class please read the module below and answer the activity</p>
                
                {/* Activity Cards - Always Visible */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Activity 1 */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-lg mb-4 shadow-sm border border-gray-200"></div>
                    <h3 className="font-semibold mb-3 text-gray-900">Intro to Programming III</h3>
                    <button 
                      onClick={() => toggleActivityExpansion('activity1')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Expand View
                    </button>
                  </div>
                  
                  {/* Activity 2 */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-lg mb-4 shadow-sm border border-gray-200"></div>
                    <h3 className="font-semibold mb-3 text-gray-900">Activity 3</h3>
                    <button 
                      onClick={() => toggleActivityExpansion('activity2')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Expand View
                    </button>
                  </div>
                </div>
                
                {/* Comment Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <input 
                      type="text" 
                      placeholder="Add a comment" 
                      className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
                    />
                    <button className="p-2 hover:bg-gray-200 rounded-md transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Ongoing Tasks */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 pt-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ongoing Task</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View All
            </button>
          </div>
          
          {/* Empty state for tasks */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">No Recent Activity</h4>
            <p className="text-sm text-gray-500 leading-relaxed">You don't have any recent activity to show here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;