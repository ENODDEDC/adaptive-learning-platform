@echo off
echo ============================================================
echo 🤖 Training ML Models for FSLSM Classification
echo ============================================================
echo.

if not exist ml-service\venv (
    echo ❌ Virtual environment not found!
    echo Please run setup-ml-service.bat first
    pause
    exit /b 1
)

echo [1/2] Generating training data...
ml-service\venv\Scripts\python.exe ml-service\training\generate_synthetic_data.py
if errorlevel 1 (
    echo ❌ Failed to generate training data
    pause
    exit /b 1
)
echo ✅ Training data generated
echo.

echo [2/2] Training models (this may take 10-15 minutes)...
ml-service\venv\Scripts\python.exe ml-service\training\train_models_improved.py
if errorlevel 1 (
    echo ❌ Failed to train models
    pause
    exit /b 1
)
echo ✅ Models trained successfully
echo.

echo ============================================================
echo ✅ Training Complete!
echo ============================================================
echo.
echo The ML models are now ready to use.
echo You can start the system with start-all.bat
echo.
pause
