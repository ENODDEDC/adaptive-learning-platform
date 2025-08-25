import React from 'react';
import { BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ type }) => {
  const config = {
    courses: {
      icon: <BookOpenIcon className="w-16 h-16 text-gray-400" />,
      title: 'No Courses Yet',
      message: 'It looks like you haven\'t joined any courses yet. You can join a course to get started.',
    },
    recent: {
      icon: <ClockIcon className="w-16 h-16 text-gray-400" />,
      title: 'No Recent Activity',
      message: 'You don\'t have any recent activity to show here.',
    },
  };

  const { icon, title, message } = config[type];

  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default EmptyState;