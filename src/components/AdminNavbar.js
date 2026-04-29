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
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellIconSolid,
  UserIcon,
} from '@heroicons/react/24/solid';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [adminData, setAdminData] = React.useState({
    name: 'Admin User',
    email: 'admin@example.com',
    photoURL: null
  });

  React.useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (response.ok) {
          const data = await response.json();
          setAdminData({
            name: data.name || 'Admin User',
            email: data.email || 'admin@example.com',
            photoURL: data.photoURL
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchAdminProfile();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Dashboard-specific header content
  const isDashboard = pathname === '/admin/dashboard' || pathname === '/admin';

  return (
    <nav className="z-40 border-b shadow-sm bg-white/80 dark:bg-[#1e293b] backdrop-blur-xl border-gray-200/50 dark:border-blue-900/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          {/* Page-specific header */}
          {isDashboard && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Overview
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Welcome back! Here's what's happening with your platform today.</p>
            </div>
          )}

          {/* Other page headers can be added here */}
          {pathname.includes('/courses') && !isDashboard && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Course Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Manage courses, instructors, and student enrollments.</p>
            </div>
          )}

          {pathname.includes('/users') && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Manage user accounts and permissions.</p>
            </div>
          )}

          {pathname.includes('/settings') && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Configure your admin preferences and system settings.</p>
            </div>
          )}

          {/* Course Management Actions */}
          {pathname.includes('/courses') && !isDashboard && (
            <button className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-purple-600 dark:bg-purple-500 rounded-lg shadow-lg hover:bg-purple-700 dark:hover:bg-purple-600 hover:shadow-xl">
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
                className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/10 border border-gray-300 dark:border-blue-900/50 rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button className="px-6 py-3 font-medium text-white transition-all duration-200 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-xl">
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
              className="block w-64 py-2 pl-10 pr-3 leading-5 placeholder-gray-400 dark:placeholder-gray-400 transition-all duration-200 border border-gray-200 dark:border-blue-900/50 rounded-lg bg-white/50 dark:bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-white/20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              document.documentElement.classList.toggle('dark');
            }}
            className="p-2 text-gray-600 dark:text-gray-300 transition-all duration-200 rounded-lg hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <svg className="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg className="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-gray-600 dark:text-gray-300 transition-all duration-200 rounded-lg hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="w-6 h-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute block w-3 h-3 bg-red-500 rounded-full top-1 right-1 ring-2 ring-white dark:ring-[#1e293b]"></span>
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex items-center max-w-xs p-1 bg-white dark:bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-[#1e293b]">
                <span className="sr-only">Open user menu</span>
                <div className="relative">
                  {adminData.photoURL ? (
                    <img
                      className="object-cover w-10 h-10 rounded-full ring-2 ring-gray-200"
                      src={adminData.photoURL}
                      alt="Admin profile"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-purple-500 dark:bg-purple-600 rounded-full ring-2 ring-gray-200 dark:ring-gray-700">
                      {adminData.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute w-4 h-4 bg-indigo-400 dark:bg-indigo-500 rounded-full -bottom-1 -right-1 ring-2 ring-white dark:ring-[#1e293b]"></div>
                </div>
                <div className="hidden ml-3 md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{adminData.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{adminData.email}</p>
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
              <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-[#1e293b] shadow-lg rounded-xl ring-1 ring-black dark:ring-blue-900/50 ring-opacity-5 focus:outline-none">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-blue-900/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{adminData.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{adminData.email}</p>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/admin/profile"
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-white/10' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
                        )}
                      >
                        <UserIcon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-400" />
                        Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/admin/settings"
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-white/10' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
                        )}
                      >
                        <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-400" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1 border-t border-gray-100 dark:border-blue-900/50">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          localStorage.removeItem('adminToken');
                          document.cookie = 'token=; Max-Age=0; path=/;';
                          window.location.href = '/admin/login';
                        }}
                        className={classNames(
                          active ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-200',
                          'flex items-center w-full px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30'
                        )}
                      >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-400" />
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