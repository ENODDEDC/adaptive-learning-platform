'use client';

import { useState } from 'react';

// Mock user data
const users = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'student' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'instructor' },
  { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin-specific layout would go here (e.g., sidebar, navbar) */}
      <div className="p-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        {/* User Management Section */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-2xl font-semibold">User Management</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Role</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-2 border-b">{user.name}</td>
                  <td className="px-4 py-2 border-b">{user.email}</td>
                  <td className="px-4 py-2 border-b">{user.role}</td>
                  <td className="px-4 py-2 border-b">
                    <button className="mr-2 text-blue-500 hover:underline">Edit</button>
                    <button className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}