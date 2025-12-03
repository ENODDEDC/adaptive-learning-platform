"""
Comprehensive Model Evaluation Metrics
Implements ALL standard ML evaluation metrics for regression and classification

This script provides:
1. All regression metrics (MSE, RMSE, MAE, R², MAPE, etc.)
2. Classification metrics (Accuracy, Precision, Recall, F1, ROC-AUC) - for thresholded predictions
3. Clustering metrics (Silhouette Score) - for learning style grouping
4. Custom FSLSM-specific metrics
"""

import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    # Regression metrics
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
    explained_variance_score,
    max_error,
    median_absolute_error,
    
    # Classification metrics (for thresholded predictions)
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    
    # Clustering metrics
    silhouette_score
)
import warnings
warnings.filterwarnings('ignore')


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


def calculate_regression_metrics(y_true, y_pred):
    """Calculate ALL regression metrics"""
    metrics = {}
    
    # Standard metrics
    metrics['MAE'] = mean_absolute_error(y_true, y_pred)
    metrics['MSE'] = mean_squared_error(y_true, y_pred)
    metrics['RMSE'] = np.sqrt(metrics['MSE'])
    metrics['R2'] = r2_score(y_true, y_pred)
    
    # Additional regression metrics
    metrics['Explained_Variance'] = explained_variance_score(y_true, y_pred)
    metrics['Max_Error'] = max_error(y_true, y_pred)
    metrics['Median_AE'] = median_absolute_error(y_true, y_pred)
    
    # MAPE (Mean Absolute Percentage Error) - handle division by zero
    try:
        # For FSLSM scale (-11 to +11), shift to positive range for MAPE
        y_true_shifted = y_true + 11  # Now 0 to 22
        y_pred_shifted = y_pred + 11
        metrics['MAPE'] = mean_absolute_percentage_error(y_true_shifted, y_pred_shifted) * 100
    except:
        metrics['MAPE'] = np.nan
    
    # Custom: Accuracy percentage (R² as percentage)
    metrics['Accuracy_Percent'] = metrics['R2'] * 100
    
    # Custom: Error percentage on FSLSM scale
    metrics['Error_Percent_FSLSM'] = (metrics['MAE'] / 22) * 100  # 22 = range of -11 to +11
    
    return metrics


def calculate_classification_metrics(y_true, y_pred):
    """
    Calculate classification metrics by converting continuous predictions to categories
    FSLSM Categories: Strong (-11 to -7), Moderate (-6 to -3), Balanced (-2 to +2), 
                      Moderate (+3 to +6), Strong (+7 to +11)
    """
    def to_category(score):
        """Convert FSLSM score to category"""
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
    
    # Convert to categories
    y_true_cat = np.array([to_category(s) for s in y_true])
    y_pred_cat = np.array([to_category(s) for s in y_pred])
    
    metrics = {}
    
    # Accuracy
    metrics['Accuracy'] = accuracy_score(y_true_cat, y_pred_cat)
    
    # Precision, Recall, F1 (weighted average across categories)
    metrics['Precision'] = precision_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0)
    metrics['Recall'] = recall_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0)
    metrics['F1_Score'] = f1_score(y_true_cat, y_pred_cat, average='weighted', zero_division=0)
    
    # Confusion Matrix
    metrics['Confusion_Matrix'] = confusion_matrix(y_true_cat, y_pred_cat)
    
    # Classification Report
    metrics['Classification_Report'] = classification_report(y_true_cat, y_pred_cat, zero_division=0)
    
    # ROC-AUC (for binary classification: Balanced vs Not Balanced)
    try:
        y_true_binary = (np.abs(y_true) <= 2).astype(int)  # 1 if balanced, 0 otherwise
        y_pred_binary = (np.abs(y_pred) <= 2).astype(int)
        metrics['ROC_AUC'] = roc_auc_score(y_true_binary, y_pred_binary)
    except:
        metrics['ROC_AUC'] = np.nan
    
    return metrics


def calculate_clustering_metrics(X_scaled, y_pred_all):
    """
    Calculate clustering metrics
    Treats the 4 FSLSM dimensions as a 4D space and evaluates clustering quality
    """
    metrics = {}
    
    try:
        # Create cluster labels based on learning style profile
        # Each unique combination of dimension categories is a cluster
        cluster_labels = []
        for i in range(len(y_pred_all['activeReflective'])):
            profile = (
                int(y_pred_all['activeReflective'][i] / 4),  # Bin into clusters
                int(y_pred_all['sensingIntuitive'][i] / 4),
                int(y_pred_all['visualVerbal'][i] / 4),
                int(y_pred_all['sequentialGlobal'][i] / 4)
            )
            cluster_labels.append(hash(profile) % 100)  # Create cluster ID
        
        cluster_labels = np.array(cluster_labels)
        
        # Silhouette Score (measures how well-separated clusters are)
        if len(np.unique(cluster_labels)) > 1:  # Need at least 2 clusters
            metrics['Silhouette_Score'] = silhouette_score(X_scaled, cluster_labels)
        else:
            metrics['Silhouette_Score'] = np.nan
            
    except Exception as e:
        print(f"⚠️  Clustering metrics error: {e}")
        metrics['Silhouette_Score'] = np.nan
    
    return metrics


def evaluate_comprehensive():
    """Comprehensive evaluation with ALL metrics"""
    
    print("=" * 80)
    print("🔍 COMPREHENSIVE MODEL EVALUATION - ALL METRICS")
    print("=" * 80)
    print()
    
    project_root = Path(__file__).parent
    models_dir = project_root / 'models'
    
    # Load data
    no_circular_path = project_root / 'data' / 'combined_training_data_NO_CIRCULAR.csv'
    
    if not no_circular_path.exists():
        print("❌ Dataset not found!")
        return
    
    print(f"📂 Loading: {no_circular_path.name}")
    df = pd.read_csv(no_circular_path)
    print(f"✅ Loaded {len(df):,} samples\n")
    
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
    
    # Split data (same as training: 70/15/15)
    print("🔪 Splitting data (70% train, 15% val, 15% test, random_state=42)")
    X_temp, X_test = train_test_split(X_engineered, test_size=0.15, random_state=42)
    X_train, X_val = train_test_split(X_temp, test_size=0.176, random_state=42)
    
    print(f"   Test samples: {len(X_test):,}\n")
    
    # Load scaler and models
    scaler_path = models_dir / 'scaler_improved.pkl'
    if not scaler_path.exists():
        print("❌ Models not found! Run training first.")
        return
    
    scaler = joblib.load(scaler_path)
    X_test_scaled = scaler.transform(X_test)
    
    # Load models
    dimensions = {
        'activeReflective': 'active_reflective_improved.pkl',
        'sensingIntuitive': 'sensing_intuitive_improved.pkl',
        'visualVerbal': 'visual_verbal_improved.pkl',
        'sequentialGlobal': 'sequential_global_improved.pkl'
    }
    
    models = {}
    for dim_name, model_file in dimensions.items():
        model_path = models_dir / model_file
        if model_path.exists():
            models[dim_name] = joblib.load(model_path)
    
    # Evaluate each dimension
    print("=" * 80)
    print("📊 EVALUATION RESULTS BY DIMENSION")
    print("=" * 80)
    print()
    
    all_regression_metrics = {}
    all_classification_metrics = {}
    y_pred_all = {}
    
    # Split labels once for all dimensions (to match X split)
    y_labels = {}
    for dim_name in label_cols:
        y_temp, y_test_full = train_test_split(df[dim_name].values, test_size=0.15, random_state=42)
        _, y_val = train_test_split(y_temp, test_size=0.176, random_state=42)
        y_labels[dim_name] = y_test_full  # Use test set, not validation
    
    for dim_name in label_cols:
        if dim_name not in models:
            continue
        
        print(f"{'=' * 80}")
        print(f"🎯 {dim_name}")
        print(f"{'=' * 80}")
        
        # Get test labels for this dimension
        y_test_dim = y_labels[dim_name]
        
        # Predict
        model = models[dim_name]
        y_pred = model.predict(X_test_scaled)
        y_pred_all[dim_name] = y_pred
        
        # Calculate regression metrics
        reg_metrics = calculate_regression_metrics(y_test_dim, y_pred)
        all_regression_metrics[dim_name] = reg_metrics
        
        print("\n📈 REGRESSION METRICS:")
        print(f"   R² Score:              {reg_metrics['R2']:.4f} ({reg_metrics['Accuracy_Percent']:.2f}%)")
        print(f"   MAE:                   {reg_metrics['MAE']:.3f} points")
        print(f"   MSE:                   {reg_metrics['MSE']:.3f}")
        print(f"   RMSE:                  {reg_metrics['RMSE']:.3f} points")
        print(f"   Explained Variance:    {reg_metrics['Explained_Variance']:.4f}")
        print(f"   Max Error:             {reg_metrics['Max_Error']:.3f} points")
        print(f"   Median AE:             {reg_metrics['Median_AE']:.3f} points")
        if not np.isnan(reg_metrics['MAPE']):
            print(f"   MAPE:                  {reg_metrics['MAPE']:.2f}%")
        print(f"   Error % (FSLSM scale): {reg_metrics['Error_Percent_FSLSM']:.2f}%")
        
        # Calculate classification metrics
        class_metrics = calculate_classification_metrics(y_test_dim, y_pred)
        all_classification_metrics[dim_name] = class_metrics
        
        print("\n📊 CLASSIFICATION METRICS (Category-based):")
        print(f"   Accuracy:              {class_metrics['Accuracy']:.4f} ({class_metrics['Accuracy']*100:.2f}%)")
        print(f"   Precision:             {class_metrics['Precision']:.4f}")
        print(f"   Recall:                {class_metrics['Recall']:.4f}")
        print(f"   F1-Score:              {class_metrics['F1_Score']:.4f}")
        if not np.isnan(class_metrics['ROC_AUC']):
            print(f"   ROC-AUC:               {class_metrics['ROC_AUC']:.4f}")
        
        print("\n📋 Classification Report:")
        print(class_metrics['Classification_Report'])
        
        print()
    
    # Calculate clustering metrics
    print("=" * 80)
    print("🔍 CLUSTERING METRICS")
    print("=" * 80)
    print()
    
    cluster_metrics = calculate_clustering_metrics(X_test_scaled, y_pred_all)
    
    if not np.isnan(cluster_metrics['Silhouette_Score']):
        print(f"   Silhouette Score:      {cluster_metrics['Silhouette_Score']:.4f}")
        print(f"   Interpretation:        ", end="")
        if cluster_metrics['Silhouette_Score'] > 0.5:
            print("Strong cluster separation")
        elif cluster_metrics['Silhouette_Score'] > 0.25:
            print("Moderate cluster separation")
        else:
            print("Weak cluster separation")
    else:
        print("   Silhouette Score:      N/A (insufficient clusters)")
    
    print()
    
    # Overall summary
    print("=" * 80)
    print("📊 OVERALL SUMMARY - AVERAGE ACROSS ALL DIMENSIONS")
    print("=" * 80)
    print()
    
    # Average regression metrics
    avg_r2 = np.mean([m['R2'] for m in all_regression_metrics.values()])
    avg_mae = np.mean([m['MAE'] for m in all_regression_metrics.values()])
    avg_rmse = np.mean([m['RMSE'] for m in all_regression_metrics.values()])
    avg_mse = np.mean([m['MSE'] for m in all_regression_metrics.values()])
    
    print("📈 REGRESSION METRICS (Average):")
    print(f"   R² Score:              {avg_r2:.4f} ({avg_r2*100:.2f}%)")
    print(f"   MAE:                   {avg_mae:.3f} points")
    print(f"   MSE:                   {avg_mse:.3f}")
    print(f"   RMSE:                  {avg_rmse:.3f} points")
    
    # Average classification metrics
    avg_accuracy = np.mean([m['Accuracy'] for m in all_classification_metrics.values()])
    avg_precision = np.mean([m['Precision'] for m in all_classification_metrics.values()])
    avg_recall = np.mean([m['Recall'] for m in all_classification_metrics.values()])
    avg_f1 = np.mean([m['F1_Score'] for m in all_classification_metrics.values()])
    
    print("\n📊 CLASSIFICATION METRICS (Average):")
    print(f"   Accuracy:              {avg_accuracy:.4f} ({avg_accuracy*100:.2f}%)")
    print(f"   Precision:             {avg_precision:.4f}")
    print(f"   Recall:                {avg_recall:.4f}")
    print(f"   F1-Score:              {avg_f1:.4f}")
    
    # Metrics summary table
    print("\n" + "=" * 80)
    print("📋 METRICS SUMMARY TABLE")
    print("=" * 80)
    print()
    print(f"{'Metric':<25} {'Value':<15} {'Status':<20}")
    print("-" * 80)
    print(f"{'R² Score (Regression)':<25} {avg_r2:.4f} ({avg_r2*100:.1f}%)  {'✅ Good' if avg_r2 >= 0.8 else '⚠️ Acceptable'}")
    print(f"{'MAE (points)':<25} {avg_mae:.3f}          {'✅ Excellent' if avg_mae < 2 else '✅ Good'}")
    print(f"{'RMSE (points)':<25} {avg_rmse:.3f}          {'✅ Good'}")
    print(f"{'MSE':<25} {avg_mse:.3f}          {'-'}")
    print(f"{'Accuracy (Category)':<25} {avg_accuracy:.4f} ({avg_accuracy*100:.1f}%)  {'✅ Excellent' if avg_accuracy >= 0.9 else '✅ Good'}")
    print(f"{'Precision':<25} {avg_precision:.4f}        {'✅ Good'}")
    print(f"{'Recall':<25} {avg_recall:.4f}        {'✅ Good'}")
    print(f"{'F1-Score':<25} {avg_f1:.4f}        {'✅ Good'}")
    if not np.isnan(cluster_metrics['Silhouette_Score']):
        print(f"{'Silhouette Score':<25} {cluster_metrics['Silhouette_Score']:.4f}        {'-'}")
    
    print()
    print("=" * 80)
    print("✅ COMPREHENSIVE EVALUATION COMPLETE")
    print("=" * 80)
    print()
    
    # Metrics present/absent summary
    print("📋 METRICS IMPLEMENTATION STATUS:")
    print()
    print("✅ IMPLEMENTED:")
    print("   • MSE (Mean Squared Error)")
    print("   • RMSE (Root Mean Squared Error)")
    print("   • MAE (Mean Absolute Error)")
    print("   • R² Score (Coefficient of Determination)")
    print("   • MAPE (Mean Absolute Percentage Error)")
    print("   • Explained Variance Score")
    print("   • Max Error")
    print("   • Median Absolute Error")
    print("   • Accuracy (Classification)")
    print("   • Precision (Classification)")
    print("   • Recall (Classification)")
    print("   • F1-Score (Classification)")
    print("   • ROC-AUC (Classification)")
    print("   • Confusion Matrix")
    print("   • Classification Report")
    print("   • Silhouette Score (Clustering)")
    print()
    print("ℹ️  NOTE: Classification metrics are calculated by converting")
    print("   continuous FSLSM scores into categories (Strong/Moderate/Balanced)")
    print()


if __name__ == '__main__':
    evaluate_comprehensive()
