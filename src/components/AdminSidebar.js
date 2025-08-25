'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Courses', href: '/admin/courses', icon: Cog6ToothIcon }, // Using Cog6ToothIcon for now, can be changed
  // Add more admin navigation items here
];

export default function AdminSidebar({ isCollapsed, toggleSidebar }) {
  const pathname = usePathname();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-gray-800 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-56'
      } flex flex-col`}
    >
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <span className={`text-xl font-bold ${isCollapsed ? 'hidden' : 'block'}`}>Admin Panel</span>
        <button onClick={toggleSidebar} className="p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
          {isCollapsed ? (
            <ArrowLeftOnRectangleIcon className="w-6 h-6 rotate-180" aria-hidden="true" />
          ) : (
            <ArrowLeftOnRectangleIcon className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              pathname === item.href
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon
              className={`mr-4 flex-shrink-0 h-6 w-6 ${
                pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
              aria-hidden="true"
            />
            <span className={isCollapsed ? 'hidden' : 'block'}>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}