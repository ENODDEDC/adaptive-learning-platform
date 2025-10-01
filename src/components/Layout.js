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
import CreateClusterModal from '@/components/CreateClusterModal';
import JoinClusterModal from '@/components/JoinClusterModal';
import { useLayout } from '../context/LayoutContext';
import featureFlags from '../utils/featureFlags';

const Layout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [upcomingTasksExpanded, setUpcomingTasksExpanded] = useState(true);
  const {
    isCreateCourseModalOpen,
    closeCreateCourseModal,
    isJoinCourseModalOpen,
    closeJoinCourseModal,
    openCreateCourseModal, // Re-add extraction
    openJoinCourseModal,   // Re-add extraction
    isCreateClusterModalOpen,
    closeCreateClusterModal,
    isJoinClusterModalOpen,
    closeJoinClusterModal,
  } = useLayout();
  const [user, setUser] = useState(null);
 
   // State to prevent hydration mismatch
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => {
     setIsMounted(true);
     if (isMounted) { // Only run on client side
       const fetchUserProfile = async () => {
         try {
           // Skip user profile fetching in development to reduce API calls
           if (featureFlags.shouldDisableHeavyFeatures()) {
             setUser(null);
             return;
           }

           // Token is now sent via HTTP-only cookie, no need to retrieve from localStorage
           // The middleware will handle authentication and redirection.
           const res = await fetch('/api/auth/profile'); // Assuming a single profile endpoint for simplicity, or separate based on context
           if (res.ok) {
             const data = await res.json();
             setUser(data);
           } else {
             // Silent fail for user profile fetch
             setUser(null);
           }
         } catch (error) {
           setUser(null);
         }
       };
       fetchUserProfile();
     }
   }, [isMounted]); // Depend on isMounted to ensure client-side execution

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // When on course pages, also control upcoming tasks
    if (pathname?.startsWith('/courses/') && pathname !== '/courses') {
      setUpcomingTasksExpanded(isSidebarCollapsed); // If collapsing sidebar, expand tasks; if expanding sidebar, collapse tasks
    }
  };

  // Auto-collapse sidebar for forms routes
  useEffect(() => {
    if (pathname?.startsWith('/forms/')) {
      setIsSidebarCollapsed(true);
    }
  }, [pathname]);

  // Collapse sidebar when other components request it
  useEffect(() => {
    const handleCollapseRequest = () => setIsSidebarCollapsed(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('collapseSidebar', handleCollapseRequest);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('collapseSidebar', handleCollapseRequest);
      }
    };
  }, []);


  const isAuthPage = ['/', '/login', '/register', '/forgot-password', '/reset-password'].some(
    path => pathname === path || (path !== '/' && pathname?.startsWith(path))
  );

  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname?.startsWith('/admin') && !isAdminLoginPage;

  if (isAuthPage || isAdminLoginPage) {
    return <div className="min-h-screen bg-base-light">{children}</div>;
  }

  if (isAdminPage) {
    const sidebarState = isSidebarCollapsed;
    const mainContentMargin = isSidebarCollapsed ? 'ml-20' : 'ml-64';
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
        <div className={`transition-all duration-500 ease-in-out ${mainContentMargin}`}>
          <AdminNavbar toggleSidebar={toggleSidebar} />
          <main className="p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Inject props into the page component (no longer passing handleJoinCourse from children)

  // Prevent hydration mismatch by using consistent initial state
  const sidebarState = isSidebarCollapsed;
  const mainContentMargin = isSidebarCollapsed ? 'ml-20' : 'ml-64';

  // Determine if current page needs scrolling
  const needsScrolling = pathname === '/text-to-docs';
  const containerOverflow = needsScrolling ? 'overflow-hidden' : 'overflow-hidden';
  const contentOverflow = needsScrolling ? 'overflow-y-auto' : 'overflow-hidden';

  return (
    <div className="h-screen overflow-hidden bg-base-light">
      <Sidebar pathname={pathname} isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={closeCreateCourseModal}
        onCreateCourse={async (courseData) => {
          try {
            const res = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(courseData),
            });
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            closeCreateCourseModal();
          } catch (error) {
            // Silent fail for course creation
          }
        }}
        adminName={user?.name}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={closeJoinCourseModal}
        onJoinCourse={async (courseKey) => {
          try {
            const res = await fetch('/api/courses/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ courseKey }),
            });
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            closeJoinCourseModal();
            // Optionally, trigger a refresh of courses on the home page
            // This would require a way to communicate from Layout to Home, e.g., context or a global state management.
            // For now, we'll assume the user will see the updated list on next page load or manual refresh.
          } catch (error) {
            // Silent fail for course joining
          }
        }}
      />
      <CreateClusterModal
        isOpen={isCreateClusterModalOpen}
        onClose={closeCreateClusterModal}
        onCreateCluster={async (clusterData) => {
          try {
            const res = await fetch('/api/clusters', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(clusterData),
            });

            const responseData = await res.json();

            if (!res.ok) {
              throw new Error(responseData.message || `Error: ${res.status} ${res.statusText}`);
            }
            closeCreateClusterModal();
          } catch (error) {
            alert(`Failed to create cluster: ${error.message}`);
          }
        }}
        userName={user?.name}
      />
      <JoinClusterModal
        isOpen={isJoinClusterModalOpen}
        onClose={closeJoinClusterModal}
        onJoinCluster={async (classCode) => {
          try {
            const res = await fetch('/api/clusters/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ classCode }),
            });
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            closeJoinClusterModal();
          } catch (error) {
            // Silent fail for cluster joining
          }
        }}
      />
      <div className={`transition-all duration-500 ease-in-out ${mainContentMargin} h-screen ${containerOverflow}`}>
        <Navbar user={user} onCreateCourseClick={openCreateCourseModal} onJoinCourseClick={openJoinCourseModal} />
        <main className={`h-full ${contentOverflow}`}>
          {React.cloneElement(children, {
            upcomingTasksExpanded,
            setUpcomingTasksExpanded,
            sidebarCollapsed: sidebarState,
            setSidebarCollapsed: setIsSidebarCollapsed
          })}
        </main>
      </div>
    </div>
  );
};

export default Layout;