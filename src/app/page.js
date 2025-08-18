// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await res.json();
        setCourses(data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  const handleCreateCourse = async (courseData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to create a course.');
      return;
    }

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create course');
      }

      const data = await res.json();
      setCourses([...courses, data.course]);
      // The modal is now closed from the Layout component
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleJoinCourse = async (courseKey) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to join a course.');
      return;
    }

    try {
      const res = await fetch('/api/courses/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to join course');
      }

      if (!courses.some(course => course._id === data.course._id)) {
        setCourses([...courses, data.course]);
      }
      
      // The modal is now closed from the Layout component
    } catch (error) {
      console.error('Error joining course:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Expose handlers for Layout to use
  Home.defaultProps = {
    handleCreateCourse,
    handleJoinCourse,
  };

  return (
    <div className="min-h-screen bg-base-light text-text-primary">
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2l font-bold mb-6">Your Courses</h1>
        {courses.length === 0 ? (
          <p className="text-gray-500 text-xs">No courses created yet or joined. Click the &quot;+&quot; button to create or join one!</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,250px)] gap-4 justify-center">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-md shadow-md overflow-hidden border border-divider-light"
              >
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: course.coverColor }}
                ></div>
                <div className="p-2">
                  <h3 className="text-md font-semibold text-text-primary truncate">{course.subject}</h3>
                  <p className="text-gray-500 text-xs">Section: {course.section}</p>
                  <p className="text-gray-500 text-xs truncate">Teacher: {course.teacherName}</p>
                  <p className="text-gray-500 text-xs">Course Key: {course.uniqueKey}</p>
                  <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs">
                    Go to Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}