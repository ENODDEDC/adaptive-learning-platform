'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function CourseJoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCoursePreview();
    }
  }, [token]);

  const fetchCoursePreview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/join/${token}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Invalid invitation link');
      }

      const data = await res.json();
      setCourse(data.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCourse = async () => {
    setJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/courses/join/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // User already enrolled, redirect to course
          router.push(`/courses/${data.courseId}`);
          return;
        }
        throw new Error(data.message || 'Failed to join course');
      }

      setJoinSuccess(true);
      
      // Redirect to course page after a short delay
      setTimeout(() => {
        router.push(`/courses/${data.courseId}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading course preview...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Joined!</h2>
          <p className="text-gray-600 mb-6">Redirecting you to the course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <AcademicCapIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-gray-600">Preview the course details below and join to get started</p>
        </div>

        {/* Course Preview Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          {/* Course Header with Color */}
          <div 
            className="h-32 relative overflow-hidden"
            style={{ backgroundColor: course?.coverColor || '#60a5fa' }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12 animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>

          {/* Course Info */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{course?.subject}</h2>
              {course?.section && (
                <p className="text-lg text-gray-600">Section: {course.section}</p>
              )}
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-700">Instructor</div>
                    <div className="text-lg font-bold text-blue-900">
                      {course?.instructor?.name || course?.teacherName || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl">
                    <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-700">Students</div>
                    <div className="text-lg font-bold text-purple-900">
                      {course?.studentCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                    <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-emerald-700">Co-Teachers</div>
                    <div className="text-lg font-bold text-emerald-900">
                      {course?.coTeacherCount || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleJoinCourse}
                disabled={joining}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl font-semibold"
              >
                {joining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    Join Course
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/home')}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">What happens when you join?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You'll be enrolled as a student in this course</li>
                <li>• You'll have access to all course materials and assignments</li>
                <li>• You can participate in class activities and discussions</li>
                <li>• You'll receive notifications about course updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
