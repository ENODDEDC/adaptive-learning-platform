'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;
  const certificateRef = useRef(null);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCertificate();
    }
  }, [courseId]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-courses/${courseId}/certificate`);
      const data = await response.json();

      if (response.ok) {
        setCertificate(data.certificate);
      } else {
        setError(data.message || 'Failed to fetch certificate');
      }
    } catch (err) {
      setError('Failed to fetch certificate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // For now, just print the certificate
    // In production, you'd generate a PDF
    window.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 hours';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-4">{error || 'Certificate not available'}</p>
            <Link
              href="/learn/my-courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to My Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/learn/my-courses"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to My Courses
          </Link>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download Certificate
          </button>
        </div>

        {/* Success Message */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 print:hidden">
          <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Congratulations!</p>
            <p className="text-sm text-green-700">You have successfully completed this course.</p>
          </div>
        </div>

        {/* Certificate */}
        <div 
          ref={certificateRef}
          className="bg-white rounded-lg border-4 border-blue-600 p-12 shadow-lg print:border-8 print:shadow-none"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full mb-4">
              <CheckCircleIcon className="w-8 h-8 inline-block" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Certificate of Completion
            </h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          {/* Body */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-6">
              This is to certify that
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block px-8">
              {certificate.studentName}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              has successfully completed the course
            </p>
            <h3 className="text-2xl font-semibold text-blue-600 mb-8">
              {certificate.courseName}
            </h3>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Instructor</p>
              <p className="font-semibold text-gray-900">{certificate.instructorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Date</p>
              <p className="font-semibold text-gray-900">{formatDate(certificate.completionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-semibold text-gray-900">{certificate.courseCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-semibold text-gray-900">{formatDuration(certificate.courseDuration)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Certificate ID: {certificate.certificateId}</p>
            <p className="text-xs text-gray-400">
              This certificate verifies that the above-named individual has completed the course requirements.
            </p>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-8 {
              border-width: 8px;
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
