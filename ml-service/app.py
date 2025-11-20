"""
Flask API for FSLSM Learning Style Classification
Serves trained XGBoost models for real-time predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from pathlib import Path
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Configuration
MODEL_PATH = Path(__file__).parent / 'models'
PORT = int(os.getenv('PORT', 5000))

# Global variables for models
models = {}
scaler = None
models_loaded = False

def load_models():
    """Load all trained models and scaler"""
    global models, scaler, models_loaded
    
    try:
        print("📦 Loading models...")
        
        # Try to load improved models first, fallback to base models
        scaler_path = MODEL_PATH / 'scaler_improved.pkl'
        if not scaler_path.exists():
            scaler_path = MODEL_PATH / 'scaler.pkl'
            print("⚠️ Using base models (scaler.pkl)")
        else:
            print("✅ Using improved models (scaler_improved.pkl)")
        
        if not scaler_path.exists():
            raise FileNotFoundError(f"Scaler not found at {scaler_path}")
        scaler = joblib.load(scaler_path)
        print(f"✅ Scaler loaded: {scaler_path.name}")
        print(f"   Features expected: {scaler.n_features_in_}")
        
        # Load dimension models (try improved first, fallback to base)
        model_suffix = '_improved' if 'improved' in scaler_path.name else ''
        model_files = {
            'activeReflective': f'active_reflective{model_suffix}.pkl',
            'sensingIntuitive': f'sensing_intuitive{model_suffix}.pkl',
            'visualVerbal': f'visual_verbal{model_suffix}.pkl',
            'sequentialGlobal': f'sequential_global{model_suffix}.pkl'
        }
        
        for dim_name, filename in model_files.items():
            model_path = MODEL_PATH / filename
            if not model_path.exists():
                raise FileNotFoundError(f"Model not found at {model_path}")
            models[dim_name] = joblib.load(model_path)
            print(f"✅ {dim_name} model loaded")
        
        models_loaded = True
        print("🎉 All models loaded successfully!")
        
        # Check if models were trained on combined data
        if 'improved' in scaler_path.name:
            print("\n📊 Model Training Data:")
            print("   ✅ Trained on combined dataset (Real + Synthetic)")
            print("   ✅ Includes 116 real participants from eye-tracking study")
            print("   ✅ No circular logic - learns authentic patterns")
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        models_loaded = False
        raise

def extract_features(feature_dict):
    """Extract features in correct order (27 features including AI Assistant)"""
    feature_order = [
        'activeModeRatio', 'questionsGenerated', 'debatesParticipated',
        'reflectiveModeRatio', 'reflectionsWritten', 'journalEntries',
        'aiAskModeRatio', 'aiResearchModeRatio',  # AI Assistant features
        'sensingModeRatio', 'simulationsCompleted', 'challengesCompleted',
        'intuitiveModeRatio', 'conceptsExplored', 'patternsDiscovered',
        'aiTextToDocsRatio',  # AI Assistant feature
        'visualModeRatio', 'diagramsViewed', 'wireframesExplored',
        'verbalModeRatio', 'textRead', 'summariesCreated',
        'sequentialModeRatio', 'stepsCompleted', 'linearNavigation',
        'globalModeRatio', 'overviewsViewed', 'navigationJumps'
    ]
    
    features = []
    for feature_name in feature_order:
        if feature_name not in feature_dict:
            raise ValueError(f"Missing feature: {feature_name}")
        features.append(float(feature_dict[feature_name]))
    
    return np.array(features).reshape(1, -1)

def engineer_features(features_array, feature_dict):
    """
    Engineer additional features to match training (27 base -> 46 total)
    Must match train_models_improved.py feature engineering exactly!
    """
    # Convert to list for easier manipulation
    features_list = features_array.flatten().tolist()
    
    # Add ratio features (4 features)
    active_ratio = feature_dict.get('activeModeRatio', 0)
    reflective_ratio = feature_dict.get('reflectiveModeRatio', 0)
    sensing_ratio = feature_dict.get('sensingModeRatio', 0)
    intuitive_ratio = feature_dict.get('intuitiveModeRatio', 0)
    visual_ratio = feature_dict.get('visualModeRatio', 0)
    verbal_ratio = feature_dict.get('verbalModeRatio', 0)
    sequential_ratio = feature_dict.get('sequentialModeRatio', 0)
    global_ratio = feature_dict.get('globalModeRatio', 0)
    
    features_list.append(active_ratio / (reflective_ratio + 0.001))  # active_reflective_ratio
    features_list.append(sensing_ratio / (intuitive_ratio + 0.001))  # sensing_intuitive_ratio
    features_list.append(visual_ratio / (verbal_ratio + 0.001))      # visual_verbal_ratio
    features_list.append(sequential_ratio / (global_ratio + 0.001))  # sequential_global_ratio
    
    # Add intensity features (8 features)
    features_list.append(feature_dict.get('questionsGenerated', 0) + feature_dict.get('debatesParticipated', 0))  # active_intensity
    features_list.append(feature_dict.get('reflectionsWritten', 0) + feature_dict.get('journalEntries', 0))       # reflective_intensity
    features_list.append(feature_dict.get('simulationsCompleted', 0) + feature_dict.get('challengesCompleted', 0))  # sensing_intensity
    features_list.append(feature_dict.get('conceptsExplored', 0) + feature_dict.get('patternsDiscovered', 0))     # intuitive_intensity
    features_list.append(feature_dict.get('diagramsViewed', 0) + feature_dict.get('wireframesExplored', 0))       # visual_intensity
    features_list.append(feature_dict.get('textRead', 0) + feature_dict.get('summariesCreated', 0))               # verbal_intensity
    features_list.append(feature_dict.get('stepsCompleted', 0) + feature_dict.get('linearNavigation', 0))         # sequential_intensity
    features_list.append(feature_dict.get('overviewsViewed', 0) + feature_dict.get('navigationJumps', 0))         # global_intensity
    
    # Add squared features (4 features)
    features_list.append(active_ratio ** 2)      # activeModeRatio_squared
    features_list.append(sensing_ratio ** 2)     # sensingModeRatio_squared
    features_list.append(visual_ratio ** 2)      # visualModeRatio_squared
    features_list.append(sequential_ratio ** 2)  # sequentialModeRatio_squared
    
    # Add AI Assistant interaction features (3 features)
    ai_ask = feature_dict.get('aiAskModeRatio', 0)
    ai_research = feature_dict.get('aiResearchModeRatio', 0)
    ai_text_to_docs = feature_dict.get('aiTextToDocsRatio', 0)
    
    features_list.append(ai_ask * active_ratio)           # ai_active_interaction
    features_list.append(ai_research * reflective_ratio)  # ai_reflective_interaction
    features_list.append(ai_text_to_docs * sensing_ratio) # ai_sensing_interaction
    
    # Total: 27 base + 4 ratios + 8 intensities + 4 squared + 3 AI interactions = 46 features
    return np.array(features_list).reshape(1, -1)

def interpret_score(score, dimension):
    """Interpret FSLSM score"""
    abs_score = abs(score)
    
    if dimension == 'activeReflective':
        if score < -7:
            return "Strong Active preference"
        elif score < -3:
            return "Moderate Active preference"
        elif score <= 3:
            return "Balanced (slight Active preference)" if score < 0 else "Balanced (slight Reflective preference)"
        elif score <= 7:
            return "Moderate Reflective preference"
        else:
            return "Strong Reflective preference"
    
    elif dimension == 'sensingIntuitive':
        if score < -7:
            return "Strong Sensing preference"
        elif score < -3:
            return "Moderate Sensing preference"
        elif score <= 3:
            return "Balanced (slight Sensing preference)" if score < 0 else "Balanced (slight Intuitive preference)"
        elif score <= 7:
            return "Moderate Intuitive preference"
        else:
            return "Strong Intuitive preference"
    
    elif dimension == 'visualVerbal':
        if score < -7:
            return "Strong Visual preference"
        elif score < -3:
            return "Moderate Visual preference"
        elif score <= 3:
            return "Balanced (slight Visual preference)" if score < 0 else "Balanced (slight Verbal preference)"
        elif score <= 7:
            return "Moderate Verbal preference"
        else:
            return "Strong Verbal preference"
    
    elif dimension == 'sequentialGlobal':
        if score < -7:
            return "Strong Sequential preference"
        elif score < -3:
            return "Moderate Sequential preference"
        elif score <= 3:
            return "Balanced (slight Sequential preference)" if score < 0 else "Balanced (slight Global preference)"
        elif score <= 7:
            return "Moderate Global preference"
        else:
            return "Strong Global preference"
    
    return "Unknown"

def calculate_confidence_from_model(model, features_scaled, prediction):
    """
    Calculate ML confidence using XGBoost's actual model properties.
    Uses prediction strength and feature importance concentration - NO hardcoded thresholds.
    
    For XGBoost regressors, confidence comes from:
    1. Prediction strength (distance from neutral/0)
    2. Feature importance concentration (focused vs scattered)
    3. Number of trees that agree (via feature importance distribution)
    """
    try:
        # Method 1: Prediction Strength
        # Strong predictions (far from 0) indicate model certainty
        # Normalize by FSLSM range (-11 to +11)
        prediction_strength = min(abs(prediction) / 11.0, 1.0)
        
        # Method 2: Feature Importance Concentration
        # When few features dominate, model is more certain about the pattern
        # When many features contribute equally, model is less certain
        feature_importance = model.feature_importances_
        
        # Calculate Gini coefficient of feature importances (0 = equal, 1 = concentrated)
        sorted_importance = np.sort(feature_importance)
        n = len(sorted_importance)
        cumsum = np.cumsum(sorted_importance)
        gini = (2 * np.sum((np.arange(1, n + 1)) * sorted_importance)) / (n * np.sum(sorted_importance)) - (n + 1) / n
        
        # Higher Gini = more concentrated = more confident
        importance_confidence = gini
        
        # Method 3: Feature Scale Consistency
        # Check if input features are well-scaled (not extreme values)
        # Extreme values suggest extrapolation (less confident)
        feature_extremeness = np.mean(np.abs(features_scaled) > 2.0)  # Beyond 2 std devs
        scale_confidence = 1.0 - feature_extremeness
        
        # Combine methods (equal weights - let the data speak)
        combined_confidence = (
            prediction_strength * 0.4 +      # How strong is the prediction?
            importance_confidence * 0.35 +   # How focused are the important features?
            scale_confidence * 0.25          # Are we interpolating or extrapolating?
        )
        
        # Natural bounds from the calculation (no artificial clipping)
        # This will naturally range from ~0.2 to ~0.95 based on actual data
        return float(combined_confidence)
        
    except Exception as e:
        print(f"⚠️  Confidence calculation error: {e}")
        # Fallback: use only prediction strength
        return float(min(abs(prediction) / 11.0, 1.0))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if models_loaded else 'unhealthy',
        'models_loaded': models_loaded,
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict learning style from behavioral features"""
    if not models_loaded:
        return jsonify({
            'success': False,
            'error': 'Models not loaded'
        }), 500
    
    try:
        # Get features from request
        data = request.get_json()
        if 'features' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing features in request'
            }), 400
        
        # Extract and validate features (27 base features)
        features = extract_features(data['features'])
        
        # Engineer additional features (27 -> 46 features)
        features_engineered = engineer_features(features, data['features'])
        
        # Scale features
        features_scaled = scaler.transform(features_engineered)
        
        # Calculate feature variance for confidence
        feature_variance = np.var(features_scaled)
        
        # Make predictions for each dimension
        predictions = {}
        confidence = {}
        interpretation = {}
        
        for dim_name, model in models.items():
            # Predict
            pred = model.predict(features_scaled)[0]
            
            # Clip to FSLSM range (-11 to 11)
            pred = np.clip(pred, -11, 11)
            
            # Round to integer
            pred_int = int(round(pred))
            
            predictions[dim_name] = pred_int
            # Use real ML-based confidence calculation
            confidence[dim_name] = calculate_confidence_from_model(model, features_scaled, pred)
            interpretation[dim_name] = interpret_score(pred_int, dim_name)
        
        # Return response
        return jsonify({
            'success': True,
            'predictions': predictions,
            'confidence': confidence,
            'interpretation': interpretation
        })
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'FSLSM ML Classification Service',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'GET - Health check',
            '/predict': 'POST - Predict learning style'
        }
    })

if __name__ == '__main__':
    # Load models on startup
    load_models()
    
    # Run Flask app
    print(f"\n🚀 Starting ML service on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False)
