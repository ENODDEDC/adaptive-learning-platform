'use client';

import React from 'react';

const ClassworkTabSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Classwork Management Section Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton-text w-24 h-5 mb-1"></div>
              <div className="skeleton-text w-48 h-4"></div>
            </div>
            <div className="skeleton-button w-20 h-10"></div>
          </div>
        </div>
      </div>

      {/* Activities Section Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="skeleton-text w-20 h-5 mb-1"></div>
                <div className="skeleton-text w-32 h-4"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <div className="skeleton-button w-8 h-6 rounded"></div>
                  <div className="skeleton-button w-8 h-6 rounded"></div>
                  <div className="skeleton-button w-8 h-6 rounded"></div>
                  <div className="skeleton-button w-8 h-6 rounded"></div>
                </div>
              </div>
            </div>

            <div className="skeleton-button w-full h-10 rounded-lg"></div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="skeleton-button w-16 h-8 rounded"></div>
                <div className="skeleton-button w-20 h-8 rounded"></div>
                <div className="skeleton-button w-16 h-8 rounded"></div>
                <div className="skeleton-button w-20 h-8 rounded"></div>
              </div>
              <div className="skeleton-button w-16 h-8 rounded"></div>
              <div className="skeleton-button w-20 h-8 rounded"></div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="skeleton-avatar w-8 h-8 rounded-lg"></div>
                      <div className="flex items-center gap-2">
                        <div className="skeleton-button w-16 h-5 rounded"></div>
                        <div className="skeleton-text w-20 h-3"></div>
                      </div>
                    </div>
                    <div className="skeleton-text w-3/4 h-5 mb-2"></div>
                    <div className="skeleton-text w-1/2 h-4 mb-3"></div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <div className="skeleton-text w-16 h-3"></div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="skeleton-button w-24 h-6 rounded"></div>
                      <div className="skeleton-button w-20 h-6 rounded"></div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="skeleton-button w-16 h-8 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassworkTabSkeleton;