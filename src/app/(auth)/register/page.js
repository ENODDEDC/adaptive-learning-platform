'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    middleName: '',
    surname: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1 for registration, 2 for OTP
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      if (res.ok) {
        router.push('/login?verified=true');
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-indigo-600">AL</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Join AssistEd
          </h1>
          <p className="text-lg text-indigo-100 mb-8">
            Start your personalized learning journey today and unlock your potential with AssistEd.
          </p>
          <div className="space-y-4 text-indigo-100">
            <div className="flex items-center justify-center">
              <CheckIcon className="h-5 w-5 mr-3" />
              <span>Free to get started</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckIcon className="h-5 w-5 mr-3" />
              <span>Adaptive learning technology</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckIcon className="h-5 w-5 mr-3" />
              <span>Comprehensive progress tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <div className="mx-auto h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">AL</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="card p-8">
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name *
                      </label>
                      <div className="mt-1">
                        <input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter your first name"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="surname"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name *
                      </label>
                      <div className="mt-1">
                        <input
                          id="surname"
                          type="text"
                          value={formData.surname}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="middleName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Middle Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="middleName"
                          type="text"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="suffix"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Suffix
                      </label>
                      <div className="mt-1">
                        <input
                          id="suffix"
                          type="text"
                          value={formData.suffix}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Jr., Sr., etc."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address *
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password *
                      </label>
                      <div className="mt-1">
                        <input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Create a strong password"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirm Password *
                      </label>
                      <div className="mt-1">
                        <input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          required
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="terms"
                          className="font-medium text-gray-700"
                        >
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Terms and Conditions
                          </Link>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="privacy"
                          type="checkbox"
                          required
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="privacy"
                          className="font-medium text-gray-700"
                        >
                          I agree to the{' '}
                          <Link
                            href="/privacy"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full flex justify-center items-center"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MailIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
                <p className="mt-2 text-sm text-gray-600">
                  We&apos;ve sent a verification code to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="card p-8">
                {message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-600">{message}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="input-field text-center text-lg tracking-widest"
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex justify-center items-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Email'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Didn&apos;t receive the code?{' '}
                    <button
                      onClick={() => setStep(1)}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Go back and try again
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon components
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const LoadingSpinner = ({ className }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const MailIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 21.75 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);