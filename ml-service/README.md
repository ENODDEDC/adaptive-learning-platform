# ML Service for FSLSM Classification

Python-based machine learning service for classifying student learning styles using the Felder-Silverman Learning Style Model (FSLSM).

## Overview

This service trains XGBoost models on behavioral data to predict learning style preferences across 4 dimensions:
- Active/Reflective
- Sensing/Intuitive
- Visual/Verbal
- Sequential/Global

## Setup

### 1. Create Virtual Environment

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate Training Data

```bash
python training/generate_synthetic_data.py
```

This creates `data/training_data.csv` with 500 synthetic samples.

### 4. Train Models

```bash
python training/train_models.py
```

This trains 4 XGBoost models (one per dimension) and saves them to `models/`.

### 5. Run API Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### POST /predict
Predict learning style from behavioral features.

**Request:**
```json
{
  "features": {
    "activeModeRatio": 0.6,
    "questionsGenerated": 15,
    "debatesParticipated": 3,
    "reflectiveModeRatio": 0.4,
    "reflectionsWritten": 8,
    "journalEntries": 5,
    "sensingModeRatio": 0.7,
    "simulationsCompleted": 12,
    "challengesCompleted": 8,
    "intuitiveModeRatio": 0.3,
    "conceptsExplored": 5,
    "patternsDiscovered": 3,
    "visualModeRatio": 0.65,
    "diagramsViewed": 20,
    "wireframesExplored": 10,
    "verbalModeRatio": 0.35,
    "textRead": 15,
    "summariesCreated": 7,
    "sequentialModeRatio": 0.55,
    "stepsCompleted": 25,
    "linearNavigation": 30,
    "globalModeRatio": 0.45,
    "overviewsViewed": 10,
    "navigationJumps": 8
  }
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "activeReflective": -5,
    "sensingIntuitive": 7,
    "visualVerbal": -9,
    "sequentialGlobal": 3
  },
  "confidence": {
    "activeReflective": 0.85,
    "sensingIntuitive": 0.92,
    "visualVerbal": 0.88,
    "sequentialGlobal": 0.79
  },
  "interpretation": {
    "activeReflective": "Balanced (slight Reflective preference)",
    "sensingIntuitive": "Moderate Intuitive preference",
    "visualVerbal": "Strong Visual preference",
    "sequentialGlobal": "Balanced (slight Global preference)"
  }
}
```

### GET /health
Check service health.

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0"
}
```

## Project Structure

```
ml-service/
├── app.py                      # Flask API server
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── models/                     # Trained models
│   ├── active_reflective.pkl
│   ├── sensing_intuitive.pkl
│   ├── visual_verbal.pkl
│   ├── sequential_global.pkl
│   └── scaler.pkl
├── training/                   # Training scripts
│   ├── generate_synthetic_data.py
│   ├── train_models.py
│   └── evaluate_models.py
├── utils/                      # Utility functions
│   ├── feature_processor.py
│   └── model_utils.py
└── data/                       # Training data
    └── training_data.csv
```

## Model Details

### Algorithm: XGBoost
- Gradient boosting decision trees
- Handles non-linear relationships
- Robust to outliers
- Fast prediction

### Features: 24 behavioral metrics
- 6 features per FSLSM dimension
- Normalized to 0-1 range
- Derived from user interactions

### Training:
- 70% train, 15% validation, 15% test
- Cross-validation for hyperparameter tuning
- Early stopping to prevent overfitting

### Performance Targets:
- Accuracy: >75%
- Confidence: >0.7 average
- Prediction time: <100ms

## Deployment

### Option 1: Render.com (Recommended)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Add environment variables
6. Deploy

### Option 2: Docker

```bash
docker build -t ml-service .
docker run -p 5000:5000 ml-service
```

### Option 3: Local Development

```bash
python app.py
```

## Environment Variables

```bash
FLASK_ENV=production
PORT=5000
MODEL_PATH=./models
DATA_PATH=./data
```

## Testing

```bash
# Test prediction endpoint
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d @test_data.json

# Test health endpoint
curl http://localhost:5000/health
```

## Monitoring

- Track prediction accuracy
- Monitor API response times
- Log prediction confidence scores
- Alert on low confidence predictions

## Retraining

Schedule monthly retraining with new data:

```bash
python training/train_models.py --data data/new_training_data.csv
```

## Troubleshooting

**Models not loading:**
- Check `models/` directory exists
- Verify all .pkl files are present
- Run training script to generate models

**Low accuracy:**
- Collect more training data (>500 samples)
- Verify feature quality
- Tune hyperparameters
- Check for data imbalance

**Slow predictions:**
- Use model caching
- Optimize feature preprocessing
- Consider model quantization

## License

MIT
