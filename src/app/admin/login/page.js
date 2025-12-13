'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (!isLocked || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setLockoutTime(null);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, remainingTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        router.replace('/admin/dashboard');
      } else if (res.status === 423) {
        // Account locked
        console.error('🔒 Account locked:', data.message);
        setIsLocked(true);
        if (data.lockedUntil) {
          const lockTime = new Date(data.lockedUntil);
          setLockoutTime(lockTime);
          const remaining = Math.ceil((lockTime - new Date()) / 1000);
          setRemainingTime(remaining > 0 ? remaining : 0);
        }
        setError(data.message || 'Account is temporarily locked.');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Admin login API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-50">
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="p-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="mt-2 text-sm text-gray-600">
              Secure access to administrative dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="admin@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-4 ${isLocked ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'} border-2 rounded-xl`}>
                <div className="flex items-start gap-3">
                  {isLocked && (
                    <LockClosedIcon className="flex-shrink-0 w-5 h-5 mt-0.5 text-orange-600" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isLocked ? 'text-orange-800' : 'text-red-800'}`}>
                      {isLocked && remainingTime > 0 ? (
                        <>
                          Account locked due to multiple failed login attempts.
                          <span className="block mt-1 text-orange-700">
                            Try again in {Math.floor(remainingTime / 60)} {Math.floor(remainingTime / 60) === 1 ? 'minute' : 'minutes'} {remainingTime % 60 > 0 && `and ${remainingTime % 60} ${remainingTime % 60 === 1 ? 'second' : 'seconds'}`}.
                          </span>
                          {lockoutTime && (
                            <span className="block mt-1 text-xs text-orange-600">
                              You can login again at {lockoutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                          )}
                        </>
                      ) : (
                        error
                      )}
                    </p>
                    {isLocked && remainingTime > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-orange-700">Time remaining:</span>
                          <span className="text-lg font-bold text-orange-900 tabular-nums">
                            {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="w-full h-2 overflow-hidden bg-orange-200 rounded-full">
                          <div 
                            className="h-full transition-all duration-1000 ease-linear bg-orange-500"
                            style={{ width: `${(remainingTime / (15 * 60)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3.5 font-semibold text-white transition-all duration-200 bg-blue-500 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : isLocked ? (
                <div className="flex items-center justify-center gap-2">
                  <LockClosedIcon className="w-5 h-5" />
                  <span>Account Locked</span>
                </div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-6 mt-6 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Protected by advanced security measures
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600">System Operational</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact system administrator
          </p>
        </div>
      </div>
    </div>
  );
}