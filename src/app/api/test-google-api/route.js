import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_API_KEY not found in environment variables'
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Check if user wants to test all models (use ?all=true)
    const { searchParams } = new URL(request.url);
    const testAll = searchParams.get('all') === 'true';
    
    // Test common model names
    const allModels = [
      'gemini-flash-lite-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash-exp',
      'gemini-exp-1206'
    ];
    
    // By default, only test the first model to save quota
    const modelsToTest = testAll ? allModels : ['gemini-flash-lite-latest'];

    const results = [];
    let workingModel = null;

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        const text = response.text();
        
        results.push({
          model: modelName,
          status: 'working',
          response: text.trim()
        });
        
        if (!workingModel) {
          workingModel = modelName;
        }
      } catch (error) {
        // Extract detailed error information
        const errorInfo = {
          model: modelName,
          status: 'failed',
          errorMessage: error.message,
          errorType: error.constructor.name
        };

        // Check for specific error patterns
        if (error.message.includes('404')) {
          errorInfo.errorCode = 404;
          errorInfo.diagnosis = 'Model not found or not available for this API key';
        } else if (error.message.includes('429')) {
          errorInfo.errorCode = 429;
          errorInfo.diagnosis = 'API quota exceeded - KEY IS WORKING but rate limited!';
          
          // Extract quota details from error message
          const quotaMatch = error.message.match(/limit: (\d+)/g);
          const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
          const metricMatch = error.message.match(/generativelanguage\.googleapis\.com\/([^,\n]+)/g);
          
          if (quotaMatch) {
            errorInfo.quotaLimits = quotaMatch.map(m => m.replace('limit: ', ''));
          }
          
          if (retryMatch) {
            errorInfo.retryAfterSeconds = parseFloat(retryMatch[1]);
          }
          
          if (metricMatch) {
            errorInfo.quotaMetrics = metricMatch.map(m => m.replace('generativelanguage.googleapis.com/', ''));
          }
          
          // Parse quota violations if available
          if (error.message.includes('QuotaFailure')) {
            const violations = [];
            const violationMatches = error.message.matchAll(/quotaMetric":"([^"]+)"/g);
            for (const match of violationMatches) {
              violations.push(match[1].replace('generativelanguage.googleapis.com/', ''));
            }
            if (violations.length > 0) {
              errorInfo.violatedQuotas = [...new Set(violations)];
            }
          }
        } else if (error.message.includes('403')) {
          errorInfo.errorCode = 403;
          errorInfo.diagnosis = 'API key does not have permission to access this model';
        } else if (error.message.includes('401')) {
          errorInfo.errorCode = 401;
          errorInfo.diagnosis = 'Invalid API key';
        } else if (error.message.includes('400')) {
          errorInfo.errorCode = 400;
          errorInfo.diagnosis = 'Bad request - check model name or parameters';
        } else {
          errorInfo.errorCode = 'unknown';
          errorInfo.diagnosis = 'Unknown error';
        }

        results.push(errorInfo);
      }
    }

    // Analyze results for summary
    const summary = {
      totalModels: results.length,
      workingModels: results.filter(r => r.status === 'working').length,
      quotaExceeded: results.filter(r => r.errorCode === 429).length,
      notFound: results.filter(r => r.errorCode === 404).length,
      otherErrors: results.filter(r => r.status === 'failed' && r.errorCode !== 429 && r.errorCode !== 404).length
    };

    // Extract common retry time if available
    const retryTimes = results
      .filter(r => r.retryAfterSeconds)
      .map(r => r.retryAfterSeconds);
    
    if (retryTimes.length > 0) {
      summary.suggestedRetryAfterSeconds = Math.max(...retryTimes);
    }

    const response = {
      apiKeyPrefix: process.env.GOOGLE_API_KEY.substring(0, 10) + '...',
      testedModels: modelsToTest.length,
      availableModels: allModels.length,
      summary,
      testResults: results,
      usageMonitorUrl: 'https://ai.dev/usage?tab=rate-limit',
      rateLimitDocsUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
      tip: testAll ? 'Testing all models uses more quota' : 'Add ?all=true to test all models (uses more quota)'
    };

    if (workingModel) {
      return NextResponse.json({
        success: true,
        message: 'Google API key is working!',
        recommendedModel: workingModel,
        ...response
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No working models found',
        ...response
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      details: error.toString(),
      apiKeyPrefix: process.env.GOOGLE_API_KEY ? 
        process.env.GOOGLE_API_KEY.substring(0, 10) + '...' : 
        'Not found'
    }, { status: 500 });
  }
}
