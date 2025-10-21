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
  AcademicCapIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import CourseBrowserModal from './CourseBrowserModal';
import { api } from '../services/apiService';


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar = ({ pathname, toggleSidebar, isCollapsed }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [isCreatedCoursesExpanded, setIsCreatedCoursesExpanded] = useState(false);
  const [isEnrolledCoursesExpanded, setIsEnrolledCoursesExpanded] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [navigatingTo, setNavigatingTo] = useState(null);
  const [isCourseBrowserOpen, setIsCourseBrowserOpen] = useState(false);
  const [courseBrowserType, setCourseBrowserType] = useState(''); // 'created' or 'enrolled'

  useEffect(() => {
    const fetchNotifications = async () => {
      // Only fetch notifications if user is authenticated
      if (!user) return;

      try {
        const response = await api.getNotifications();
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        // Silent fail for notification fetching
      }
    };

    fetchNotifications();
    // Removed aggressive polling to reduce API calls
  }, [user]);

  const markAsRead = async (notificationIds) => {
    if (notificationIds.length === 0) return;

    try {
      await api.markNotificationsRead(notificationIds);
      setNotifications(prev => prev.map(n =>
        notificationIds.includes(n._id) ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => prev - notificationIds.length);
    } catch (error) {
      // Silent fail for marking notifications as read
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
        const response = await api.getUserProfile();
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };

    const fetchCourses = async () => {
      if (!user) return;

      try {
        const response = await api.getCourses();
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        const created = [];
        const enrolled = [];

        data.courses.forEach(course => {
          const formattedCourse = {
            id: course._id,
            title: course.subject,
            code: course.section,
            instructor: course.teacherName,
            progress: 0,
            color: course.coverColor,
            createdBy: course.createdBy,
            enrolledUsers: course.enrolledUsers,
          };

          if (course.createdBy === user._id) {
            created.push(formattedCourse);
          } else if (course.enrolledUsers.includes(user._id)) {
            enrolled.push(formattedCourse);
          }
        });

        setCourses({ created, enrolled });
      } catch (error) {
        // Silent fail for course fetching
      }
    };

    const fetchScheduledCount = async () => {
      if (!user) return;

      try {
        const response = await api.getSchedule();
        if (!response.ok) {
          throw new Error('Failed to fetch scheduled courses');
        }

        const data = await response.json();
        setScheduledCount(data.scheduledCourses.length);
      } catch (error) {
        setScheduledCount(0);
      }
    };

    fetchUserProfile();
    if (user) {
      fetchCourses();
      fetchScheduledCount();
    }
  }, [user]); // Empty dependency array to run once on mount

  // Clear navigation loading state when pathname changes
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setUser(null); // Clear user state
        router.push('/login');
      } else {
        // Silent fail for logout
      }
    } catch (error) {
      // Silent fail for logout error
    }
  };

  const handleNavigation = (href, label) => {
    setNavigatingTo(label);
    router.push(href);
    // Loading state will be cleared when pathname changes (navigation complete)
  };

  const links = [
    { href: "/home", label: "Home" },
    { href: "/courses", label: "Course" },
    { href: "/todo", label: "To-Do" },
    { href: "/schedule", label: "Schedule" },
    { href: "/clusters", label: "Cluster" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <React.Fragment>
      <aside
        className={`bg-white/95 backdrop-blur-md border-r border-white/30 fixed top-0 left-0 h-screen z-30 flex flex-col shadow-2xl transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20 items-center rounded-r-2xl' : 'w-64 rounded-r-3xl'}`}
      >
        {/* Header Section */}
        <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-gray-100 flex-shrink-0`}>
          {/* Hamburger toggle */}
          <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
            <button
              onClick={toggleSidebar}
              className="p-3 transition-all duration-300 rounded-xl hover:bg-blue-50 hover:scale-110 active:scale-95 group"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Bars3Icon className={`w-6 h-6 text-gray-600 transition-all duration-300 group-hover:text-blue-600 ${isCollapsed ? 'rotate-90' : 'rotate-0'}`} />
            </button>
          </div>

        {/* User profile section - only when expanded */}
        {!isCollapsed && (
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center justify-between w-full p-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl hover:bg-gray-100 hover:scale-102"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                  {user?.profilePicture ? (
                    <Image src={user.profilePicture} alt="Profile" width={40} height={40} className="rounded-full" />
                  ) : (
                    <span className="text-sm font-semibold text-white">{user?.fullName ? user.fullName.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900 capitalize">{user?.role || "Student"}</div>
                  <div className="text-xs text-gray-500">Active Learning</div>
                </div>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute left-full top-0 z-50 ml-2 w-64 overflow-hidden bg-white border border-gray-200 shadow-xl rounded-xl">
                <div className="py-2">
                  <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="w-full px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-5 h-5 text-gray-500" /> {/* Using BellIcon for notifications */}
                      Notifications
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 ml-auto text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
 
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-sm text-left text-red-600 transition-colors hover:bg-red-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-300 rounded-full"></div>
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
            <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
              {user?.profilePicture ? (
                <Image src={user.profilePicture} alt="Profile" width={40} height={40} className="rounded-full" />
              ) : (
                <span className="text-sm font-semibold text-white">{user?.fullName ? user.fullName.charAt(0) : 'U'}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-6'} pt-6`} role="navigation" aria-label="Main navigation">
        <div className={`${isCollapsed ? 'h-full' : 'h-[calc(100vh-200px)] overflow-y-auto elegant-scrollbar relative pr-1'}`}>
        {!isCollapsed && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="px-3 mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Navigation</h3>
          </div>
        )}

        <ul className="space-y-1">
          {/* Home Link */}
          <li className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <button
              onClick={() => handleNavigation('/home', 'Home')}
              disabled={navigatingTo === 'Home'}
              aria-current={pathname === '/home' ? 'page' : undefined}
              className={`group flex items-center rounded-xl font-medium transition-all duration-300 relative hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed w-full text-left ${
                pathname === '/home'
                  ? 'bg-blue-50 text-blue-700 shadow-lg border border-blue-200 shadow-blue-500/20'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:border hover:border-blue-200 hover:shadow-blue-500/10'
              } ${
                isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-3 mx-1'
              }`}
            >
              {pathname === '/home' && !isCollapsed && (
                <div className="absolute left-0 w-1 h-6 transform -translate-y-1/2 bg-blue-600 rounded-r-full top-1/2"></div>
              )}
              {navigatingTo === 'Home' ? (
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <HomeIcon
                  className={`flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                    pathname === '/home'
                      ? 'text-blue-600 animate-pulse'
                      : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110 group-hover:animate-bounce'
                  }`}
                />
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium">
                  {navigatingTo === 'Home' ? 'Loading...' : 'Home'}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute z-50 px-2 py-1 ml-2 text-xs text-white transition-opacity bg-gray-900 rounded opacity-0 pointer-events-none left-full group-hover:opacity-100 whitespace-nowrap">
                  {navigatingTo === 'Home' ? 'Loading...' : 'Home'}
                </div>
              )}
            </button>
          </li>

          {/* Courses Tree Structure */}
          {!isCollapsed && (
            <li className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="space-y-1">
                {/* Courses Header */}
                <button
                  onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}
                  className="group flex items-center justify-between w-full rounded-xl font-medium transition-all duration-300 text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:border hover:border-blue-200 hover:shadow-blue-500/10 gap-3 px-4 py-3 mx-1"
                >
                  <div className="flex items-center gap-3">
                    <BookOpenIcon className="flex-shrink-0 w-5 h-5 transition-all duration-300 text-gray-500 group-hover:text-blue-600 group-hover:scale-110" />
                    <span className="text-sm font-medium">Courses</span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCoursesExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Courses Tree */}
                {isCoursesExpanded && (
                  <div className="ml-6 space-y-1 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {/* Created Courses Section */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsCreatedCoursesExpanded(!isCreatedCoursesExpanded)}
                        className="group flex items-center justify-between w-full rounded-lg font-medium transition-all duration-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 gap-2 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>My Created Courses</span>
                          {courses.created?.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              {courses.created.length}
                            </span>
                          )}
                        </div>
                        <ChevronDownIcon
                          className={`w-3 h-3 transition-transform duration-200 ${isCreatedCoursesExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isCreatedCoursesExpanded && (
                        <>
                          {/* Show only first 2 recent courses */}
                          {courses.created?.slice(0, 2).map((course, index) => (
                            <button
                              key={course.id}
                              onClick={() => handleNavigation(`/courses/${course.id}`, `Course: ${course.title}`)}
                              disabled={navigatingTo === `Course: ${course.title}`}
                              className="group flex items-center gap-2 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-blue-700 hover:bg-blue-50/50 px-3 py-2 ml-4 text-xs border-l-2 border-transparent hover:border-blue-300 w-full text-left disabled:opacity-75"
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              {navigatingTo === `Course: ${course.title}` ? (
                                <div className="w-1.5 h-1.5 flex items-center justify-center">
                                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                              )}
                              <span className="truncate">
                                {navigatingTo === `Course: ${course.title}` ? 'Loading...' : course.title}
                              </span>
                              <div className="ml-auto flex items-center gap-1">
                                <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-400">{course.progress}%</span>
                              </div>
                            </button>
                          ))}

                          {/* View All button for created courses */}
                          {courses.created?.length > 2 && (
                            <button
                              onClick={() => {
                                setCourseBrowserType('created');
                                setIsCourseBrowserOpen(true);
                              }}
                              className="group flex items-center gap-2 px-3 py-2 ml-4 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg transition-all duration-200 w-full text-left"
                            >
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              <span>View All ({courses.created.length - 2} more)</span>
                              <div className="ml-auto">
                                <div className="w-4 h-4 border border-blue-300 rounded group-hover:border-blue-400 transition-colors flex items-center justify-center">
                                  <span className="text-xs text-blue-500">+</span>
                                </div>
                              </div>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Enrolled Courses Section */}
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsEnrolledCoursesExpanded(!isEnrolledCoursesExpanded)}
                        className="group flex items-center justify-between w-full rounded-lg font-medium transition-all duration-200 text-gray-500 hover:text-purple-600 hover:bg-purple-50/50 gap-2 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>My Enrolled Courses</span>
                          {courses.enrolled?.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {courses.enrolled.length}
                            </span>
                          )}
                        </div>
                        <ChevronDownIcon
                          className={`w-3 h-3 transition-transform duration-200 ${isEnrolledCoursesExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isEnrolledCoursesExpanded && (
                        <>
                          {/* Show only first 2 recent courses */}
                          {courses.enrolled?.slice(0, 2).map((course, index) => (
                            <button
                              key={course.id}
                              onClick={() => handleNavigation(`/courses/${course.id}`, `Course: ${course.title}`)}
                              disabled={navigatingTo === `Course: ${course.title}`}
                              className="group flex items-center gap-2 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-purple-700 hover:bg-purple-50/50 px-3 py-2 ml-4 text-xs border-l-2 border-transparent hover:border-purple-300 w-full text-left disabled:opacity-75"
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              {navigatingTo === `Course: ${course.title}` ? (
                                <div className="w-1.5 h-1.5 flex items-center justify-center">
                                  <div className="w-3 h-3 border border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover:bg-purple-600 transition-colors"></div>
                              )}
                              <span className="truncate">
                                {navigatingTo === `Course: ${course.title}` ? 'Loading...' : course.title}
                              </span>
                              <div className="ml-auto flex items-center gap-1">
                                <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-400">{course.progress}%</span>
                              </div>
                            </button>
                          ))}

                          {/* View All button for enrolled courses */}
                          {courses.enrolled?.length > 2 && (
                            <button
                              onClick={() => {
                                setCourseBrowserType('enrolled');
                                setIsCourseBrowserOpen(true);
                              }}
                              className="group flex items-center gap-2 px-3 py-2 ml-4 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 rounded-lg transition-all duration-200 w-full text-left"
                            >
                              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                              <span>View All ({courses.enrolled.length - 2} more)</span>
                              <div className="ml-auto">
                                <div className="w-4 h-4 border border-purple-300 rounded group-hover:border-purple-400 transition-colors flex items-center justify-center">
                                  <span className="text-xs text-purple-500">+</span>
                                </div>
                              </div>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        <button
                          onClick={() => handleNavigation('/courses', 'View All Courses')}
                          disabled={navigatingTo === 'View All Courses'}
                          className="group flex items-center gap-2 w-full rounded-lg font-medium transition-all duration-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 px-3 py-2 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {navigatingTo === 'View All Courses' ? (
                            <div className="w-3 h-3 flex items-center justify-center">
                              <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <Squares2X2Icon className="w-3 h-3" />
                          )}
                          <span>
                            {navigatingTo === 'View All Courses' ? 'Loading...' : 'View All Courses'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </li>
          )}

          {/* Other Navigation Links */}
          {links.filter(link => link.label !== 'Home' && link.label !== 'Course').map((link, index) => {
            const IconComponent = getIconForLink(link.label);
            const isActive = pathname === link.href;
            const isScheduleLink = link.label === 'Schedule';
            const isNavigating = navigatingTo === link.label;
            return (
              <li key={link.href} className="animate-fade-in-up" style={{ animationDelay: `${(index + 2) * 0.05}s` }}>
                <button
                  onClick={() => handleNavigation(link.href, link.label)}
                  disabled={isNavigating}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center rounded-xl font-medium transition-all duration-300 relative hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed w-full text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-lg border border-blue-200 shadow-blue-500/20'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:border hover:border-blue-200 hover:shadow-blue-500/10'
                  } ${
                    isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-3 mx-1'
                  }`}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 w-1 h-6 transform -translate-y-1/2 bg-blue-600 rounded-r-full top-1/2"></div>
                  )}
                  {isNavigating ? (
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    IconComponent && (
                      <IconComponent
                        className={`flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? 'text-blue-600 animate-pulse'
                            : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110 group-hover:animate-bounce'
                        }`}
                      />
                    )
                  )}
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm font-medium">
                        {isNavigating ? 'Loading...' : link.label}
                      </span>
                      {isScheduleLink && scheduledCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 ml-2 text-xs font-bold leading-none text-white bg-blue-600 rounded-full animate-pulse">
                          {scheduledCount}
                        </span>
                      )}
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="absolute z-50 px-2 py-1 ml-2 text-xs text-white transition-opacity bg-gray-900 rounded opacity-0 pointer-events-none left-full group-hover:opacity-100 whitespace-nowrap">
                      {isNavigating ? 'Loading...' : link.label}
                      {isScheduleLink && scheduledCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                          {scheduledCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer section */}
        {!isCollapsed && (
          <div className="pt-6 mt-8 border-t border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="px-3 py-2 border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg animate-pulse">
                  <span className="text-xs font-bold text-blue-600">AI</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-900">Intelevo AI</div>
                  <div className="text-xs text-blue-600">Your learning assistant</div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </nav>
      </aside>

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

       <CourseBrowserModal
         open={isCourseBrowserOpen}
         setOpen={setIsCourseBrowserOpen}
         courses={courseBrowserType === 'created' ? (courses.created || []) : (courses.enrolled || [])}
         type={courseBrowserType}
         onNavigate={handleNavigation}
         navigatingTo={navigatingTo}
       />
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
    case 'Text to Docs':
      return DocumentTextIcon;
    case 'To-Do':
      return CheckCircleIcon;
    case 'Schedule':
      return CalendarIcon;
    case 'Cluster':
      return Squares2X2Icon;
    case 'Settings':
      return Cog6ToothIcon;
    default:
      return null;
  }
};

export default Sidebar;
