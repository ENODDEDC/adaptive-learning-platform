# ML Service File Purposes

Quick reference for key ML service files.

---

## `app.py`
Flask API server for real-time FSLSM predictions. Loads trained XGBoost models (improved → base fallback), accepts 24 behavioral features via `/predict` endpoint, returns learning style scores (-11 to +11).

---

## `training/train_models.py`
Base/fallback training script. Uses 24 features (no AI Assistant), simple hyperparameters, achieves ~91% accuracy. Produces `scaler.pkl` and base models. Validation: Train/Val/Test split.

---

## `training/train_models_improved.py` ⭐
Primary production training script. Uses 27 base → 46 engineered features (includes AI Assistant), GridSearchCV + 5-Fold CV, targets 96%+ accuracy. Produces `scaler_improved.pkl` and improved models. Training time: 5-15 min.

---

## `training/train_models_fast.py`
Fast alternative to improved training. Same 46 features, pre-optimized hyperparameters (no grid search), simple Train/Val/Test split, targets 96%+ accuracy. Produces `scaler_fast.pkl` and fast models. Training time: 2-3 min.

---

## `evaluate_models.py`
Tests trained models without retraining. Loads existing models, reports R² score, MAE, RMSE for each dimension. Automatically detects improved vs base models and matches feature engineering.

---

**Quick Comparison:**

| File | Features | Validation | Time | Accuracy |
|------|----------|------------|------|----------|
| `train_models.py` | 24 | Train/Val/Test | 1-2 min | 91% |
| `train_models_improved.py` | 46 | GridSearchCV + 5-Fold CV | 5-15 min | 96%+ |
| `train_models_fast.py` | 46 | Train/Val/Test | 2-3 min | 96%+ |

**Production Workflow:** Train with `train_models_improved.py` → Verify with `evaluate_models.py` → Deploy with `app.py`
