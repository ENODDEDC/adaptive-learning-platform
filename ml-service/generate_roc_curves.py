"""
Generate ROC Curve Visualizations for FSLSM Learning Style Models
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize, StandardScaler
from sklearn.metrics import roc_curve, auc
from itertools import cycle
import os

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

def categorize_score(score):
    """Convert continuous FSLSM score to category"""
    if score <= -7:
        return 'Strong_Negative'
    elif score <= -3:
        return 'Moderate_Negative'
    elif score <= 2:
        return 'Balanced'
    elif score <= 6:
        return 'Moderate_Positive'
    else:
        return 'Strong_Positive'

print("=" * 80)
print("🎨 ROC CURVE VISUALIZATION GENERATOR")
print("=" * 80)

# Load data
print("\n📂 Loading data...")
data_path = 'data/combined_training_data_NO_CIRCULAR.csv'
df = pd.read_csv(data_path)
print(f"✅ Loaded {len(df)} samples")

# Define feature and label columns
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

# Prepare features
X = df[feature_cols].values
X_engineered = engineer_features(X, feature_cols)

# Split data (same as training: 70/15/15)
print("\n🔪 Splitting data (70% train, 15% val, 15% test)...")
X_temp, X_test = train_test_split(X_engineered, test_size=0.15, random_state=42)
X_train, X_val = train_test_split(X_temp, test_size=0.176, random_state=42)
print(f"Test samples: {len(X_test)}")

# Load scaler
scaler = joblib.load('models/scaler_improved.pkl')
X_test_scaled = scaler.transform(X_test)

# Split labels
y_labels = {}
for dim_name in label_cols:
    y_temp, y_test_full = train_test_split(df[dim_name].values, test_size=0.15, random_state=42)
    _, y_val = train_test_split(y_temp, test_size=0.176, random_state=42)
    y_labels[dim_name] = y_test_full

# Load models
dimensions = {
    'activeReflective': 'active_reflective_improved.pkl',
    'sensingIntuitive': 'sensing_intuitive_improved.pkl',
    'visualVerbal': 'visual_verbal_improved.pkl',
    'sequentialGlobal': 'sequential_global_improved.pkl'
}

models = {}
for dim_name, model_file in dimensions.items():
    models[dim_name] = joblib.load(f'models/{model_file}')

# Create output directory
output_dir = 'evaluation_results'
os.makedirs(output_dir, exist_ok=True)

# Create figure with subplots
fig, axes = plt.subplots(2, 2, figsize=(16, 14))
fig.suptitle('ROC Curves for FSLSM Learning Style Prediction Models', 
             fontsize=16, fontweight='bold', y=0.995)

axes = axes.flatten()

print("\n" + "=" * 80)
print("📊 GENERATING ROC CURVES")
print("=" * 80)

for idx, dim_name in enumerate(label_cols):
    print(f"\n🎯 Processing: {dim_name}")
    
    # Get test labels and predictions
    y_test = y_labels[dim_name]
    model = models[dim_name]
    y_pred = model.predict(X_test_scaled)
    
    # Convert to categories
    y_test_categories = np.array([categorize_score(s) for s in y_test])
    y_pred_categories = np.array([categorize_score(s) for s in y_pred])
    
    # Get unique classes
    classes = sorted(np.unique(y_test_categories))
    n_classes = len(classes)
    
    print(f"   Classes: {classes}")
    print(f"   Number of classes: {n_classes}")
    
    # Binarize the output
    y_test_bin = label_binarize(y_test_categories, classes=classes)
    y_pred_bin = label_binarize(y_pred_categories, classes=classes)
    
    # Handle single class case
    if n_classes == 2:
        y_test_bin = y_test_bin.ravel()
        y_pred_bin = y_pred_bin.ravel()
    
    # Compute ROC curve and ROC area for each class
    fpr = dict()
    tpr = dict()
    roc_auc = dict()
    
    for i, class_name in enumerate(classes):
        if n_classes > 2:
            fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_pred_bin[:, i])
        else:
            fpr[i], tpr[i], _ = roc_curve(y_test_bin, y_pred_bin)
        roc_auc[i] = auc(fpr[i], tpr[i])
    
    # Compute micro-average ROC curve
    if n_classes > 2:
        fpr["micro"], tpr["micro"], _ = roc_curve(y_test_bin.ravel(), y_pred_bin.ravel())
        roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])
    
    # Plot ROC curves
    ax = axes[idx]
    
    # Plot diagonal line (random classifier)
    ax.plot([0, 1], [0, 1], 'k--', lw=2, label='Random Classifier (AUC = 0.50)')
    
    # Colors for different classes
    colors = cycle(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'])
    
    # Plot ROC curve for each class
    for i, color, class_name in zip(range(n_classes), colors, classes):
        ax.plot(fpr[i], tpr[i], color=color, lw=2.5,
                label=f'{class_name} (AUC = {roc_auc[i]:.3f})')
    
    # Plot micro-average if multi-class
    if n_classes > 2 and "micro" in roc_auc:
        ax.plot(fpr["micro"], tpr["micro"], color='navy', lw=3, linestyle=':',
                label=f'Micro-average (AUC = {roc_auc["micro"]:.3f})')
    
    # Formatting
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=11, fontweight='bold')
    ax.set_ylabel('True Positive Rate', fontsize=11, fontweight='bold')
    ax.set_title(f'{dim_name}', fontsize=13, fontweight='bold', pad=10)
    ax.legend(loc="lower right", fontsize=9, framealpha=0.95)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_aspect('equal')
    
    # Calculate overall AUC
    overall_auc = np.mean([roc_auc[i] for i in range(n_classes)])
    print(f"   ✅ Overall AUC: {overall_auc:.4f}")

# Adjust layout
plt.tight_layout()

# Save figure
output_path = os.path.join(output_dir, 'roc_curves_all_dimensions.png')
plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
print(f"\n💾 Saved combined ROC curves to: {output_path}")

# Create individual plots
print("\n" + "=" * 80)
print("📊 GENERATING INDIVIDUAL ROC CURVES")
print("=" * 80)

for dim_name in label_cols:
    print(f"\n🎯 Creating individual plot: {dim_name}")
    
    # Get test labels and predictions
    y_test = y_labels[dim_name]
    model = models[dim_name]
    y_pred = model.predict(X_test_scaled)
    
    # Convert to categories
    y_test_categories = np.array([categorize_score(s) for s in y_test])
    y_pred_categories = np.array([categorize_score(s) for s in y_pred])
    
    classes = sorted(np.unique(y_test_categories))
    n_classes = len(classes)
    
    # Binarize
    y_test_bin = label_binarize(y_test_categories, classes=classes)
    y_pred_bin = label_binarize(y_pred_categories, classes=classes)
    
    if n_classes == 2:
        y_test_bin = y_test_bin.ravel()
        y_pred_bin = y_pred_bin.ravel()
    
    # Compute ROC curves
    fpr = dict()
    tpr = dict()
    roc_auc = dict()
    
    for i, class_name in enumerate(classes):
        if n_classes > 2:
            fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_pred_bin[:, i])
        else:
            fpr[i], tpr[i], _ = roc_curve(y_test_bin, y_pred_bin)
        roc_auc[i] = auc(fpr[i], tpr[i])
    
    if n_classes > 2:
        fpr["micro"], tpr["micro"], _ = roc_curve(y_test_bin.ravel(), y_pred_bin.ravel())
        roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])
    
    # Create individual plot
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Plot diagonal
    ax.plot([0, 1], [0, 1], 'k--', lw=2, label='Random Classifier (AUC = 0.50)')
    
    # Colors
    colors = cycle(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'])
    
    # Plot each class
    for i, color, class_name in zip(range(n_classes), colors, classes):
        ax.plot(fpr[i], tpr[i], color=color, lw=3,
                label=f'{class_name} (AUC = {roc_auc[i]:.3f})')
    
    # Plot micro-average
    if n_classes > 2 and "micro" in roc_auc:
        ax.plot(fpr["micro"], tpr["micro"], color='navy', lw=3.5, linestyle=':',
                label=f'Micro-average (AUC = {roc_auc["micro"]:.3f})')
    
    # Formatting
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=13, fontweight='bold')
    ax.set_ylabel('True Positive Rate', fontsize=13, fontweight='bold')
    ax.set_title(f'ROC Curve - {dim_name}', fontsize=15, fontweight='bold', pad=15)
    ax.legend(loc="lower right", fontsize=11, framealpha=0.95)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_aspect('equal')
    
    # Add text box with overall AUC
    overall_auc = np.mean([roc_auc[i] for i in range(n_classes)])
    textstr = f'Overall AUC: {overall_auc:.4f}'
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.8)
    ax.text(0.65, 0.15, textstr, transform=ax.transAxes, fontsize=12,
            verticalalignment='top', bbox=props, fontweight='bold')
    
    plt.tight_layout()
    
    # Save
    output_path = os.path.join(output_dir, f'roc_curve_{dim_name}.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"   💾 Saved to: {output_path}")
    plt.close()

print("\n" + "=" * 80)
print("✅ ROC CURVE GENERATION COMPLETE")
print("=" * 80)
print(f"\n📁 All visualizations saved to: {output_dir}/")
print("\nGenerated files:")
print("  • roc_curves_all_dimensions.png (combined view)")
print("  • roc_curve_activeReflective.png")
print("  • roc_curve_sensingIntuitive.png")
print("  • roc_curve_visualVerbal.png")
print("  • roc_curve_sequentialGlobal.png")
print("\n" + "=" * 80)
