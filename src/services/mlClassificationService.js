/**
 * ML Classification Service
 * Integrates with Python ML service for learning style predictions
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Check if ML service is available
 */
export async function checkMLServiceHealth() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return { available: false, error: 'Service unhealthy' };
    }
    
    const data = await response.json();
    return {
      available: data.models_loaded,
      status: data.status,
      version: data.version
    };
  } catch (error) {
    console.error('ML service health check failed:', error);
    return { available: false, error: error.message };
  }
}

/**
 * Get ML prediction from Python service
 * @param {Object} features - 24 behavioral features
 * @returns {Object} Predictions and confidence scores
 */
export async function getMLPrediction(features) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Prediction unsuccessful');
    }
    
    return {
      success: true,
      predictions: data.predictions,
      confidence: data.confidence,
      interpretation: data.interpretation,
      source: 'ml_model'
    };
  } catch (error) {
    console.error('ML prediction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Classify user with hybrid approach: ML + Rule-based fallback
 * @param {Object} features - 24 behavioral features
 * @param {Function} ruleBasedFallback - Rule-based classification function
 * @returns {Object} Classification results
 */
export async function hybridClassification(features, ruleBasedFallback) {
  // Try ML service first
  const mlHealth = await checkMLServiceHealth();
  
  if (mlHealth.available) {
    console.log('✅ Using ML service for classification');
    const mlResult = await getMLPrediction(features);
    
    if (mlResult.success) {
      return {
        ...mlResult,
        method: 'ml_model',
        fallback: false
      };
    }
  }
  
  // Fallback to rule-based classification
  console.log('⚠️ ML service unavailable, using rule-based classification');
  const ruleBasedResult = ruleBasedFallback(features);
  
  return {
    ...ruleBasedResult,
    method: 'rule_based',
    fallback: true,
    mlServiceError: mlHealth.error || 'Service unavailable'
  };
}

/**
 * Batch prediction for multiple users
 * @param {Array} featuresList - Array of feature objects
 * @returns {Array} Array of predictions
 */
export async function batchMLPrediction(featuresList) {
  const predictions = [];
  
  for (const features of featuresList) {
    const result = await getMLPrediction(features);
    predictions.push(result);
  }
  
  return predictions;
}

/**
 * Get model performance metrics (if available)
 */
export async function getModelMetrics() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/metrics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get model metrics:', error);
    return null;
  }
}

export default {
  checkMLServiceHealth,
  getMLPrediction,
  hybridClassification,
  batchMLPrediction,
  getModelMetrics
};
