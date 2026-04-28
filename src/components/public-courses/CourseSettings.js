'use client';

import { useState } from 'react';

const CATEGORIES = ['Programming', 'Design', 'Business', 'Marketing', 'Personal Development', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COLORS = [
  '#60a5fa', '#a78bfa', '#f472b6', '#34d399',
  '#fb923c', '#f87171', '#2dd4bf', '#818cf8'
];

export default function CourseSettings({ course, onUpdate }) {
  const [formData, setFormData] = useState({
    title: course.title || '',
    description: course.description || '',
    category: course.category || 'Programming',
    level: course.level || 'Beginner',
    coverColor: course.coverColor || '#60a5fa',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const response = await fetch(`/api/public-courses/${course._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Settings saved successfully');
        await onUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch (err) {
      setMessage('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this course?')) return;

    try {
      const response = await fetch(`/api/public-courses/${course._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/public-courses';
      } else {
        alert(data.message || 'Failed to archive course');
      }
    } catch (err) {
      alert('Failed to archive course');
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Settings</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Color
            </label>
            <div className="flex gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, coverColor: color })}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    formData.coverColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <button
            onClick={handleArchive}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Archive Course
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Archived courses are hidden from students but can be restored later.
          </p>
        </div>
      </div>
    </div>
  );
}
