import React from 'react';

const CoursePage = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Course-1</h1>
        <button className="bg-gray-200 px-4 py-2 rounded-md">Upload</button>
      </div>
      <div className="flex gap-8 mb-8 border-b">
        <button className="py-2 border-b-2 border-black">All</button>
        <button className="py-2 text-gray-500">Document</button>
        <button className="py-2 text-gray-500">Video</button>
        <button className="py-2 text-gray-500">Audio</button>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-200 p-4 rounded-md flex justify-between items-center">
          <span>Fundamentals of Programming</span>
          <button>Test Your Skills</button>
        </div>
        <div className="bg-gray-200 p-4 rounded-md flex justify-between items-center">
          <span>Fundamentals of Programming</span>
          <button>Test Your Skills</button>
        </div>
        <div className="bg-gray-200 p-4 rounded-md flex justify-between items-center">
          <span>Fundamentals of Programming</span>
          <button>Test Your Skills</button>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;