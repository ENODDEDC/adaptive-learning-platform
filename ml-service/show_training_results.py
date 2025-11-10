"""
Show Training Results - Display validation accuracy from trained models
This shows the ACTUAL validation set performance (not full dataset)
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error

def engineer_features(X, feature_cols):
    """Add engineered features (same as training script)"""
    df_features = pd.DataFrame(X, columns=feature_cols)
    
    # Ratio features
    df_features['active_reflective_ratio'] = df_features['activeModeRatio'] / (df_features['reflectiveModeRatio'] + 0.001)
    df_features['sensing_intuitive_ratio'] = df_features['sensingModeRatio'] / (df_features['intuitiveModeRatio'] + 0.001)
    df_features['visual_verbal_ratio'] = df_features['visualModeRatio'] / (df_features['verbalModeRatio'] + 0.001)
    df_features['sequential_global_ratio'] = df_features['sequentialModeRatio'] / (df_features['globalModeRatio'] + 0.001)
    
    # Intensity features
    df_features['active_intensity'] = df_features['questionsGenerated'] + df_features['debatesParticipated']
    df_features['reflective_intensity'] = df_features['reflectionsWritten'] + df_features['journalEntries']
    df_features['sensing_intensity'] = df_features['simulationsCompleted'] + df_features['challengesCompleted']
    df_features['intuitive_intensity'] = df_features['conceptsExplored'] + df_features['patternsDiscovered']
    df_features['visual_intensity'] = df_features['diagramsViewed'] + df_features['wireframesExplored']
    df_features['verbal_intensity'] = df_features['textRead'] + df_features['summariesCreated']
    df_features['sequential_intensity'] = df_features['stepsCompleted'] + df_features['linearNavigation']
    df_features['global_intensity'] = df_features['overviewsViewed'] + df_features['navigationJumps']
    
    # Squared features
    for col in ['activeModeRatio', 'sensingModeRatio', 'visualModeRatio', 'sequentialModeRatio']:
        df_features[f'{col}_squared'] = df_features[col] ** 2
    
    # AI interaction features
    if 'aiAskModeRatio' in df_features.columns:
        df_features['ai_active_interaction'] = df_features['aiAskModeRatio'] * df_features['activeModeRatio']
        df_features['ai_reflective_interaction'] = df_features['aiResearchModeRatio'] * df_features['reflectiveModeRatio']
        df_features['ai_sensing_interaction'] = df_features['aiTextToDocsRatio'] * df_features['sensingModeRatio']
    
    return df_features.values

def show_validation_results():
    """Show validation set accuracy (proper ML evaluation)"""
    
    print("=" * 70)
    print("📊 VALIDATION SET ACCURACY - Training Results")
    print("=" * 70)
    
    project_root = Path(__file__).parent
    models_dir = project_root / 'models'
    
    # Load data
    no_circular_path = project_root / 'data' / 'combined_training_data_NO_CIRCULAR.csv'
    
    if not no_circular_path.exists():
        print("\n❌ Dataset not found!")
        return
    
    print(f"\n📂 Loading: {no_circular_path.name}")
    df = pd.read_csv(no_circular_path)
    print(f"✅ Loaded {len(df):,} samples")
    
    # Prepare features
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
    X_engineered = engineer_features(X, feature_cols)
    
    # Split data THE SAME WAY as training (70/15/15, random_state=42)
    print(f"\n🔪 Splitting data (70% train, 15% val, 15% test, random_state=42)")
    
    # First split: 85% temp, 15% test
    X_temp, X_test = train_test_split(X_engineered, test_size=0.15, random_state=42)
    
    # Second split: 70% train, 15% val (0.176 of temp = 15% of total)
    X_train, X_val = train_test_split(X_temp, test_size=0.176, random_state=42)
    
    print(f"   Training samples: {len(X_train):,} ({len(X_train)/len(X_engineered)*100:.1f}%)")
    print(f"   Validation samples: {len(X_val):,} ({len(X_val)/len(X_engineered)*100:.1f}%)")
    print(f"   Test samples: {len(X_test):,} ({len(X_test)/len(X_engineered)*100:.1f}%)")
    
    # Load scaler and models
    scaler_path = models_dir / 'scaler_improved.pkl'
    if not scaler_path.exists():
        print("\n❌ Models not found! Run training first.")
        return
    
    scaler = joblib.load(scaler_path)
    X_val_scaled = scaler.transform(X_val)
    
    # Test each dimension on VALIDATION SET ONLY
    print(f"\n{'=' * 70}")
    print(f"🎯 VALIDATION SET PERFORMANCE (Held-Out Data)")
    print(f"{'=' * 70}")
    
    dimensions = {
        'activeReflective': 'active_reflective_improved.pkl',
        'sensingIntuitive': 'sensing_intuitive_improved.pkl',
        'visualVerbal': 'visual_verbal_improved.pkl',
        'sequentialGlobal': 'sequential_global_improved.pkl'
    }
    
    results = []
    
    for dim_name, model_file in dimensions.items():
        model_path = models_dir / model_file
        
        if not model_path.exists():
            print(f"\n⚠️ {dim_name}: Model not found")
            continue
        
        # Load model
        model = joblib.load(model_path)
        
        # Get validation labels (same split as training: 70/15/15)
        y_temp, y_test = train_test_split(df[dim_name].values, test_size=0.15, random_state=42)
        _, y_val = train_test_split(y_temp, test_size=0.176, random_state=42)
        
        # Predict on validation set
        y_pred = model.predict(X_val_scaled)
        
        # Calculate metrics
        mae = mean_absolute_error(y_val, y_pred)
        rmse = np.sqrt(mean_squared_error(y_val, y_pred))
        r2 = r2_score(y_val, y_pred)
        
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
        print(f"📈 VALIDATION SET AVERAGE (USE THIS FOR DEFENSE)")
        print(f"{'=' * 70}")
        print(f"Average R² Score: {avg_r2:.4f} ({avg_r2*100:.2f}% accuracy)")
        print(f"Average MAE: {avg_mae:.3f} points")
        print(f"Average RMSE: {avg_rmse:.3f} points")
        
        print(f"\n🎯 Interpretation:")
        if avg_r2 >= 0.90:
            print("✅ EXCELLENT - 90%+ accuracy")
        elif avg_r2 >= 0.80:
            print("✅ GOOD - 80-90% accuracy")
        elif avg_r2 >= 0.70:
            print("⚠️ ACCEPTABLE - 70-80% accuracy")
        else:
            print("❌ NEEDS IMPROVEMENT - <70% accuracy")
        
        print(f"\n{'=' * 70}")
        print(f"🎓 FOR YOUR DEFENSE:")
        print(f"{'=' * 70}")
        print(f"✅ Report: {avg_r2*100:.1f}% validation accuracy")
        print(f"✅ Explain: Tested on 15% held-out validation set ({len(X_val):,} samples)")
        print(f"✅ Emphasize: Proper ML evaluation (not training data)")
        print(f"✅ MAE: ±{avg_mae:.2f} points on FSLSM scale")
        
        print(f"\n💡 Why validation accuracy matters:")
        print(f"   - Training data: Model has seen this → inflated accuracy")
        print(f"   - Validation data: Model hasn't seen → true performance")
        print(f"   - This {avg_r2*100:.1f}% is honest and defensible")
    
    print(f"\n{'=' * 70}")
    print("✅ Validation results complete!")
    print(f"{'=' * 70}")

if __name__ == '__main__':
    show_validation_results()
