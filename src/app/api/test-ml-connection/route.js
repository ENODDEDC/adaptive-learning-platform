import { NextResponse } from 'next/server';
import mlClassificationService from '@/services/mlClassificationService';

/**
 * Test ML service connection
 */
export async function GET() {
  try {
    // Check ML service health
    const health = await mlClassificationService.checkMLServiceHealth();
    
    console.log('ML Service Health:', health);
    
    if (!health.available) {
      return NextResponse.json({
        success: false,
        message: 'ML service is not available',
        error: health.error,
        mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5000'
      });
    }
    
    // Try a test prediction with dummy features in correct format
    const dummyFeatures = {
      // Active vs Reflective
      activeModeRatio: 0.5,
      questionsGenerated: 5,
      debatesParticipated: 3,
      reflectiveModeRatio: 0.3,
      reflectionsWritten: 2,
      journalEntries: 2,
      
      // Sensing vs Intuitive
      sensingModeRatio: 0.6,
      simulationsCompleted: 4,
      challengesCompleted: 5,
      intuitiveModeRatio: 0.2,
      conceptsExplored: 3,
      patternsDiscovered: 3,
      
      // Visual vs Verbal
      visualModeRatio: 0.7,
      diagramsViewed: 8,
      wireframesExplored: 8,
      verbalModeRatio: 0.4,
      textRead: 10,
      summariesCreated: 2,
      
      // Sequential vs Global
      sequentialModeRatio: 0.5,
      stepsCompleted: 6,
      linearNavigation: 6,
      globalModeRatio: 0.3,
      overviewsViewed: 4,
      navigationJumps: 4
    };
    
    const prediction = await mlClassificationService.getMLPrediction(dummyFeatures);
    
    return NextResponse.json({
      success: true,
      message: 'ML service is working!',
      health,
      testPrediction: prediction,
      mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5000'
    });
    
  } catch (error) {
    console.error('ML connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
