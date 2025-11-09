"""
Combine Multiple Training Datasets
Merges synthetic, eye-tracking, and real user data with appropriate weighting
"""

import pandas as pd
import numpy as np
from pathlib import Path

def load_dataset(filename, dataset_name):
    """Load a dataset if it exists"""
    data_path = Path(__file__).parent / 'data' / filename
    
    if not data_path.exists():
        print(f"⚠️  {dataset_name} not found: {filename}")
        return None
    
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {dataset_name}: {len(df)} samples")
    return df

def combine_datasets(
    synthetic_file='training_data.csv',
    eye_tracking_file='eye_tracking_training_data_NO_CIRCULAR.csv',  # ZERO CIRCULAR LOGIC VERSION
    real_user_file='real_training_data.csv',
    output_file='combined_training_data_NO_CIRCULAR.csv',  # NEW OUTPUT FILE
    synthetic_weight=1.0,
    eye_tracking_weight=3.0,
    real_user_weight=5.0
):
    """
    Combine multiple datasets with different weights
    
    Weighting rationale:
    - Synthetic data (1x): Baseline, covers full distribution
    - Eye-tracking data (3x): Real behavioral patterns from research study
    - Real user data (5x): Most valuable, actual system usage
    """
    
    print("\n")
    print("=" * 70)
    print("🔗 COMBINING TRAINING DATASETS")
    print("=" * 70)
    print()
    
    datasets = []
    weights = []
    names = []
    
    # Load synthetic data
    df_synthetic = load_dataset(synthetic_file, "Synthetic Data")
    if df_synthetic is not None:
        datasets.append(df_synthetic)
        weights.append(synthetic_weight)
        names.append("Synthetic")
    
    # Load eye-tracking data
    df_eye_tracking = load_dataset(eye_tracking_file, "Eye-Tracking Data")
    if df_eye_tracking is not None:
        datasets.append(df_eye_tracking)
        weights.append(eye_tracking_weight)
        names.append("Eye-Tracking")
    
    # Load real user data
    df_real_user = load_dataset(real_user_file, "Real User Data")
    if df_real_user is not None:
        datasets.append(df_real_user)
        weights.append(real_user_weight)
        names.append("Real User")
    
    print()
    
    if len(datasets) == 0:
        print("❌ No datasets found to combine!")
        print()
        print("💡 Available datasets:")
        print(f"   - {synthetic_file} (synthetic)")
        print(f"   - {eye_tracking_file} (eye-tracking)")
        print(f"   - {real_user_file} (real users)")
        print()
        return None
    
    if len(datasets) == 1:
        print(f"⚠️  Only one dataset available: {names[0]}")
        print("   Using it without combination")
        combined_df = datasets[0]
    else:
        # Apply weights by duplicating datasets
        print("⚖️  APPLYING WEIGHTS")
        print("=" * 70)
        
        weighted_datasets = []
        for df, weight, name in zip(datasets, weights, names):
            if weight > 1.0:
                df_weighted = pd.concat([df] * int(weight), ignore_index=True)
                print(f"   {name}: {len(df)} → {len(df_weighted)} samples ({weight}x weight)")
            else:
                df_weighted = df
                print(f"   {name}: {len(df)} samples (1x weight)")
            weighted_datasets.append(df_weighted)
        
        print()
        
        # Combine all datasets
        print("🔄 COMBINING DATASETS")
        print("=" * 70)
        combined_df = pd.concat(weighted_datasets, ignore_index=True)
        print(f"✅ Combined: {len(combined_df)} total samples")
        print()
    
    # Shuffle the combined dataset
    print("🔀 Shuffling combined dataset...")
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Validate data quality
    print()
    print("🔍 DATA QUALITY CHECK")
    print("=" * 70)
    
    # Check for missing values
    missing_count = combined_df.isnull().sum().sum()
    if missing_count > 0:
        print(f"⚠️  Found {missing_count} missing values")
        print("   Filling with zeros...")
        combined_df = combined_df.fillna(0)
    else:
        print("✅ No missing values")
    
    # Check label distributions
    print()
    print("📊 LABEL DISTRIBUTIONS")
    print("=" * 70)
    
    for dimension in ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']:
        mean_val = combined_df[dimension].mean()
        std_val = combined_df[dimension].std()
        min_val = combined_df[dimension].min()
        max_val = combined_df[dimension].max()
        
        print(f"   {dimension}:")
        print(f"      Range: [{min_val:.1f}, {max_val:.1f}]")
        print(f"      Mean: {mean_val:.2f} ± {std_val:.2f}")
    
    print()
    
    # Save combined dataset
    output_path = Path(__file__).parent / 'data' / output_file
    combined_df.to_csv(output_path, index=False)
    
    print("=" * 70)
    print("✅ COMBINATION COMPLETE")
    print("=" * 70)
    print(f"📁 Saved to: {output_path}")
    print(f"📊 Total samples: {len(combined_df)}")
    print()
    
    # Show composition breakdown
    if len(datasets) > 1:
        print("📈 DATASET COMPOSITION")
        print("=" * 70)
        total_samples = len(combined_df)
        
        for df, weight, name in zip(datasets, weights, names):
            weighted_count = len(df) * int(weight) if weight > 1.0 else len(df)
            percentage = (weighted_count / total_samples) * 100
            print(f"   {name}: {weighted_count} samples ({percentage:.1f}%)")
        
        print()
    
    return output_path

def main():
    """Main combination function"""
    
    print("\n")
    print("=" * 70)
    print("🚀 DATASET COMBINATION TOOL")
    print("=" * 70)
    print()
    
    try:
        # Combine datasets with appropriate weights
        combined_path = combine_datasets(
            synthetic_weight=1.0,      # Baseline coverage
            eye_tracking_weight=3.0,   # Real behavioral patterns
            real_user_weight=5.0       # Most valuable
        )
        
        if combined_path:
            print("🎯 NEXT STEPS:")
            print("=" * 70)
            print("   1. Review the combined dataset:")
            print(f"      {combined_path}")
            print()
            print("   2. Retrain models with combined data:")
            print("      python ml-service/training/train_models_improved.py")
            print()
            print("   3. Evaluate model performance:")
            print("      python ml-service/evaluate_models.py")
            print()
            print("   4. Compare with previous models:")
            print("      python ml-service/check_model_accuracy.py")
            print()
            print("💡 Expected improvements:")
            print("   - Better generalization (real behavioral patterns)")
            print("   - Higher accuracy (116 real participants)")
            print("   - More robust predictions (diverse data sources)")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        print()

if __name__ == '__main__':
    main()
