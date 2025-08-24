// src/components/Layout.js
'use client';

import React, { useState, cloneElement, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CreateCourseModal from '@/components/CreateCourseModal';
import JoinCourseModal from '@/components/JoinCourseModal';

const Layout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModalOpen] = useState(false);

  // State to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleCreateCourseClick = () => setIsCreateCourseModalOpen(true);
  const handleJoinCourseClick = () => setIsJoinCourseModalOpen(true);

  const isAuthPage = ['/', '/login', '/register', '/forgot-password', '/reset-password'].some(
    path => pathname === path || (path !== '/' && pathname?.startsWith(path))
  );

  if (isAuthPage) {
    return <div className="min-h-screen bg-base-light">{children}</div>;
  }

  // Inject props into the page component
  const pageContent = cloneElement(children, {
    handleCreateCourse: children.props.handleCreateCourse,
    handleJoinCourse: children.props.handleJoinCourse,
  });

  const sidebarState = isMounted ? isSidebarCollapsed : false;
  const mainContentMargin = isMounted && isSidebarCollapsed ? 'ml-16' : 'ml-56';

  return (
    <div className="bg-base-light min-h-screen">
      <Sidebar pathname={pathname} isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={pageContent.props.handleCreateCourse}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={() => setIsJoinCourseModalOpen(false)}
        onJoinCourse={pageContent.props.handleJoinCourse}
      />
      <div className={`transition-all duration-300 ${mainContentMargin}`}>
        <main className="p-8">{pageContent}</main>
      </div>
    </div>
  );
};

export default Layout;