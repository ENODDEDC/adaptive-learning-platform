'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Navbar = ({ onCreateCourseClick, onJoinCourseClick }) => {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const optionsRef = useRef(null);
  const buttonRef = useRef(null);
  const profileRef = useRef(null);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setUser({ token });
      } else {
        setUser(null);
      }
    };

    // Check on component mount
    checkAuthStatus();

    // Listen for storage changes (when localStorage is modified)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthStatus();
      }
    };

    // Listen for custom logout events
    const handleLogoutEvent = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);

  const toggleOptionsModal = () => {
    setShowOptionsModal(!showOptionsModal);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleClickOutside = (event) => {
    if (
      optionsRef.current &&
      !optionsRef.current.contains(event.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target)
    ) {
      setShowOptionsModal(false);
    }
    
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target)
    ) {
      setShowProfileMenu(false);
    }
  };

  const handleLogout = (e) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== LOGOUT PROCESS STARTED ===');
    
    try {
      console.log('1. Logout button clicked');
      
      // Check what's currently in localStorage
      console.log('2. Current localStorage token:', localStorage.getItem('token'));
      console.log('3. Current localStorage user:', localStorage.getItem('user'));
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      console.log('4. Token removed from localStorage');
      
      // Remove user data from localStorage (for Google users)
      localStorage.removeItem('user');
      console.log('5. User data removed from localStorage');
      
      // Verify removal
      console.log('6. Verification - token after removal:', localStorage.getItem('token'));
      console.log('7. Verification - user after removal:', localStorage.getItem('user'));
      
      // Clear user state immediately
      setUser(null);
      console.log('8. User state cleared');
      
      // Close profile menu
      setShowProfileMenu(false);
      console.log('9. Profile menu closed');
      
      // Trigger custom logout event to force re-check
      window.dispatchEvent(new Event('logout'));
      console.log('10. Logout event dispatched');
      
      // Force immediate redirect without delay
      console.log('11. Attempting redirect to login page');
      router.push('/login');
      
      // Also try window.location as backup
      setTimeout(() => {
        console.log('11. Backup redirect using window.location');
        window.location.href = '/login';
      }, 500);
      
    } catch (error) {
      console.error('ERROR during logout:', error);
      console.log('12. Using emergency redirect');
      // Force redirect even if there's an error
      window.location.href = '/login';
    }
    
    console.log('=== LOGOUT PROCESS COMPLETED ===');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-base-light border-b border-divider-light py-4 px-4 flex justify-between items-center relative"> {/* Reduced padding to py-2 */}
      <div>{/* Left-aligned content if any */}</div>
      <div className="flex items-center">
        {/* Course creation button - only show if user is logged in */}
        {user && (
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleOptionsModal}
              className="bg-text-primary hover:bg-gray-700 text-white font-bold py-1 px-3 rounded mr-4 text-base focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50" // Changed background, removed rounded-full, adjusted padding and text size
            >
              +
            </button>
            {showOptionsModal && (
              <div
                ref={optionsRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
                style={{ top: 'calc(100% + 10px)' }}
              >
                <button
                  onClick={() => {
                    onCreateCourseClick();
                    setShowOptionsModal(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Create Course
                </button>
                <button
                  onClick={() => {
                    onJoinCourseClick();
                    setShowOptionsModal(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Join Course
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile/Login button */}
        {user ? (
          <div className="relative">
            <button
              ref={profileRef}
              onClick={toggleProfileMenu}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-normal text-sm py-2 px-3 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50 flex items-center" // Reduced font, padding, and ring size
            >
              <UserIcon className="h-4 w-4 mr-1" /> {/* Adjusted margin */}
              Profile
              <ChevronDownIcon className="h-4 w-4 ml-1" /> {/* Adjusted margin */}
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <p className="font-medium">Signed in</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Add profile navigation here if needed
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Add settings navigation here if needed
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <div className="border-t border-gray-100">
                  <button
                    onMouseDown={(e) => {
                      console.log('🔴 LOGOUT BUTTON MOUSE DOWN - Starting logout immediately');
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogout(e);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left text-red-600 hover:text-red-700"
                  >
                    <LogoutIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

// Icon components
const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

export default Navbar;