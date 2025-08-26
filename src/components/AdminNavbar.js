'use client';

import React from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminNavbar({ toggleSidebar }) {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800">
      <div className="flex items-center">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </button>
        <h1 className="ml-4 text-2xl font-bold text-white">Dashboard</h1>
      </div>
      <div className="flex items-center">
        <button
          type="button"
          className="relative p-1 text-gray-400 bg-gray-800 rounded-full hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          <span className="absolute -inset-1.5" />
          <span className="sr-only">View notifications</span>
          <BellIcon className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* Profile dropdown */}
        <Menu as="div" className="relative ml-3">
          <div>
            <Menu.Button className="relative flex items-center max-w-xs text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
              <span className="absolute -inset-1.5" />
              <span className="sr-only">Open user menu</span>
              <Image
                className="w-8 h-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
                width={32}
                height={32}
              />
              <span className="ml-2 text-white">Admin Name</span> {/* Replace with actual admin name */}
              <ChevronDownIcon className="w-5 h-5 ml-1 text-gray-400" aria-hidden="true" />
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
            <Menu.Items className="absolute right-0 z-10 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/admin/profile"
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    Profile
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/admin/settings"
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    Settings
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => {
                      localStorage.removeItem('adminToken');
                      window.location.href = '/admin/login';
                    }}
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block w-full text-left px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </nav>
  );
}