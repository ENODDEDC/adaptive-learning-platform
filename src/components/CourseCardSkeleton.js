'use client';

import React from 'react';

const CourseCardSkeleton = ({ index = 0, priority = 'normal' }) => {
  // Calculate dynamic card size based on priority (matching the real card logic)
  const getCardSize = () => {
    const sizes = {
      small: { width: '320px', height: '420px' },
      medium: { width: '320px', height: '480px' },
      large: { width: '320px', height: '540px' },
      featured: { width: '320px', height: '600px' }
    };

    // Simulate priority-based sizing
    if (priority === 'featured') {
      return { ...sizes.featured, height: '600px' };
    } else if (priority === 'high') {
      return { ...sizes.large, height: '540px' };
    } else if (priority === 'normal') {
      return { ...sizes.medium, height: '480px' };
    } else {
      return { ...sizes.small, height: '420px' };
    }
  };

  const cardConfig = getCardSize();

  return (
    <div
      className="block group masonry-item skeleton-card"
      style={{
        height: cardConfig.height,
        width: cardConfig.width,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="relative flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Content density indicator */}
        <div className="absolute top-2 right-2 z-20">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>

        {/* Header Skeleton */}
        <div className="relative h-56 p-4 pr-6 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
          {/* Animated background pattern skeleton */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Top section skeleton */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton-avatar"></div>
            </div>
            <div className="skeleton-button w-8 h-8 rounded-lg"></div>
          </div>

          {/* Bottom section skeleton */}
          <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="text-white flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                <div className="skeleton-text w-20 h-3"></div>
              </div>
              <div className="skeleton-text w-16 h-2 mb-2"></div>
            </div>

            <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4 mr-2">
              <div className="skeleton-button w-14 h-14 rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Content section skeleton */}
        <div className="relative flex flex-col flex-grow p-6 bg-white">
          {/* Course title skeleton */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 mr-2">
                <div className="skeleton-text w-full h-5 mb-2"></div>
                <div className="skeleton-text w-3/4 h-5"></div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="skeleton-button w-16 h-5 rounded-full"></div>
                {priority === 'featured' && (
                  <div className="skeleton-button w-20 h-5 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Metadata skeleton */}
            <div className="flex items-center gap-3">
              <div className="skeleton-button w-20 h-6 rounded-lg"></div>
              <div className="skeleton-button w-24 h-6 rounded-lg"></div>
            </div>
          </div>

          {/* Progress section skeleton */}
          <div className="mt-auto space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton-avatar w-10 h-10 rounded-xl"></div>
                  <div>
                    <div className="skeleton-text w-12 h-5 mb-1"></div>
                    <div className="skeleton-text w-16 h-3"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="skeleton-text w-8 h-3 mb-1"></div>
                </div>
              </div>

              {/* Progress bar skeleton */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="skeleton-text w-16 h-3"></div>
                  <div className="skeleton-text w-8 h-3"></div>
                </div>
                <div className="skeleton-progress w-full"></div>
              </div>
            </div>

            {/* Stats row skeleton */}
            <div className="grid grid-cols-3 gap-3">
              <div className="skeleton-stat"></div>
              <div className="skeleton-stat"></div>
              <div className="skeleton-stat"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardSkeleton;