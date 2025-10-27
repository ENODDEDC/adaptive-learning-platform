'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Terms & Conditions
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-white/80 text-sm">
          <p className="text-white/60 mb-6">Last Updated: October 27, 2025</p>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">1. Introduction</h3>
            <p className="leading-relaxed mb-3">
              Welcome to Intelevo, an AI-powered adaptive learning management system designed to meet the demands of a fast-changing, information-driven society. By accessing or using Intelevo, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our Platform.
            </p>
            <p className="leading-relaxed mb-3">
              Intelevo fosters an environment that cultivates engagement and learner achievement, enabling learners to register for classes, track their progress, and stay updated on course announcements. The platform adapts course materials to your specific learning style using the Felder-Silverman Learning Style Model (FSLSM) and supervised machine learning (XGBoost algorithm) to provide personalized educational experiences that make learning more active and interactive.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">2. User Accounts</h3>
            <p className="leading-relaxed mb-2">You must:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Provide accurate, complete, and current information</li>
              <li>Be at least 13 years old (users under 18 should have parental consent)</li>
              <li>Maintain confidentiality of your account credentials</li>
              <li>Notify us immediately of unauthorized access</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">3. Platform Services</h3>
            <p className="leading-relaxed mb-2">Intelevo provides:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Core LMS Functionalities:</strong> Course management, learning content management, learning objects, course registration, progress tracking, and announcements</li>
              <li><strong>Adaptive Learning:</strong> Content automatically adapts to your learning style based on the Felder-Silverman Learning Style Model (FSLSM) dimensions (Active/Reflective, Sensing/Intuitive, Visual/Verbal, Sequential/Global)</li>
              <li><strong>Learning Style Classification:</strong> Supervised machine learning (XGBoost algorithm) analyzes your behavioral data to identify your unique learning preferences and cognitive differences</li>
              <li><strong>Rule-Based Initial Labeling:</strong> System generates initial labels by mapping behaviors (time spent on videos, replay counts, forum participation) to train the machine learning model</li>
              <li><strong>Content Personalization:</strong> Lessons are automatically reformatted to match different learning styles, providing individualized learning experiences</li>
              <li><strong>Content Generation:</strong> AI creates quizzes, practice questions, and activities based on uploaded lessons</li>
              <li><strong>Multimedia Materials:</strong> Single content pieces converted into various formats including text, audio narration, visual diagrams, and interactive activities</li>
              <li><strong>Document Processing:</strong> Upload and view PDF, DOCX, and PPTX files</li>
              <li><strong>Monitoring & Management:</strong> Facilitators can oversee and manage student activities</li>
              <li><strong>Performance Feedback:</strong> System delivers feedback on student performance to support learning progress and engagement</li>
              <li><strong>Security & Data Privacy:</strong> Strict data privacy and security measures to protect student information</li>
              <li><strong>Administrative Controls:</strong> Tools for managing users, courses, system settings, and monitoring platform health and usage</li>
              <li><strong>Cloud Storage:</strong> Backblaze B2 for learning materials, Firebase for authentication and profile photos</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">4. Prohibited Activities</h3>
            <p className="leading-relaxed mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Upload illegal, harmful, or objectionable content</li>
              <li>Violate intellectual property rights</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Interfere with or disrupt the Platform</li>
              <li>Use automated systems without permission</li>
              <li>Share course content without authorization</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">5. Intellectual Property</h3>
            <p className="leading-relaxed mb-3">
              All Platform content is owned by Intelevo and protected by intellectual property laws. You retain ownership of content you upload but grant us a license to use it to provide our services.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">6. Privacy & Data</h3>
            <p className="leading-relaxed mb-3">
              Your privacy is governed by our Privacy Policy. We collect behavioral data (time spent on videos, replay counts, forum participation, etc.) to train our machine learning model and classify your learning style. This enables the platform to adapt content to your preferences. You can control data settings in your account preferences.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">7. Third-Party Services & Technology Stack</h3>
            <p className="leading-relaxed mb-2">Intelevo is built using the following technologies and services:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Next.js:</strong> Full-stack web application framework with React features and Rust-based JavaScript tooling</li>
              <li><strong>MongoDB:</strong> Database for managing user data, courses, and platform information with intuitive document model</li>
              <li><strong>Firebase:</strong> Authentication services supporting multiple credentials and federated identity providers (Google, Facebook, Twitter)</li>
              <li><strong>Backblaze B2:</strong> Cloud-based storage for learning materials uploaded to the system</li>
              <li><strong>Tailwind CSS:</strong> Utility-first CSS framework for rapid UI development</li>
              <li><strong>Jupyter Notebook:</strong> Provides visualization for graphics, charts, and graphs</li>
              <li><strong>Render.com:</strong> Cloud platform for deploying and hosting the application with automatic deployments and scalability</li>
              <li><strong>Gemini AI:</strong> AI model for providing intelligent features and personalized feedback</li>
              <li><strong>Git:</strong> Version control for collaborative development and code management</li>
              <li><strong>XGBoost:</strong> Main machine learning component for determining student learning styles</li>
            </ul>
            <p className="leading-relaxed mt-3 text-white/70 text-xs">
              Your use of these third-party services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">8. Disclaimers & System Limitations</h3>
            <p className="leading-relaxed mb-3">
              The Platform is provided "AS IS" without warranties. We don't guarantee uninterrupted or error-free service. AI-generated content and learning style classifications should be verified independently. We're not liable for indirect, incidental, or consequential damages.
            </p>
            <p className="leading-relaxed mb-2"><strong>System Limitations:</strong></p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Initial Adaptability:</strong> Newly registered students initially see a default view of lectures because the system has no prior data on their learning style. AI-driven content suggestions are unavailable at this stage, and any personalization must be done manually.</li>
              <li><strong>AI Assistance:</strong> AI-generated content does not provide direct answers to assigned activities. Students must engage with material independently.</li>
              <li><strong>Cookie Limitations:</strong> Cookies are inherently unstable as they can be deleted, blocked, or disabled by users, and do not persist across devices or browsers. This leads to inconsistencies in engagement data and may affect learning style prediction accuracy.</li>
              <li><strong>Machine Learning Model:</strong> The XGBoost model requires sufficient labeled training data; predictions may be inaccurate if the dataset is small or unbalanced.</li>
              <li><strong>Dataset Compatibility:</strong> Acquired datasets used to train the machine learning algorithm may not be entirely compatible with all features present within the system.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">9. Termination</h3>
            <p className="leading-relaxed mb-3">
              We may suspend or terminate your account for violations. You may terminate your account anytime. Upon termination, we'll delete or anonymize your data per our Privacy Policy.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">10. Changes to Terms</h3>
            <p className="leading-relaxed mb-3">
              We may modify these Terms at any time. Continued use after changes constitutes acceptance. Review these Terms periodically.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">11. Contact</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="font-medium text-white">Intelevo Support</p>
              <p>Email: support@intelevo.com</p>
              <p>Website: https://intelevo.onrender.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all duration-300"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
