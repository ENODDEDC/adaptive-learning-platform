'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const pathname = usePathname();

  // Check if current page is an auth page
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
    path => pathname?.startsWith(path)
  );

  // For auth pages, render without sidebar/navbar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;