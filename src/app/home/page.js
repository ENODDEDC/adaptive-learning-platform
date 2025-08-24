'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const [user, setUser] = useState({ name: 'User' });

  useEffect(() => {
    // A sample user object is used. In a real application, you would fetch this from your authentication context.
    const sampleUser = { name: 'Justine' };
    setUser(sampleUser);
  }, []);

  const courses = [
    {
      id: 1,
      title: 'Programming 1',
      code: '201 B',
      instructor: 'Mr. Fernandez',
      progress: 10,
      color: 'bg-blue-900',
      progressColor: 'bg-blue-400',
    },
    {
      id: 2,
      title: 'Health',
      code: '201 B', 
      instructor: 'Mr. Valdez',
      progress: 8,
      color: 'bg-green-700',
      progressColor: 'bg-purple-500',
    }
  ];

  const recentActivities = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ];

  return (
    <div className="flex-1 bg-gray-100 min-h-screen p-8">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <h1 className="text-xl font-semibold text-gray-800">Hello, {user.name || 'User'}!</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Type something..."
            className="flex-1 text-gray-700 bg-transparent border-none outline-none text-base placeholder-gray-500 pl-2"
          />
          <div className="flex items-center gap-2">
            <button className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-900 transition-colors">
              Build
            </button>
            <button className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
              <PlusIcon className="w-4 h-4 text-gray-700" />
            </button>
            <div className="relative">
              <button className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">My Course</h2>
            <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
              <PlusIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
            </svg>
            <span className="text-gray-600 font-medium">Cluster1</span>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                  <div className={`h-40 relative p-6 flex flex-col justify-between ${course.color}`}>
                    <div className="flex justify-between items-start">
                      <div></div>
                      <button className="text-white opacity-70 hover:opacity-100">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className={`absolute bottom-4 right-4 w-12 h-12 ${course.progressColor} rounded-full`}></div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{course.code}</p>
                    <p className="text-sm text-gray-500 mb-4">{course.instructor}</p>
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-orange-500 font-bold text-lg">{course.progress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <button className="text-gray-600 font-medium hover:text-gray-900 transition-colors">See All</button>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="bg-gray-200 h-20 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}