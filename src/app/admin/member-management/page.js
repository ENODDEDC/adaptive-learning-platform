'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminMemberManagementPage() {
  const [courseMembers, setCourseMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data || []);
        // Auto-select course if courseId is provided in URL
        if (courseId && data.length > 0) {
          const course = data.find(c => c._id === courseId);
          if (course) {
            setSelectedCourse(courseId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  }, [courseId]);

  const fetchCourseMembers = useCallback(async (courseId) => {
    if (!courseId) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/course-members?courseId=${courseId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setCourseMembers(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course members:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseMembers(selectedCourse);
      // Update URL without page reload
      const params = new URLSearchParams(searchParams);
      params.set('courseId', selectedCourse);
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }
  }, [selectedCourse, fetchCourseMembers, searchParams]);

  const handleMemberAction = async (userId, action, newRole = null) => {
    setActionLoading(prev => ({ ...prev, [`${action}-${userId}`]: true }));
    setError('');

    try {
      const res = await fetch('/api/admin/course-members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          userId,
          action,
          newRole
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      showNotification(data.message || 'Action completed successfully!', 'success');

      // Refresh course members
      fetchCourseMembers(selectedCourse);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err.message);
      showNotification(err.message || 'Failed to complete action', 'error');
      console.error('Failed to update member:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${action}-${userId}`]: false }));
    }
  };

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 4000);
  };

  const openRoleModal = (member) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const getAllMembers = () => {
    if (!courseMembers) return [];

    const allMembers = [
      ...courseMembers.members.enrolledUsers.map(m => ({ ...m, memberType: 'Students' })),
      ...courseMembers.members.coTeachers.map(m => ({ ...m, memberType: 'Co-Teachers' })),
      ...courseMembers.members.instructors.map(m => ({ ...m, memberType: 'Instructors' }))
    ];

    if (courseMembers.members.creator) {
      allMembers.push({
        ...courseMembers.members.creator,
        memberType: 'Creator',
        type: 'creator'
      });
    }

    return allMembers;
  };

  const filteredMembers = getAllMembers().filter(member => {
    const matchesSearch = searchTerm === '' ||
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberType.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="mt-1 text-gray-600">Manage course members, roles, and permissions</p>
        </div>
      </div>

      {/* Course Selection */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[300px]"
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.subject} {course.section} - {course.teacherName}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && courseMembers && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Course:</span> {courseMembers.course.subject} {courseMembers.course.section}
            </div>
          )}
        </div>
      </div>

      {selectedCourse && courseMembers && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{courseMembers.summary.totalEnrolled}</p>
                </div>
                <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Co-Teachers</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{courseMembers.summary.totalCoTeachers}</p>
                </div>
                <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instructors</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{courseMembers.summary.totalInstructors}</p>
                </div>
                <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{courseMembers.summary.totalMembers}</p>
                </div>
                <div className="p-3 rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-orange-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Members List */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="p-6">
              <div className="flex flex-col mb-6 space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search members by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full py-2.5 pl-9 pr-3 text-sm leading-5 placeholder-gray-400 transition-all duration-200 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No members found</h3>
                    <p className="text-gray-500">Members will appear here once they join this course.</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div key={member.id} className="p-6 transition-colors duration-200 border border-gray-200 bg-gray-50 rounded-xl hover:bg-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 font-semibold text-white rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                member.type === 'creator' ? 'bg-purple-100 text-purple-800' :
                                member.type === 'instructor' ? 'bg-green-100 text-green-800' :
                                member.type === 'coTeacher' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {member.memberType}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            <p className="text-xs text-gray-500">Role: {member.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {member.type !== 'creator' && (
                            <>
                              <button
                                onClick={() => openRoleModal(member)}
                                className="px-3 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 bg-blue-100 rounded-lg hover:bg-blue-200"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => handleMemberAction(member.id, 'remove')}
                                disabled={actionLoading[`remove-${member.id}`]}
                                className="px-3 py-2 text-sm font-medium text-red-600 transition-colors duration-200 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[`remove-${member.id}`] ? 'Removing...' : 'Remove'}
                              </button>
                            </>
                          )}
                          {member.type === 'creator' && (
                            <span className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg">
                              Course Creator
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 sm:p-4">
          <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Change Member Role</h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="p-1 text-white transition-colors duration-200 rounded-lg hover:bg-white hover:bg-opacity-20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4 space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 font-semibold text-white rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedMember.name}</h4>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Current role: <span className="font-medium">{selectedMember.role}</span> ({selectedMember.memberType})
                </p>
              </div>

              <div className="mb-6 space-y-3">
                <label className="block text-sm font-medium text-gray-700">New Role:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="newRole"
                      value="student"
                      defaultChecked={selectedMember.type === 'enrolled'}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">Student</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="newRole"
                      value="coTeacher"
                      defaultChecked={selectedMember.type === 'coTeacher'}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">Co-Teacher</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="newRole"
                      value="instructor"
                      defaultChecked={selectedMember.type === 'instructor'}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">Instructor</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const newRole = document.querySelector('input[name="newRole"]:checked').value;
                    handleMemberAction(selectedMember.id, 'changeRole', newRole);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Change Role
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed z-50 space-y-2 top-4 right-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm w-full p-4 rounded-lg shadow-lg transition-all duration-300 animate-fade-in-down ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="inline-flex text-gray-400 rounded-md hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}