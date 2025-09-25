'use client';

import React from 'react';

const StreamTabSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Post Announcement Section Skeleton */}
      <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton-text w-40 h-6"></div>
        </div>
        <div className="mb-4">
          <div className="skeleton-text w-full h-20 mb-2"></div>
          <div className="skeleton-text w-full h-20 mb-2"></div>
          <div className="skeleton-text w-3/4 h-20"></div>
        </div>
        <div className="flex justify-end">
          <div className="skeleton-button w-20 h-10"></div>
        </div>
      </div>

      {/* Pinned Items Skeleton */}
      <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="skeleton-text w-24 h-6 mb-4"></div>
        <div className="space-y-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-4 mb-3">
                <div className="skeleton-avatar w-10 h-10 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="skeleton-text w-24 h-4"></div>
                      <div className="skeleton-button w-16 h-5 rounded-full"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton-button w-8 h-8 rounded-lg"></div>
                      <div className="skeleton-button w-8 h-8 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="skeleton-text w-20 h-3 mb-3"></div>
                </div>
              </div>
              <div className="skeleton-text w-full h-4 mb-2"></div>
              <div className="skeleton-text w-3/4 h-4 mb-2"></div>
              <div className="skeleton-text w-1/2 h-4"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Section Skeleton */}
      <div className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="skeleton-text w-16 h-6"></div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="skeleton-button w-12 h-8 rounded-full"></div>
            <div className="skeleton-button w-16 h-8 rounded-full"></div>
            <div className="skeleton-button w-20 h-8 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-4 mb-3">
                <div className="skeleton-avatar w-10 h-10 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="skeleton-text w-24 h-4"></div>
                      <div className="skeleton-button w-16 h-5 rounded-full"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton-button w-8 h-8 rounded-lg"></div>
                      <div className="skeleton-button w-8 h-8 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="skeleton-text w-20 h-3 mb-3"></div>
                </div>
              </div>
              <div className="skeleton-text w-full h-4 mb-2"></div>
              <div className="skeleton-text w-3/4 h-4 mb-2"></div>
              <div className="skeleton-text w-1/2 h-4 mb-4"></div>

              <div className="pt-4 mt-6 border-t border-gray-200">
                <div className="skeleton-button w-24 h-4 mb-3"></div>
                <div className="flex items-center gap-3">
                  <div className="skeleton-button flex-1 h-10 rounded-lg"></div>
                  <div className="skeleton-button w-10 h-10 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreamTabSkeleton;