'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Privacy Policy
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
              At Intelevo, we're committed to protecting your privacy and securing your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered adaptive learning management system.
            </p>
            <p className="leading-relaxed mb-3">
              Intelevo is designed to meet the demands of a fast-changing, information-driven society by integrating technological tools that support flexible, individualized, and accessible learning. Our platform uses supervised machine learning (XGBoost algorithm) and the Felder-Silverman Learning Style Model (FSLSM) to classify and adapt course materials to your individual learning preferences, making learning more active and interactive.
            </p>
            <p className="leading-relaxed mb-3">
              The system employs a rule-based algorithm to generate initial labels by mapping your behaviors (such as time spent on videos, replay counts, and forum participation) into preliminary categories. These labels serve as a starting point for training the machine learning model, which then learns more accurate patterns from the data to provide personalized learning experiences.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h3>
            
            <h4 className="font-semibold text-white/90 mb-2">Personal Information:</h4>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Name, email, password (encrypted)</li>
              <li>Profile photo, bio, learning preferences</li>
              <li>Authentication data and session tokens</li>
            </ul>

            <h4 className="font-semibold text-white/90 mb-2">Educational Data:</h4>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Course enrollment, progress, and completion</li>
              <li>Learning activity and time spent</li>
              <li>AI interactions and generated content</li>
              <li>Assignments, submissions, and feedback</li>
              <li>Performance metrics and learning patterns</li>
            </ul>

            <h4 className="font-semibold text-white/90 mb-2">User Content:</h4>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Uploaded documents (PDF, DOCX, PPTX)</li>
              <li>Notes, annotations, and highlights</li>
              <li>Discussion posts and comments</li>
              <li>Reflections and self-assessments</li>
            </ul>

            <h4 className="font-semibold text-white/90 mb-2">Technical & Behavioral Information:</h4>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Device type, OS, browser</li>
              <li>IP address, access times, pages viewed</li>
              <li>Cookies and tracking data (time spent on videos, replay counts, forum participation)</li>
              <li>Error logs and performance data</li>
              <li>Learning behavior patterns for style classification</li>
            </ul>
            <p className="text-yellow-400/80 text-xs mt-2 ml-4">
              <strong>Note:</strong> Cookies are inherently unstable as they can be deleted, blocked, or disabled by users, and do not persist across devices or browsers. This may lead to inconsistencies in engagement data and affect the accuracy of learning style predictions.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Platform Services:</strong> Account management, course registration, progress tracking, course announcements, document processing, monitoring and managing student activities</li>
              <li><strong>AI & Personalization:</strong> Train XGBoost classification model, personalize content based on FSLSM dimensions (Active/Reflective, Sensing/Intuitive, Visual/Verbal, Sequential/Global), generate adaptive learning materials</li>
              <li><strong>Learning Style Classification:</strong> Analyze behavioral data to classify learning preferences across FSLSM dimensions and adapt course materials to individual needs and cognitive differences</li>
              <li><strong>Content Adaptation:</strong> Automatically reformat lessons to match different learning styles, convert content into various formats (text, audio, visual diagrams, interactive activities)</li>
              <li><strong>Performance Feedback:</strong> Deliver feedback on student performance to support learning progress and engagement</li>
              <li><strong>Communication:</strong> Account verification, course updates, announcements, support responses</li>
              <li><strong>Improvement:</strong> Analyze usage, develop features, fix bugs, enhance security</li>
              <li><strong>Legal:</strong> Comply with obligations, enforce Terms, protect rights</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">4. Data Storage & Security</h3>
            <p className="leading-relaxed mb-2">Your data is stored using:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>MongoDB:</strong> User accounts, course data, and platform information</li>
              <li><strong>Backblaze B2:</strong> Cloud-based storage for learning materials and documents</li>
              <li><strong>Firebase:</strong> Authentication and profile photo storage</li>
              <li><strong>Render.com:</strong> Platform hosting and deployment</li>
            </ul>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Secure password hashing and JWT tokens</li>
              <li>Role-based access controls</li>
              <li>Continuous security monitoring</li>
              <li>Regular backups and audits</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">5. Information Sharing</h3>
            <p className="leading-relaxed mb-3">
              <strong>We do NOT sell your data.</strong> We share information only with:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Service Providers:</strong> Google AI, Firebase, Backblaze B2, MongoDB</li>
              <li><strong>Educational Institutions:</strong> If you access through an institution</li>
              <li><strong>Legal Requirements:</strong> When required by law</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">6. Your Privacy Rights</h3>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>Access & Update:</strong> View and modify your information anytime</li>
              <li><strong>Data Portability:</strong> Request a copy of your data</li>
              <li><strong>Deletion:</strong> Request account and data deletion</li>
              <li><strong>Privacy Settings:</strong> Control profile visibility, progress sharing, analytics</li>
              <li><strong>Cookie Preferences:</strong> Manage cookies through browser settings</li>
              <li><strong>Marketing:</strong> Opt out of marketing emails anytime</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">7. Children's Privacy</h3>
            <p className="leading-relaxed mb-3">
              Intelevo is for users 13+. We don't knowingly collect data from children under 13 without parental consent. Users 13-18 should have parental/guardian consent.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">8. AI & Automated Decisions</h3>
            <p className="leading-relaxed mb-3">
              Our AI analyzes learning patterns, generates content, and personalizes experiences based on your learning style. The system uses XGBoost supervised machine learning to classify your preferences according to the Felder-Silverman Learning Style Model. Important decisions (grades, certifications) aren't made solely by AI. You can control AI features in privacy settings.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Initial Adaptability:</strong> Newly registered students initially see a default view of lectures because the system has no prior data on their learning style. AI-driven content suggestions become available as the system collects sufficient behavioral data.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>AI Assistance Limitations:</strong> AI-generated content provides learning support but does not provide direct answers to assigned activities. Students are expected to engage with the material and complete assignments independently.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">9. Data Retention & Limitations</h3>
            <p className="leading-relaxed mb-3">
              We retain data while your account is active. After deletion, personal data is removed within 90 days, except where legally required. Anonymized data may be retained for research and model improvement.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Machine Learning Limitations:</strong> The XGBoost model requires sufficient labeled training data for accurate predictions. Predictions may be inaccurate if the dataset is small or unbalanced. The acquired datasets used to train the algorithm may not be entirely compatible with all features present within the system.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">10. Changes to Policy</h3>
            <p className="leading-relaxed mb-3">
              We may update this Privacy Policy. We'll notify you of material changes via email or platform notice. Continued use constitutes acceptance.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">11. Contact Us</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="font-medium text-white">Intelevo Privacy Team</p>
              <p>Email: privacy@intelevo.com</p>
              <p>Support: support@intelevo.com</p>
              <p>Website: https://intelevo.onrender.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-xl font-semibold transition-all duration-300"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
