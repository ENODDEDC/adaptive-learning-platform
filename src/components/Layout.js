// src/components/Layout.js
'use client';

import React, { useState, cloneElement, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import HorizontalNav from './HorizontalNav';
import CreateCourseModal from '@/components/CreateCourseModal';
import JoinCourseModal from '@/components/JoinCourseModal';
import CreateClusterModal from '@/components/CreateClusterModal';
import JoinClusterModal from '@/components/JoinClusterModal';
import UnifiedFloatingAssistant from '@/components/UnifiedFloatingAssistant';
import ConfirmationModal from '@/components/ConfirmationModal';
import useViewportInfo from '@/hooks/useViewportInfo';
import { useLayout } from '../context/LayoutContext';
import featureFlags from '../utils/featureFlags';
import { api } from '../services/apiService';
import '../utils/clearOldNotes'; // Auto-clear old localStorage notes

const Layout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [upcomingTasksExpanded, setUpcomingTasksExpanded] = useState(true);
  const [immersiveLearningShell, setImmersiveLearningShell] = useState(false);
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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { height: viewportHeight } = useViewportInfo();
 
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
           const res = await api.getUserProfile();
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
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    }
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
    const handleCollapseMainSidebar = () => {
      console.log('🔍 LAYOUT: Received collapseMainSidebar event - collapsing sidebar');
      setIsSidebarCollapsed(true);
    };
    const handleHideMainSidebar = () => {
      console.log('🔍 LAYOUT: Received hideMainSidebar event - hiding sidebar completely');
      setIsSidebarCollapsed(true);
      // Add a CSS class to completely hide the sidebar
      if (typeof document !== 'undefined') {
        document.body.classList.add('hide-main-sidebar');
      }
    };
    const handleShowMainSidebar = () => {
      console.log('🔍 LAYOUT: Received showMainSidebar event - showing sidebar again');
      setIsSidebarCollapsed(false);
      // Remove the CSS class to show the sidebar
      if (typeof document !== 'undefined') {
        document.body.classList.remove('hide-main-sidebar');
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('collapseSidebar', handleCollapseRequest);
      window.addEventListener('collapseMainSidebar', handleCollapseMainSidebar);
      window.addEventListener('hideMainSidebar', handleHideMainSidebar);
      window.addEventListener('showMainSidebar', handleShowMainSidebar);
      console.log('🔍 LAYOUT: Event listeners added for sidebar collapse/hide/show');
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('collapseSidebar', handleCollapseRequest);
        window.removeEventListener('collapseMainSidebar', handleCollapseMainSidebar);
        window.removeEventListener('hideMainSidebar', handleHideMainSidebar);
        window.removeEventListener('showMainSidebar', handleShowMainSidebar);
      }
    };
  }, []);

  // Full-screen learning overlays: hide main sidebar — body flags + events
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;
    const syncFromBody = () =>
      setImmersiveLearningShell(
        document.body.hasAttribute('data-immersive-constellation') ||
          document.body.hasAttribute('data-immersive-global') ||
          document.body.hasAttribute('data-immersive-sensing') ||
          document.body.hasAttribute('data-immersive-sequential') ||
          document.body.hasAttribute('data-immersive-active-learning') ||
          document.body.hasAttribute('data-immersive-reflective-learning') ||
          document.body.hasAttribute('data-immersive-visual-learning')
      );

    const onConstellation = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onGlobal = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onSensing = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onSequential = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onActiveLearning = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onReflectiveLearning = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    const onVisualLearning = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean' && e.detail.open) {
        setImmersiveLearningShell(true);
      } else {
        syncFromBody();
      }
    };

    syncFromBody();
    window.addEventListener('assist-ed-immersive-constellation', onConstellation);
    window.addEventListener('assist-ed-immersive-global', onGlobal);
    window.addEventListener('assist-ed-immersive-sensing', onSensing);
    window.addEventListener('assist-ed-immersive-sequential', onSequential);
    window.addEventListener('assist-ed-immersive-active-learning', onActiveLearning);
    window.addEventListener('assist-ed-immersive-reflective-learning', onReflectiveLearning);
    window.addEventListener('assist-ed-immersive-visual-learning', onVisualLearning);
    const observer = new MutationObserver(() => syncFromBody());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'data-immersive-constellation',
        'data-immersive-global',
        'data-immersive-sensing',
        'data-immersive-sequential',
        'data-immersive-active-learning',
        'data-immersive-reflective-learning',
        'data-immersive-visual-learning'
      ]
    });

    return () => {
      window.removeEventListener('assist-ed-immersive-constellation', onConstellation);
      window.removeEventListener('assist-ed-immersive-global', onGlobal);
      window.removeEventListener('assist-ed-immersive-sensing', onSensing);
      window.removeEventListener('assist-ed-immersive-sequential', onSequential);
      window.removeEventListener('assist-ed-immersive-active-learning', onActiveLearning);
      window.removeEventListener('assist-ed-immersive-reflective-learning', onReflectiveLearning);
      window.removeEventListener('assist-ed-immersive-visual-learning', onVisualLearning);
      observer.disconnect();
    };
  }, []);


  const isAuthPage = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/complete-registration'].some(
    path => pathname === path || (path !== '/' && pathname?.startsWith(path))
  );

  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname?.startsWith('/admin') && !isAdminLoginPage;

  // Set body background color based on page
  useEffect(() => {
    if (pathname === '/') {
      document.body.style.backgroundColor = '#0a0a0a';
    } else {
      document.body.style.backgroundColor = '#F0F2F5';
    }
    
    return () => {
      document.body.style.backgroundColor = '#F0F2F5';
    };
  }, [pathname]);

  if (isAuthPage || isAdminLoginPage) {
    return <div>{children}</div>;
  }

  if (isAdminPage) {
    const sidebarState = isSidebarCollapsed;
    const mainContentMargin = isSidebarCollapsed ? 'ml-16' : 'ml-52';
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar isCollapsed={sidebarState} toggleSidebar={toggleSidebar} />
        <div className={`transition-all duration-500 ease-in-out ${mainContentMargin}`}>
          <AdminNavbar toggleSidebar={toggleSidebar} />
          <main>{children}</main>
        </div>
      </div>
    );
  }

  // Inject props into the page component (no longer passing handleJoinCourse from children)

  // Prevent hydration mismatch by using consistent initial state
  const sidebarState = isSidebarCollapsed;
  const mainContentMargin = immersiveLearningShell
    ? 'ml-0'
    : isSidebarCollapsed
      ? 'ml-16'
      : 'ml-52';

  return (
    <div className="bg-base-light overflow-hidden" style={{ height: `${viewportHeight}px` }}>
      {/* CSS for hiding sidebar completely */}
      <style jsx global>{`
        .hide-main-sidebar aside[data-sidebar="main-container"] {
          display: none !important;
        }
        .hide-main-sidebar .main-content {
          margin-left: 0 !important;
        }
        /* Hide sidebar for non-admin pages */
        aside[data-sidebar="main-container"] {
          display: none !important;
        }
      `}</style>
      
      {/* Sidebar hidden - using horizontal nav instead */}
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
              credentials: 'include',
              body: JSON.stringify(courseData),
            });
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
            }
            const result = await res.json();
            closeCreateCourseModal();
            // Show success modal
            setIsSuccessModalOpen(true);
          } catch (error) {
            console.error('Error creating course:', error);
            alert(`Failed to create course: ${error.message}`);
          }
        }}
        adminName={user ? `${user.name} ${user.surname}` : ''}
      />
      <JoinCourseModal
        isOpen={isJoinCourseModalOpen}
        onClose={closeJoinCourseModal}
        onJoinCourse={async (courseKey) => {
          try {
            console.log('Attempting to join course with key:', courseKey);
            const res = await fetch('/api/courses/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include cookies for authentication
              body: JSON.stringify({ courseKey }),
            });
            
            const responseData = await res.json();
            console.log('Join course response:', responseData);
            
            if (!res.ok) {
              throw new Error(responseData.message || `Error: ${res.status} ${res.statusText}`);
            }
            
            closeJoinCourseModal();
            // Show success message
            alert('Successfully joined the course!');
            
            // Refresh the page to show updated courses
            window.location.reload();
          } catch (error) {
            console.error('Error joining course:', error);
            alert(`Failed to join course: ${error.message}`);
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
      <div
        className="main-content relative transition-all duration-500 ease-in-out ml-0 h-full overflow-hidden flex flex-col"
      >
        <Navbar user={user} onCreateCourseClick={openCreateCourseModal} onJoinCourseClick={openJoinCourseModal} />
        
        <main className="flex-1 overflow-hidden">
          {React.isValidElement(children) && typeof children.type !== 'string'
            ? React.cloneElement(children, {
                upcomingTasksExpanded,
                setUpcomingTasksExpanded,
                sidebarCollapsed: sidebarState,
                setSidebarCollapsed: setIsSidebarCollapsed
              })
            : children}
        </main>
        
        {/* Global Unified Assistant Button - Fixed to bottom viewport */}
        <UnifiedFloatingAssistant />
      </div>

      {/* Success Modal for Course Creation */}
      <ConfirmationModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirm={() => {
          setIsSuccessModalOpen(false);
          window.location.reload();
        }}
        title="Course Created Successfully!"
        message="Your course has been created and is now ready for students to join."
        confirmText="OK"
        variant="success"
        showCancel={false}
      />
    </div>
  );
};

export default Layout;
