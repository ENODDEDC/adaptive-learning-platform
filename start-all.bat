@echo off
echo ============================================================
echo 🚀 Starting Complete Assistive Learning Platform
echo ============================================================
echo.

echo [1/3] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running
) else (
    echo ⚠️ MongoDB not running, attempting to start...
    net start MongoDB
)
echo.

echo [2/3] Starting Next.js Application...
echo 📱 Frontend/Backend will run on http://localhost:3000
start "Next.js App" cmd /k "npm run dev"
echo ✅ Next.js starting in new window...
echo.

echo Waiting 5 seconds for Next.js to initialize...
timeout /t 5 /nobreak >nul
echo.

echo [3/3] Starting ML Service...
echo 🤖 ML Classification Service will run on http://localhost:5000
start "ML Service" cmd /k "cd ml-service && .\venv\Scripts\activate && python app.py"
echo ✅ ML Service starting in new window...
echo.

echo ============================================================
echo ✅ System Startup Complete!
echo ============================================================
echo.
echo 📱 Next.js App:     http://localhost:3000
echo 🤖 ML Service:      http://localhost:5000
echo 💾 MongoDB:         mongodb://localhost:27017
echo.
echo 📝 Note: Two new windows opened for each service
echo    Keep them running during your demo!
echo.
echo Press any key to close this window...
pause >nul
