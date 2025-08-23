'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Immediate redirect to login by default
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // User is logged in, redirect to home
          router.replace('/home');
        } else {
          // User is not logged in, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        // If localStorage fails, redirect to login
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    // Run immediately
    checkAuth();
  }, [router]);

  // Don't render anything to prevent flash
  if (isChecking) {
    return null;
  }

  // Fallback loading state (should rarely be seen)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}