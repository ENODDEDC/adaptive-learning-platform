'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function LearningStyleDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, statusRes] = await Promise.all([
        fetch('/api/learning-style/profile'),
        fetch('/api/learning-style/classify')
      ]);

      const profileData = await profileRes.json();
      const statusData = await statusRes.json();

      setProfile(profileData.data);
      setStatus(statusData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerClassification = async () => {
    setClassifying(true);
    try {
      const response = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error classifying:', error);
    } finally {
      setClassifying(false);
    }
  };

  const getDimensionLabel = (dimension, score) => {
    const labels = {
      activeReflective: score > 0 ? 'Active' : score < 0 ? 'Reflective' : 'Balanced',
      sensingIntuitive: score > 0 ? 'Sensing' : score < 0 ? 'Intuitive' : 'Balanced',
      visualVerbal: score > 0 ? 'Visual' : score < 0 ? 'Verbal' : 'Balanced',
      sequentialGlobal: score > 0 ? 'Sequential' : score < 0 ? 'Global' : 'Balanced'
    };
    return labels[dimension];
  };

  const getStrengthLabel = (score) => {
    const abs = Math.abs(score);
    if (abs <= 1) return 'Balanced';
    if (abs <= 3) return 'Mild';
    if (abs <= 5) return 'Moderate';
    if (abs <= 7) return 'Strong';
    return 'Very Strong';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasProfile = profile?.hasProfile;
  const needsClassification = !hasProfile || profile?.needsUpdate;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Learning Style Profile</h2>
            <p className="text-blue-100">
              {hasProfile 
                ? `Dominant Style: ${profile.profile.dominantStyle}`
                : 'Discover your personalized learning preferences'}
            </p>
          </div>
          <SparklesIcon className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* Status Card */}
      {status && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification Status</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Interactions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{status.totalInteractions}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClockIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Learning Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(status.totalLearningTime / 1000 / 60).toFixed(0)}m
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Completeness</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {status.dataQuality?.completeness || 0}%
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">ML Ready</span>
              </div>
              <p className={`text-2xl font-bold ${status.readyForClassification ? 'text-green-600' : 'text-orange-600'}`}>
                {status.readyForClassification ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {needsClassification && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{status.message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={triggerClassification}
                  disabled={classifying || !status.readyForClassification}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {classifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Classifying...
                    </span>
                  ) : (
                    'Classify My Learning Style'
                  )}
                </button>
                
                <button
                  onClick={() => router.push('/questionnaire')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Take Questionnaire
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Display */}
      {hasProfile && profile.profile && (
        <div className="space-y-6">
          {/* FSLSM Dimensions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">FSLSM Dimensions</h3>
            
            <div className="space-y-4">
              {Object.entries(profile.profile.dimensions).map(([dimension, score]) => {
                const dimensionNames = {
                  activeReflective: { left: 'Reflective', right: 'Active' },
                  sensingIntuitive: { left: 'Intuitive', right: 'Sensing' },
                  visualVerbal: { left: 'Verbal', right: 'Visual' },
                  sequentialGlobal: { left: 'Global', right: 'Sequential' }
                };
                
                const names = dimensionNames[dimension];
                const percentage = ((score + 11) / 22) * 100;
                
                return (
                  <div key={dimension} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {names.left} ↔ {names.right}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{score}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({getStrengthLabel(score)} {getDimensionLabel(dimension, score)})
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{names.left} (-11)</span>
                      <span>{names.right} (+11)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {profile.profile.recommendedModes && profile.profile.recommendedModes.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended Learning Modes
              </h3>
              
              <div className="space-y-3">
                {profile.profile.recommendedModes.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-blue-900">{rec.mode}</span>
                      </div>
                      <span className="text-sm text-blue-700">
                        {(rec.confidence * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 ml-8">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Classification Method:</span>
              <span className="font-medium">{profile.profile.classificationMethod}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Last Updated:</span>
              <span className="font-medium">
                {new Date(profile.profile.lastPrediction).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
