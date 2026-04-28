'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function HorizontalNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/home', label: 'Home', icon: HomeIcon },
    { href: '/courses', label: 'Courses', icon: BookOpenIcon },
    { href: '/todo', label: 'To-Do', icon: CheckCircleIcon },
    { href: '/schedule', label: 'Schedule', icon: CalendarIcon },
    { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/login');
      }
    } catch (error) {
      // Silent fail for logout error
    }
  };

  return (
    <div className="mx-3 mt-2">
      <nav className="bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden">
        <div className="flex items-stretch">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } ${index !== 0 ? 'border-l border-gray-300' : ''}`}
              >
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 shadow-sm"></div>
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          {/* Logout Button - Separated on the right */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all border-l border-gray-300"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
