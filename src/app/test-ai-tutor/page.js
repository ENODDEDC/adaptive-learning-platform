'use client';

import React, { useState } from 'react';
import AITutorModal from '@/components/AITutorModal';

const TestAITutorPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [testContent, setTestContent] = useState('');

  // Sample DOCX content for testing
  const sampleContent = `
Introduction to Machine Learning

Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

Key Concepts:
1. Supervised Learning - Learning with labeled examples
2. Unsupervised Learning - Finding patterns in data without labels
3. Reinforcement Learning - Learning through trial and error

Applications:
- Image recognition
- Natural language processing
- Recommendation systems
- Autonomous vehicles

The process of machine learning involves training algorithms on data to make predictions or decisions without being explicitly programmed to perform the task.
  `.trim();

  const handleTestAITutor = () => {
    setTestContent(sampleContent);
    setShowModal(true);
  };

  const handleCustomContent = () => {
    if (testContent.trim()) {
      setShowModal(true);
    } else {
      alert('Please enter some content to test with');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Narrator Test Page</h1>
          
          <div className="space-y-6">
            {/* Quick Test Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Test</h2>
              <p className="text-blue-700 mb-4">
                Test the AI narrator with sample content about Machine Learning.
              </p>
              <button
                onClick={handleTestAITutor}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Test AI Narrator with Sample Content
              </button>
            </div>

            {/* Custom Content Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">Custom Content Test</h2>
              <p className="text-green-700 mb-4">
                Enter your own content to test the AI narrator functionality.
              </p>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Enter document content here..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCustomContent}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Test AI Narrator with Custom Content
                </button>
                <button
                  onClick={() => setTestContent(sampleContent)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Load Sample Content
                </button>
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">AI Narrator Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">📚 Tutorial Generation</h3>
                  <p className="text-purple-700 text-sm">
                    AI generates comprehensive tutorials in Taglish (English + Tagalog) with cultural context.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">🎯 Interactive Quiz</h3>
                  <p className="text-purple-700 text-sm">
                    Auto-generated questions with explanations to test understanding.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">📝 Smart Summary</h3>
                  <p className="text-purple-700 text-sm">
                    Concise summaries highlighting key points in student-friendly language.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">🔊 Text-to-Speech</h3>
                  <p className="text-purple-700 text-sm">
                    AI-generated audio using Google's advanced TTS with Filipino-friendly voices.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">How to Use in Courses</h2>
              <ol className="list-decimal list-inside space-y-2 text-yellow-800">
                <li>Go to any course and click on the "Activities" tab</li>
                <li>Find a DOCX file in the classwork cards</li>
                <li>Look for the purple "AI Narrator" button on the DOCX thumbnail</li>
                <li>Click the AI Narrator button to extract content and start learning</li>
                <li>Explore the Tutorial, Quiz, Summary, and Study Tips tabs</li>
                <li>Use the "Listen" button to hear AI-generated audio in Taglish</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* AI Narrator Modal */}
      <AITutorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        docxContent={testContent}
        fileName="Test Document.docx"
      />
    </div>
  );
};

export default TestAITutorPage;