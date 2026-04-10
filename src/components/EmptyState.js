import React from 'react';
import { BookOpenIcon, ClockIcon, PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useLayout } from '../context/LayoutContext';

const EmptyState = ({ type }) => {
  const { openCreateCourseModal, openJoinCourseModal } = useLayout();

  const config = {
    courses: {
      icon: (
        <div className="relative mb-4">
          {/* Background circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full"></div>
          </div>
          {/* Main icon container */}
          <div className="relative w-[4.5rem] h-[4.5rem] bg-blue-500 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
            <BookOpenIcon className="w-9 h-9 text-white" strokeWidth={2} />
          </div>
        </div>
      ),
      title: 'No Courses Yet',
      message: 'It looks like you haven\'t joined any courses yet. Create your own course or join an existing one to get started.',
      actions: (
        <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
          <button
            onClick={openCreateCourseModal}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2} />
            Create Course
          </button>
          <button
            onClick={openJoinCourseModal}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <AcademicCapIcon className="w-5 h-5" strokeWidth={2} />
            Join Course
          </button>
        </div>
      ),
    },
    recent: {
      icon: (
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full"></div>
          </div>
          <div className="relative w-[4.5rem] h-[4.5rem] bg-gray-400 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
            <ClockIcon className="w-9 h-9 text-white" strokeWidth={2} />
          </div>
        </div>
      ),
      title: 'No Recent Activity',
      message: 'Your activity will appear here once you start interacting with courses.',
      actions: null,
    },
  };

  const { icon, title, message, actions } = config[type];

  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full px-6 py-8">
      <div className="max-w-sm">
        {/* Icon */}
        {icon}

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        {actions && (
          <div className="flex justify-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
