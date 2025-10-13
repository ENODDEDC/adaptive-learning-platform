'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const [adminData, setAdminData] = useState({
    name: '',
    surname: '',
    email: '',
    photoURL: null,
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAdminProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/profile', {
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
      setAdminData({
        name: data.name,
        surname: data.surname,
        email: data.email,
        photoURL: data.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      });
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch admin profile:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  const handleProfileChange = (e) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: adminData.name, surname: adminData.surname, email: adminData.email }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setSuccess('Profile updated successfully!');
      fetchAdminProfile();
    } catch (err) {
      setError(err.message);
      console.error('Failed to update profile:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
      console.error('Failed to update password:', err);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/profile/photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
        }
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setAdminData((prevData) => ({ ...prevData, photoURL: data.photoURL }));
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Failed to upload profile picture:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
          Admin Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Profile Information */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="name">
                First Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={adminData.name}
                onChange={handleProfileChange}
                className="block w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="surname">
                Last Name
              </label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={adminData.surname}
                onChange={handleProfileChange}
                className="block w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={adminData.email}
                onChange={handleProfileChange}
                className="block w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl"
            >
              Update Profile
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Profile Picture */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Profile Picture</h2>
          </div>

          <div className="flex items-center mb-6">
            <div className="relative">
              <Image
                className="object-cover w-24 h-24 rounded-full ring-4 ring-gray-100"
                src={adminData.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                alt="Admin Profile"
                width={96}
                height={96}
              />
              <div className="absolute flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full -bottom-1 -right-1 ring-2 ring-white">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className="ml-6">
              <label htmlFor="profile-picture-upload" className="inline-flex items-center px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Upload New Picture
              </label>
              <input
                id="profile-picture-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureChange}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="mb-2 text-sm font-medium text-gray-900">Upload Guidelines</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Maximum file size: 5MB</li>
              <li>• Supported formats: JPG, PNG, GIF</li>
              <li>• Recommended size: 400x400px or larger</li>
              <li>• Image will be automatically cropped to square</li>
            </ul>
          </div>
        </div>

        {/* System Preferences */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">System Preferences</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications about system updates</p>
              </div>
              <button className="relative inline-flex items-center h-6 transition-colors duration-200 bg-purple-600 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <span className="inline-block w-4 h-4 transition-transform duration-200 transform translate-x-6 bg-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-600">Toggle between light and dark themes</p>
              </div>
              <button className="relative inline-flex items-center h-6 transition-colors duration-200 bg-gray-200 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <span className="inline-block w-4 h-4 transition-transform duration-200 transform translate-x-1 bg-white rounded-full"></span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Auto-save</p>
                <p className="text-sm text-gray-600">Automatically save changes as you type</p>
              </div>
              <button className="relative inline-flex items-center h-6 transition-colors duration-200 bg-purple-600 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <span className="inline-block w-4 h-4 transition-transform duration-200 transform translate-x-6 bg-white rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}