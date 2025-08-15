'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import CreateCourseModal from '@/components/CreateCourseModal';
import JoinCourseModal from '@/components/JoinCourseModal';

export default function Home() {
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModalOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar
        onCreateCourseClick={handleCreateCourseClick}
        onJoinCourseClick={handleJoinCourseClick}
      />
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={() => setIsJoinCourseModalOpen(false)}
        onJoinCourse={handleJoinCourse}
      />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Your Courses</h1>
        {courses.length === 0 ? (
          <p className="text-gray-400">No courses created yet or joined. Click the &quot;+&quot; button to create or join one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div
                  className="h-32 w-full"
                  style={{ backgroundColor: course.coverColor }}
                ></div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-100">{course.subject}</h3>
                  <p className="text-gray-300">Section: {course.section}</p>
                  <p className="text-gray-300">Teacher: {course.teacherName}</p>
                  <p className="text-gray-300">Course Key: {course.uniqueKey}</p>
                  <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm">
                    Go to Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="flex items-center justify-center w-full h-24 mt-8 border-t border-gray-700">
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
            className="h-4 ml-2"
            width={76}
            height={16}
          />
        </a>
      </footer>
    </div>
  );
}