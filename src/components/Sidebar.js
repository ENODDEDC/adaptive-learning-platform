import React, { useState } from "react";
import Link from 'next/link';
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
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ pathname, toggleSidebar, isCollapsed }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const links = [
    { href: "/home", label: "Home" },
    { href: "/notifications", label: "Notifications" },
    { href: "/courses", label: "Course" },
    { href: "/text-to-docs", label: "Text to Docs" },
    { href: "/todo", label: "To-Do" },
    { href: "/schedule", label: "Schedule" },
    { href: "/cluster", label: "Cluster" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <aside
      className={`bg-gray-100 border-r border-gray-200 fixed top-0 left-0 h-full z-30 flex flex-col p-6 transition-all duration-300 ${isCollapsed ? 'w-20 items-center' : 'w-64'}`}
    >
      {/* Hamburger toggle always at the top */}
      <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-8 w-full`}>
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-200">
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* User dropdown only when expanded */}
      {!isCollapsed && (
        <div className="relative mb-8 w-full">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
              <span className="text-gray-800 font-semibold">User123</span>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 w-full">
        <ul className="space-y-2">
          {links.map(link => {
            const IconComponent = getIconForLink(link.label);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-lg text-base font-medium transition-colors ${pathname === link.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    } ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-3'}`}
                >
                  {IconComponent && <IconComponent className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 text-gray-700" />}
                  {!isCollapsed && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
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
