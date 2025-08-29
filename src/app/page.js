'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /home if authenticated, or /login if not.
    // This logic is now primarily handled by middleware.js.
    // This client-side check is a fallback/initial redirect for the root path.
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}