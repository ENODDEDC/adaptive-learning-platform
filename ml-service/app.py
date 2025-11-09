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
    """Extract features in correct order"""
    feature_order = [
        'activeModeRatio', 'questionsGenerated', 'debatesParticipated',
        'reflectiveModeRatio', 'reflectionsWritten', 'journalEntries',
        'sensingModeRatio', 'simulationsCompleted', 'challengesCompleted',
        'intuitiveModeRatio', 'conceptsExplored', 'patternsDiscovered',
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

def calculate_confidence(prediction, feature_variance):
    """Calculate prediction confidence based on feature variance"""
    # Higher variance in features = lower confidence
    # This is a simple heuristic; can be improved with model uncertainty
    base_confidence = 0.7
    variance_penalty = min(0.2, feature_variance * 0.1)
    confidence = max(0.5, base_confidence - variance_penalty)
    return round(confidence, 2)

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
        
        # Extract and validate features
        features = extract_features(data['features'])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
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
            confidence[dim_name] = calculate_confidence(pred, feature_variance)
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
