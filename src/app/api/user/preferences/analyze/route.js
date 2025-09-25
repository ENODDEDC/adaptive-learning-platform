import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import UserPreference from '@/models/UserPreference';

// POST /api/user/preferences/analyze - Analyze user behavior and generate recommendations
export async function POST(request) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interactions, currentLayout, timeContext } = body;

    let preferences = await UserPreference.findOne({ userId: decoded.userId });

    if (!preferences) {
      preferences = await UserPreference.create({ userId: decoded.userId });
    }

    // Analyze user behavior patterns
    const analysis = await analyzeUserBehavior(interactions, currentLayout, timeContext);

    // Generate layout recommendations
    const recommendations = generateLayoutRecommendations(analysis, preferences);

    // Update preferences with new analysis
    preferences = await updatePreferencesFromAnalysis(preferences, analysis, interactions);

    return NextResponse.json({
      success: true,
      analysis,
      recommendations,
      preferences: {
        layoutPreferences: preferences.layoutPreferences,
        learningMetrics: preferences.learningMetrics,
        adaptiveSettings: preferences.adaptiveSettings
      }
    });
  } catch (error) {
    console.error('Error analyzing user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeUserBehavior(interactions, currentLayout, timeContext) {
  const analysis = {
    interactionPatterns: {},
    layoutEfficiency: {},
    timeBasedPatterns: {},
    featurePreferences: {},
    satisfactionIndicators: {}
  };

  // Analyze interaction frequency and types
  const interactionTypes = {};
  const layoutInteractions = {};
  const timeBasedInteractions = {};

  interactions.forEach(interaction => {
    // Count interaction types
    interactionTypes[interaction.type] = (interactionTypes[interaction.type] || 0) + 1;

    // Analyze layout interactions
    if (interaction.metadata && interaction.metadata.layout) {
      layoutInteractions[interaction.metadata.layout] =
        (layoutInteractions[interaction.metadata.layout] || 0) + 1;
    }

    // Analyze time-based patterns
    const hour = new Date(interaction.timestamp).getHours();
    const timeSlot = getTimeSlot(hour);
    timeBasedInteractions[timeSlot] = (timeBasedInteractions[timeSlot] || 0) + 1;
  });

  // Determine most frequent interaction types
  analysis.interactionPatterns.topInteractions = Object.entries(interactionTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Analyze layout efficiency
  analysis.layoutEfficiency = calculateLayoutEfficiency(layoutInteractions, currentLayout);

  // Analyze time-based patterns
  analysis.timeBasedPatterns = timeBasedInteractions;

  // Determine feature preferences
  analysis.featurePreferences = determineFeaturePreferences(interactionTypes);

  // Calculate satisfaction indicators
  analysis.satisfactionIndicators = calculateSatisfactionIndicators(interactions, currentLayout);

  return analysis;
}

function calculateLayoutEfficiency(layoutInteractions, currentLayout) {
  const totalInteractions = Object.values(layoutInteractions).reduce((sum, count) => sum + count, 0);

  if (totalInteractions === 0) {
    return {
      currentLayout: 0,
      recommendedLayout: 'grid',
      efficiency: 0,
      confidence: 0
    };
  }

  const currentLayoutInteractions = layoutInteractions[currentLayout] || 0;
  const efficiency = currentLayoutInteractions / totalInteractions;

  // Determine recommended layout based on interaction patterns
  let recommendedLayout = 'grid';
  let confidence = 0;

  if (efficiency > 0.7) {
    recommendedLayout = currentLayout;
    confidence = efficiency;
  } else if (efficiency > 0.4) {
    // Look for better alternatives
    const alternatives = Object.entries(layoutInteractions)
      .filter(([layout, _]) => layout !== currentLayout)
      .sort(([,a], [,b]) => b - a);

    if (alternatives.length > 0) {
      recommendedLayout = alternatives[0][0];
      confidence = alternatives[0][1] / totalInteractions;
    }
  }

  return {
    currentLayout: efficiency,
    recommendedLayout,
    efficiency: efficiency * 100,
    confidence: confidence * 100
  };
}

function determineFeaturePreferences(interactionTypes) {
  const preferences = {
    search: (interactionTypes.search || 0) > 5,
    filter: (interactionTypes.filter || 0) > 3,
    sort: (interactionTypes.sort || 0) > 2,
    preview: (interactionTypes.preview || 0) > 3,
    dragDrop: (interactionTypes.drag_drop || 0) > 1
  };

  return preferences;
}

function calculateSatisfactionIndicators(interactions, currentLayout) {
  // Analyze interaction duration and frequency as satisfaction indicators
  const hoverInteractions = interactions.filter(i => i.type === 'card_hover' || i.type === 'course_hover');
  const clickInteractions = interactions.filter(i => i.type === 'course_click');

  const avgHoverDuration = hoverInteractions.length > 0
    ? hoverInteractions.reduce((sum, i) => sum + (i.metadata.hoverDuration || 0), 0) / hoverInteractions.length
    : 0;

  const clickThroughRate = clickInteractions.length > 0
    ? (clickInteractions.length / hoverInteractions.length) * 100
    : 0;

  return {
    avgHoverDuration,
    clickThroughRate,
    totalHovers: hoverInteractions.length,
    totalClicks: clickInteractions.length,
    satisfactionScore: calculateSatisfactionScore(avgHoverDuration, clickThroughRate)
  };
}

function calculateSatisfactionScore(avgHoverDuration, clickThroughRate) {
  // Simple satisfaction scoring algorithm
  let score = 50; // Base score

  // Hover duration scoring (longer hovers = more interest)
  if (avgHoverDuration > 3000) score += 25;
  else if (avgHoverDuration > 1000) score += 15;
  else if (avgHoverDuration > 500) score += 5;

  // Click-through rate scoring
  if (clickThroughRate > 30) score += 25;
  else if (clickThroughRate > 15) score += 15;
  else if (clickThroughRate > 5) score += 5;

  return Math.min(100, Math.max(0, score));
}

function generateLayoutRecommendations(analysis, preferences) {
  const recommendations = [];
  const confidence = analysis.layoutEfficiency.confidence;

  // Card size recommendation based on interaction patterns
  if (analysis.satisfactionIndicators.avgHoverDuration > 3000) {
    recommendations.push({
      type: 'card_size',
      value: 'large',
      reason: 'Long hover duration indicates interest in detailed information',
      confidence: Math.min(90, confidence + 20)
    });
  } else if (analysis.satisfactionIndicators.avgHoverDuration < 1000) {
    recommendations.push({
      type: 'card_size',
      value: 'small',
      reason: 'Quick interactions suggest preference for compact layout',
      confidence: Math.min(85, confidence + 15)
    });
  }

  // Compact mode recommendation
  if (analysis.featurePreferences.search && analysis.featurePreferences.filter) {
    recommendations.push({
      type: 'compact_mode',
      value: true,
      reason: 'Frequent use of search and filters suggests preference for information density',
      confidence: Math.min(80, confidence + 10)
    });
  }

  // Layout recommendation
  if (analysis.layoutEfficiency.recommendedLayout !== preferences.layoutPreferences.currentLayout) {
    recommendations.push({
      type: 'layout',
      value: analysis.layoutEfficiency.recommendedLayout,
      reason: `Layout efficiency analysis suggests ${analysis.layoutEfficiency.recommendedLayout} layout`,
      confidence: analysis.layoutEfficiency.confidence
    });
  }

  // Feature visibility recommendations
  if (!analysis.featurePreferences.search && preferences.layoutPreferences.showProgress) {
    recommendations.push({
      type: 'show_progress',
      value: false,
      reason: 'Limited search usage suggests progress indicators may not be essential',
      confidence: 60
    });
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

async function updatePreferencesFromAnalysis(preferences, analysis, interactions) {
  // Update feature usage statistics
  preferences.featureUsage.searchFrequency += analysis.interactionPatterns.topInteractions
    .find(i => i.type === 'search')?.count || 0;
  preferences.featureUsage.filterUsage += analysis.interactionPatterns.topInteractions
    .find(i => i.type === 'filter')?.count || 0;
  preferences.featureUsage.sortUsage += analysis.interactionPatterns.topInteractions
    .find(i => i.type === 'sort')?.count || 0;
  preferences.featureUsage.previewUsage += analysis.interactionPatterns.topInteractions
    .find(i => i.type === 'preview')?.count || 0;
  preferences.featureUsage.dragDropUsage += analysis.interactionPatterns.topInteractions
    .find(i => i.type === 'drag_drop')?.count || 0;

  // Update learning metrics
  preferences.learningMetrics.satisfactionScore = analysis.satisfactionIndicators.satisfactionScore;
  preferences.learningMetrics.learningProgress = Math.min(100,
    preferences.learningMetrics.learningProgress + (analysis.satisfactionIndicators.satisfactionScore * 0.01)
  );

  // Update interaction patterns
  analysis.interactionPatterns.topInteractions.forEach(interaction => {
    const existing = preferences.interactionPatterns.frequentActions.find(
      a => a.action === interaction.type
    );

    if (existing) {
      existing.count += interaction.count;
      existing.lastUsed = new Date();
    } else {
      preferences.interactionPatterns.frequentActions.push({
        action: interaction.type,
        count: interaction.count,
        lastUsed: new Date()
      });
    }
  });

  return await preferences.save();
}

function getTimeSlot(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}