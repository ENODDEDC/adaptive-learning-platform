# AI Assistant → ML Integration Verification Guide

## Purpose
This guide helps you verify that AI Assistant interactions (Ask, Research, Text-to-Docs modes) are being properly tracked and processed by the Machine Learning system for learning style classification.

## Test Page Location
**URL:** `http://localhost:3000/test-ai-assistant-ml`

## What This Test Page Shows

### Step 1: Raw Behavior Data
- Shows the actual AI Assistant usage counts stored in MongoDB
- Displays: Ask Mode count, Research Mode count, Text-to-Docs count
- Verifies that tracking is working

### Step 2: Calculated Features
- Shows how raw data is converted into ML features
- Key features to look for:
  - `aiAskModeRatio` → Active Learning indicator
  - `aiResearchModeRatio` → Reflective Learning indicator
  - `aiTextToDocsRatio` → Sensing Learning indicator
- Shows data quality and ML readiness

### Step 3: ML Service Format
- Shows the exact data structure sent to the Python ML service
- Verifies feature formatting is correct

### Step 4: Classification Results
- Shows the ML model's output (learning style dimensions)
- Displays recommended learning modes based on your AI Assistant usage

## How to Verify the Complete Flow

### 1. Start Fresh (Optional)
```bash
# Reset your learning profile to start clean
curl -X POST http://localhost:3000/api/reset-learning-profile
```

### 2. Use AI Assistant Features
Go to any document viewer and use:
- **Ask Mode**: Ask 3-5 quick questions
- **Research Mode**: Do 2-3 deep research queries
- **Text-to-Docs Mode**: Generate 1-2 documents

### 3. Check the Test Page
Visit: `http://localhost:3000/test-ai-assistant-ml`

You should see:
- ✅ AI Assistant data is being tracked
- ✅ AI Assistant features are being calculated
- ✅ Features are being formatted for ML service
- ✅ ML classification is producing results

### 4. Trigger Classification
Click the **"Trigger Classification"** button on the test page.

This will:
1. Calculate features from your AI Assistant usage
2. Send features to the ML service
3. Get predictions back
4. Update your learning style profile

### 5. Verify Results
Check that:
- Your learning style dimensions changed based on AI Assistant usage
- Recommended modes reflect your AI Assistant behavior
- Classification method shows "ml-prediction" (if ML service is running)

## Expected Behavior

### If You Use Ask Mode Frequently
- **Active/Reflective dimension** should lean toward **Active** (positive score)
- Recommended modes should include "Active Learning Hub"

### If You Use Research Mode Frequently
- **Active/Reflective dimension** should lean toward **Reflective** (negative score)
- Recommended modes should include "Reflective Learning"

### If You Use Text-to-Docs Mode Frequently
- **Sensing/Intuitive dimension** should lean toward **Sensing** (positive score)
- Recommended modes should include "Hands-On Lab"

## Troubleshooting

### "No AI Assistant data found"
**Problem:** AI Assistant tracking is not working
**Solution:** 
1. Check if AI Assistant components are calling `trackAIAssistantInteraction()`
2. Verify browser console for tracking logs
3. Check MongoDB for `LearningBehavior` documents

### "Features are 0 or undefined"
**Problem:** Feature calculation is failing
**Solution:**
1. Check that behavior data exists in MongoDB
2. Verify `featureEngineeringService.js` is calculating AI Assistant features
3. Check server logs for errors

### "ML service unavailable"
**Problem:** Python ML service is not running
**Solution:**
1. Start ML service: `cd ml-service && python app.py`
2. Check ML service health: `http://localhost:5000/health`
3. System will fall back to rule-based classification

### "Classification method shows 'rule-based'"
**Problem:** Not enough data for ML or ML service is down
**Solution:**
1. Ensure you have 10+ total interactions
2. Verify ML service is running
3. Check that `dataQuality.sufficientForML` is true

## API Endpoints Used

### GET /api/learning-behavior/track
Returns raw behavior data including AI Assistant usage

### GET /api/test-features
Returns calculated features (27 features for ML)

### GET /api/test-ml-features
Returns ML-formatted features (what ML service receives)

### POST /api/learning-style/classify
Triggers classification using ML or rule-based approach

### GET /api/learning-style/profile
Returns current learning style profile

## Code Flow Verification

### 1. Tracking (Client-Side)
```javascript
// In AI Assistant component
import { getLearningBehaviorTracker } from '@/utils/learningBehaviorTracker';

const tracker = getLearningBehaviorTracker();
tracker.trackAIAssistantInteraction('ask', promptLength);
```

### 2. Storage (API)
```javascript
// POST /api/learning-behavior/track
// Stores in MongoDB LearningBehavior collection
{
  aiAssistantUsage: {
    askMode: { count: 5 },
    researchMode: { count: 2 },
    textToDocsMode: { count: 1 }
  }
}
```

### 3. Feature Engineering (Service)
```javascript
// featureEngineeringService.calculateFeatures()
{
  aiAskModeRatio: 0.625,      // 5/8 = Active indicator
  aiResearchModeRatio: 0.25,  // 2/8 = Reflective indicator
  aiTextToDocsRatio: 0.125    // 1/8 = Sensing indicator
}
```

### 4. ML Prediction (Python Service)
```python
# ML service receives 24 features including AI Assistant ratios
# Returns FSLSM dimensions
{
  "activeReflective": 5.2,    # Positive = Active (influenced by Ask Mode)
  "sensingIntuitive": 2.1,    # Positive = Sensing (influenced by Text-to-Docs)
  "visualVerbal": -1.3,
  "sequentialGlobal": 0.8
}
```

### 5. Profile Update (Database)
```javascript
// LearningStyleProfile updated with ML results
{
  dimensions: {
    activeReflective: 5.2,
    sensingIntuitive: 2.1,
    visualVerbal: -1.3,
    sequentialGlobal: 0.8
  },
  classificationMethod: "ml-prediction",
  recommendedModes: [
    { mode: "Active Learning Hub", priority: 1 },
    { mode: "Hands-On Lab", priority: 2 }
  ]
}
```

## Success Criteria

✅ **Complete Integration Verified When:**
1. AI Assistant interactions appear in raw behavior data
2. AI Assistant features are calculated (aiAskModeRatio, etc.)
3. Features are included in ML service payload
4. ML classification produces dimension scores
5. Recommended modes reflect AI Assistant usage patterns

## Developer Notes

### Where AI Assistant Data is Used

**Feature Engineering (27 total features):**
- Feature 7: `aiAskModeRatio` (Active/Reflective)
- Feature 8: `aiResearchModeRatio` (Active/Reflective)
- Feature 15: `aiTextToDocsRatio` (Sensing/Intuitive)

**ML Model Input:**
All 27 features are sent to XGBoost model, including the 3 AI Assistant features.

**Impact on Classification:**
- High Ask Mode usage → More Active classification
- High Research Mode usage → More Reflective classification
- High Text-to-Docs usage → More Sensing classification

### Database Schema

**LearningBehavior Collection:**
```javascript
{
  userId: ObjectId,
  sessionId: String,
  aiAssistantUsage: {
    askMode: { count: Number, totalTime: Number },
    researchMode: { count: Number, totalTime: Number },
    textToDocsMode: { count: Number, totalTime: Number },
    totalInteractions: Number,
    averagePromptLength: Number
  },
  // ... other fields
}
```

## Conclusion

This test page provides complete visibility into the AI Assistant → ML integration pipeline. Use it to verify that your AI Assistant interactions are not just being logged, but are actively influencing your learning style classification and personalized recommendations.

**Remember:** The ML system learns from ALL your interactions (8 Learning Modes + AI Assistant), creating a comprehensive profile of your learning preferences.
