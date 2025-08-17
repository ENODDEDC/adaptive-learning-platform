// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Navbar is now in Layout.js
import CreateCourseModal from '@/components/CreateCourseModal';
import JoinCourseModal from '@/components/JoinCourseModal';

export default function Home() {
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModal] = useState(false);
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

  const handleCreateCourseClick = () => {
    setIsCreateCourseModalOpen(true);
  };

  const handleJoinCourseClick = () => {
    setIsJoinCourseModalOpen(true);
  };

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
      setIsCreateCourseModalOpen(false);
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
      
      setIsJoinCourseModalOpen(false);
    } catch (error) {
      console.error('Error joining course:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-light text-text-primary">
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={() => setIsJoinCourseModal(false)}
        onJoinCourse={handleJoinCourse}
      />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2l font-bold mb-6">Your Courses</h1>
        {courses.length === 0 ? (
          <p className="text-gray-500 text-xs">No courses created yet or joined. Click the &quot;+&quot; button to create or join one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <footer className="flex items-center justify-center w-full h-20 mt-6 border-t border-divider-light">
        <a
          className="flex items-center justify-center"
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <Image
            src="/vercel.svg"
            alt="Vercel Logo"
            className="h-3 ml-2"
            width={57}
            height={12}
          />
        </a>
      </footer>
    </div>
  );
}