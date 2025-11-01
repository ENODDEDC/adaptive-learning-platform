# Retrain ML Models with AI Assistant Features

## What Changed
Added 3 new AI Assistant features to the ML pipeline:
- `aiAskModeRatio` - Active learning indicator
- `aiResearchModeRatio` - Reflective learning indicator
- `aiTextToDocsRatio` - Sensing learning indicator

**Total features: 24 → 27**

## Steps to Retrain

### 1. Generate New Training Data
```bash
cd ml-service
python training/generate_synthetic_data.py
```

**Expected output:**
```
Generating 2500 synthetic training samples...
Generated 500/2500 samples...
Generated 1000/2500 samples...
Generated 1500/2500 samples...
Generated 2000/2500 samples...
Generated 2500/2500 samples...

✅ Training data saved to: ml-service/data/training_data.csv
📊 Dataset shape: (2500, 31)  # 27 features + 4 labels
```

### 2. Train New Models
```bash
python training/train_models.py
```

**Expected output:**
```
🚀 FSLSM Model Training
📂 Loading training data from: ml-service/data/training_data.csv
✅ Loaded 2500 samples

📊 Dataset Info:
  Features: 27  # Updated from 24
  Samples: 2500
  Dimensions: 4

🎯 Training model for: activeReflective
  Train MAE: X.XXX, R²: X.XXX
  Val MAE: X.XXX, R²: X.XXX
  Test MAE: X.XXX, R²: X.XXX
✅ Model saved to: ml-service/models/active_reflective.pkl

[... similar for other 3 dimensions ...]

✅ Training complete!
```

### 3. Restart ML Service
```bash
# Stop current service (Ctrl+C)
python app.py
```

### 4. Test Classification
Go to your app and:
1. Use AI Assistant (Ask/Research/Text to Docs modes)
2. Use some learning modes
3. Go to `/settings` → Analytics
4. Check if AI Assistant usage shows up
5. Trigger classification (10+ interactions)
6. Check Learning Style Widget for updated predictions

## Verification

### Check Feature Count
The models should now expect 27 features instead of 24.

### Check Training Data
```bash
cd ml-service/data
# On Windows
type training_data.csv | findstr /C:"aiAskModeRatio"

# Should show the column exists
```

### Check Model Files
New model files should be created with timestamp:
- `ml-service/models/active_reflective.pkl`
- `ml-service/models/sensing_intuitive.pkl`
- `ml-service/models/visual_verbal.pkl`
- `ml-service/models/sequential_global.pkl`
- `ml-service/models/scaler.pkl`

## What the New Features Do

### aiAskModeRatio (Active/Reflective)
- **High value** → Active learner (prefers quick questions)
- **Low value** → Reflective learner (prefers deep exploration)

### aiResearchModeRatio (Active/Reflective)
- **High value** → Reflective learner (prefers research)
- **Low value** → Active learner (prefers immediate answers)

### aiTextToDocsRatio (Sensing/Intuitive)
- **High value** → Sensing learner (prefers practical outputs)
- **Low value** → Intuitive learner (prefers conceptual exploration)

## Expected Improvements

1. **Better classification** for students who use AI Assistant frequently
2. **More data points** for ML model (27 vs 24 features)
3. **Captures different behavior** not shown in 8 learning modes
4. **Complementary signals** that strengthen predictions

## Troubleshooting

### Error: "Feature mismatch"
- Make sure you generated new training data first
- Check that training_data.csv has 27 feature columns

### Error: "Module not found"
- Activate virtual environment: `venv\Scripts\activate`
- Install requirements: `pip install -r requirements.txt`

### Models not updating
- Check file timestamps in `ml-service/models/`
- Make sure training completed successfully
- Restart ML service after training

## Rollback (if needed)

If something goes wrong, you can rollback:
1. Restore old `training_data.csv` (24 features)
2. Retrain with old data
3. Remove AI Assistant features from `featureEngineeringService.js`

## Status

✅ Synthetic data generator updated
✅ Feature engineering updated
✅ Ready to generate new training data
⏳ Waiting for you to run training scripts
