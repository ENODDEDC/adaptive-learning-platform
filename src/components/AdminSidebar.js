'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  MegaphoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  MegaphoneIcon as MegaphoneIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, iconSolid: UsersIconSolid },
  { name: 'Courses', href: '/admin/courses', icon: AcademicCapIcon, iconSolid: AcademicCapIconSolid },
  { name: 'Feed Management', href: '/admin/feed-management', icon: MegaphoneIcon, iconSolid: MegaphoneIconSolid },
  { name: 'Member Management', href: '/admin/member-management', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
];

export default function AdminSidebar({ isCollapsed, toggleSidebar }) {
  const pathname = usePathname();
  const [adminData, setAdminData] = React.useState({
    name: 'Admin User',
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
            photoURL: data.photoURL
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchAdminProfile();
  }, []);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      } flex flex-col border-r border-slate-700/50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-6 bg-blue-600 shadow-lg">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm">
            <AcademicCapIcon className="w-6 h-6 text-white" />
          </div>
          <span className={`ml-3 text-xl font-bold text-white ${isCollapsed ? 'hidden' : 'block'}`}>
            Admin Panel
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 transition-all duration-200 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {isCollapsed ? (
            <ArrowLeftOnRectangleIcon className="w-5 h-5 rotate-180" aria-hidden="true" />
          ) : (
            <ArrowLeftOnRectangleIcon className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = isActive ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/5 hover:shadow-md'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-blue-600/20 rounded-xl blur-sm"></div>
              )}

              <IconComponent
                className={`relative flex-shrink-0 w-6 h-6 mr-4 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
                aria-hidden="true"
              />
              <span className={`relative transition-all duration-200 ${isCollapsed ? 'hidden opacity-0' : 'block opacity-100'}`}>
                {item.name}
              </span>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute px-2 py-1 ml-2 text-sm text-white transition-opacity duration-200 bg-gray-900 rounded-lg opacity-0 pointer-events-none left-full group-hover:opacity-100 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          {adminData.photoURL ? (
            <img
              src={adminData.photoURL}
              alt="Admin profile"
              className="object-cover w-8 h-8 rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
              <span className="text-sm font-semibold text-white">{adminData.name.charAt(0)}</span>
            </div>
          )}
          <div className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-sm font-medium text-white">{adminData.name}</p>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}