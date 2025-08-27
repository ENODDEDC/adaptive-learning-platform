'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const CourseContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const formatSlugToTitle = (s) => {
    if (!s) return '';
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  // Default fallback - no slug provided
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button className="bg-gray-200 px-4 py-2 rounded-md">Upload</button>
      </div>
      <div className="flex gap-8 mb-8 border-b">
        <button className="py-2 border-b-2 border-black">All</button>
        <button className="py-2 text-gray-500">Document</button>
        <button className="py-2 text-gray-500">Video</button>
        <button className="py-2 text-gray-500">Audio</button>
      </div>
      <div className="space-y-4">
        <p className="text-gray-500">No course selected. Please select a course from the home page.</p>
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