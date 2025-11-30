@echo off
echo ============================================================
echo 🔧 Setting up ML Service Environment
echo ============================================================
echo.

if not exist ml-service (
    echo ❌ ml-service directory not found
    pause
    exit /b 1
)

echo [1/3] Creating Python virtual environment...
pushd ml-service
python -m venv venv
if errorlevel 1 (
    echo ❌ Failed to create virtual environment
    echo Make sure Python is installed and in your PATH
    popd
    pause
    exit /b 1
)
echo ✅ Virtual environment created
echo.

echo [2/3] Upgrading pip...
venv\Scripts\python.exe -m pip install --upgrade pip
echo ✅ Pip upgraded
echo.

echo [3/3] Installing dependencies...
venv\Scripts\pip.exe install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    popd
    pause
    exit /b 1
)
echo ✅ Dependencies installed
popd
echo.

echo ============================================================
echo ✅ ML Service Setup Complete!
echo ============================================================
echo.
echo You can now run start-all.bat to start the complete system
echo.
pause
