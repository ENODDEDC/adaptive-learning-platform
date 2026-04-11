'use client';

import React from 'react';

const CourseCardSkeleton = ({ index = 0 }) => {
  return (
    <div 
      className="flex-shrink-0 w-80 snap-start animate-pulse"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-400 to-indigo-500 px-5 py-6">
          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-white"></div>
          </div>
          <div className="relative z-10 space-y-3.5">
            <div className="h-8 w-32 rounded-lg bg-white/80"></div>
            <div className="space-y-2">
              <div className="h-6 w-4/5 rounded bg-white/60"></div>
              <div className="h-6 w-2/3 rounded bg-white/50"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200"></div>
              <div className="h-4 w-32 rounded bg-gray-200"></div>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-indigo-200"></div>
              <div className="h-3 w-20 rounded bg-indigo-200"></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-10 rounded bg-indigo-200"></div>
                <div className="h-3 w-24 rounded bg-indigo-200"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-10 rounded bg-indigo-200"></div>
                <div className="h-3 w-24 rounded bg-indigo-200"></div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-stretch gap-2.5 border-t border-gray-200 pt-4">
            {[...Array(3)].map((_, statIndex) => (
              <div key={statIndex} className="flex flex-1 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="mb-2 h-5 w-5 rounded bg-gray-200"></div>
                <div className="mb-1 h-5 w-8 rounded bg-gray-200"></div>
                <div className="h-3 w-14 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardSkeleton;
