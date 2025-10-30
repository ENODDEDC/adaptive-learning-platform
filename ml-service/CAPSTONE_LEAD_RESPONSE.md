# Response to Capstone Lead Questions

## Tanong 1: "Ano yung algorithm na ginamit mo para malabelan sila?"

### Rule-Based Labeling Algorithm

Ang synthetic data ay ginawa using **rule-based generation** based on FSLSM (Felder-Silverman Learning Style Model) theory:

#### Process:

1. **Generate Learning Style Profile (Labels)**
   - Random na generate ng scores para sa bawat dimension: -11 to +11
   - Ito ang "true" learning style ng synthetic user

2. **Generate Behavioral Features (Based on Profile)**
   
   Para sa **Active/Reflective**:
   - Kung Active (score < -3): 
     - High `activeModeRatio` (0.6-0.9)
     - Maraming `questionsGenerated` (15-50)
     - Maraming `debatesParticipated` (5-20)
   - Kung Reflective (score > 3):
     - High `reflectiveModeRatio` (0.6-0.9)
     - Maraming `reflectionsWritten` (10-40)
     - Maraming `journalEntries` (5-20)
   
   Para sa **Sensing/Intuitive**:
   - Kung Sensing (score < -3):
     - High `sensingModeRatio` (0.6-0.9)
     - Maraming `simulationsCompleted` (10-40)
     - Maraming `challengesCompleted` (8-30)
   - Kung Intuitive (score > 3):
     - High `intuitiveModeRatio` (0.6-0.9)
     - Maraming `conceptsExplored` (15-50)
     - Maraming `patternsDiscovered` (10-30)
   
   Para sa **Visual/Verbal**:
   - Kung Visual (score < -3):
     - High `visualModeRatio` (0.6-0.9)
     - Maraming `diagramsViewed` (20-60)
     - Maraming `wireframesExplored` (10-40)
   - Kung Verbal (score > 3):
     - High `verbalModeRatio` (0.6-0.9)
     - Maraming `textRead` (20-60)
     - Maraming `summariesCreated` (10-30)
   
   Para sa **Sequential/Global**:
   - Kung Sequential (score < -3):
     - High `sequentialModeRatio` (0.6-0.9)
     - Maraming `stepsCompleted` (25-70)
     - Maraming `linearNavigation` (30-80)
   - Kung Global (score > 3):
     - High `globalModeRatio` (0.6-0.9)
     - Maraming `overviewsViewed` (15-50)
     - Maraming `navigationJumps` (20-60)

3. **Add Realistic Noise**
   - Add Gaussian noise (5% ng value) para realistic
   - Para hindi perfect ang prediction (realistic sa real world)

---

## Tanong 2: "Tingin nga dataset features"

### Current Features (24 total)

#### Active/Reflective Features (6):
1. `activeModeRatio` - Ratio ng time sa active learning mode
2. `questionsGenerated` - Bilang ng questions na ginawa
3. `debatesParticipated` - Bilang ng debates na sinalihan
4. `reflectiveModeRatio` - Ratio ng time sa reflective mode
5. `reflectionsWritten` - Bilang ng reflections na sinulat
6. `journalEntries` - Bilang ng journal entries

#### Sensing/Intuitive Features (6):
7. `sensingModeRatio` - Ratio ng time sa sensing mode
8. `simulationsCompleted` - Bilang ng simulations na natapos
9. `challengesCompleted` - Bilang ng challenges na natapos
10. `intuitiveModeRatio` - Ratio ng time sa intuitive mode
11. `conceptsExplored` - Bilang ng concepts na inaral
12. `patternsDiscovered` - Bilang ng patterns na nadiscover

#### Visual/Verbal Features (6):
13. `visualModeRatio` - Ratio ng time sa visual mode
14. `diagramsViewed` - Bilang ng diagrams na tiningnan
15. `wireframesExplored` - Bilang ng wireframes na inaral
16. `verbalModeRatio` - Ratio ng time sa verbal mode
17. `textRead` - Bilang ng text content na binasa
18. `summariesCreated` - Bilang ng summaries na ginawa

#### Sequential/Global Features (6):
19. `sequentialModeRatio` - Ratio ng time sa sequential mode
20. `stepsCompleted` - Bilang ng steps na natapos
21. `linearNavigation` - Bilang ng linear navigation actions
22. `globalModeRatio` - Ratio ng time sa global mode
23. `overviewsViewed` - Bilang ng overviews na tiningnan
24. `navigationJumps` - Bilang ng navigation jumps

### Jupyter Notebook Available

Check `ml-service/notebooks/FSLSM_Analysis.ipynb` para sa:
- Complete dataset analysis
- Feature distributions
- Correlation heatmaps
- Detailed visualizations

---

## Tanong 3: "Ang baba tas ang onti pa ng datasets, dapat makuha mo yung 96%"

### Current Problem

**Current Performance:**
- Dataset: 500 samples
- Accuracy: ~85% R² (85% accuracy)
- Target: 96% R²

### Solutions Implemented

#### 1. ✅ Increase Dataset Size
```python
# OLD: 500 samples
# NEW: 2500 samples
python ml-service/training/generate_synthetic_data.py
```

#### 2. ✅ Feature Engineering
Added engineered features:
- **Ratio features**: `active_reflective_ratio`, `sensing_intuitive_ratio`, etc.
- **Intensity features**: `active_intensity`, `reflective_intensity`, etc.
- **Polynomial features**: `activeModeRatio_squared`, etc.
- **Total**: 24 original + 20 engineered = 44 features

#### 3. ✅ Hyperparameter Tuning
Using GridSearchCV to find best parameters:
- `max_depth`: [6, 8, 10]
- `learning_rate`: [0.05, 0.1, 0.15]
- `n_estimators`: [150, 200, 250]
- `subsample`: [0.8, 0.9]
- `colsample_bytree`: [0.8, 0.9]
- `min_child_weight`: [1, 3, 5]

#### 4. ✅ Improved Training Script
New file: `train_models_improved.py`

---

## How to Run Improved Version

### Step 1: Generate More Data (2500 samples)
```bash
cd ml-service
python training/generate_synthetic_data.py
```

### Step 2: Train Improved Models
```bash
python training/train_models_improved.py
```

Expected output:
- **Target**: 96%+ R² score
- **Features**: 44 total (24 original + 20 engineered)
- **Samples**: 2500
- **Method**: XGBoost with hyperparameter tuning

### Step 3: Analyze in Jupyter Notebook
```bash
jupyter notebook notebooks/FSLSM_Analysis.ipynb
```

---

## Expected Improvements

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dataset Size | 500 | 2500 | +400% |
| Features | 24 | 44 | +83% |
| Hyperparameters | Default | Tuned | +5-10% |
| Expected R² | 85% | 96%+ | +11%+ |

---

## Why This Will Work

1. **More Data = Better Learning**
   - 500 samples → 2500 samples
   - More examples para matuto ng patterns

2. **Better Features = Better Predictions**
   - Engineered features capture complex relationships
   - Ratio features show relative preferences
   - Polynomial features capture non-linear patterns

3. **Optimized Model = Better Performance**
   - GridSearchCV finds best hyperparameters
   - Cross-validation ensures generalization
   - Prevents overfitting

4. **Based on Research**
   - FSLSM is validated learning style model
   - Features aligned with educational psychology
   - Realistic behavioral patterns

---

## Files Created

1. `ml-service/notebooks/FSLSM_Analysis.ipynb` - Complete analysis
2. `ml-service/training/train_models_improved.py` - Improved training
3. `ml-service/training/generate_synthetic_data.py` - Updated (2500 samples)
4. This document - Explanation for capstone lead

---

## Next Steps

1. Run the improved training pipeline
2. Review Jupyter notebook analysis
3. If still below 96%, we can:
   - Increase to 5000 samples
   - Add ensemble methods (Random Forest + XGBoost + Neural Network)
   - Add more feature engineering
   - Try different algorithms (LightGBM, CatBoost)

---

## Questions?

Kung may tanong pa ang capstone lead, ready ako mag-explain ng:
- Algorithm details
- Feature engineering rationale
- Model architecture
- Performance metrics
- Real-world applicability
