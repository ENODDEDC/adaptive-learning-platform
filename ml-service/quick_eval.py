import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

project_root = Path(__file__).parent
data_path = project_root / 'data' / 'combined_training_data_NO_CIRCULAR.csv'
if not data_path.exists():
    data_path = project_root / 'data' / 'training_data.csv'

print(f'Using: {data_path.name}')
df = pd.read_csv(data_path)
print(f'Loaded {len(df)} samples')

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

X = df[feature_cols].values
df_f = pd.DataFrame(X, columns=feature_cols)
df_f['active_reflective_ratio'] = df_f['activeModeRatio'] / (df_f['reflectiveModeRatio'] + 0.001)
df_f['sensing_intuitive_ratio'] = df_f['sensingModeRatio'] / (df_f['intuitiveModeRatio'] + 0.001)
df_f['visual_verbal_ratio'] = df_f['visualModeRatio'] / (df_f['verbalModeRatio'] + 0.001)
df_f['sequential_global_ratio'] = df_f['sequentialModeRatio'] / (df_f['globalModeRatio'] + 0.001)
df_f['active_intensity'] = df_f['questionsGenerated'] + df_f['debatesParticipated']
df_f['reflective_intensity'] = df_f['reflectionsWritten'] + df_f['journalEntries']
df_f['sensing_intensity'] = df_f['simulationsCompleted'] + df_f['challengesCompleted']
df_f['intuitive_intensity'] = df_f['conceptsExplored'] + df_f['patternsDiscovered']
df_f['visual_intensity'] = df_f['diagramsViewed'] + df_f['wireframesExplored']
df_f['verbal_intensity'] = df_f['textRead'] + df_f['summariesCreated']
df_f['sequential_intensity'] = df_f['stepsCompleted'] + df_f['linearNavigation']
df_f['global_intensity'] = df_f['overviewsViewed'] + df_f['navigationJumps']
for col in ['activeModeRatio', 'sensingModeRatio', 'visualModeRatio', 'sequentialModeRatio']:
    df_f[f'{col}_squared'] = df_f[col] ** 2
df_f['ai_active_interaction'] = df_f['aiAskModeRatio'] * df_f['activeModeRatio']
df_f['ai_reflective_interaction'] = df_f['aiResearchModeRatio'] * df_f['reflectiveModeRatio']
df_f['ai_sensing_interaction'] = df_f['aiTextToDocsRatio'] * df_f['sensingModeRatio']
X_eng = df_f.values

scaler = joblib.load(project_root / 'models' / 'scaler_improved.pkl')
X_temp, X_test = train_test_split(X_eng, test_size=0.15, random_state=42)
X_test_scaled = scaler.transform(X_test)

dims = {
    'activeReflective': 'active_reflective_improved.pkl',
    'sensingIntuitive': 'sensing_intuitive_improved.pkl',
    'visualVerbal': 'visual_verbal_improved.pkl',
    'sequentialGlobal': 'sequential_global_improved.pkl'
}

print()
print('=' * 50)
print('MODEL PERFORMANCE RESULTS')
print('=' * 50)
for dim, fname in dims.items():
    try:
        model = joblib.load(project_root / 'models' / fname)
        y_temp, y_test = train_test_split(df[dim].values, test_size=0.15, random_state=42)
        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        print(f'{dim}: R2={r2*100:.1f}%, MAE={mae:.3f}')
    except Exception as e:
        print(f'{dim}: ERROR - {e}')
