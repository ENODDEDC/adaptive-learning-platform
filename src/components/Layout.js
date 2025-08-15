'use client'; // Ensure this is a client component as it will contain client-side logic eventually.

import React from 'react';
import Sidebar from './Sidebar';
// import Navbar from './Navbar'; // Remove this import

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* <Navbar /> */} {/* Remove this line */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;