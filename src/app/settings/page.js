'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const settingsSections = [
    {
      title: 'Core Principles',
      icon: '🏛️',
      custom: true,
      items: [
        { label: 'Personalization', value: 'Tailored content for your learning style.' },
        { label: 'Engagement', value: 'Interactive and motivating materials.' },
        { label: 'Professionalism', value: 'High academic standards, friendly tone.' },
        { label: 'Consistency', value: 'Structured lessons and assessments.' },
      ],
    },
    {
      title: 'Learning Settings',
      icon: '🎓',
      items: [
        { label: 'Difficulty Level', value: 'Intermediate' },
        { label: 'Learning Style Support', value: 'All four styles' },
        { label: 'Pace', value: 'Standardized' },
        { label: 'Content Examples', value: 'General academic' },
      ],
    },
    {
      title: 'Notifications & Engagement',
      icon: '🔔',
      items: [
        { label: 'Study Reminders', value: 'Daily at 6 PM, Weekly on Fridays' },
        { label: 'Motivation Triggers', value: 'Quotes and badges' },
      ],
    },
    {
      title: 'Interface Preferences',
      icon: '🎨',
      items: [
        { label: 'Theme', value: 'Light mode with blue accents' },
        { label: 'Layout', value: 'Card-based, minimal' },
        { label: 'Typography', value: 'Sans-serif, medium' },
        { label: 'Accessibility', value: 'Always enabled' },
      ],
    },
    {
      title: 'Performance & Analytics',
      icon: '📊',
      items: [
        { label: 'Progress Tracking', value: 'Dashboard with charts' },
        { label: 'Analytics', value: 'Lesson completion and scores' },
        { label: 'Goal Setting', value: 'Static goal at onboarding' },
        { label: 'Reflection', value: 'Weekly journal prompt' },
      ],
    },
    {
      title: 'Collaboration & Social Learning',
      icon: '👥',
      items: [
        { label: 'Study Groups', value: 'Assigned groups of 5' },
        { label: 'Discussion Forums', value: 'Open access with AI moderation' },
        { label: 'Peer Review', value: '2 reviews per assignment' },
        { label: 'Mentorship', value: 'Randomly assigned mentor' },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: '🔒',
      items: [
        { label: 'Compliance', value: 'GDPR/COPPA compliant' },
        { label: 'Screen Time Reminders', value: 'Every 45 minutes' },
        { label: 'Parent Reports', value: 'Optional monthly emails' },
      ],
    },
    {
      title: 'AI Behavior Guidelines',
      icon: '🤖',
      items: [
        { label: 'Tone', value: 'Professional, friendly, supportive' },
        { label: 'Instruction Style', value: 'Explanation, example, practice' },
        { label: 'Assessment', value: 'Immediate feedback' },
        { label: 'Perspective', value: 'Real-world connections' },
      ],
    },
    {
      title: 'Implementation Instructions',
      icon: '⚙️',
      items: [
        { label: 'Onboarding', value: '5 static survey questions' },
        { label: 'Baseline Assessment', value: '10-question diagnostic quiz' },
        { label: 'Profile Creation', value: 'Store survey/quiz results' },
        { label: 'Calibration', value: 'No ongoing calibration' },
      ],
    },
    {
      title: 'Success Metrics',
      icon: '📈',
      items: [
        { label: 'Completion Rate', value: 'Lesson completion rate' },
        { label: 'Performance', value: 'Quiz performance averages' },
        { label: 'Engagement', value: 'Discussion posts per student' },
        { label: 'Satisfaction', value: 'Self-reported satisfaction survey' },
      ],
    },
    {
      title: 'Emergency Protocols',
      icon: '⚠️',
      items: [
        { label: 'Academic Distress', value: 'Suggest help articles' },
        { label: 'Technical Issues', value: 'Provide troubleshooting FAQ' },
        { label: 'Wellbeing Concerns', value: 'Display wellbeing resources' },
        { label: 'Accessibility', value: 'Alt text and captions' },
      ],
    },
  ];

  const filteredSections = settingsSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.items.some(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-lg text-gray-600 mt-2">Customize your learning experience</p>
        <div className="mt-6">
          <input
            type="text"
            placeholder="Search settings..."
            className="w-full max-w-md p-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSections.map((section) => (
          section.custom ? (
            <section key={section.title} className="md:col-span-2 lg:col-span-3 mb-4 p-8 bg-gray-50 rounded-2xl shadow-md">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                {section.items.map(item => (
                  <div key={item.label} className="p-6 bg-white rounded-xl shadow-sm">
                    <strong className="text-lg text-blue-600">{item.label}</strong>
                    <p className="text-gray-600 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section key={section.title} className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-3 text-2xl">{section.icon}</span>
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item.label} className="flex justify-between">
                    <strong className="text-gray-600">{item.label}:</strong>
                    <span className="text-gray-800 text-right">{item.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        ))}
      </div>
    </div>
  );
}