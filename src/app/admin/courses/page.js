'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreateCourseModal from '@/components/CreateCourseModal';

export default function AdminCourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    section: '',
    teacherName: '',
    coverColor: '',
    uniqueKey: '',
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const router = useRouter();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setCourses(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCourses();
    const fetchAdminName = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          const res = await fetch('/api/admin/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setAdminName(data.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin name:', error);
      }
    };
    fetchAdminName();
  }, [fetchCourses]);

  const handleEditClick = (course) => {
    setEditingCourse(course._id);
    setEditFormData({
      subject: course.subject,
      section: course.section,
      teacherName: course.teacherName,
      coverColor: course.coverColor,
      uniqueKey: course.uniqueKey,
    });
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (courseId) => {
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: courseId, ...editFormData }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      setEditingCourse(null);
      fetchCourses(); // Refresh the course list
    } catch (err) {
      setError(err.message);
      console.error('Failed to update course:', err);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/courses?id=${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      fetchCourses(); // Refresh the course list
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete course:', err);
    }
  };

  const handleViewClick = async (courseId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setSelectedCourse(data);
      setShowViewModal(true);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCourse(null);
  };

  const handleCreateCourse = async (courseData) => {
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      setIsCreateCourseModalOpen(false);
      fetchCourses(); // Refresh the course list
    } catch (err) {
      setError(err.message);
      console.error('Failed to create course:', err);
    }
  };

  const filteredCourses = courses.filter(course => {
    const subject = course.subject || '';
    const section = course.section || '';
    const createdBy = course.createdBy?.name || '';
    return (
      subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="py-8 text-center">Loading courses...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="mb-6 text-3xl font-bold">Course Management</h1>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">All Courses</h2>
          <button
            onClick={() => setIsCreateCourseModalOpen(true)}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            Create Course
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left border-b">Course Name</th>
                <th className="px-4 py-2 text-left border-b">Course Description</th>
                <th className="px-4 py-2 text-left border-b">Created By</th>
                <th className="px-4 py-2 text-left border-b">Students Joined</th>
                <th className="px-4 py-2 text-left border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course._id}>
                  {editingCourse === course._id ? (
                    <>
                      <td className="px-4 py-2 border-b">
                        <input
                          type="text"
                          name="subject"
                          value={editFormData.subject}
                          onChange={handleEditFormChange}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-2 border-b">
                        <textarea
                          name="section"
                          value={editFormData.section}
                          onChange={handleEditFormChange}
                          className="w-full p-1 border rounded"
                          rows="3"
                        ></textarea>
                      </td>
                      <td className="px-4 py-2 border-b">
                        <input
                          type="text"
                          name="teacherName"
                          value={editFormData.teacherName}
                          onChange={handleEditFormChange}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-2 border-b">
                        <input
                          type="text"
                          name="coverColor"
                          value={editFormData.coverColor}
                          onChange={handleEditFormChange}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-2 border-b">
                        <input
                          type="text"
                          name="uniqueKey"
                          value={editFormData.uniqueKey}
                          onChange={handleEditFormChange}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-2 border-b">
                        {selectedCourse?.enrolledUsers?.length || 0} Students
                      </td>
                      <td className="px-4 py-2 border-b">
                        <button
                          onClick={() => handleSaveEdit(course._id)}
                          className="px-2 py-1 mr-2 text-xs font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCourse(null)}
                          className="px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 border-b">{course.subject}</td>
                      <td className="px-4 py-2 border-b">{course.section}</td>
                      <td className="px-4 py-2 border-b">
                        {course.createdBy?.name} ({course.createdBy?.email}, {course.createdBy?.role})
                      </td>
                      <td className="px-4 py-2 border-b">
                        {course.enrolledUsersCount} Students
                      </td>
                      <td className="px-4 py-2 border-b">
                        <button
                          onClick={() => handleViewClick(course._id)}
                          className="mr-2 text-green-500 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditClick(course)}
                          className="mr-2 text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCreateCourse={handleCreateCourse}
        adminName={adminName}
      />

      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-2xl font-bold">Course Details: {selectedCourse.subject}</h3>
            <p><strong>Course Name:</strong> {selectedCourse.subject}</p>
            <p><strong>Course Description:</strong> {selectedCourse.section}</p>
            <p><strong>Date Created:</strong> {new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
            <p><strong>Created By:</strong> {selectedCourse.createdBy?.name} ({selectedCourse.createdBy?.email}, {selectedCourse.createdBy?.role})</p>
            <p><strong>Teacher Name:</strong> {selectedCourse.teacherName}</p>
            <p><strong>Unique Key:</strong> {selectedCourse.uniqueKey}</p>
            <p><strong>Students Joined:</strong> {selectedCourse.enrolledUsers ? selectedCourse.enrolledUsers.length : 0}</p>
            <h4 className="mt-4 mb-2 text-xl font-semibold">Enrolled Members:</h4>
            {selectedCourse.enrolledUsers && selectedCourse.enrolledUsers.length > 0 ? (
              <ul>
                {selectedCourse.enrolledUsers.map(user => (
                  <li key={user._id} className="ml-4 list-disc">
                    {user.name} ({user.email}, {user.role})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ml-4">No students enrolled yet.</p>
            )}
            {/* TODO: Add activity logs */}
            <button
              onClick={handleCloseViewModal}
              className="px-4 py-2 mt-6 text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}