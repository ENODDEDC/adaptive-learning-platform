@echo off
REM Setup ML Service - Windows Batch Script
REM Run this once to set up ML models

echo ========================================
echo   ML Service Setup
echo ========================================
echo.

REM Go back to project root, then to ml-service
cd ..
cd ml-service

echo [1/5] Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    echo Make sure Python 3.8+ is installed
    pause
    exit /b 1
)

echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/5] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/5] Generating synthetic training data...
python training/generate_synthetic_data.py
if errorlevel 1 (
    echo ERROR: Failed to generate training data
    pause
    exit /b 1
)

echo [5/5] Training ML models (this may take 5-10 minutes)...
python training/train_models.py
if errorlevel 1 (
    echo ERROR: Failed to train models
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete! ✅
echo ========================================
echo.
echo Trained models are in: ml-service/models/
echo.
echo To start the ML service:
echo   cd ml-service
echo   venv\Scripts\activate
echo   python app.py
echo.
echo To test the ML service:
echo   curl http://localhost:5000/health
echo.

pause
