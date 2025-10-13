'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';
import CreateUserModal from '@/components/CreateUserModal';

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    surname: '',
    email: '',
    role: '',
  });
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [adminRole, setAdminRole] = useState('');
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // No need to get token from localStorage, cookie will be sent automatically
      // const token = localStorage.getItem('adminToken');
      // if (!token) {
      //   router.push('/admin/login');
      //   return;
      // }
      // const decodedToken = jwt.decode(token); // jwt.decode is client-side safe
      // if (decodedToken && decodedToken.role) {
      //   setAdminRole(decodedToken.role);
      // }

      // Fetch admin role from a secure endpoint if needed, or rely on middleware for auth
      // For now, we'll assume the user is authenticated if they reach here,
      // and the role can be fetched from /api/admin/profile if needed for client-side logic.
      // For setting adminRole, we can make a separate call to /api/admin/profile
      // or pass it from a server component if this page was a server component.
      // For now, we'll remove the client-side token decoding.

      const res = await fetch('/api/admin/users'); // Cookie will be sent automatically

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
    });
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (userId) => {
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, ...editFormData }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      setEditingUser(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.message);
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      await res.json();
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete user:', err);
    }
  };

  const handleCreateUser = async (userData) => {
  setError('');
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      let errorMsg = `Error: ${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data?.message) errorMsg = data.message;
      } catch {
        // response was not JSON
      }

      throw new Error(errorMsg);
    }

    await res.json();
    setIsCreateUserModalOpen(false);
    fetchUsers(); // Refresh the user list
  } catch (err) {
    setError(err.message);
    console.error('Failed to create user:', err);
  }
};


  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="py-8 text-center">Loading users...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage user accounts, roles, and permissions across the platform.
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="flex items-center px-6 py-3 space-x-2 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Instructors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'instructor').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin' || u.role === 'super admin').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full py-3 pl-10 pr-3 leading-5 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select className="px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>All Roles</option>
                <option>Student</option>
                <option>Instructor</option>
                <option>Admin</option>
                <option>Super Admin</option>
              </select>
              <button className="px-4 py-3 text-gray-700 transition-colors duration-200 bg-gray-100 rounded-lg hover:bg-gray-200">
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="transition-colors duration-200 hover:bg-gray-50">
                    {editingUser === user._id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-400">
                                <span className="text-sm font-medium text-white">
                                  {editFormData.name.charAt(0)}{editFormData.surname.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditFormChange}
                                className="block w-32 text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                placeholder="First name"
                              />
                              <input
                                type="text"
                                name="surname"
                                value={editFormData.surname}
                                onChange={handleEditFormChange}
                                className="block w-32 mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Last name"
                              />
                              <input
                                type="email"
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditFormChange}
                                className="block w-48 mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Email"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            name="role"
                            value={editFormData.role}
                            onChange={handleEditFormChange}
                            className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                            {adminRole === 'super admin' && (
                              <option value="super admin">Super Admin</option>
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Just now
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <button
                            onClick={() => handleSaveEdit(user._id)}
                            className="px-3 py-1 mr-2 text-xs font-bold text-white transition-colors duration-200 bg-green-500 rounded-lg hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-3 py-1 text-xs font-bold text-white transition-colors duration-200 bg-gray-500 rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-400">
                                <span className="text-sm font-medium text-white">
                                  {user.name.charAt(0)}{user.surname.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name} {user.surname}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'instructor' ? 'bg-green-100 text-green-800' :
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          Just now
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 text-blue-600 transition-all duration-200 rounded-lg hover:text-blue-900 hover:bg-blue-50"
                              title="Edit user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-2 text-red-600 transition-all duration-200 rounded-lg hover:text-red-900 hover:bg-red-50"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onCreateUser={handleCreateUser}
          adminRole={adminRole}
        />
      )}
    </>
  );
}