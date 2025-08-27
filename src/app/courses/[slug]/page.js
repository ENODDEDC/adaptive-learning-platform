import React from 'react';

const CourseDetailPage = ({ params }) => {
  const { slug } = params;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Course: {slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h1>
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
};

export default CourseDetailPage;