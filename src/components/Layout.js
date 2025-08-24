// src/components/Layout.js
'use client';

import React, { useState, cloneElement, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import CreateCourseModal from '@/components/CreateCourseModal';
import JoinCourseModal from '@/components/JoinCourseModal';

const Layout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModalOpen] = useState(false);
  const [userName, setUserName] = useState(''); // For both admin and regular users

  // State to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (isMounted) { // Only run on client side
      const fetchUserName = async () => {
        try {
          const currentToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
          if (currentToken) {
            const isAdmin = localStorage.getItem('adminToken') ? true : false;
            const profileApi = isAdmin ? '/api/admin/profile' : '/api/auth/profile';
            
            const res = await fetch(profileApi, {
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setUserName(data.name);
            } else {
              console.error('Failed to fetch user profile:', res.status, res.statusText);
              localStorage.removeItem('token');
              localStorage.removeItem('adminToken');
              setUserName('');
            }
          } else {
            setUserName('');
          }
        } catch (error) {
          console.error('Failed to fetch user name:', error);
          setUserName('');
        }
      };
      fetchUserName();
    }
  }, [isMounted]); // Depend on isMounted to ensure client-side execution

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleCreateCourseClick = () => setIsCreateCourseModalOpen(true);
  const handleJoinCourseClick = () => setIsJoinCourseModalOpen(true);

  const isAuthPage = ['/', '/login', '/register', '/forgot-password', '/reset-password'].some(
    path => pathname === path || (path !== '/' && pathname?.startsWith(path))
  );

  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname?.startsWith('/admin') && !isAdminLoginPage;

  if (isAuthPage || isAdminLoginPage) {
    return <div className="min-h-screen bg-base-light">{children}</div>;
  }

  if (isAdminPage) {
    const sidebarState = isMounted ? isSidebarCollapsed : false;
    const mainContentMargin = isMounted && isSidebarCollapsed ? 'ml-20' : 'ml-56';
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
        <div className={`transition-all duration-300 ${mainContentMargin}`}>
          <AdminNavbar toggleSidebar={toggleSidebar} />
          <main className="p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Inject props into the page component (no longer passing handleJoinCourse from children)
  const pageContent = cloneElement(children, {});

  const sidebarState = isMounted ? isSidebarCollapsed : false;
  const mainContentMargin = isMounted && isSidebarCollapsed ? 'ml-20' : 'ml-56';

  return (
    <div className="min-h-screen bg-base-light">
      <Sidebar pathname={pathname} isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={async (courseData) => {
          try {
            console.log('Course data before sending to API:', courseData); // Added console.log
            const token = localStorage.getItem('token'); // Use 'token' for regular user authentication
            if (!token) {
              console.error('User not authenticated to create course.');
              return;
            }
            const res = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(courseData),
            });
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            console.log('Course created successfully by user.');
            setIsCreateCourseModalOpen(false);
          } catch (error) {
            console.error('Failed to create course by user:', error);
          }
        }}
        adminName={userName}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={() => setIsJoinCourseModalOpen(false)}
        onJoinCourse={async (courseKey) => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              console.error('User not authenticated to join course.');
              return;
            }
            const res = await fetch('/api/courses/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ courseKey }),
            });
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            console.log('Successfully joined course.');
            setIsJoinCourseModalOpen(false);
            // Optionally, trigger a refresh of courses on the home page
            // This would require a way to communicate from Layout to Home, e.g., context or a global state management.
            // For now, we'll assume the user will see the updated list on next page load or manual refresh.
          } catch (error) {
            console.error('Failed to join course:', error);
          }
        }}
      />
      <div className={`transition-all duration-300 ${mainContentMargin}`}>
        <Navbar onCreateCourseClick={handleCreateCourseClick} onJoinCourseClick={handleJoinCourseClick} />
        <main className="p-8">{pageContent}</main>
      </div>
    </div>
  );
};

export default Layout;