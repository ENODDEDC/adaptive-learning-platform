'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}