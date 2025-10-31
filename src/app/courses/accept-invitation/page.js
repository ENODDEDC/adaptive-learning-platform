'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
const AcceptInvitationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Processing your invitation...');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    const checkAuthAndAccept = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch (err) {
        setStatus('unauthenticated');
      }
    };
    checkAuthAndAccept();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/courses/accept-invitation?token=${token}`);
      return;
    }

    if (status === 'authenticated' && token) {
      const acceptInvitation = async () => {
        try {
          const response = await fetch('/api/courses/accept-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage(data.message);
            setTimeout(() => router.push('/courses'), 3000);
          } else {
            setError(data.message || 'Failed to accept invitation.');
          }
        } catch (err) {
          setError('An unexpected error occurred.');
        }
      };

      acceptInvitation();
    }
  }, [status, token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Course Invitation</h1>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <p className="text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;