"""
Generate Synthetic Training Data for FSLSM Classification
Creates realistic behavioral data with known learning style labels
"""

import numpy as np
import pandas as pd
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

def generate_learning_style_profile():
    """Generate a random learning style profile"""
    return {
        'activeReflective': np.random.randint(-11, 12),
        'sensingIntuitive': np.random.randint(-11, 12),
        'visualVerbal': np.random.randint(-11, 12),
        'sequentialGlobal': np.random.randint(-11, 12)
    }

def generate_features_from_profile(profile):
    """Generate behavioral features that align with learning style profile"""
    features = {}
    
    # Active/Reflective Features
    if profile['activeReflective'] < -3:  # Active preference
        features['activeModeRatio'] = np.random.uniform(0.6, 0.9)
        features['questionsGenerated'] = np.random.randint(15, 50)
        features['debatesParticipated'] = np.random.randint(5, 20)
        features['reflectiveModeRatio'] = 1 - features['activeModeRatio']
        features['reflectionsWritten'] = np.random.randint(0, 10)
        features['journalEntries'] = np.random.randint(0, 5)
    elif profile['activeReflective'] > 3:  # Reflective preference
        features['activeModeRatio'] = np.random.uniform(0.1, 0.4)
        features['questionsGenerated'] = np.random.randint(0, 15)
        features['debatesParticipated'] = np.random.randint(0, 5)
        features['reflectiveModeRatio'] = 1 - features['activeModeRatio']
        features['reflectionsWritten'] = np.random.randint(10, 40)
        features['journalEntries'] = np.random.randint(5, 20)
    else:  # Balanced
        features['activeModeRatio'] = np.random.uniform(0.4, 0.6)
        features['questionsGenerated'] = np.random.randint(5, 25)
        features['debatesParticipated'] = np.random.randint(2, 10)
        features['reflectiveModeRatio'] = 1 - features['activeModeRatio']
        features['reflectionsWritten'] = np.random.randint(5, 20)
        features['journalEntries'] = np.random.randint(2, 10)
    
    # Sensing/Intuitive Features
    if profile['sensingIntuitive'] < -3:  # Sensing preference
        features['sensingModeRatio'] = np.random.uniform(0.6, 0.9)
        features['simulationsCompleted'] = np.random.randint(10, 40)
        features['challengesCompleted'] = np.random.randint(8, 30)
        features['intuitiveModeRatio'] = 1 - features['sensingModeRatio']
        features['conceptsExplored'] = np.random.randint(0, 10)
        features['patternsDiscovered'] = np.random.randint(0, 5)
    elif profile['sensingIntuitive'] > 3:  # Intuitive preference
        features['sensingModeRatio'] = np.random.uniform(0.1, 0.4)
        features['simulationsCompleted'] = np.random.randint(0, 10)
        features['challengesCompleted'] = np.random.randint(0, 8)
        features['intuitiveModeRatio'] = 1 - features['sensingModeRatio']
        features['conceptsExplored'] = np.random.randint(15, 50)
        features['patternsDiscovered'] = np.random.randint(10, 30)
    else:  # Balanced
        features['sensingModeRatio'] = np.random.uniform(0.4, 0.6)
        features['simulationsCompleted'] = np.random.randint(5, 20)
        features['challengesCompleted'] = np.random.randint(4, 15)
        features['intuitiveModeRatio'] = 1 - features['sensingModeRatio']
        features['conceptsExplored'] = np.random.randint(5, 25)
        features['patternsDiscovered'] = np.random.randint(3, 15)
    
    # Visual/Verbal Features
    if profile['visualVerbal'] < -3:  # Visual preference
        features['visualModeRatio'] = np.random.uniform(0.6, 0.9)
        features['diagramsViewed'] = np.random.randint(20, 60)
        features['wireframesExplored'] = np.random.randint(10, 40)
        features['verbalModeRatio'] = 1 - features['visualModeRatio']
        features['textRead'] = np.random.randint(0, 15)
        features['summariesCreated'] = np.random.randint(0, 8)
    elif profile['visualVerbal'] > 3:  # Verbal preference
        features['visualModeRatio'] = np.random.uniform(0.1, 0.4)
        features['diagramsViewed'] = np.random.randint(0, 20)
        features['wireframesExplored'] = np.random.randint(0, 10)
        features['verbalModeRatio'] = 1 - features['visualModeRatio']
        features['textRead'] = np.random.randint(20, 60)
        features['summariesCreated'] = np.random.randint(10, 30)
    else:  # Balanced
        features['visualModeRatio'] = np.random.uniform(0.4, 0.6)
        features['diagramsViewed'] = np.random.randint(10, 35)
        features['wireframesExplored'] = np.random.randint(5, 20)
        features['verbalModeRatio'] = 1 - features['visualModeRatio']
        features['textRead'] = np.random.randint(10, 35)
        features['summariesCreated'] = np.random.randint(5, 18)
    
    # Sequential/Global Features
    if profile['sequentialGlobal'] < -3:  # Sequential preference
        features['sequentialModeRatio'] = np.random.uniform(0.6, 0.9)
        features['stepsCompleted'] = np.random.randint(25, 70)
        features['linearNavigation'] = np.random.randint(30, 80)
        features['globalModeRatio'] = 1 - features['sequentialModeRatio']
        features['overviewsViewed'] = np.random.randint(0, 10)
        features['navigationJumps'] = np.random.randint(0, 8)
    elif profile['sequentialGlobal'] > 3:  # Global preference
        features['sequentialModeRatio'] = np.random.uniform(0.1, 0.4)
        features['stepsCompleted'] = np.random.randint(0, 25)
        features['linearNavigation'] = np.random.randint(0, 30)
        features['globalModeRatio'] = 1 - features['sequentialModeRatio']
        features['overviewsViewed'] = np.random.randint(15, 50)
        features['navigationJumps'] = np.random.randint(20, 60)
    else:  # Balanced
        features['sequentialModeRatio'] = np.random.uniform(0.4, 0.6)
        features['stepsCompleted'] = np.random.randint(12, 40)
        features['linearNavigation'] = np.random.randint(15, 50)
        features['globalModeRatio'] = 1 - features['sequentialModeRatio']
        features['overviewsViewed'] = np.random.randint(7, 25)
        features['navigationJumps'] = np.random.randint(8, 30)
    
    # Add some noise to make it realistic
    for key in features:
        if isinstance(features[key], (int, float)):
            noise = np.random.normal(0, 0.05 * features[key])
            features[key] = max(0, features[key] + noise)
    
    return features

def generate_dataset(n_samples=2500):
    """Generate complete dataset with features and labels"""
    data = []
    
    print(f"Generating {n_samples} synthetic training samples...")
    
    for i in range(n_samples):
        # Generate learning style profile (labels)
        profile = generate_learning_style_profile()
        
        # Generate features that align with profile
        features = generate_features_from_profile(profile)
        
        # Combine into single record
        record = {**features, **profile}
        data.append(record)
        
        if (i + 1) % 500 == 0:
            print(f"Generated {i + 1}/{n_samples} samples...")
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Reorder columns: features first, then labels
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
    
    df = df[feature_cols + label_cols]
    
    return df

def main():
    """Main function to generate and save training data"""
    # Create data directory if it doesn't exist
    data_dir = Path(__file__).parent.parent / 'data'
    data_dir.mkdir(exist_ok=True)
    
    # Generate dataset with 2500 samples for better accuracy
    df = generate_dataset(n_samples=2500)
    
    # Save to CSV
    output_path = data_dir / 'training_data.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Training data saved to: {output_path}")
    print(f"📊 Dataset shape: {df.shape}")
    print(f"\n📈 Label distributions:")
    for col in ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']:
        print(f"  {col}: mean={df[col].mean():.2f}, std={df[col].std():.2f}")
    
    print(f"\n🎯 Sample records:")
    print(df.head())

if __name__ == '__main__':
    main()
