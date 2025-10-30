"""
Export Real User Data from MongoDB for Model Retraining
Combines behavioral data + ILS questionnaire responses
"""

import pandas as pd
from pathlib import Path
import os
from pymongo import MongoClient
from datetime import datetime

def connect_to_mongodb():
    """Connect to MongoDB"""
    # Get MongoDB URI from environment or use default
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/assistive-learning')
    
    print(f"📡 Connecting to MongoDB...")
    client = MongoClient(mongodb_uri)
    db = client.get_database()
    print(f"✅ Connected to database: {db.name}\n")
    
    return db

def export_real_data(db, output_file='real_training_data.csv'):
    """Export real user data to CSV format matching synthetic data"""
    
    print("=" * 70)
    print("📊 EXPORTING REAL USER DATA")
    print("=" * 70)
    print()
    
    # Get collections
    behaviors = db['learningbehaviors']
    profiles = db['learningstyleprofiles']
    
    # Count documents
    behavior_count = behaviors.count_documents({})
    profile_count = profiles.count_documents({})
    
    print(f"📂 Found {behavior_count} behavior records")
    print(f"📂 Found {profile_count} learning style profiles")
    print()
    
    if behavior_count == 0 or profile_count == 0:
        print("⚠️  No real data found yet!")
        print("   Users need to:")
        print("   1. Use the system (behavior tracking)")
        print("   2. Take ILS questionnaire (ground truth labels)")
        print()
        return None
    
    # Fetch all data
    print("🔄 Fetching data from MongoDB...")
    behavior_data = list(behaviors.find({}))
    profile_data = list(profiles.find({}))
    
    # Create user ID to profile mapping
    profile_map = {}
    for profile in profile_data:
        if profile.get('classificationMethod') == 'questionnaire':
            # Only use profiles with questionnaire data (ground truth)
            user_id = str(profile['userId'])
            profile_map[user_id] = profile['dimensions']
    
    print(f"✅ Found {len(profile_map)} users with questionnaire data")
    print()
    
    if len(profile_map) == 0:
        print("⚠️  No users have completed the ILS questionnaire yet!")
        print("   Need questionnaire responses for ground truth labels")
        print()
        return None
    
    # Process behavioral data
    print("🔧 Processing behavioral data...")
    real_samples = []
    
    for behavior in behavior_data:
        user_id = str(behavior['userId'])
        
        # Only include users who have questionnaire data
        if user_id not in profile_map:
            continue
        
        # Extract features from behavior
        mode_usage = behavior.get('modeUsage', {})
        
        # Calculate total time
        total_time = sum([
            mode_usage.get('activeLearning', {}).get('totalTime', 0),
            mode_usage.get('reflectiveLearning', {}).get('totalTime', 0),
            mode_usage.get('sensingLearning', {}).get('totalTime', 0),
            mode_usage.get('intuitiveLearning', {}).get('totalTime', 0),
            mode_usage.get('visualLearning', {}).get('totalTime', 0),
            mode_usage.get('aiNarrator', {}).get('totalTime', 0),
            mode_usage.get('sequentialLearning', {}).get('totalTime', 0),
            mode_usage.get('globalLearning', {}).get('totalTime', 0)
        ])
        
        if total_time == 0:
            continue  # Skip users with no activity
        
        # Extract features (24 base features)
        sample = {
            # Active/Reflective features
            'activeModeRatio': mode_usage.get('activeLearning', {}).get('totalTime', 0) / total_time,
            'questionsGenerated': mode_usage.get('activeLearning', {}).get('interactions', 0),
            'debatesParticipated': mode_usage.get('activeLearning', {}).get('interactions', 0) * 0.3,  # Estimate
            'reflectiveModeRatio': mode_usage.get('reflectiveLearning', {}).get('totalTime', 0) / total_time,
            'reflectionsWritten': mode_usage.get('reflectiveLearning', {}).get('interactions', 0),
            'journalEntries': mode_usage.get('reflectiveLearning', {}).get('interactions', 0) * 0.5,  # Estimate
            
            # Sensing/Intuitive features
            'sensingModeRatio': mode_usage.get('sensingLearning', {}).get('totalTime', 0) / total_time,
            'simulationsCompleted': mode_usage.get('sensingLearning', {}).get('interactions', 0),
            'challengesCompleted': mode_usage.get('sensingLearning', {}).get('interactions', 0) * 0.7,  # Estimate
            'intuitiveModeRatio': mode_usage.get('intuitiveLearning', {}).get('totalTime', 0) / total_time,
            'conceptsExplored': mode_usage.get('intuitiveLearning', {}).get('interactions', 0),
            'patternsDiscovered': mode_usage.get('intuitiveLearning', {}).get('interactions', 0) * 0.6,  # Estimate
            
            # Visual/Verbal features
            'visualModeRatio': mode_usage.get('visualLearning', {}).get('totalTime', 0) / total_time,
            'diagramsViewed': mode_usage.get('visualLearning', {}).get('interactions', 0),
            'wireframesExplored': mode_usage.get('visualLearning', {}).get('interactions', 0) * 0.8,  # Estimate
            'verbalModeRatio': mode_usage.get('aiNarrator', {}).get('totalTime', 0) / total_time,
            'textRead': mode_usage.get('aiNarrator', {}).get('interactions', 0),
            'summariesCreated': mode_usage.get('aiNarrator', {}).get('interactions', 0) * 0.4,  # Estimate
            
            # Sequential/Global features
            'sequentialModeRatio': mode_usage.get('sequentialLearning', {}).get('totalTime', 0) / total_time,
            'stepsCompleted': mode_usage.get('sequentialLearning', {}).get('interactions', 0),
            'linearNavigation': mode_usage.get('sequentialLearning', {}).get('interactions', 0) * 1.2,  # Estimate
            'globalModeRatio': mode_usage.get('globalLearning', {}).get('totalTime', 0) / total_time,
            'overviewsViewed': mode_usage.get('globalLearning', {}).get('interactions', 0),
            'navigationJumps': mode_usage.get('globalLearning', {}).get('interactions', 0) * 0.9,  # Estimate
            
            # Labels from questionnaire (ground truth)
            'activeReflective': profile_map[user_id]['activeReflective'],
            'sensingIntuitive': profile_map[user_id]['sensingIntuitive'],
            'visualVerbal': profile_map[user_id]['visualVerbal'],
            'sequentialGlobal': profile_map[user_id]['sequentialGlobal']
        }
        
        real_samples.append(sample)
    
    print(f"✅ Processed {len(real_samples)} valid samples")
    print()
    
    if len(real_samples) == 0:
        print("⚠️  No valid samples found!")
        print("   Users need more interactions before data is useful")
        print()
        return None
    
    # Create DataFrame
    df = pd.DataFrame(real_samples)
    
    # Save to CSV
    output_path = Path(__file__).parent / 'data' / output_file
    df.to_csv(output_path, index=False)
    
    print("=" * 70)
    print("✅ EXPORT COMPLETE")
    print("=" * 70)
    print(f"📁 Saved to: {output_path}")
    print(f"📊 Total samples: {len(df)}")
    print(f"📊 Features: {len(df.columns) - 4} (+ 4 labels)")
    print()
    
    # Show sample statistics
    print("📈 Sample Statistics:")
    print(f"   Active/Reflective range: {df['activeReflective'].min():.1f} to {df['activeReflective'].max():.1f}")
    print(f"   Sensing/Intuitive range: {df['sensingIntuitive'].min():.1f} to {df['sensingIntuitive'].max():.1f}")
    print(f"   Visual/Verbal range: {df['visualVerbal'].min():.1f} to {df['visualVerbal'].max():.1f}")
    print(f"   Sequential/Global range: {df['sequentialGlobal'].min():.1f} to {df['sequentialGlobal'].max():.1f}")
    print()
    
    return output_path

def combine_datasets(synthetic_file='training_data.csv', real_file='real_training_data.csv', 
                     output_file='combined_training_data.csv', real_weight=2.0):
    """Combine synthetic and real data, giving more weight to real data"""
    
    print("=" * 70)
    print("🔗 COMBINING DATASETS")
    print("=" * 70)
    print()
    
    data_dir = Path(__file__).parent / 'data'
    
    # Load synthetic data
    synthetic_path = data_dir / synthetic_file
    if not synthetic_path.exists():
        print(f"❌ Synthetic data not found: {synthetic_path}")
        return None
    
    df_synthetic = pd.read_csv(synthetic_path)
    print(f"📂 Loaded synthetic data: {len(df_synthetic)} samples")
    
    # Load real data
    real_path = data_dir / real_file
    if not real_path.exists():
        print(f"⚠️  Real data not found: {real_path}")
        print(f"   Using synthetic data only")
        return synthetic_path
    
    df_real = pd.read_csv(real_path)
    print(f"📂 Loaded real data: {len(df_real)} samples")
    print()
    
    # Give more weight to real data by duplicating it
    if real_weight > 1.0:
        print(f"⚖️  Applying weight {real_weight}x to real data...")
        df_real_weighted = pd.concat([df_real] * int(real_weight), ignore_index=True)
        print(f"   Real data expanded: {len(df_real)} → {len(df_real_weighted)} samples")
    else:
        df_real_weighted = df_real
    
    # Combine datasets
    df_combined = pd.concat([df_synthetic, df_real_weighted], ignore_index=True)
    
    # Shuffle
    df_combined = df_combined.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save
    output_path = data_dir / output_file
    df_combined.to_csv(output_path, index=False)
    
    print()
    print("=" * 70)
    print("✅ COMBINATION COMPLETE")
    print("=" * 70)
    print(f"📁 Saved to: {output_path}")
    print(f"📊 Total samples: {len(df_combined)}")
    print(f"   - Synthetic: {len(df_synthetic)} ({len(df_synthetic)/len(df_combined)*100:.1f}%)")
    print(f"   - Real (weighted): {len(df_real_weighted)} ({len(df_real_weighted)/len(df_combined)*100:.1f}%)")
    print()
    
    return output_path

def main():
    """Main export function"""
    print("\n")
    print("=" * 70)
    print("🚀 REAL DATA EXPORT & COMBINATION TOOL")
    print("=" * 70)
    print()
    
    try:
        # Connect to MongoDB
        db = connect_to_mongodb()
        
        # Export real data
        real_data_path = export_real_data(db)
        
        if real_data_path:
            # Combine with synthetic data
            combined_path = combine_datasets(real_weight=2.0)
            
            if combined_path:
                print("🎯 NEXT STEPS:")
                print("   1. Review the combined dataset")
                print("   2. Run: python training/train_models_improved.py")
                print("   3. Use 'combined_training_data.csv' as input")
                print("   4. New models will have improved accuracy!")
                print()
        else:
            print("💡 TIP: Get users to:")
            print("   1. Use the system (generates behavioral data)")
            print("   2. Complete ILS questionnaire (provides ground truth)")
            print("   3. Then run this script again")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("💡 Make sure:")
        print("   1. MongoDB is running")
        print("   2. MONGODB_URI environment variable is set")
        print("   3. Database has data")
        print()

if __name__ == '__main__':
    main()
