'use client';

'use client';

import React from 'react';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellIconSolid,
  UserIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminNavbar({ toggleSidebar }) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add dark mode toggle logic here
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Dashboard-specific header content
  const isDashboard = pathname === '/admin/dashboard' || pathname === '/admin';

  return (
    <nav className="sticky top-0 z-40 border-b shadow-sm bg-white/80 backdrop-blur-xl border-gray-200/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
         <button
            type="button"
            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="w-6 h-6" aria-hidden="true" />
          </button> 

          {/* Page-specific header */}
          {isDashboard && (
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                Dashboard Overview
              </h1>
              <p className="text-sm text-gray-500">Welcome back! Here's what's happening with your platform today.</p>
            </div>
          )}

          {/* Other page headers can be added here */}
          {pathname.includes('/courses') && !isDashboard && (
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                Course Management
              </h1>
              <p className="text-sm text-gray-500">Manage courses, instructors, and student enrollments.</p>
            </div>
          )}

          {pathname.includes('/users') && (
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                User Management
              </h1>
              <p className="text-sm text-gray-500">Manage user accounts and permissions.</p>
            </div>
          )}

          {pathname.includes('/settings') && (
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
                Settings
              </h1>
              <p className="text-sm text-gray-500">Configure your admin preferences and system settings.</p>
            </div>
          )}

          {/* Course Management Actions */}
          {pathname.includes('/courses') && !isDashboard && (
            <button className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Course
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Dashboard-specific actions */}
          {isDashboard && (
            <>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button className="px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
                Generate Report
              </button>
            </>
          )}
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-64 py-2 pl-10 pr-3 leading-5 placeholder-gray-400 transition-all duration-200 border border-gray-200 rounded-lg bg-white/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="w-6 h-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute block w-3 h-3 bg-red-500 rounded-full top-1 right-1 ring-2 ring-white"></span>
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex items-center max-w-xs p-1 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <div className="relative">
                  <Image
                    className="object-cover w-10 h-10 rounded-full ring-2 ring-gray-200"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Admin profile"
                    width={40}
                    height={40}
                  />
                  <div className="absolute w-4 h-4 bg-green-400 rounded-full -bottom-1 -right-1 ring-2 ring-white"></div>
                </div>
                <div className="hidden ml-3 md:block">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@example.com</p>
                </div>
                <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-sm text-gray-500">admin@example.com</p>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/admin/profile"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <UserIcon className="w-5 h-5 mr-3 text-gray-400" />
                        Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/admin/settings"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1 border-t border-gray-100">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          localStorage.removeItem('adminToken');
                          document.cookie = 'token=; Max-Age=0; path=/;';
                          window.location.href = '/admin/login';
                        }}
                        className={classNames(
                          active ? 'bg-red-50 text-red-700' : 'text-gray-700',
                          'flex items-center w-full px-4 py-2 text-sm hover:bg-red-50'
                        )}
                      >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-400" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
}