# ML Model Technical Summary

## 🎯 Overview
Your IntelEvo platform uses **XGBoost Regression** models to predict FSLSM (Felder-Silverman Learning Style Model) scores based on real-time behavioral tracking.

---

## 📊 Model Architecture

### Algorithm: XGBoost Regressor
- **Type**: Gradient Boosting Decision Trees
- **Task**: Regression (predicting continuous scores from -11 to +11)
- **Framework**: XGBoost with scikit-learn integration
- **Hyperparameter Tuning**: GridSearchCV with 5-fold cross-validation

### Hyperparameters Tuned:
```python
{
    'n_estimators': [100, 200, 300],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1],
    'subsample': [0.8, 0.9, 1.0],
    'colsample_bytree': [0.8, 0.9],
    'min_child_weight': [1, 3, 5]
}
```

---

## 🔢 Features (24 Behavioral Metrics)

### Feature Engineering Pipeline:
The system tracks student interactions and engineers 24 features grouped by learning dimension:

### 1. **Active/Reflective Dimension** (6 features)
- `activeModeRatio` - Time spent in active learning modes
- `questionsGenerated` - Number of questions created
- `debatesParticipated` - Debate/discussion participation count
- `reflectiveModeRatio` - Time spent in reflective modes
- `reflectionsWritten` - Number of reflection entries
- `journalEntries` - Journal/note-taking activity

### 2. **Sensing/Intuitive Dimension** (6 features)
- `sensingModeRatio` - Time in concrete/practical learning
- `simulationsCompleted` - Hands-on simulation interactions
- `challengesCompleted` - Practical problem-solving tasks
- `intuitiveModeRatio` - Time in abstract/conceptual learning
- `conceptsExplored` - Theoretical concept engagement
- `patternsDiscovered` - Pattern recognition activities

### 3. **Visual/Verbal Dimension** (6 features)
- `visualModeRatio` - Time viewing visual content
- `diagramsViewed` - Diagram/chart interactions
- `wireframesExplored` - Visual mockup engagement
- `verbalModeRatio` - Time reading text content
- `textRead` - Text-based content consumption
- `summariesCreated` - Written summary creation

### 4. **Sequential/Global Dimension** (6 features)
- `sequentialModeRatio` - Linear, step-by-step learning time
- `stepsCompleted` - Sequential task completion
- `linearNavigation` - Linear navigation patterns
- `globalModeRatio` - Overview/big-picture learning time
- `overviewsViewed` - High-level overview engagement
- `navigationJumps` - Non-linear navigation patterns

---

## 🏗️ Model Versions

You have **3 model versions** in `ml-service/models/`:

### 1. **Base Models** (Latest: Nov 4, 2025)
- `scaler.pkl` (1,191 bytes, 24 features)
- `active_reflective.pkl` (191 KB)
- `sensing_intuitive.pkl` (186 KB)
- `visual_verbal.pkl` (227 KB)
- `sequential_global.pkl` (210 KB)

### 2. **Fast Models** (Nov 1, 2025)
- `scaler_fast.pkl` (1,719 bytes)
- Larger file sizes (~1.3 MB each)
- Optimized for speed

### 3. **Improved Models** (Nov 3-4, 2025)
- `scaler_improved.pkl` (1,719 bytes, **46 features**)
- Medium file sizes (~500-580 KB)
- Enhanced with additional engineered features
- Most recent updates

**Currently Active**: The Flask API (`app.py`) automatically loads **improved models** if available, otherwise falls back to base models.

---

## 🎓 Training Data

### Dataset: `ml-service/data/training_data.csv`
- **Size**: 5,000 samples
- **Columns**: 31 total
  - 24 behavioral features
  - 4 target labels (FSLSM scores for each dimension)
  - 3 metadata columns

### Data Generation:
- Synthetic data generated using `generate_synthetic_data.py`
- Based on FSLSM research and behavioral patterns
- Validated against real user interactions

---

## 🔄 Prediction Pipeline

```
User Interaction
    ↓
Behavioral Tracking (learningBehaviorTracker.js)
    ↓
Feature Engineering (featureEngineeringService.js)
    ↓
24 Features Extracted
    ↓
POST /predict to Flask API (app.py)
    ↓
StandardScaler Normalization
    ↓
4 XGBoost Models (one per dimension)
    ↓
Predictions: -11 to +11 scores
    ↓
Interpretation + Confidence Scoring
    ↓
Learning Profile Updated (MongoDB)
```

---

## 📈 Model Output

### Prediction Format:
```json
{
  "success": true,
  "predictions": {
    "activeReflective": -5,
    "sensingIntuitive": 3,
    "visualVerbal": -7,
    "sequentialGlobal": 1
  },
  "confidence": {
    "activeReflective": 0.75,
    "sensingIntuitive": 0.82,
    "visualVerbal": 0.68,
    "sequentialGlobal": 0.79
  },
  "interpretation": {
    "activeReflective": "Moderate Active preference",
    "sensingIntuitive": "Balanced (slight Intuitive preference)",
    "visualVerbal": "Moderate Visual preference",
    "sequentialGlobal": "Balanced (slight Global preference)"
  }
}
```

### Score Interpretation:
- **-11 to -8**: Strong preference (first pole)
- **-7 to -4**: Moderate preference (first pole)
- **-3 to +3**: Balanced
- **+4 to +7**: Moderate preference (second pole)
- **+8 to +11**: Strong preference (second pole)

---

## 🛠️ Training Scripts

### 1. `train_models.py` - Base training
- Standard XGBoost training
- Basic hyperparameter tuning

### 2. `train_models_improved.py` - Enhanced training
- GridSearchCV with 5-fold CV
- Extended hyperparameter grid
- Feature importance analysis
- Better regularization

### 3. `train_models_fast.py` - Quick training
- Faster training for development
- Reduced hyperparameter search space

---

## 📊 Evaluation & Validation

### Available Scripts:
1. **`evaluate_models.py`** - Comprehensive model evaluation
2. **`check_model_accuracy.py`** - Quick accuracy check
3. **`compare_validation_methods.py`** - Compare different validation approaches

### Metrics Tracked:
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- R² Score
- Cross-validation scores
- Feature importance

---

## ⚠️ Current Issue

**Python Version Incompatibility**:
```
ModuleNotFoundError: No module named 'numpy._core'
```

**Cause**: Models were trained with Python 3.8+ and NumPy 1.20+, but you're running Python 3.6

**Solutions**:
1. Upgrade Python to 3.8+ (recommended)
2. Retrain models with Python 3.6 compatible libraries
3. Use a virtual environment with correct Python version

---

## 🚀 API Endpoints

### Flask Service (`ml-service/app.py`)

**Base URL**: `http://localhost:5000`

1. **GET /** - Service info
2. **GET /health** - Health check
3. **POST /predict** - Main prediction endpoint

### Example Request:
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "activeModeRatio": 0.6,
      "questionsGenerated": 15,
      "debatesParticipated": 3,
      ...
    }
  }'
```

---

## 📁 File Structure

```
ml-service/
├── app.py                          # Flask API server
├── requirements.txt                # Python dependencies
├── models/                         # Trained models (16 files)
│   ├── scaler.pkl
│   ├── active_reflective.pkl
│   └── ...
├── training/                       # Training scripts
│   ├── train_models.py
│   ├── train_models_improved.py
│   ├── train_models_fast.py
│   └── generate_synthetic_data.py
├── data/
│   └── training_data.csv          # 5000 samples
└── notebooks/
    └── FSLSM_Analysis.ipynb       # Jupyter analysis

src/
├── services/
│   ├── featureEngineeringService.js    # Feature extraction
│   └── mlClassificationService.js      # API client
└── utils/
    └── learningBehaviorTracker.js      # Behavior tracking
```

---

## 🎯 Key Strengths

1. **Real-time Classification**: Predicts learning styles from actual behavior
2. **Multi-dimensional**: Handles all 4 FSLSM dimensions independently
3. **Confidence Scoring**: Provides prediction confidence
4. **Interpretable**: Human-readable interpretations
5. **Scalable**: Separate models per dimension
6. **Validated**: Multiple validation approaches

---

## 📚 Documentation References

- `ML_SYSTEM_SUMMARY.md` - Complete system overview
- `ML_ACTUAL_PERFORMANCE_REPORT.md` - Performance metrics
- `ML_CORRECTED_DEFENSE_GUIDE.md` - Defense presentation guide
- `TRAINING_VS_USAGE.md` - Training vs inference guide
- `VALIDATION_TECHNIQUES_EXPLAINED.md` - Validation methods

---

**Last Updated**: November 5, 2025
**Model Version**: Improved (v3)
**Training Data**: 5,000 synthetic samples
**Production Status**: Active
