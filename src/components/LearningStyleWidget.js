'use client';

import React from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

/**
 * Learning Style Profile Widget for Home Page
 * Shows user's learning style profile and quick actions
 */
const LearningStyleWidget = ({ profile, loading }) => {
  if (loading) {
    return (
      <div className="p-6 mx-4 mb-8 bg-white/95 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  // No profile yet - show questionnaire prompt
  if (!profile) {
    return (
      <div className="p-6 mx-4 mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              Discover Your Learning Style
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">NEW</span>
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Your learning preference has not been identified yet.</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Take our quick 2-minute questionnaire to get personalized learning recommendations powered by AI. 
              Or start learning right away - our system will automatically identify your style as you interact with content.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/questionnaire"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <AcademicCapIcon className="w-4 h-4" />
                Take Questionnaire
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/my-learning-style"
                className="inline-flex items-center gap-2 px-4 py-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has profile - show summary
  const { dimensions, confidence, recommendedModes, lastUpdated, source, dataQuality } = profile;

  // Calculate overall learning style
  const getStyleLabel = (score) => {
    if (Math.abs(score) <= 3) return 'Balanced';
    if (Math.abs(score) <= 7) return 'Moderate';
    return 'Strong';
  };

  const getPrimaryStyle = () => {
    const styles = [];
    if (dimensions.activeReflective < -3) styles.push('Active');
    if (dimensions.activeReflective > 3) styles.push('Reflective');
    if (dimensions.sensingIntuitive < -3) styles.push('Sensing');
    if (dimensions.sensingIntuitive > 3) styles.push('Intuitive');
    if (dimensions.visualVerbal < -3) styles.push('Visual');
    if (dimensions.visualVerbal > 3) styles.push('Verbal');
    if (dimensions.sequentialGlobal < -3) styles.push('Sequential');
    if (dimensions.sequentialGlobal > 3) styles.push('Global');
    
    return styles.length > 0 ? styles.join('-') : 'Balanced';
  };

  const primaryStyle = getPrimaryStyle();

  // Get confidence badge
  const getConfidenceBadge = () => {
    const confidenceLevel = dataQuality?.confidenceLevel || 'low';
    const confidencePercentage = dataQuality?.confidencePercentage || 0;
    
    const colors = {
      'high': 'bg-green-100 text-green-700 border-green-300',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'low-medium': 'bg-orange-100 text-orange-700 border-orange-300',
      'low': 'bg-red-100 text-red-700 border-red-300'
    };
    
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${colors[confidenceLevel] || colors['low']}`}>
        {confidencePercentage}% Confidence
      </span>
    );
  };

  // Determine source badge
  const getSourceBadge = () => {
    if (source === 'questionnaire') {
      return (
        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-semibold">
          From Questionnaire
        </span>
      );
    } else if (source === 'ml_classification') {
      return (
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          AI Detected
        </span>
      );
    } else if (source === 'hybrid') {
      return (
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          Questionnaire + AI
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 mx-4 mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              Your Learning Style
              {getSourceBadge()}
              {getConfidenceBadge()}
            </h3>
            <p className="text-sm text-gray-600">{primaryStyle} Learner</p>
          </div>
        </div>
        <Link
          href="/my-learning-style"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          View Full Profile →
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-600 mb-1">Active/Reflective</div>
          <div className="text-lg font-bold text-gray-900">
            {dimensions.activeReflective < 0 ? 'Active' : 'Reflective'}
          </div>
          <div className="text-xs text-gray-500">
            {getStyleLabel(dimensions.activeReflective)}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-600 mb-1">Sensing/Intuitive</div>
          <div className="text-lg font-bold text-gray-900">
            {dimensions.sensingIntuitive < 0 ? 'Sensing' : 'Intuitive'}
          </div>
          <div className="text-xs text-gray-500">
            {getStyleLabel(dimensions.sensingIntuitive)}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-600 mb-1">Visual/Verbal</div>
          <div className="text-lg font-bold text-gray-900">
            {dimensions.visualVerbal < 0 ? 'Visual' : 'Verbal'}
          </div>
          <div className="text-xs text-gray-500">
            {getStyleLabel(dimensions.visualVerbal)}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-600 mb-1">Sequential/Global</div>
          <div className="text-lg font-bold text-gray-900">
            {dimensions.sequentialGlobal < 0 ? 'Sequential' : 'Global'}
          </div>
          <div className="text-xs text-gray-500">
            {getStyleLabel(dimensions.sequentialGlobal)}
          </div>
        </div>
      </div>

      {/* Recommended Modes */}
      {recommendedModes && recommendedModes.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100 mb-3">
          <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            Recommended Learning Modes
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedModes.slice(0, 3).map((mode, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
              >
                {mode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Level Info */}
      {dataQuality && (
        <div className={`border rounded-lg p-3 mb-3 ${
          dataQuality.confidenceLevel === 'high' ? 'bg-green-50 border-green-200' :
          dataQuality.confidenceLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
          dataQuality.confidenceLevel === 'low-medium' ? 'bg-orange-50 border-orange-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className={`text-xs ${
            dataQuality.confidenceLevel === 'high' ? 'text-green-800' :
            dataQuality.confidenceLevel === 'medium' ? 'text-yellow-800' :
            dataQuality.confidenceLevel === 'low-medium' ? 'text-orange-800' :
            'text-red-800'
          }`}>
            <strong>
              {dataQuality.confidenceLevel === 'high' && '✓ High Confidence Classification'}
              {dataQuality.confidenceLevel === 'medium' && '⚡ Medium Confidence Classification'}
              {dataQuality.confidenceLevel === 'low-medium' && '📊 Growing Confidence'}
              {dataQuality.confidenceLevel === 'low' && '🌱 Initial Classification'}
            </strong>
            {' '}
            {dataQuality.interactionCount} interactions tracked. 
            {dataQuality.confidenceLevel !== 'high' && ` Keep learning to improve accuracy (${dataQuality.confidencePercentage}%).`}
            {dataQuality.confidenceLevel === 'high' && ' Your profile is highly accurate!'}
          </p>
        </div>
      )}

      {/* Info based on source */}
      {source === 'questionnaire' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-green-800">
            <strong>✓ Initial profile created from questionnaire.</strong> As you interact with learning materials, 
            our AI will refine your profile for even more personalized recommendations.
          </p>
        </div>
      )}
      {source === 'ml_classification' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-800">
            <strong>✓ AI-detected learning style.</strong> Your profile was automatically identified based on your 
            learning behavior. Take the questionnaire for a more comprehensive assessment.
          </p>
        </div>
      )}
      {source === 'hybrid' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-purple-800">
            <strong>✓ Enhanced profile.</strong> Your learning style combines questionnaire results with AI analysis 
            of your actual learning behavior for maximum accuracy.
          </p>
        </div>
      )}

      {/* Classification Method & Last Updated */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Classification Method:</span>
          <span className={`font-semibold px-2 py-1 rounded ${
            source === 'ml-prediction' 
              ? 'bg-green-100 text-green-800' 
              : source === 'questionnaire'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {source === 'ml-prediction' ? '🤖 Machine Learning' : 
             source === 'questionnaire' ? '📝 Questionnaire' : 
             source === 'hybrid' ? '🔄 Hybrid (ML + Questionnaire)' :
             source || 'Unknown'}
          </span>
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningStyleWidget;
