"""
Simple script to check the accuracy of your trained models
Works with whichever models you have (base, fast, or improved)
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import os

def check_models():
    """Check which models exist and their accuracy"""
    
    print("=" * 70)
    print("🔍 CHECKING MODEL ACCURACY")
    print("=" * 70)
    
    project_root = Path(__file__).parent
    models_dir = project_root / 'models'
    data_path = project_root / 'data' / 'training_data.csv'
    
    # Check which model versions exist
    model_versions = []
    if (models_dir / 'scaler.pkl').exists():
        model_versions.append(('base', 'scaler.pkl', 24))
    if (models_dir / 'scaler_fast.pkl').exists():
        model_versions.append(('fast', 'scaler_fast.pkl', None))
    if (models_dir / 'scaler_improved.pkl').exists():
        model_versions.append(('improved', 'scaler_improved.pkl', 46))
    
    if not model_versions:
        print("❌ No trained models found!")
        return
    
    print(f"\n📦 Found {len(model_versions)} model version(s):")
    for version, scaler_file, features in model_versions:
        print(f"  - {version}: {scaler_file} ({features} features)" if features else f"  - {version}: {scaler_file}")
    
    # Load data
    print(f"\n📂 Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} samples")
    print(f"✅ Dataset has {len(df.columns)} columns")
    
    # Try each model version
    for version, scaler_file, expected_features in model_versions:
        print(f"\n{'=' * 70}")
        print(f"🎯 Testing {version.upper()} models")
        print(f"{'=' * 70}")
        
        try:
            # Load scaler
            scaler_path = models_dir / scaler_file
            scaler = joblib.load(scaler_path)
            print(f"✅ Loaded scaler: {scaler_file}")
            print(f"   Scaler expects {scaler.n_features_in_} features")
            
            # Prepare features based on scaler expectations
            n_features = scaler.n_features_in_
            
            # Get base features (first 27 columns, excluding labels)
            feature_cols = [col for col in df.columns if col not in ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']]
            
            if n_features == 24:
                # Base models - exclude AI features
                feature_cols = [col for col in feature_cols if 'ai' not in col.lower()][:24]
            elif n_features == 27:
                # Use all 27 features
                feature_cols = feature_cols[:27]
            elif n_features == 46:
                # Need to engineer features
                print("   ⚠️ This version needs feature engineering (46 features)")
                print("   Skipping for now - use train_models_improved.py to retrain")
                continue
            
            print(f"   Using {len(feature_cols)} features: {feature_cols[:5]}...")
            
            X = df[feature_cols].values
            y_labels = {
                'activeReflective': df['activeReflective'].values,
                'sensingIntuitive': df['sensingIntuitive'].values,
                'visualVerbal': df['visualVerbal'].values,
                'sequentialGlobal': df['sequentialGlobal'].values
            }
            
            # Scale features
            X_scaled = scaler.transform(X)
            
            # Load and test each dimension model
            dimensions = ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']
            model_files = {
                'activeReflective': f'active_reflective{"_" + version if version != "base" else ""}.pkl',
                'sensingIntuitive': f'sensing_intuitive{"_" + version if version != "base" else ""}.pkl',
                'visualVerbal': f'visual_verbal{"_" + version if version != "base" else ""}.pkl',
                'sequentialGlobal': f'sequential_global{"_" + version if version != "base" else ""}.pkl'
            }
            
            results = []
            
            for dim_name in dimensions:
                model_file = model_files[dim_name]
                model_path = models_dir / model_file
                
                if not model_path.exists():
                    print(f"\n⚠️ {dim_name}: Model file not found ({model_file})")
                    continue
                
                # Load model
                model = joblib.load(model_path)
                
                # Predict
                y_true = y_labels[dim_name]
                y_pred = model.predict(X_scaled)
                
                # Calculate metrics
                mae = mean_absolute_error(y_true, y_pred)
                rmse = np.sqrt(mean_squared_error(y_true, y_pred))
                r2 = r2_score(y_true, y_pred)
                
                results.append({
                    'dimension': dim_name,
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2,
                    'accuracy': r2 * 100
                })
                
                print(f"\n📊 {dim_name}:")
                print(f"   R² Score: {r2:.4f} ({r2*100:.2f}% accuracy)")
                print(f"   MAE: {mae:.3f} points")
                print(f"   RMSE: {rmse:.3f} points")
            
            if results:
                # Calculate averages
                avg_r2 = np.mean([r['r2'] for r in results])
                avg_mae = np.mean([r['mae'] for r in results])
                avg_rmse = np.mean([r['rmse'] for r in results])
                
                print(f"\n{'=' * 70}")
                print(f"📈 OVERALL RESULTS ({version.upper()} models):")
                print(f"{'=' * 70}")
                print(f"Average R² Score: {avg_r2:.4f} ({avg_r2*100:.2f}% accuracy)")
                print(f"Average MAE: {avg_mae:.3f} points")
                print(f"Average RMSE: {avg_rmse:.3f} points")
                print(f"\nInterpretation:")
                if avg_r2 >= 0.90:
                    print("✅ EXCELLENT - 90%+ accuracy")
                elif avg_r2 >= 0.80:
                    print("✅ GOOD - 80-90% accuracy")
                elif avg_r2 >= 0.70:
                    print("⚠️ ACCEPTABLE - 70-80% accuracy")
                else:
                    print("❌ NEEDS IMPROVEMENT - <70% accuracy")
                
        except Exception as e:
            print(f"❌ Error testing {version} models: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'=' * 70}")
    print("✅ Model accuracy check complete!")
    print(f"{'=' * 70}")

if __name__ == '__main__':
    check_models()
