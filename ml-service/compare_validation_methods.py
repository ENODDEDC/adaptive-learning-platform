"""
Compare Fast vs Thorough Validation Methods
Tests both approaches and shows accuracy differences
"""

import time
import subprocess
import sys
from pathlib import Path

def run_training(script_name, method_name):
    """Run training script and measure time"""
    print("\n" + "=" * 70)
    print(f"🚀 TESTING: {method_name}")
    print("=" * 70)
    
    script_path = Path(__file__).parent / 'training' / script_name
    
    start_time = time.time()
    
    try:
        # Run training script
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=1800  # 30 minute timeout
        )
        
        elapsed_time = time.time() - start_time
        
        # Print output
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        # Extract accuracy from output
        accuracy = extract_accuracy(result.stdout)
        
        return {
            'success': result.returncode == 0,
            'time': elapsed_time,
            'accuracy': accuracy,
            'output': result.stdout
        }
        
    except subprocess.TimeoutExpired:
        elapsed_time = time.time() - start_time
        print(f"❌ Training timed out after {elapsed_time:.1f} seconds")
        return {
            'success': False,
            'time': elapsed_time,
            'accuracy': None,
            'output': 'Timeout'
        }
    except Exception as e:
        elapsed_time = time.time() - start_time
        print(f"❌ Error: {e}")
        return {
            'success': False,
            'time': elapsed_time,
            'accuracy': None,
            'output': str(e)
        }

def extract_accuracy(output):
    """Extract average R² from training output"""
    try:
        # Look for "Average Test R²: 0.XXX (XX.X%)"
        for line in output.split('\n'):
            if 'Average Test R²' in line or 'Average R2' in line:
                # Extract percentage
                if '(' in line and '%' in line:
                    percent_str = line.split('(')[1].split('%')[0]
                    return float(percent_str)
    except:
        pass
    return None

def main():
    """Main comparison function"""
    print("\n")
    print("=" * 70)
    print("🔬 VALIDATION METHOD COMPARISON")
    print("=" * 70)
    print("\nThis script will train models using BOTH methods:")
    print("  1. FAST: Simple train/val/test split (2-3 min)")
    print("  2. THOROUGH: GridSearchCV + 5-Fold CV (10-20 min)")
    print("\nNote: This will take 15-25 minutes total")
    print("=" * 70)
    
    input("\nPress ENTER to start comparison...")
    
    results = {}
    
    # Test 1: Fast method
    print("\n\n📊 TEST 1/2: Fast Validation Method")
    print("   - Simple train/val/test split")
    print("   - Pre-optimized hyperparameters")
    print("   - No cross-validation")
    results['fast'] = run_training('train_models_fast.py', 'FAST METHOD')
    
    # Test 2: Thorough method
    print("\n\n📊 TEST 2/2: Thorough Validation Method")
    print("   - GridSearchCV with 324 combinations")
    print("   - 5-Fold cross-validation")
    print("   - Comprehensive hyperparameter tuning")
    results['thorough'] = run_training('train_models_improved.py', 'THOROUGH METHOD')
    
    # Comparison summary
    print("\n\n" + "=" * 70)
    print("📊 COMPARISON RESULTS")
    print("=" * 70)
    
    print("\n┌─────────────────────────────────────────────────────────────┐")
    print("│                    VALIDATION METHOD COMPARISON              │")
    print("├─────────────────────────────────────────────────────────────┤")
    
    # Fast method
    if results['fast']['success']:
        print(f"│ FAST METHOD (Simple Split)                                  │")
        print(f"│   Training Time:  {results['fast']['time']/60:.1f} minutes                              │")
        if results['fast']['accuracy']:
            print(f"│   Accuracy:       {results['fast']['accuracy']:.1f}%                                  │")
        print(f"│   Status:         ✅ SUCCESS                                 │")
    else:
        print(f"│ FAST METHOD (Simple Split)                                  │")
        print(f"│   Status:         ❌ FAILED                                  │")
    
    print("├─────────────────────────────────────────────────────────────┤")
    
    # Thorough method
    if results['thorough']['success']:
        print(f"│ THOROUGH METHOD (GridSearchCV + 5-Fold CV)                  │")
        print(f"│   Training Time:  {results['thorough']['time']/60:.1f} minutes                             │")
        if results['thorough']['accuracy']:
            print(f"│   Accuracy:       {results['thorough']['accuracy']:.1f}%                                  │")
        print(f"│   Status:         ✅ SUCCESS                                 │")
    else:
        print(f"│ THOROUGH METHOD (GridSearchCV + 5-Fold CV)                  │")
        print(f"│   Status:         ❌ FAILED                                  │")
    
    print("└─────────────────────────────────────────────────────────────┘")
    
    # Analysis
    if results['fast']['success'] and results['thorough']['success']:
        print("\n📈 ANALYSIS:")
        
        # Time comparison
        time_diff = results['thorough']['time'] - results['fast']['time']
        time_ratio = results['thorough']['time'] / results['fast']['time']
        print(f"\n⏱️  Time Difference:")
        print(f"   - Fast: {results['fast']['time']/60:.1f} minutes")
        print(f"   - Thorough: {results['thorough']['time']/60:.1f} minutes")
        print(f"   - Difference: +{time_diff/60:.1f} minutes ({time_ratio:.1f}x slower)")
        
        # Accuracy comparison
        if results['fast']['accuracy'] and results['thorough']['accuracy']:
            acc_diff = results['thorough']['accuracy'] - results['fast']['accuracy']
            print(f"\n🎯 Accuracy Difference:")
            print(f"   - Fast: {results['fast']['accuracy']:.2f}%")
            print(f"   - Thorough: {results['thorough']['accuracy']:.2f}%")
            print(f"   - Difference: {acc_diff:+.2f}%")
            
            if abs(acc_diff) < 1:
                print(f"\n💡 CONCLUSION: Accuracy difference is minimal (<1%)")
                print(f"   - Fast method is sufficient for development")
                print(f"   - Thorough method recommended for final thesis models")
            elif acc_diff > 0:
                print(f"\n💡 CONCLUSION: Thorough method is {acc_diff:.1f}% more accurate")
                print(f"   - Worth the extra time for thesis defense")
                print(f"   - Shows rigorous validation approach")
            else:
                print(f"\n💡 CONCLUSION: Fast method performed better (unusual)")
                print(f"   - May indicate overfitting in thorough method")
                print(f"   - Consider using fast method")
    
    print("\n" + "=" * 70)
    print("✅ COMPARISON COMPLETE")
    print("=" * 70)
    
    print("\n📝 RECOMMENDATION FOR YOUR THESIS:")
    print("   - Use THOROUGH method for final models (more defensible)")
    print("   - Use FAST method for quick experiments")
    print("   - Current production models: THOROUGH (87.4% accuracy)")
    print("\n")

if __name__ == '__main__':
    main()
