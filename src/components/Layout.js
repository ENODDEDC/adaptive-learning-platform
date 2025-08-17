// src/components/Layout.js
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar'; // Import Navbar

const Layout = ({ children }) => {
  const pathname = usePathname();

  // Check if current page is an auth page
  const isAuthPage = ['/login', '//register', '/forgot-password', '/reset-password'].some(
    path => pathname?.startsWith(path)
  );

  // For auth pages, render without sidebar/navbar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-base-light">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-base-light"> {/* Changed to flex-col to stack Navbar on top */}
      <Navbar
        // Pass necessary props to Navbar if needed.
        // These props would typically come from a context or a higher-level state.
        // For now, I'm assuming default behavior or that Navbar handles its own state.
        // If onCreateCourseClick/onJoinCourseClick are still needed here,
        // you'll need to lift their state/handlers up to RootLayout or a context provider.
      />
      <div className="flex flex-1"> {/* This div now holds Sidebar and main content side-by-side */}
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-base-light ml-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;