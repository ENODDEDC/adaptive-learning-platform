'use client';

import React, { useState, useEffect } from 'react';
import { useAdaptiveLayout } from '../context/AdaptiveLayoutContext';

const SmartCourseIndicator = ({ course, userBehavior, behaviorHistory, className = '' }) => {
  const [relevanceScore, setRelevanceScore] = useState(0);
  const [completionLikelihood, setCompletionLikelihood] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);

  // Calculate course relevance based on user behavior patterns
  useEffect(() => {
    const calculateRelevance = () => {
      if (!userBehavior || !behaviorHistory) {
        setRelevanceScore(50); // Default neutral score
        setIsCalculating(false);
        return;
      }

      let score = 50; // Base score

      // Factor 1: Recent interaction frequency (last 7 days)
      const recentInteractions = behaviorHistory.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return interactionDate > weekAgo;
      });

      const courseInteractions = recentInteractions.filter(i =>
        i.courseId === course.id || i.metadata?.courseId === course.id
      );

      const interactionFrequency = courseInteractions.length;
      score += Math.min(interactionFrequency * 10, 30); // Max +30 for frequent interactions

      // Factor 2: Interaction recency (more recent = higher score)
      if (courseInteractions.length > 0) {
        const mostRecent = Math.max(...courseInteractions.map(i => new Date(i.timestamp).getTime()));
        const daysSinceLastInteraction = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);

        if (daysSinceLastInteraction < 1) score += 20;
        else if (daysSinceLastInteraction < 3) score += 10;
        else if (daysSinceLastInteraction < 7) score += 5;
      }

      // Factor 3: Course priority in user's most clicked courses
      const mostClickedCourses = userBehavior.interactionPatterns?.mostClickedCourses || [];
      const courseRanking = mostClickedCourses.findIndex(id => id === course.id);

      if (courseRanking >= 0) {
        score += Math.max(0, 15 - courseRanking * 3); // Top course gets +15, 2nd gets +12, etc.
      }

      // Factor 4: Time spent on course (if available)
      const timeSpentInteractions = courseInteractions.filter(i => i.type === 'time_spent');
      const totalTimeSpent = timeSpentInteractions.reduce((sum, i) => sum + (i.metadata?.duration || 0), 0);

      if (totalTimeSpent > 3600) score += 15; // More than 1 hour total
      else if (totalTimeSpent > 1800) score += 10; // More than 30 minutes
      else if (totalTimeSpent > 600) score += 5; // More than 10 minutes

      // Factor 5: Course progress influence
      const progress = course.progress || 0;
      if (progress > 80) score += 10; // High progress courses get priority
      else if (progress > 50) score += 5;

      // Normalize score to 0-100 range
      score = Math.max(0, Math.min(100, score));

      setRelevanceScore(Math.round(score));
      setIsCalculating(false);
    };

    calculateRelevance();
  }, [course.id, course.progress, userBehavior, behaviorHistory]);

  // Calculate completion likelihood
  useEffect(() => {
    const calculateCompletionLikelihood = () => {
      let likelihood = 50; // Base likelihood

      // Factor 1: Current progress
      const progress = course.progress || 0;
      likelihood += progress * 0.3; // Progress contributes up to 30 points

      // Factor 2: Recent activity pattern
      const recentActivity = behaviorHistory?.slice(-10) || [];
      const activeDays = new Set(
        recentActivity.map(i => new Date(i.timestamp).toDateString())
      ).size;

      if (activeDays >= 5) likelihood += 15; // Very active user
      else if (activeDays >= 3) likelihood += 10; // Moderately active
      else if (activeDays >= 1) likelihood += 5;

      // Factor 3: Course engagement consistency
      const courseInteractions = behaviorHistory?.filter(i =>
        i.courseId === course.id || i.metadata?.courseId === course.id
      ) || [];

      if (courseInteractions.length > 0) {
        const interactionDays = new Set(
          courseInteractions.map(i => new Date(i.timestamp).toDateString())
        ).size;

        const consistency = interactionDays / Math.max(1, courseInteractions.length);
        likelihood += consistency * 20; // Consistent engagement gets bonus
      }

      // Factor 4: Course difficulty vs user capability
      const enrollment = 24; // This would come from course data
      const avgProgress = 0; // This would be calculated from all users

      if (enrollment > 30) {
        likelihood += 10; // Popular courses are more likely to be completed
      }

      // Factor 5: Time-based completion prediction
      const daysSinceEnrollment = 30; // This would come from enrollment data
      const expectedCompletionDays = 60; // Based on course structure

      if (daysSinceEnrollment < expectedCompletionDays * 0.5) {
        likelihood += 15; // Early in course, high likelihood
      } else if (daysSinceEnrollment > expectedCompletionDays * 1.5) {
        likelihood -= 20; // Overdue courses, lower likelihood
      }

      // Normalize to 0-100 range
      likelihood = Math.max(0, Math.min(100, likelihood));

      setCompletionLikelihood(Math.round(likelihood));
    };

    calculateCompletionLikelihood();
  }, [course.id, course.progress, behaviorHistory]);

  const getRelevanceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getRelevanceIcon = (score) => {
    if (score >= 80) return '🎯';
    if (score >= 60) return '⭐';
    if (score >= 40) return '📊';
    return '📈';
  };

  const getLikelihoodColor = (likelihood) => {
    if (likelihood >= 80) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (likelihood >= 60) return 'text-cyan-600 bg-cyan-100 border-cyan-200';
    if (likelihood >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getLikelihoodIcon = (likelihood) => {
    if (likelihood >= 80) return '🚀';
    if (likelihood >= 60) return '⚡';
    if (likelihood >= 40) return '📈';
    return '🎯';
  };

  const getRelevanceLabel = (score) => {
    if (score >= 80) return 'High Priority';
    if (score >= 60) return 'Relevant';
    if (score >= 40) return 'Moderate';
    return 'Low Priority';
  };

  const getLikelihoodLabel = (likelihood) => {
    if (likelihood >= 80) return 'Very Likely';
    if (likelihood >= 60) return 'Likely';
    if (likelihood >= 40) return 'Possible';
    return 'Challenging';
  };

  if (isCalculating) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border animate-pulse ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>Calculating...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Relevance Indicator */}
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-all duration-300 hover:scale-105 ${getRelevanceColor(relevanceScore)}`}
        title={`Course Relevance: ${relevanceScore}/100 - ${getRelevanceLabel(relevanceScore)}`}
      >
        {/* <span className="text-sm">{getRelevanceIcon(relevanceScore)}</span> */}
        {/* <span className="hidden sm:inline">{relevanceScore}</span> */}
      </div>

      {/* Completion Likelihood Indicator */}
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-all duration-300 hover:scale-105 ${getLikelihoodColor(completionLikelihood)}`}
        title={`Completion Likelihood: ${completionLikelihood}/100 - ${getLikelihoodLabel(completionLikelihood)}`}
      >
        {/* <span className="text-sm">{getLikelihoodIcon(completionLikelihood)}</span> */}
        {/* <span className="hidden sm:inline">{completionLikelihood}</span> */}
      </div>
    </div>
  );
};

export default SmartCourseIndicator;