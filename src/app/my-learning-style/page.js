'use client';

import LearningStyleDashboard from '@/components/LearningStyleDashboard';

export default function MyLearningStylePage() {
  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LearningStyleDashboard />
      </div>
    </div>
  );
}
