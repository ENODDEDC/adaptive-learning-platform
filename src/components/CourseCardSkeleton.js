'use client';

import React from 'react';

const CourseCardSkeleton = ({ index = 0 }) => {
  return (
    <div 
      className="flex-shrink-0 w-[calc(33.333%-1rem)] relative"
      style={{ 
        animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
        animationDelay: `${index * 0.15}s` 
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02]">
        {/* Shimmer Effect Wrapper */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>

        {/* Top Header Section (Modern White/Light Blue) */}
        <div className="relative h-32 overflow-hidden bg-slate-50/50 px-5 py-6 border-b border-gray-50">
          <div className="relative z-10 space-y-4">
            {/* Section Badge Skeleton */}
            <div className="h-6 w-24 rounded-lg bg-gray-200/60"></div>
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-7 w-4/5 rounded-lg bg-gray-200/80"></div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col px-5 py-6 bg-white">
          {/* Instructor Skeleton */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 shadow-inner"></div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-12 rounded bg-gray-100"></div>
              <div className="h-4 w-28 rounded bg-gray-100"></div>
            </div>
          </div>

          {/* Schedule Box Skeleton */}
          <div className="mb-6 rounded-xl border border-gray-50 bg-gray-50/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded bg-gray-200/50"></div>
              <div className="h-3 w-16 rounded bg-gray-200/50"></div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-8 rounded bg-gray-100"></div>
                <div className="h-2.5 w-20 rounded bg-gray-100"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-8 rounded bg-gray-100"></div>
                <div className="h-2.5 w-20 rounded bg-gray-100"></div>
              </div>
            </div>
          </div>

          {/* Bottom Metrics Skeleton */}
          <div className="mt-auto flex items-stretch gap-3 pt-5 border-t border-gray-50">
            {[...Array(2)].map((_, statIndex) => (
              <div key={statIndex} className="flex flex-1 flex-col items-center justify-center rounded-xl border border-gray-50 bg-white px-3 py-4 shadow-sm">
                <div className="mb-2 h-4 w-4 rounded bg-gray-100"></div>
                <div className="mb-1.5 h-4 w-6 rounded bg-gray-100"></div>
                <div className="h-2.5 w-12 rounded bg-gray-100"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default CourseCardSkeleton;
