'use client';

import React from 'react';

const CourseCardSkeleton = ({ index = 0 }) => {
  return (
    <div 
      className="block group masonry-item animate-pulse"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative flex flex-col bg-white border rounded-3xl shadow-sm">
        {/* Enhanced gradient header skeleton - matching h-32 */}
        <div className="relative h-32 p-3 pr-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-3xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Top section with icon and menu */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Icon skeleton */}
                <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl"></div>
                {/* Status indicator skeleton */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/40 border-2 border-white rounded-full"></div>
              </div>
            </div>
            {/* Menu button skeleton */}
            <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
          </div>

          {/* Bottom section with status and action button */}
          <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-white/40 rounded-full flex-shrink-0"></div>
                <div className="w-16 h-4 bg-white/30 rounded"></div>
              </div>
            </div>
            {/* Action button skeleton */}
            <div className="flex-shrink-0 ml-4 mr-2">
              <div className="w-14 h-14 bg-white/25 backdrop-blur-md rounded-2xl border border-white/20"></div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/20 rounded-full"></div>
        </div>

        {/* Content section skeleton */}
        <div className="relative flex flex-col flex-grow p-4 bg-gradient-to-b from-white to-gray-50/50">
          {/* Course title section */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              {/* Title skeleton */}
              <div className="flex-1 mr-2 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
              {/* Course type badge skeleton */}
              <div className="flex-shrink-0">
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Metadata badges skeleton */}
            <div className="flex items-center gap-3">
              {/* Code badge */}
              <div className="w-24 h-8 bg-gray-200 rounded-lg"></div>
              {/* Instructor badge */}
              <div className="w-32 h-8 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          {/* Stats section skeleton */}
          <div className="mt-auto space-y-4">
            {/* Stats grid - 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-100 rounded-xl border border-gray-200">
                <div className="h-6 bg-gray-200 rounded mb-1 mx-auto w-8"></div>
                <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
              </div>
              <div className="text-center p-3 bg-gray-100 rounded-xl border border-gray-200">
                <div className="h-6 bg-gray-200 rounded mb-1 mx-auto w-8"></div>
                <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
              </div>
              <div className="text-center p-3 bg-gray-100 rounded-xl border border-gray-200">
                <div className="h-6 bg-gray-200 rounded mb-1 mx-auto w-8"></div>
                <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-b-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardSkeleton;