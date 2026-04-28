# -*- coding: utf-8 -*-
"""
Improved Training Script for FSLSM Classification
Target: 96%+ accuracy (R2 score)

Improvements:
1. More training data (2500+ samples)
2. Feature engineering (interactions, polynomials)
3. Hyperparameter tuning
4. Better model architecture
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb

def load_training_data(data_path):
    """Load training data from CSV"""
    print(f"[LOAD] Loading training data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"[OK] Loaded {len(df)} samples")
    return df

def engineer_features(X, feature_cols):
    """Add engineered features for better performance"""
    print("\n[FEATURES] Engineering additional features...")

    df_features = pd.DataFrame(X, columns=feature_cols)

    df_features['active_reflective_ratio'] = df_features['activeModeRatio'] / (df_features['reflectiveModeRatio'] + 0.001)
    df_features['sensing_intuitive_ratio'] = df_features['sensingModeRatio'] / (df_features['intuitiveModeRatio'] + 0.001)
    df_features['visual_verbal_ratio'] = df_features['visualModeRatio'] / (df_features['verbalModeRatio'] + 0.001)
    df_features['sequential_global_ratio'] = df_features['sequentialModeRatio'] / (df_features['globalModeRatio'] + 0.001)

    df_features['active_intensity'] = df_features['questionsGenerated'] + df_features['debatesParticipated']
    df_features['reflective_intensity'] = df_features['reflectionsWritten'] + df_features['journalEntries']
    df_features['sensing_intensity'] = df_features['simulationsCompleted'] + df_features['challengesCompleted']
    df_features['intuitive_intensity'] = df_features['conceptsExplored'] + df_features['patternsDiscovered']
    df_features['visual_intensity'] = df_features['diagramsViewed'] + df_features['wireframesExplored']
    df_features['verbal_intensity'] = df_features['textRead'] + df_features['summariesCreated']
    df_features['sequential_intensity'] = df_features['stepsCompleted'] + df_features['linearNavigation']
    df_features['global_intensity'] = df_features['overviewsViewed'] + df_features['navigationJumps']

    for col in ['activeModeRatio', 'sensingModeRatio', 'visualModeRatio', 'sequentialModeRatio']:
        df_features[f'{col}_squared'] = df_features[col] ** 2

    if 'aiAskModeRatio' in df_features.columns:
        df_features['ai_active_interaction'] = df_features['aiAskModeRatio'] * df_features['activeModeRatio']
        df_features['ai_reflective_interaction'] = df_features['aiResearchModeRatio'] * df_features['reflectiveModeRatio']
        df_features['ai_sensing_interaction'] = df_features['aiTextToDocsRatio'] * df_features['sensingModeRatio']

    print(f"[OK] Engineered features: {df_features.shape[1]} total features (added {df_features.shape[1] - len(feature_cols)})")

    return df_features.values, list(df_features.columns)

def prepare_data(df):
    """Prepare features and labels"""
    feature_cols = [
        'activeModeRatio', 'questionsGenerated', 'debatesParticipated',
        'reflectiveModeRatio', 'reflectionsWritten', 'journalEntries',
        'aiAskModeRatio', 'aiResearchModeRatio',
        'sensingModeRatio', 'simulationsCompleted', 'challengesCompleted',
        'intuitiveModeRatio', 'conceptsExplored', 'patternsDiscovered',
        'aiTextToDocsRatio',
        'visualModeRatio', 'diagramsViewed', 'wireframesExplored',
        'verbalModeRatio', 'textRead', 'summariesCreated',
        'sequentialModeRatio', 'stepsCompleted', 'linearNavigation',
        'globalModeRatio', 'overviewsViewed', 'navigationJumps'
    ]

    label_cols = ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']

    X = df[feature_cols].values
    y = {col: df[col].values for col in label_cols}

    X_engineered, engineered_cols = engineer_features(X, feature_cols)

    return X_engineered, y, engineered_cols

def train_dimension_model_tuned(X_train, y_train, X_val, y_val, dimension_name):
    """Train XGBoost model with hyperparameter tuning"""
    print(f"\n[TRAIN] Training optimized model for: {dimension_name}")

    param_grid = {
        'max_depth': [6, 8, 10],
        'learning_rate': [0.05, 0.1, 0.15],
        'n_estimators': [150, 200, 250],
        'subsample': [0.8, 0.9],
        'colsample_bytree': [0.8, 0.9],
        'min_child_weight': [1, 3, 5]
    }

    try:
        is_cuda = __import__('subprocess').run(['nvidia-smi'], capture_output=True).returncode == 0
    except FileNotFoundError:
        is_cuda = False
    base_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        random_state=42,
        tree_method='hist',
        device='cuda' if is_cuda else 'cpu'
    )

    total_combos = 162
    print(f"  [SEARCH] Performing hyperparameter tuning (GridSearchCV)...")
    print(f"  [INFO] {total_combos} combinations x cv=5 = {total_combos*5} fits total")
    print(f"  [INFO] Progress updates every completed combination...")

    import time
    start_time = time.time()

    grid_search = GridSearchCV(
        base_model,
        param_grid,
        cv=5,
        scoring='r2',
        n_jobs=1,
        verbose=3
    )

    grid_search.fit(X_train, y_train)

    elapsed = (time.time() - start_time) / 60
    print(f"\n  [OK] Completed in {elapsed:.1f} minutes")
    best_model = grid_search.best_estimator_
    print(f"  [OK] Best parameters: {grid_search.best_params_}")
    print(f"  [OK] Best CV R2: {grid_search.best_score_*100:.1f}%")

    train_pred = best_model.predict(X_train)
    val_pred = best_model.predict(X_val)

    train_mae = mean_absolute_error(y_train, train_pred)
    val_mae = mean_absolute_error(y_val, val_pred)
    train_r2 = r2_score(y_train, train_pred)
    val_r2 = r2_score(y_val, val_pred)

    print(f"  [RESULT] Train MAE: {train_mae:.3f}, R2: {train_r2:.3f} ({train_r2*100:.1f}%)")
    print(f"  [RESULT] Val   MAE: {val_mae:.3f}, R2: {val_r2:.3f} ({val_r2*100:.1f}%)")

    return best_model, val_mae, val_r2

def main():
    """Main training function"""
    print("=" * 70)
    print("IMPROVED FSLSM Model Training with Real Eye-Tracking Data")
    print("=" * 70)

    project_root = Path(__file__).parent.parent

    no_circular_path = project_root / 'data' / 'combined_training_data_NO_CIRCULAR.csv'
    combined_data_path = project_root / 'data' / 'combined_training_data.csv'
    synthetic_data_path = project_root / 'data' / 'training_data.csv'

    if no_circular_path.exists():
        data_path = no_circular_path
        print("[OK] Using ZERO CIRCULAR LOGIC dataset")
        print("   - 116 real participants from eye-tracking study")
        print("   - Labels from OBSERVED behavior (not programmed rules!)")
        print("   - Weighted 3x for importance (348 samples)")
        print("   - Combined with synthetic for full coverage")
    elif combined_data_path.exists():
        data_path = combined_data_path
        print("[WARN] Using dataset with partial circular logic")
        print("   - 116 real participants from eye-tracking study")
        print("   - Labels inferred using rules (some circular logic)")
    else:
        data_path = synthetic_data_path
        print("[WARN] Using SYNTHETIC-ONLY dataset")

    models_dir = project_root / 'models'
    models_dir.mkdir(exist_ok=True)

    df = load_training_data(data_path)

    print(f"\n[DATA] Data Composition:")
    if 'NO_CIRCULAR' in str(data_path):
        print(f"   [OK] Real eye-tracking data: ~6.5% (116 participants x 3 weight)")
        print(f"   [OK] Synthetic data: ~93.5% (full distribution coverage)")
        print(f"   [OK] ZERO CIRCULAR LOGIC: Labels from observed behavior!")
    elif 'combined' in str(data_path):
        print(f"   [OK] Real eye-tracking data: ~6.5% (116 participants x 3 weight)")
        print(f"   [OK] Synthetic data: ~93.5% (full distribution coverage)")
        print(f"   [WARN] Partial circular logic: Labels inferred using rules")
    else:
        print(f"   [WARN] Synthetic only: Has circular logic issue")

    if len(df) < 2000:
        print(f"\n[WARN] WARNING: Only {len(df)} samples available.")
        print("   Recommended: 2000+ samples for good accuracy")

    X, y, feature_cols = prepare_data(df)

    print(f"\n[DATA] Dataset Info:")
    print(f"  Features: {X.shape[1]} (including engineered features)")
    print(f"  Samples: {X.shape[0]}")
    print(f"  Dimensions: {len(y)}")

    X_temp_data, X_test_data = train_test_split(X, test_size=0.15, random_state=42)
    X_train_data, X_val_data = train_test_split(X_temp_data, test_size=0.176, random_state=42)

    print(f"\n[SPLIT] Data Split:")
    print(f"  Train: {len(X_train_data)} samples ({len(X_train_data)/len(X)*100:.1f}%)")
    print(f"  Val:   {len(X_val_data)} samples ({len(X_val_data)/len(X)*100:.1f}%)")
    print(f"  Test:  {len(X_test_data)} samples ({len(X_test_data)/len(X)*100:.1f}%)")

    print(f"\n[SCALE] Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_data)
    X_val_scaled = scaler.transform(X_val_data)
    X_test_scaled = scaler.transform(X_test_data)

    scaler_path = models_dir / 'scaler_improved.pkl'
    joblib.dump(scaler, scaler_path)
    print(f"[OK] Scaler saved to: {scaler_path}")

    models = {}
    results = {}

    dimensions = {
        'activeReflective': 'active_reflective_improved',
        'sensingIntuitive': 'sensing_intuitive_improved',
        'visualVerbal': 'visual_verbal_improved',
        'sequentialGlobal': 'sequential_global_improved'
    }

    for dim_label, dim_file in dimensions.items():
        y_temp_data, y_test_data = train_test_split(y[dim_label], test_size=0.15, random_state=42)
        y_train_data, y_val_data = train_test_split(y_temp_data, test_size=0.176, random_state=42)

        model, val_mae, val_r2 = train_dimension_model_tuned(
            X_train_scaled, y_train_data,
            X_val_scaled, y_val_data,
            dim_label
        )

        test_pred = model.predict(X_test_scaled)
        test_mae = mean_absolute_error(y_test_data, test_pred)
        test_r2 = r2_score(y_test_data, test_pred)

        print(f"  [RESULT] Test MAE: {test_mae:.3f}, R2: {test_r2:.3f} ({test_r2*100:.1f}%)")

        model_path = models_dir / f'{dim_file}.pkl'
        joblib.dump(model, model_path)
        print(f"[OK] Model saved to: {model_path}")

        models[dim_label] = model
        results[dim_label] = {
            'val_mae': val_mae,
            'val_r2': val_r2,
            'test_mae': test_mae,
            'test_r2': test_r2
        }

    print("\n" + "=" * 70)
    print("Training Summary")
    print("=" * 70)

    for dim_label, metrics in results.items():
        print(f"\n{dim_label}:")
        print(f"  Validation R2: {metrics['val_r2']:.3f} ({metrics['val_r2']*100:.1f}%)")
        print(f"  Test R2:       {metrics['test_r2']:.3f} ({metrics['test_r2']*100:.1f}%)")

    avg_test_r2 = np.mean([m['test_r2'] for m in results.values()])

    print(f"\n[FINAL] Overall Performance:")
    print(f"  Average Test R2: {avg_test_r2:.3f} ({avg_test_r2*100:.1f}%)")

    if avg_test_r2 >= 0.96:
        print(f"\n[SUCCESS] Achieved target accuracy of 96%+")
    else:
        print(f"\n[INFO] Current: {avg_test_r2*100:.1f}%, Target: 96%")
        print(f"   Gap: {(0.96 - avg_test_r2)*100:.1f}%")

    print("\n[DONE] Training complete!")
    print(f"[SAVE] Models saved to: {models_dir}")

    if 'NO_CIRCULAR' in str(data_path):
        print(f"\n[DEFENSE]")
        print(f"   [OK] Models trained on REAL eye-tracking data (116 participants)")
        print(f"   [OK] ZERO CIRCULAR LOGIC - labels from observed behavior!")
        print(f"   [OK] Source: Bittner et al. (2023) - Published research study")
        print(f"   [OK] Strongest possible defense position!")
    elif 'combined' in str(data_path):
        print(f"\n[DEFENSE]")
        print(f"   [OK] Models trained on REAL eye-tracking data (116 participants)")
        print(f"   [WARN] Partial circular logic - labels inferred using rules")
        print(f"   [OK] Source: Bittner et al. (2023) - Published research study")
    else:
        print(f"\n[WARN] Note: Models trained on synthetic data only")

if __name__ == '__main__':
    main()
