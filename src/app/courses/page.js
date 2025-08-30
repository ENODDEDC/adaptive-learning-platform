'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useLayout } from '../../context/LayoutContext';

const CourseContent = () => {
  const { openCreateCourseModal, openJoinCourseModal } = useLayout();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !slug) {
      fetchUserCourses();
    }
  }, [isMounted, slug]);

  const formatSlugToTitle = (s) => {
    if (!s) return '';
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

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

  if (slug) {
    // Display course detail page
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Course: {formatSlugToTitle(slug)}</h1>
          <button className="bg-gray-200 px-4 py-2 rounded-md">View Streak</button>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-8 border-b">
            <button className="py-2 border-b-2 border-black">All</button>
            <button className="py-2 text-gray-500">Document</button>
            <button className="py-2 text-gray-500">Video</button>
            <button className="py-2 text-gray-500">Audio</button>
          </div>
          <button className="bg-gray-200 px-4 py-2 rounded-md">Upload</button>
        </div>
        <div className="space-y-4">
          {/* Course content will be dynamically loaded here */}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center bg-gray-100">
        Loading courses...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 min-h-screen p-8 text-center text-red-500 bg-gray-100">
        Error: {error}
      </div>
    );
  }

  // Default fallback - no slug provided, show all courses
  return (
    <div className="flex-1 p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">All Courses</h1>
        <div className="relative">
          <button
            onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
            className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <PlusIcon className="w-5 h-5 text-gray-700" />
          </button>
          {isCourseMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  openCreateCourseModal();
                  setIsCourseMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Create Course
              </button>
              <button
                onClick={() => {
                  openJoinCourseModal();
                  setIsCourseMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Join Course
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-8 mb-8 border-b">
        <button className="py-2 border-b-2 border-black">All</button>
        <button className="py-2 text-gray-500">Document</button>
        <button className="py-2 text-gray-500">Video</button>
        <button className="py-2 text-gray-500">Audio</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {courses.length === 0 ? (
          <div className="col-span-full">
            <EmptyState type="courses" />
          </div>
        ) : (
          courses.map((course) => (
            <Link key={course.id} href={`/courses?slug=${course.title.toLowerCase().replace(/\s+/g, '-')}`} className="block">
              <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-shadow">
                <div className={`h-40 relative p-6 flex flex-col justify-between ${course.color}`}>
                  <div className="flex items-start justify-between">
                    <div></div>
                    <button className="text-white opacity-70 hover:opacity-100">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                  <div className={`absolute bottom-4 right-4 w-12 h-12 ${course.progressColor} rounded-full opacity-30`}></div>
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const CoursePage = () => {
  return (
    <Suspense fallback={<div className="p-8">Loading course...</div>}>
      <CourseContent />
    </Suspense>
  );
};

export default CoursePage;