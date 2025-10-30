@echo off
REM Start ML Service - Windows Batch Script

echo ========================================
echo   Starting ML Service
echo ========================================
echo.

REM Go back to project root, then to ml-service
cd ..
cd ml-service

REM Check if venv exists
if not exist "venv\" (
    echo ERROR: Virtual environment not found!
    echo Please run setup-ml.bat first
    pause
    exit /b 1
)

REM Check if models exist
if not exist "models\scaler.pkl" (
    echo ERROR: ML models not found!
    echo Please run setup-ml.bat first
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting Flask server on http://localhost:5000
echo Press Ctrl+C to stop
echo.

python app.py
