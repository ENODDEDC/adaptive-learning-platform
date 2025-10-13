'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem('adminToken');
      console.log('AdminLayout - Current Pathname:', pathname);
      console.log('AdminLayout - Admin Token:', token ? 'Exists' : 'Does not exist');

      if (!token && pathname !== '/admin/login') {
        console.log('AdminLayout - Redirecting to /admin/login (not authenticated)');
        router.replace('/admin/login');
      } else if (token && pathname === '/admin/login') {
        console.log('AdminLayout - Redirecting to /admin/dashboard (authenticated on login page)');
        router.replace('/admin/dashboard');
      } else {
        setIsLoading(false); // Authentication check complete, allow rendering
      }
    };

    checkAdminAuth();
  }, [pathname, router]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-transparent rounded-full border-t-purple-400 border-r-blue-400 animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-transparent rounded-full border-t-purple-600 border-r-blue-600 animate-spin animation-delay-150"></div>
          </div>
          <p className="text-xl font-semibold text-white">Loading Admin Panel...</p>
          <p className="mt-2 text-sm text-gray-300">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar/navbar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}