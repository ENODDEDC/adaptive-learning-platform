"""
Convert Real Eye-Tracking Data to Training Format
Source: Bittner et al. (2023) - Zenodo Eye-Tracking Dataset
Converts eye-tracking metrics to behavioral learning features
"""

import pandas as pd
import numpy as np
from pathlib import Path

def load_eye_tracking_data():
    """Load the eye-tracking dataset"""
    data_path = Path(__file__).parent / 'data' / 'eye_tracking_data.tsv'
    
    print("=" * 70)
    print("📊 LOADING EYE-TRACKING DATA")
    print("=" * 70)
    print(f"📁 Loading from: {data_path}")
    
    # Load TSV file
    df = pd.read_csv(data_path, sep='\t')
    
    print(f"✅ Loaded {len(df)} rows")
    print(f"📊 Participants: {df['Participant ID'].nunique()}")
    print(f"📊 Slides: {df['Slide Nr.'].nunique()}")
    print()
    
    # Convert European decimal format (comma) to standard format (dot)
    print("🔧 Converting numeric formats...")
    numeric_columns = [
        'Total_duration_of_fixations', 'Average_duration_of_fixations',
        'Minimum_duration_of_fixations', 'Maximum_duration_of_fixations',
        'Number_of_fixations', 'Time_to_first_fixation', 'Duration_of_first_fixation',
        'Average_pupil_diameter', 'Total_duration_of_whole_fixations',
        'Average_duration_of_whole_fixations', 'Minimum_duration_of_whole_fixations',
        'Maximum_duration_of_whole_fixations', 'Number_of_whole_fixations',
        'Time_to_first_whole_fixation', 'Duration_of_first_whole_fixation',
        'Average_whole-fixation_pupil_diameter', 'Total_duration_of_Visit',
        'Average_duration_of_Visit', 'Minimum_duration_of_Visit',
        'Maximum_duration_of_Visit', 'Number_of_Visits', 'Time_to_first_Visit',
        'Duration_of_first_Visit', 'Total_duration_of_Glances',
        'Average_duration_of_Glances', 'Minimum_duration_of_Glances',
        'Maximum_duration_of_Glances', 'Number_of_Glances',
        'Time_to_first_Glance', 'Duration_of_first_Glance',
        'Number_of_mouse_clicks', 'Number_of_saccades_in_AOI',
        'Time_to_entry_saccade', 'Time_to_exit_saccade',
        'Peak_velocity_of_entry_saccade', 'Peak_velocity_of_exit_saccade'
    ]
    
    for col in numeric_columns:
        if col in df.columns:
            # Replace comma with dot and convert to numeric
            df[col] = df[col].astype(str).str.replace(',', '.').replace('', '0')
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    print("✅ Numeric conversion complete")
    print()
    
    return df

def aggregate_by_participant(df):
    """Aggregate eye-tracking metrics by participant"""
    
    print("🔧 AGGREGATING DATA BY PARTICIPANT")
    print("=" * 70)
    
    # Group by participant
    participants = []
    
    for participant_id in df['Participant ID'].unique():
        participant_data = df[df['Participant ID'] == participant_id]
        
        # Aggregate metrics across all slides for this participant
        agg_data = {
            'participant_id': participant_id,
            
            # Fixation metrics (averaged)
            'avg_fixation_duration': participant_data['Average_duration_of_fixations'].mean(),
            'total_fixations': participant_data['Number_of_fixations'].sum(),
            'avg_time_to_first_fixation': participant_data['Time_to_first_fixation'].mean(),
            
            # Pupil diameter (attention indicator)
            'avg_pupil_diameter': participant_data['Average_pupil_diameter'].mean(),
            
            # Visit metrics
            'total_visits': participant_data['Number_of_Visits'].sum(),
            'avg_visit_duration': participant_data['Average_duration_of_Visit'].mean(),
            
            # Saccade metrics (navigation patterns)
            'total_saccades': participant_data['Number_of_saccades_in_AOI'].sum(),
            
            # Content-specific metrics
            'illustrations_fixation_time': 0,
            'text_fixation_time': 0,
            'theory_fixation_time': 0,
            'example_fixation_time': 0,
            'exercise_fixation_time': 0,
            'summary_fixation_time': 0,
            'toc_fixation_time': 0,
            'keywords_fixation_time': 0,
            'mcq_fixation_time': 0,
            'supporting_text_fixation_time': 0,
            'additional_material_fixation_time': 0,
        }
        
        # Calculate content-specific fixation times
        for _, row in participant_data.iterrows():
            content = row['Content per AOI']
            fixation_time = row['Total_duration_of_fixations']
            
            if pd.isna(fixation_time):
                fixation_time = 0
            
            if 'Illustrations' in content:
                agg_data['illustrations_fixation_time'] += fixation_time
            elif 'Key words' in content:
                agg_data['keywords_fixation_time'] += fixation_time
            elif 'Theory' in content:
                agg_data['theory_fixation_time'] += fixation_time
            elif 'Example' in content:
                agg_data['example_fixation_time'] += fixation_time
            elif 'Exercise' in content:
                agg_data['exercise_fixation_time'] += fixation_time
            elif 'Summary' in content:
                agg_data['summary_fixation_time'] += fixation_time
            elif 'Table of contents' in content:
                agg_data['toc_fixation_time'] += fixation_time
            elif 'Multiple choice' in content:
                agg_data['mcq_fixation_time'] += fixation_time
            elif 'Supporting text' in content:
                agg_data['supporting_text_fixation_time'] += fixation_time
            elif 'additional material' in content.lower():
                agg_data['additional_material_fixation_time'] += fixation_time
        
        # Calculate total fixation time for normalization
        agg_data['total_fixation_time'] = sum([
            agg_data['illustrations_fixation_time'],
            agg_data['text_fixation_time'],
            agg_data['theory_fixation_time'],
            agg_data['example_fixation_time'],
            agg_data['exercise_fixation_time'],
            agg_data['summary_fixation_time'],
            agg_data['toc_fixation_time'],
            agg_data['keywords_fixation_time'],
            agg_data['mcq_fixation_time'],
            agg_data['supporting_text_fixation_time'],
            agg_data['additional_material_fixation_time']
        ])
        
        participants.append(agg_data)
    
    df_agg = pd.DataFrame(participants)
    
    print(f"✅ Aggregated data for {len(df_agg)} participants")
    print()
    
    return df_agg

def map_to_learning_features(df_agg):
    """Map eye-tracking metrics to FSLSM learning behavior features"""
    
    print("🔄 MAPPING TO LEARNING FEATURES")
    print("=" * 70)
    
    features = []
    
    for _, row in df_agg.iterrows():
        total_time = row['total_fixation_time']
        
        if total_time == 0:
            continue  # Skip participants with no fixation data
        
        # Active/Reflective Dimension
        # Active learners: more time on exercises, examples, practice
        # Reflective learners: more time on theory, summaries, reflection
        
        active_time = (
            row['exercise_fixation_time'] + 
            row['example_fixation_time'] +
            row['mcq_fixation_time']
        )
        
        reflective_time = (
            row['theory_fixation_time'] + 
            row['summary_fixation_time'] +
            row['supporting_text_fixation_time']
        )
        
        active_ratio = active_time / total_time if total_time > 0 else 0
        reflective_ratio = reflective_time / total_time if total_time > 0 else 0
        
        # Sensing/Intuitive Dimension
        # Sensing learners: more time on concrete examples, facts, procedures
        # Intuitive learners: more time on concepts, patterns, theories
        
        sensing_time = (
            row['example_fixation_time'] +
            row['exercise_fixation_time'] +
            row['keywords_fixation_time']
        )
        
        intuitive_time = (
            row['theory_fixation_time'] +
            row['additional_material_fixation_time']
        )
        
        sensing_ratio = sensing_time / total_time if total_time > 0 else 0
        intuitive_ratio = intuitive_time / total_time if total_time > 0 else 0
        
        # Visual/Verbal Dimension
        # Visual learners: more time on illustrations, diagrams
        # Verbal learners: more time on text, keywords, summaries
        
        visual_time = row['illustrations_fixation_time']
        
        verbal_time = (
            row['keywords_fixation_time'] +
            row['summary_fixation_time'] +
            row['supporting_text_fixation_time'] +
            row['theory_fixation_time']
        )
        
        visual_ratio = visual_time / total_time if total_time > 0 else 0
        verbal_ratio = verbal_time / total_time if total_time > 0 else 0
        
        # Sequential/Global Dimension
        # Sequential learners: linear navigation, step-by-step
        # Global learners: jump around, overview first
        
        sequential_time = (
            row['example_fixation_time'] +
            row['exercise_fixation_time']
        )
        
        global_time = (
            row['toc_fixation_time'] +
            row['summary_fixation_time'] +
            row['additional_material_fixation_time']
        )
        
        sequential_ratio = sequential_time / total_time if total_time > 0 else 0
        global_ratio = global_time / total_time if total_time > 0 else 0
        
        # Normalize fixation counts to interaction-like metrics
        max_fixations = 100  # Normalization factor
        fixation_norm = row['total_fixations'] / max_fixations if row['total_fixations'] > 0 else 0
        
        # Create feature vector matching training_data.csv format
        feature_row = {
            # Active/Reflective features
            'activeModeRatio': active_ratio,
            'questionsGenerated': row['exercise_fixation_time'] / 1000 * fixation_norm,  # Estimate from exercise time
            'debatesParticipated': row['mcq_fixation_time'] / 1000 * fixation_norm * 0.3,
            'reflectiveModeRatio': reflective_ratio,
            'reflectionsWritten': row['summary_fixation_time'] / 1000 * fixation_norm,
            'journalEntries': row['supporting_text_fixation_time'] / 1000 * fixation_norm * 0.5,
            
            # AI modes (estimated from attention patterns)
            'aiAskModeRatio': row['mcq_fixation_time'] / total_time if total_time > 0 else 0,
            'aiResearchModeRatio': row['additional_material_fixation_time'] / total_time if total_time > 0 else 0,
            
            # Sensing/Intuitive features
            'sensingModeRatio': sensing_ratio,
            'simulationsCompleted': row['example_fixation_time'] / 1000 * fixation_norm,
            'challengesCompleted': row['exercise_fixation_time'] / 1000 * fixation_norm * 0.7,
            'intuitiveModeRatio': intuitive_ratio,
            'conceptsExplored': row['theory_fixation_time'] / 1000 * fixation_norm,
            'patternsDiscovered': row['additional_material_fixation_time'] / 1000 * fixation_norm * 0.6,
            
            # AI text-to-docs ratio
            'aiTextToDocsRatio': row['supporting_text_fixation_time'] / total_time if total_time > 0 else 0,
            
            # Visual/Verbal features
            'visualModeRatio': visual_ratio,
            'diagramsViewed': row['illustrations_fixation_time'] / 1000 * fixation_norm,
            'wireframesExplored': row['illustrations_fixation_time'] / 1000 * fixation_norm * 0.8,
            'verbalModeRatio': verbal_ratio,
            'textRead': verbal_time / 1000 * fixation_norm,
            'summariesCreated': row['summary_fixation_time'] / 1000 * fixation_norm * 0.4,
            
            # Sequential/Global features
            'sequentialModeRatio': sequential_ratio,
            'stepsCompleted': row['exercise_fixation_time'] / 1000 * fixation_norm,
            'linearNavigation': row['avg_fixation_duration'] / 100 * fixation_norm,  # Longer fixations = more linear
            'globalModeRatio': global_ratio,
            'overviewsViewed': row['toc_fixation_time'] / 1000 * fixation_norm,
            'navigationJumps': row['total_saccades'] / 10,  # Saccades indicate jumps
        }
        
        features.append(feature_row)
    
    df_features = pd.DataFrame(features)
    
    print(f"✅ Mapped {len(df_features)} participants to learning features")
    print()
    
    return df_features

def infer_learning_style_labels(df_features):
    """Infer FSLSM dimension labels from behavioral patterns"""
    
    print("🎯 INFERRING LEARNING STYLE LABELS")
    print("=" * 70)
    
    labels = []
    
    for _, row in df_features.iterrows():
        # Active/Reflective: -11 (very active) to +11 (very reflective)
        active_score = row['activeModeRatio'] * 10
        reflective_score = row['reflectiveModeRatio'] * 10
        active_reflective = int(np.clip(reflective_score - active_score, -11, 11))
        
        # Sensing/Intuitive: -11 (very sensing) to +11 (very intuitive)
        sensing_score = row['sensingModeRatio'] * 10
        intuitive_score = row['intuitiveModeRatio'] * 10
        sensing_intuitive = int(np.clip(intuitive_score - sensing_score, -11, 11))
        
        # Visual/Verbal: -11 (very visual) to +11 (very verbal)
        visual_score = row['visualModeRatio'] * 10
        verbal_score = row['verbalModeRatio'] * 10
        visual_verbal = int(np.clip(verbal_score - visual_score, -11, 11))
        
        # Sequential/Global: -11 (very sequential) to +11 (very global)
        sequential_score = row['sequentialModeRatio'] * 10
        global_score = row['globalModeRatio'] * 10
        sequential_global = int(np.clip(global_score - sequential_score, -11, 11))
        
        labels.append({
            'activeReflective': active_reflective,
            'sensingIntuitive': sensing_intuitive,
            'visualVerbal': visual_verbal,
            'sequentialGlobal': sequential_global
        })
    
    df_labels = pd.DataFrame(labels)
    
    print(f"✅ Inferred labels for {len(df_labels)} participants")
    print()
    print("📊 Label Distribution:")
    print(f"   Active/Reflective: {df_labels['activeReflective'].mean():.2f} ± {df_labels['activeReflective'].std():.2f}")
    print(f"   Sensing/Intuitive: {df_labels['sensingIntuitive'].mean():.2f} ± {df_labels['sensingIntuitive'].std():.2f}")
    print(f"   Visual/Verbal: {df_labels['visualVerbal'].mean():.2f} ± {df_labels['visualVerbal'].std():.2f}")
    print(f"   Sequential/Global: {df_labels['sequentialGlobal'].mean():.2f} ± {df_labels['sequentialGlobal'].std():.2f}")
    print()
    
    return df_labels

def save_training_data(df_features, df_labels, output_file='eye_tracking_training_data.csv'):
    """Combine features and labels, save to CSV"""
    
    print("💾 SAVING TRAINING DATA")
    print("=" * 70)
    
    # Combine features and labels
    df_combined = pd.concat([df_features, df_labels], axis=1)
    
    # Reorder columns to match training_data.csv format
    column_order = [
        'activeModeRatio', 'questionsGenerated', 'debatesParticipated',
        'reflectiveModeRatio', 'reflectionsWritten', 'journalEntries',
        'aiAskModeRatio', 'aiResearchModeRatio',
        'sensingModeRatio', 'simulationsCompleted', 'challengesCompleted',
        'intuitiveModeRatio', 'conceptsExplored', 'patternsDiscovered',
        'aiTextToDocsRatio',
        'visualModeRatio', 'diagramsViewed', 'wireframesExplored',
        'verbalModeRatio', 'textRead', 'summariesCreated',
        'sequentialModeRatio', 'stepsCompleted', 'linearNavigation',
        'globalModeRatio', 'overviewsViewed', 'navigationJumps',
        'activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal'
    ]
    
    df_combined = df_combined[column_order]
    
    # Save to CSV
    output_path = Path(__file__).parent / 'data' / output_file
    df_combined.to_csv(output_path, index=False)
    
    print(f"✅ Saved to: {output_path}")
    print(f"📊 Total samples: {len(df_combined)}")
    print(f"📊 Features: 27 behavioral + 4 labels")
    print()
    
    return output_path

def main():
    """Main conversion pipeline"""
    
    print("\n")
    print("=" * 70)
    print("🚀 EYE-TRACKING DATA CONVERSION TOOL")
    print("=" * 70)
    print("📚 Source: Bittner et al. (2023) - Zenodo Dataset")
    print("🎯 Target: FSLSM Learning Style Training Data")
    print("=" * 70)
    print()
    
    try:
        # Step 1: Load eye-tracking data
        df_raw = load_eye_tracking_data()
        
        # Step 2: Aggregate by participant
        df_agg = aggregate_by_participant(df_raw)
        
        # Step 3: Map to learning features
        df_features = map_to_learning_features(df_agg)
        
        # Step 4: Infer learning style labels
        df_labels = infer_learning_style_labels(df_features)
        
        # Step 5: Save training data
        output_path = save_training_data(df_features, df_labels)
        
        print("=" * 70)
        print("✅ CONVERSION COMPLETE!")
        print("=" * 70)
        print()
        print("🎯 NEXT STEPS:")
        print("   1. Review the converted data:")
        print(f"      {output_path}")
        print()
        print("   2. Combine with synthetic data (optional):")
        print("      python ml-service/combine_datasets.py")
        print()
        print("   3. Retrain models with real data:")
        print("      python ml-service/training/train_models_improved.py")
        print()
        print("   4. Evaluate improved model accuracy:")
        print("      python ml-service/evaluate_models.py")
        print()
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print()
        print("💡 Make sure:")
        print("   1. eye_tracking_data.tsv is in ml-service/data/")
        print("   2. The file is properly formatted (TSV)")
        print()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        print()

if __name__ == '__main__':
    main()
