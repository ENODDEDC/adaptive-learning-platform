'use client';

import React, { useState } from 'react';
import VisualContentModal from '@/components/VisualContentModal';

const TestVisualContent = () => {
  const [showModal, setShowModal] = useState(false);
  const [testContent, setTestContent] = useState(`
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

## Key Concepts

### 1. Supervised Learning
Supervised learning is a type of machine learning where the algorithm learns from labeled training data. The goal is to learn a mapping from inputs to outputs.

Examples include:
- Linear regression
- Decision trees
- Support vector machines
- Neural networks

### 2. Unsupervised Learning
Unsupervised learning involves finding hidden patterns in data without labeled examples. The algorithm tries to identify structure in the data.

Examples include:
- Clustering algorithms
- Dimensionality reduction
- Association rules

### 3. Reinforcement Learning
Reinforcement learning is a type of machine learning where an agent learns to make decisions by taking actions in an environment to maximize cumulative reward.

## Process Steps

1. Data Collection
2. Data Preprocessing
3. Model Selection
4. Training
5. Evaluation
6. Deployment

## Applications

Machine learning is used in various fields:
- Healthcare (medical diagnosis)
- Finance (fraud detection)
- Technology (recommendation systems)
- Transportation (autonomous vehicles)
`);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Visual Content Generation Test
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test Document Content
            </h2>
            <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {testContent}
              </pre>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate Visual Content
            </button>
            
            <button
              onClick={() => setTestContent('')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Content
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Generate Visual Content" to open the visual content modal</li>
              <li>• Each visual is generated using AI based on the document content above</li>
              <li>• You can download individual images or regenerate them</li>
              <li>• The system uses Google's Gemini Flash Lite model for content analysis and Gemini 2.5 Flash Image for visual generation</li>
            </ul>
          </div>
        </div>
      </div>

      <VisualContentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        docxContent={testContent}
        fileName="test-document.md"
      />
    </div>
  );
};

export default TestVisualContent;
