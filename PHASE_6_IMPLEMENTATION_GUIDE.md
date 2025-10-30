# Phase 6: ML Model Training - Implementation Guide

## 🎯 Overview

Phase 6 adds actual machine learning models to improve classification accuracy beyond the rule-based system. This guide walks you through setting up, training, and deploying the ML service.

## 📋 What Was Created

### Python ML Service Structure:
```
ml-service/
├── app.py                              # Flask API server
├── requirements.txt                    # Python dependencies
├── README.md                           # Service documentation
├── .gitignore                          # Git ignore rules
├── models/                             # Trained models (generated)
│   ├── active_reflective.pkl
│   ├── sensing_intuitive.pkl
│   ├── visual_verbal.pkl
│   ├── sequential_global.pkl
│   └── scaler.pkl
├── training/                           # Training scripts
│   ├── generate_synthetic_data.py     # Generate training data
│   └── train_models.py                # Train XGBoost models
└── data/                               # Training data (generated)
    └── training_data.csv
```

### Next.js Integration:
```
src/services/
└── mlClassificationService.js          # ML service integration
```

## 🚀 Quick Start (5 Steps)

### Step 1: Set Up Python Environment

```bash
# Navigate to ml-service directory
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Generate Training Data

```bash
# Generate 500 synthetic training samples
python training/generate_synthetic_data.py
```

**Output:**
- Creates `data/training_data.csv` with 500 samples
- Each sample has 24 features + 4 labels
- Data is realistic and aligned with FSLSM theory

### Step 3: Train Models

```bash
# Train XGBoost models for all 4 dimensions
python training/train_models.py
```

**Output:**
- Trains 4 separate models (one per dimension)
- Saves models to `models/` directory
- Shows training metrics (MAE, R²)
- Takes ~1-2 minutes

**Expected Performance:**
- MAE: 2-3 points (on -11 to +11 scale)
- R²: 0.7-0.85
- Accuracy: 75-85%

### Step 4: Start ML Service

```bash
# Run Flask API server
python app.py
```

**Output:**
- Server starts on `http://localhost:5000`
- Loads all 4 models + scaler
- Ready to accept predictions

### Step 5: Test ML Service

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test prediction endpoint
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "activeModeRatio": 0.7,
      "questionsGenerated": 25,
      "debatesParticipated": 8,
      "reflectiveModeRatio": 0.3,
      "reflectionsWritten": 5,
      "journalEntries": 2,
      "sensingModeRatio": 0.6,
      "simulationsCompleted": 15,
      "challengesCompleted": 10,
      "intuitiveModeRatio": 0.4,
      "conceptsExplored": 8,
      "patternsDiscovered": 4,
      "visualModeRatio": 0.75,
      "diagramsViewed": 30,
      "wireframesExplored": 15,
      "verbalModeRatio": 0.25,
      "textRead": 8,
      "summariesCreated": 3,
      "sequentialModeRatio": 0.5,
      "stepsCompleted": 20,
      "linearNavigation": 25,
      "globalModeRatio": 0.5,
      "overviewsViewed": 12,
      "navigationJumps": 10
    }
  }'
```

## 🔗 Integration with Next.js

### Update Classification API

Modify `src/app/api/learning-style/classify/route.js`:

```javascript
import { hybridClassification } from '@/services/mlClassificationService';
import { classifyLearningStyle } from '@/services/ruleBasedLabelingService';

export async function POST(request) {
  // ... existing code to get features ...
  
  // Use hybrid classification (ML + rule-based fallback)
  const result = await hybridClassification(
    features,
    (features) => classifyLearningStyle(features)
  );
  
  // ... save and return result ...
}
```

### Environment Variables

Add to `.env.local`:

```bash
# ML Service URL
ML_SERVICE_URL=http://localhost:5000

# For production (after deploying to Render):
# ML_SERVICE_URL=https://your-ml-service.onrender.com
```

## 📊 Understanding the Models

### Algorithm: XGBoost
- **Type:** Gradient Boosting Decision Trees
- **Why:** Handles non-linear relationships, robust, fast
- **Training:** 70% train, 15% validation, 15% test

### Features: 24 Behavioral Metrics
Each dimension uses all 24 features:
1. Active/Reflective: 6 features
2. Sensing/Intuitive: 6 features
3. Visual/Verbal: 6 features
4. Sequential/Global: 6 features

### Output: FSLSM Scores
- Range: -11 to +11 for each dimension
- Negative: First preference (Active, Sensing, Visual, Sequential)
- Positive: Second preference (Reflective, Intuitive, Verbal, Global)
- Confidence: 0.5 to 1.0

## 🎯 Synthetic vs Real Data

### Current: Synthetic Data
- **Pros:** Start immediately, test system, validate pipeline
- **Cons:** Not as accurate as real data
- **Accuracy:** 75-80%

### Future: Real User Data
- **When:** After 100+ users use the system
- **How:** Export from MongoDB, retrain models
- **Accuracy:** 85-95% (expected)

### Collecting Real Data

1. **Deploy current system** (Phases 1-5)
2. **Users take ILS questionnaire** (ground truth labels)
3. **Users interact with learning modes** (behavioral features)
4. **Export data after 2-4 weeks:**

```javascript
// Export script (create in scripts/export-training-data.js)
const data = await LearningBehavior.aggregate([
  // Join with LearningStyleProfile for labels
  // Calculate features
  // Export to CSV
]);
```

5. **Retrain models** with real data
6. **Deploy updated models**

## 🚀 Deployment Options

### Option 1: Render.com (Recommended)

1. **Create Web Service:**
   - Go to render.com
   - New → Web Service
   - Connect GitHub repo

2. **Configure:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Environment: Python 3.9+

3. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (~5 minutes)
   - Get service URL

4. **Update Next.js:**
   ```bash
   ML_SERVICE_URL=https://your-service.onrender.com
   ```

### Option 2: Docker

```dockerfile
# Dockerfile (create in ml-service/)
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

```bash
# Build and run
docker build -t ml-service .
docker run -p 5000:5000 ml-service
```

### Option 3: Local Development

```bash
# Keep running in terminal
python app.py

# Or use in background (Windows)
start /B python app.py

# Or use in background (Mac/Linux)
python app.py &
```

## 🧪 Testing the Integration

### Test 1: Health Check

```javascript
// In browser console or test page
const health = await fetch('http://localhost:5000/health');
const data = await health.json();
console.log(data);
// Expected: { status: 'healthy', models_loaded: true, version: '1.0.0' }
```

### Test 2: Prediction

```javascript
// Test classification with ML service
const response = await fetch('/api/learning-style/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'test-user-id' })
});

const result = await response.json();
console.log(result.method); // Should be 'ml_model' if service is running
```

### Test 3: Fallback

```bash
# Stop ML service
# Try classification again
# Should fallback to rule-based
```

## 📈 Monitoring & Improvement

### Track Performance

Create `src/app/api/ml-metrics/route.js`:

```javascript
export async function GET() {
  // Track:
  // - ML service availability
  // - Prediction accuracy (compare with ILS)
  // - Response times
  // - Confidence scores
}
```

### A/B Testing

```javascript
// Randomly assign users to ML or rule-based
const useML = Math.random() > 0.5;
const result = useML 
  ? await getMLPrediction(features)
  : classifyLearningStyle(features);

// Track which performs better
```

### Retraining Schedule

1. **Monthly:** Retrain with new data
2. **Quarterly:** Evaluate and tune hyperparameters
3. **Annually:** Consider new algorithms

## 🎓 Next Steps

### Immediate (Now):
1. ✅ Set up Python environment
2. ✅ Generate synthetic data
3. ✅ Train models
4. ✅ Test ML service locally
5. ✅ Integrate with Next.js

### Short-term (1-2 weeks):
1. Deploy ML service to Render
2. Update environment variables
3. Test in production
4. Monitor performance

### Medium-term (1-3 months):
1. Collect real user data (100+ users)
2. Export training data from MongoDB
3. Retrain models with real data
4. Deploy updated models
5. Compare accuracy

### Long-term (3-6 months):
1. Implement A/B testing
2. Add model monitoring dashboard
3. Experiment with deep learning
4. Add collaborative filtering
5. Implement adaptive learning

## ❓ Troubleshooting

### Issue: Models not training
**Solution:**
- Check Python version (3.9+)
- Verify all dependencies installed
- Check training data exists
- Review error messages

### Issue: ML service not starting
**Solution:**
- Check port 5000 is available
- Verify models directory has .pkl files
- Check Flask installation
- Review app.py for errors

### Issue: Predictions failing
**Solution:**
- Verify all 24 features provided
- Check feature names match exactly
- Ensure features are numeric
- Review API request format

### Issue: Low accuracy
**Solution:**
- Collect more training data
- Retrain with real user data
- Tune hyperparameters
- Check feature quality

## 📚 Resources

- **XGBoost Docs:** https://xgboost.readthedocs.io/
- **Flask Docs:** https://flask.palletsprojects.com/
- **Scikit-learn:** https://scikit-learn.org/
- **Render Deployment:** https://render.com/docs

## ✅ Success Criteria

Phase 6 is complete when:
- ✅ Python environment set up
- ✅ Synthetic data generated
- ✅ Models trained successfully
- ✅ ML service running locally
- ✅ Integration with Next.js working
- ✅ Hybrid classification functional
- ✅ Fallback to rule-based working

**Status:** Ready to implement!
**Time:** 1-2 hours for setup and testing
**Difficulty:** Intermediate (Python + API integration)
