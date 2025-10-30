"""
Train XGBoost Models for FSLSM Classification
Trains separate models for each learning style dimension
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb

def load_training_data(data_path):
    """Load training data from CSV"""
    print(f"📂 Loading training data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} samples")
    return df

def prepare_data(df):
    """Prepare features and labels"""
    # Feature columns (24 behavioral features)
    feature_cols = [
        'activeModeRatio', 'questionsGenerated', 'debatesParticipated',
        'reflectiveModeRatio', 'reflectionsWritten', 'journalEntries',
        'sensingModeRatio', 'simulationsCompleted', 'challengesCompleted',
        'intuitiveModeRatio', 'conceptsExplored', 'patternsDiscovered',
        'visualModeRatio', 'diagramsViewed', 'wireframesExplored',
        'verbalModeRatio', 'textRead', 'summariesCreated',
        'sequentialModeRatio', 'stepsCompleted', 'linearNavigation',
        'globalModeRatio', 'overviewsViewed', 'navigationJumps'
    ]
    
    # Label columns (4 FSLSM dimensions)
    label_cols = ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']
    
    X = df[feature_cols].values
    y = {col: df[col].values for col in label_cols}
    
    return X, y, feature_cols

def train_dimension_model(X_train, y_train, X_val, y_val, dimension_name):
    """Train XGBoost model for a single dimension"""
    print(f"\n🎯 Training model for: {dimension_name}")
    
    # XGBoost parameters
    params = {
        'objective': 'reg:squarederror',
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': 42
    }
    
    # Create and train model with early stopping
    model = xgb.XGBRegressor(**params, early_stopping_rounds=10)
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    # Evaluate
    train_pred = model.predict(X_train)
    val_pred = model.predict(X_val)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    val_mae = mean_absolute_error(y_val, val_pred)
    train_r2 = r2_score(y_train, train_pred)
    val_r2 = r2_score(y_val, val_pred)
    
    print(f"  Train MAE: {train_mae:.3f}, R²: {train_r2:.3f}")
    print(f"  Val MAE: {val_mae:.3f}, R²: {val_r2:.3f}")
    
    return model, val_mae, val_r2

def main():
    """Main training function"""
    print("=" * 60)
    print("🚀 FSLSM Model Training")
    print("=" * 60)
    
    # Paths
    project_root = Path(__file__).parent.parent
    data_path = project_root / 'data' / 'training_data.csv'
    models_dir = project_root / 'models'
    models_dir.mkdir(exist_ok=True)
    
    # Load data
    df = load_training_data(data_path)
    
    # Prepare features and labels
    X, y, feature_cols = prepare_data(df)
    
    print(f"\n📊 Dataset Info:")
    print(f"  Features: {X.shape[1]}")
    print(f"  Samples: {X.shape[0]}")
    print(f"  Dimensions: {len(y)}")
    
    # Split data (70% train, 15% val, 15% test)
    X_temp, X_test, y_temp, y_test = {}, {}, {}, {}
    X_train, X_val, y_train, y_val = {}, {}, {}, {}
    
    # First split: 85% temp, 15% test
    X_temp_data, X_test_data = train_test_split(X, test_size=0.15, random_state=42)
    
    # Second split: 70% train, 15% val (from the 85% temp)
    X_train_data, X_val_data = train_test_split(X_temp_data, test_size=0.176, random_state=42)  # 0.176 * 0.85 ≈ 0.15
    
    print(f"\n📈 Data Split:")
    print(f"  Train: {len(X_train_data)} samples ({len(X_train_data)/len(X)*100:.1f}%)")
    print(f"  Val: {len(X_val_data)} samples ({len(X_val_data)/len(X)*100:.1f}%)")
    print(f"  Test: {len(X_test_data)} samples ({len(X_test_data)/len(X)*100:.1f}%)")
    
    # Scale features
    print(f"\n⚙️ Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_data)
    X_val_scaled = scaler.transform(X_val_data)
    X_test_scaled = scaler.transform(X_test_data)
    
    # Save scaler
    scaler_path = models_dir / 'scaler.pkl'
    joblib.dump(scaler, scaler_path)
    print(f"✅ Scaler saved to: {scaler_path}")
    
    # Train models for each dimension
    models = {}
    results = {}
    
    dimensions = {
        'activeReflective': 'active_reflective',
        'sensingIntuitive': 'sensing_intuitive',
        'visualVerbal': 'visual_verbal',
        'sequentialGlobal': 'sequential_global'
    }
    
    for dim_label, dim_file in dimensions.items():
        # Split labels
        y_temp_data, y_test_data = train_test_split(y[dim_label], test_size=0.15, random_state=42)
        y_train_data, y_val_data = train_test_split(y_temp_data, test_size=0.176, random_state=42)
        
        # Train model
        model, val_mae, val_r2 = train_dimension_model(
            X_train_scaled, y_train_data,
            X_val_scaled, y_val_data,
            dim_label
        )
        
        # Test evaluation
        test_pred = model.predict(X_test_scaled)
        test_mae = mean_absolute_error(y_test_data, test_pred)
        test_r2 = r2_score(y_test_data, test_pred)
        
        print(f"  Test MAE: {test_mae:.3f}, R²: {test_r2:.3f}")
        
        # Save model
        model_path = models_dir / f'{dim_file}.pkl'
        joblib.dump(model, model_path)
        print(f"✅ Model saved to: {model_path}")
        
        models[dim_label] = model
        results[dim_label] = {
            'val_mae': val_mae,
            'val_r2': val_r2,
            'test_mae': test_mae,
            'test_r2': test_r2
        }
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Training Summary")
    print("=" * 60)
    
    for dim_label, metrics in results.items():
        print(f"\n{dim_label}:")
        print(f"  Validation MAE: {metrics['val_mae']:.3f}")
        print(f"  Validation R²: {metrics['val_r2']:.3f}")
        print(f"  Test MAE: {metrics['test_mae']:.3f}")
        print(f"  Test R²: {metrics['test_r2']:.3f}")
    
    avg_test_mae = np.mean([m['test_mae'] for m in results.values()])
    avg_test_r2 = np.mean([m['test_r2'] for m in results.values()])
    
    print(f"\n🎯 Overall Performance:")
    print(f"  Average Test MAE: {avg_test_mae:.3f}")
    print(f"  Average Test R²: {avg_test_r2:.3f}")
    
    print("\n✅ Training complete!")
    print(f"📁 Models saved to: {models_dir}")

if __name__ == '__main__':
    main()
