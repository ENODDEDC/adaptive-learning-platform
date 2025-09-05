'use client';
import { Fragment, useState, useEffect } from 'react';
import {
  BellIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
// Helper function to get token from localStorage (client-side)
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ user, onCreateCourseClick, onJoinCourseClick }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Fetch every minute
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (notificationIds) => {
    const token = getToken();
    if (!token || notificationIds.length === 0) return;

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds }),
      });
      setNotifications(prev => prev.map(n =>
        notificationIds.includes(n._id) ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => prev - notificationIds.length);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead([notification._id]);
    }
    router.push(notification.link);
    setIsModalOpen(false); // Close modal if open
  };

  const handleViewAllNotifications = () => {
    setIsModalOpen(true);
    // Optionally mark all unread as read when opening the modal
    const unreadNotificationIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadNotificationIds.length > 0) {
      markAsRead(unreadNotificationIds);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/;'; // Clear the cookie
    router.replace('/login');
  };

  return (
    <header className="flex-shrink-0 border-b border-divider-light bg-base-light">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* Your breadcrumbs or other left-side content can go here */}
        </div>

        <div className="flex items-center space-x-4">
          <form className="flex-1 w-full max-w-md ml-auto">
            <div className="relative">
              <MagnifyingGlassIcon
                className="absolute inset-y-0 left-0 w-5 h-full text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="search-field"
                className="block w-full h-full py-2 pl-8 pr-0 text-gray-900 border-0 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search..."
                type="search"
                name="search"
              />
            </div>
          </form>

          {/* Plus Icon Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open new item menu</span>
              <PlusIcon className="w-6 h-6 text-text-secondary" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onCreateCourseClick}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Create Course
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onJoinCourseClick}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Join Course
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Notification Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">View notifications</span>
              <BellIcon className="w-6 h-6 text-text-secondary" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <h3 className="px-3 py-2 text-sm font-semibold text-gray-900">Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="px-3 py-1 text-sm text-gray-500">No new notifications</p>
                ) : (
                  <>
                    {notifications.slice(0, 5).map((notification) => (
                      <Menu.Item key={notification._id}>
                        {({ active }) => (
                          <Link
                            href={notification.link}
                            onClick={() => handleNotificationClick(notification)}
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              notification.read ? 'text-gray-500' : 'font-semibold text-gray-900',
                              'block px-3 py-2 text-sm leading-6'
                            )}
                          >
                            <p>{notification.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                    {notifications.length > 0 && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleViewAllNotifications}
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block w-full text-center px-3 py-2 text-sm leading-6 text-blue-600'
                            )}
                          >
                            View all notifications
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </>
                )}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <Image
                className="w-8 h-8 rounded-full bg-gray-50"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
                width={32}
                height={32}
              />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user ? user.name : 'Tom Cook'}
                </span>
                <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900'
                      )}
                    >
                      Your profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
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
      </div>

      {/* Notification Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        All Notifications
                      </Dialog.Title>
                      <div className="mt-2">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-500">No notifications to display.</p>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {notifications.map((notification) => (
                              <li key={notification._id} className="py-3">
                                <Link
                                  href={notification.link}
                                  onClick={() => handleNotificationClick(notification)}
                                  className={classNames(
                                    notification.read ? 'text-gray-500' : 'font-semibold text-gray-900',
                                    'block hover:bg-gray-50 p-2 rounded-md'
                                  )}
                                >
                                  <p>{notification.message}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </header>
  );
}