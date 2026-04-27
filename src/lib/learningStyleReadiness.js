/**
 * Shared readiness / quality helpers for learning-style classification gates.
 */

export const DEFAULT_MODE_KEYS = [
  'aiNarrator',
  'visualLearning',
  'sequentialLearning',
  'globalLearning',
  'sensingLearning',
  'intuitiveLearning',
  'activeLearning',
  'reflectiveLearning'
];

export const MINIMUM_CLASSIFICATION_INTERACTIONS = 50;

export function getRequiredQuality(totalInteractions) {
  if (totalInteractions < 50) return 0.66;
  if (totalInteractions < 100) return 0.6;
  if (totalInteractions < 200) return 0.56;
  return 0.52;
}

export function sumActivityEngagement(activityEngagement) {
  if (!activityEngagement || typeof activityEngagement !== 'object') return 0;
  return Object.values(activityEngagement).reduce(
    (sum, v) => sum + Math.max(0, Number(v) || 0),
    0
  );
}

export function totalModeOpenCount(modeUsage) {
  if (!modeUsage || typeof modeUsage !== 'object') return 0;
  return Object.values(modeUsage).reduce(
    (sum, row) => sum + Math.max(0, Number(row?.count) || 0),
    0
  );
}

/** Penalize many mode opens with little depth activity (idle / shallow clicking). */
export function computeIdleDepthFactor({ totalLearningTimeMs, activitySum, modeOpenCount }) {
  const opens = Math.max(0, modeOpenCount);
  const act = Math.max(0, activitySum);
  const depthRatio = opens > 0 ? act / (opens + 1) : 1;
  if (opens >= 25 && depthRatio < 0.12) return 0.72;
  if (opens >= 15 && depthRatio < 0.08) return 0.82;
  const minutes = Math.max(0, totalLearningTimeMs) / 60000;
  if (minutes >= 40 && act < 3 && opens >= 10) return 0.78;
  return 1;
}

/** Reward learning spread across calendar days (anti single-day spam). */
export function computeCrossSessionFactor(recentActiveDays) {
  const n = Array.isArray(recentActiveDays) ? new Set(recentActiveDays.filter(Boolean)).size : 0;
  if (n >= 4) return 1;
  if (n === 3) return 0.92;
  if (n === 2) return 0.78;
  if (n === 1) return 0.58;
  return 0.45;
}

export function computeDiversityScore(modeUsage, keys = DEFAULT_MODE_KEYS) {
  const weights = keys.map((k) => {
    const row = modeUsage?.[k] || {};
    return Math.max(0, (Number(row.count) || 0) + (Number(row.totalTime) || 0) / 1000);
  });
  const total = weights.reduce((s, v) => s + v, 0);
  if (total <= 0) return 0;
  const probs = weights.filter((w) => w > 0).map((w) => w / total);
  if (probs.length <= 1) return 0;
  const entropy = -probs.reduce((s, p) => s + p * Math.log(p), 0);
  const maxEntropy = Math.log(weights.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * @param {object} aggregatedStats - profile.aggregatedStats
 * @param {number} totalInteractions - processed interaction count
 * @param {string[]} recentActiveDays - YYYY-MM-DD strings (rolling window on server)
 */
export function computeClassificationReadiness(aggregatedStats, totalInteractions, recentActiveDays = []) {
  const modeUsage = aggregatedStats?.modeUsage || {};
  const totalLearningTime = Object.values(modeUsage).reduce(
    (s, v) => s + (Number(v?.totalTime) || 0),
    0
  );
  const diversity = computeDiversityScore(modeUsage);
  const minutes = totalLearningTime / 60000;
  const avgMinPerInteraction = totalInteractions > 0 ? minutes / totalInteractions : 0;

  const activitySum = sumActivityEngagement(aggregatedStats?.activityEngagement);
  const modeOpens = totalModeOpenCount(modeUsage);
  const activityDepthQuality = Math.min(
    1,
    activitySum / Math.max(24, totalInteractions * 0.38 + 8)
  );

  const interactionQuality = Math.min(1, totalInteractions / 120);
  const durationQuality = Math.min(1, minutes / 45);
  const depthQuality = Math.min(1, avgMinPerInteraction / 0.35);

  let baseQuality =
    interactionQuality * 0.3 +
    durationQuality * 0.2 +
    diversity * 0.22 +
    depthQuality * 0.13 +
    activityDepthQuality * 0.15;

  const idleFactor = computeIdleDepthFactor({
    totalLearningTimeMs: totalLearningTime,
    activitySum,
    modeOpenCount: modeOpens
  });
  const cross = computeCrossSessionFactor(recentActiveDays);
  baseQuality *= idleFactor;
  const qualityScore = Math.min(1, baseQuality * (0.68 + 0.32 * cross));

  const requiredQuality = getRequiredQuality(totalInteractions);

  return {
    qualityScore,
    requiredQuality,
    totalLearningTime,
    diversity,
    idleFactor,
    crossSessionFactor: cross,
    activitySum,
    ready: totalInteractions >= MINIMUM_CLASSIFICATION_INTERACTIONS && qualityScore >= requiredQuality
  };
}

export function mergeRecentActiveDay(recentActiveDays, date = new Date()) {
  const y = date.toISOString().slice(0, 10);
  const arr = Array.isArray(recentActiveDays) ? [...recentActiveDays] : [];
  if (!arr.includes(y)) arr.push(y);
  while (arr.length > 14) arr.shift();
  return arr;
}
