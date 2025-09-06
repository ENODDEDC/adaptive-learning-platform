import React, { Fragment, useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronDownIcon,
  Bars3Icon,
  HomeIcon,
  BellIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CalendarIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import ProfileModal from './ProfileModal';

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

const Sidebar = ({ pathname, toggleSidebar, isCollapsed }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

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
    setIsNotificationModalOpen(false); // Close modal if open
  };

  const handleViewAllNotifications = () => {
    setIsNotificationModalOpen(true);
    // Optionally mark all unread as read when opening the modal
    const unreadNotificationIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadNotificationIds.length > 0) {
      markAsRead(unreadNotificationIds);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // router.replace('/login'); // Do not redirect here, let Navbar handle it if needed
          return;
        }

        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      }
    };

    fetchUserProfile();
  }, []); // Empty dependency array to run once on mount

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const links = [
    { href: "/home", label: "Home" },
    { href: "/courses", label: "Course" },
    { href: "/learning-styles", label: "Learning Styles" },
    { href: "/todo", label: "To-Do" },
    { href: "/schedule", label: "Schedule" },
    { href: "/cluster", label: "Cluster" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <React.Fragment>
      <aside
        className={`bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-30 flex flex-col shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20 items-center' : 'w-64'}`}
      >
        {/* Header Section */}
        <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-gray-100`}>
          {/* Hamburger toggle */}
          <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

        {/* User profile section - only when expanded */}
        {!isCollapsed && (
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  {user?.profilePicture ? (
                    <Image src={user.profilePicture} alt="Profile" width={40} height={40} className="rounded-full" />
                  ) : (
                    <span className="text-white font-semibold text-sm">{user?.fullName ? user.fullName.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-gray-900 font-semibold text-sm">{user?.fullName || "User Name"}</div>
                  <div className="text-gray-500 text-xs">{user?.role || "Student"}</div>
                </div>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={() => setOpenProfileModal(true)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      Profile
                    </div>
                  </button>
                  <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-5 h-5 text-gray-500" /> {/* Using BellIcon for notifications */}
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-300"></div>
                      Sign Out
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed user avatar */}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              {user?.profilePicture ? (
                <Image src={user.profilePicture} alt="Profile" width={40} height={40} className="rounded-full" />
              ) : (
                <span className="text-white font-semibold text-sm">{user?.fullName ? user.fullName.charAt(0) : 'U'}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-6'} pt-6`}>
        {!isCollapsed && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Navigation</h3>
          </div>
        )}
        
        <ul className="space-y-1">
          {links.map(link => {
            const IconComponent = getIconForLink(link.label);
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group flex items-center rounded-xl font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${
                    isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-3 mx-1'
                  }`}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                  )}
                  {IconComponent && (
                    <IconComponent 
                      className={`flex-shrink-0 w-5 h-5 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} 
                    />
                  )}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{link.label}</span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {link.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Footer section */}
        {!isCollapsed && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">AI</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-900">Intelevo AI</div>
                  <div className="text-xs text-blue-600">Your learning assistant</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      </aside>
      <ProfileModal open={openProfileModal} setOpen={setOpenProfileModal} user={user} />

      {/* Notification Modal */}
      <Transition.Root show={isNotificationModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsNotificationModalOpen(false)}>
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
                      onClick={() => setIsNotificationModalOpen(false)}
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
    </React.Fragment>
  );
};

const getIconForLink = (label) => {
  switch (label) {
    case 'Home':
      return HomeIcon;
    case 'Notifications':
      return BellIcon;
    case 'Course':
      return BookOpenIcon;
    case 'Learning Styles':
      return AcademicCapIcon;
    case 'Text to Docs':
      return DocumentTextIcon;
    case 'To-Do':
      return CheckCircleIcon;
    case 'Schedule':
    case 'Cluster':
      return Squares2X2Icon;
    case 'Settings':
      return Cog6ToothIcon;
    default:
      return null;
  }
};

export default Sidebar;
