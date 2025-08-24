'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function Home({ userName }) { // Accept userName as prop
  const [user, setUser] = useState({ name: 'User' });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state

  useEffect(() => {
    setIsMounted(true); // Set to true on client mount
  }, []);

  useEffect(() => {
    if (isMounted) { // Only run on client side
      if (userName) {
        setUser({ name: userName });
      } else {
        setUser({ name: 'User' });
      }
      fetchUserCourses();
    }
  }, [userName, isMounted]); // Depend on userName and isMounted

  const fetchUserCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      // Map fetched courses to the expected format for display
      const formattedCourses = data.courses.map(course => ({
        id: course._id,
        title: course.subject,
        code: course.section,
        instructor: course.teacherName,
        progress: 0, // Assuming progress is not part of the fetched data yet
        color: course.coverColor,
        progressColor: course.coverColor, // Using coverColor for progressColor for now
      }));
      setCourses(formattedCourses);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch user courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const recentActivities = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ];

  if (loading) {
    return <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">Loading courses...</div>;
  }

  if (error) {
    return <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">Error: {error}</div>;
  }

  return (
    <div className="flex-1 min-h-screen p-8 bg-gray-100">
      <div className="p-4 mb-6 bg-white shadow-sm rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <h1 className="text-xl font-semibold text-gray-800">Hello, {user.name || 'User'}!</h1>
        </div>
      </div>

      <div className="p-4 mb-8 bg-white shadow-sm rounded-xl">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Type something..."
            className="flex-1 pl-2 text-base text-gray-700 placeholder-gray-500 bg-transparent border-none outline-none"
          />
          <div className="flex items-center gap-2">
            <button className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-900 transition-colors">
              Build
            </button>
            <button className="flex items-center justify-center bg-gray-200 rounded-full w-7 h-7 hover:bg-gray-300">
              <PlusIcon className="w-4 h-4 text-gray-700" />
            </button>
            <div className="relative">
              <button className="flex items-center justify-center bg-black rounded-full w-7 h-7">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
              <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">My Course</h2>
            <button className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300">
              <PlusIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
            </svg>
            <span className="font-medium text-gray-600">Cluster1</span>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {courses.map((course) => (
                <div key={course.id} className="flex flex-col overflow-hidden bg-white shadow-md rounded-2xl">
                  <div className={`h-40 relative p-6 flex flex-col justify-between ${course.color}`}>
                    <div className="flex items-start justify-between">
                      <div></div>
                      <button className="text-white opacity-70 hover:opacity-100">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                    <div className={`absolute bottom-4 right-4 w-12 h-12 ${course.progressColor} rounded-full`}></div>
                  </div>

                  <div className="flex flex-col flex-grow p-6">
                    <h3 className="mb-2 text-lg font-bold text-gray-800">{course.title}</h3>
                    <p className="mb-2 text-sm text-gray-500">{course.code}</p>
                    <p className="mb-4 text-sm text-gray-500">{course.instructor}</p>
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg font-bold text-orange-500">{course.progress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="absolute left-0 flex items-center justify-center w-10 h-10 transition-colors -translate-x-6 -translate-y-1/2 bg-white rounded-full shadow-lg top-1/2 hover:bg-gray-100">
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button className="absolute right-0 flex items-center justify-center w-10 h-10 transition-colors translate-x-6 -translate-y-1/2 bg-white rounded-full shadow-lg top-1/2 hover:bg-gray-100">
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <button className="font-medium text-gray-600 transition-colors hover:text-gray-900">See All</button>
          </div>
        </div>

        <div>
          <div className="p-6 bg-white shadow-md rounded-2xl">
            <h3 className="mb-6 text-lg font-semibold text-gray-800">Recent</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}