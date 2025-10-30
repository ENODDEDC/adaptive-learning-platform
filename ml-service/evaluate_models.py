"""
Evaluate Trained Models Without Retraining
Loads existing models and displays their performance metrics
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.model_selection import train_test_split

def load_data():
    """Load training data"""
    project_root = Path(__file__).parent
    data_path = project_root / 'data' / 'training_data.csv'
    
    print("📂 Loading training data...")
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} samples\n")
    
    return df

def engineer_features(X, feature_cols):
    """Add engineered features (same as training)"""
    df_features = pd.DataFrame(X, columns=feature_cols)
    
    # Add interaction features (ratio features)
    df_features['active_reflective_ratio'] = df_features['activeModeRatio'] / (df_features['reflectiveModeRatio'] + 0.001)
    df_features['sensing_intuitive_ratio'] = df_features['sensingModeRatio'] / (df_features['intuitiveModeRatio'] + 0.001)
    df_features['visual_verbal_ratio'] = df_features['visualModeRatio'] / (df_features['verbalModeRatio'] + 0.001)
    df_features['sequential_global_ratio'] = df_features['sequentialModeRatio'] / (df_features['globalModeRatio'] + 0.001)
    
    # Add activity intensity features
    df_features['active_intensity'] = df_features['questionsGenerated'] + df_features['debatesParticipated']
    df_features['reflective_intensity'] = df_features['reflectionsWritten'] + df_features['journalEntries']
    df_features['sensing_intensity'] = df_features['simulationsCompleted'] + df_features['challengesCompleted']
    df_features['intuitive_intensity'] = df_features['conceptsExplored'] + df_features['patternsDiscovered']
    df_features['visual_intensity'] = df_features['diagramsViewed'] + df_features['wireframesExplored']
    df_features['verbal_intensity'] = df_features['textRead'] + df_features['summariesCreated']
    df_features['sequential_intensity'] = df_features['stepsCompleted'] + df_features['linearNavigation']
    df_features['global_intensity'] = df_features['overviewsViewed'] + df_features['navigationJumps']
    
    # Add squared features for non-linear relationships
    for col in ['activeModeRatio', 'sensingModeRatio', 'visualModeRatio', 'sequentialModeRatio']:
        df_features[f'{col}_squared'] = df_features[col] ** 2
    
    return df_features.values, list(df_features.columns)

def prepare_features(df, use_engineered=True):
    """Prepare features (same as training)"""
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
    
    label_cols = ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']
    
    X = df[feature_cols].values
    y = {col: df[col].values for col in label_cols}
    
    # Add engineered features if using improved models
    if use_engineered:
        X, feature_cols = engineer_features(X, feature_cols)
        print(f"✅ Engineered features: {len(feature_cols)} total features")
    
    return X, y, feature_cols

def evaluate_model(model_name, model, scaler, X_test, y_test):
    """Evaluate a single model"""
    # Scale features
    X_test_scaled = scaler.transform(X_test)
    
    # Predict
    y_pred = model.predict(X_test_scaled)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    return {
        'mae': mae,
        'mse': mse,
        'rmse': rmse,
        'r2': r2,
        'accuracy_percent': r2 * 100
    }

def main():
    """Main evaluation function"""
    print("=" * 70)
    print("🔍 MODEL EVALUATION - Checking Actual Accuracy")
    print("=" * 70)
    print()
    
    project_root = Path(__file__).parent
    models_dir = project_root / 'models'
    
    # Check which models exist first
    print("🔍 Checking for trained models...")
    
    # Try improved models first
    model_files = {
        'activeReflective': 'active_reflective_improved.pkl',
        'sensingIntuitive': 'sensing_intuitive_improved.pkl',
        'visualVerbal': 'visual_verbal_improved.pkl',
        'sequentialGlobal': 'sequential_global_improved.pkl'
    }
    scaler_file = 'scaler_improved.pkl'
    use_engineered = True
    
    # Check if improved models exist
    improved_exist = all((models_dir / f).exists() for f in model_files.values())
    improved_scaler_exists = (models_dir / scaler_file).exists()
    
    if not improved_exist or not improved_scaler_exists:
        print("⚠️  Improved models not found, checking for regular models...")
        model_files = {
            'activeReflective': 'active_reflective.pkl',
            'sensingIntuitive': 'sensing_intuitive.pkl',
            'visualVerbal': 'visual_verbal.pkl',
            'sequentialGlobal': 'sequential_global.pkl'
        }
        scaler_file = 'scaler.pkl'
        use_engineered = False
    else:
        print("✅ Found improved models (with engineered features)")
    
    # Load data
    df = load_data()
    X, y, feature_cols = prepare_features(df, use_engineered=use_engineered)
    
    # Split data (same as training)
    print("📊 Splitting data (70% train, 15% val, 15% test)...")
    X_temp, X_test = train_test_split(X, test_size=0.15, random_state=42)
    print(f"   Test set: {len(X_test)} samples")
    print(f"   Features: {X_test.shape[1]}\n")
    
    # Load scaler
    scaler_path = models_dir / scaler_file
    if not scaler_path.exists():
        print(f"❌ Scaler not found at {scaler_path}")
        print("   Please train models first using train_models.py")
        return
    
    print(f"✅ Loading scaler: {scaler_file}")
    scaler = joblib.load(scaler_path)
    
    # Load and evaluate each model
    print("\n" + "=" * 70)
    print("📈 EVALUATION RESULTS")
    print("=" * 70)
    print()
    
    results = {}
    
    for dim_name, model_file in model_files.items():
        model_path = models_dir / model_file
        
        if not model_path.exists():
            print(f"❌ Model not found: {model_file}")
            continue
        
        print(f"🎯 Evaluating: {dim_name}")
        print(f"   Model: {model_file}")
        
        # Load model
        model = joblib.load(model_path)
        
        # Split labels
        y_temp, y_test_dim = train_test_split(y[dim_name], test_size=0.15, random_state=42)
        
        # Evaluate
        metrics = evaluate_model(dim_name, model, scaler, X_test, y_test_dim)
        results[dim_name] = metrics
        
        # Display results
        print(f"   📊 R² Score: {metrics['r2']:.4f} ({metrics['accuracy_percent']:.2f}%)")
        print(f"   📊 MAE: {metrics['mae']:.3f} points")
        print(f"   📊 RMSE: {metrics['rmse']:.3f} points")
        print()
    
    # Summary
    if results:
        print("=" * 70)
        print("📊 SUMMARY")
        print("=" * 70)
        print()
        
        avg_r2 = np.mean([m['r2'] for m in results.values()])
        avg_mae = np.mean([m['mae'] for m in results.values()])
        avg_rmse = np.mean([m['rmse'] for m in results.values()])
        
        print(f"Average R² Score: {avg_r2:.4f} ({avg_r2*100:.2f}%)")
        print(f"Average MAE: {avg_mae:.3f} points")
        print(f"Average RMSE: {avg_rmse:.3f} points")
        print()
        
        # Interpretation
        print("=" * 70)
        print("💡 INTERPRETATION")
        print("=" * 70)
        print()
        
        if avg_r2 >= 0.90:
            print("✅ EXCELLENT: Models explain >90% of variance")
        elif avg_r2 >= 0.80:
            print("✅ GOOD: Models explain >80% of variance")
        elif avg_r2 >= 0.70:
            print("⚠️  ACCEPTABLE: Models explain >70% of variance")
        else:
            print("❌ NEEDS IMPROVEMENT: Models explain <70% of variance")
        
        print(f"\nOn FSLSM scale (-11 to +11):")
        print(f"  Average prediction error: ±{avg_mae:.2f} points")
        print(f"  Error percentage: {(avg_mae/22)*100:.1f}%")
        print()
        
        # Detailed table
        print("=" * 70)
        print("📋 DETAILED RESULTS TABLE")
        print("=" * 70)
        print()
        print(f"{'Dimension':<20} {'R² Score':<12} {'Accuracy %':<12} {'MAE':<10}")
        print("-" * 70)
        for dim_name, metrics in results.items():
            print(f"{dim_name:<20} {metrics['r2']:<12.4f} {metrics['accuracy_percent']:<12.2f} {metrics['mae']:<10.3f}")
        print("-" * 70)
        print(f"{'AVERAGE':<20} {avg_r2:<12.4f} {avg_r2*100:<12.2f} {avg_mae:<10.3f}")
        print()
    
    print("✅ Evaluation complete!")
    print()

if __name__ == '__main__':
    main()
