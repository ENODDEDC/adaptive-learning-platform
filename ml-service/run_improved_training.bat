@echo off
echo ============================================================
echo FSLSM Improved Training Pipeline
echo Target: 96%+ Accuracy
echo ============================================================
echo.

echo Step 1: Activating virtual environment...
call venv\Scripts\activate.bat
echo.

echo Step 2: Generating 2500 training samples...
python training\generate_synthetic_data.py
echo.

echo Step 3: Training improved models with hyperparameter tuning...
echo This may take 10-15 minutes...
python training\train_models_improved.py
echo.

echo ============================================================
echo Training Complete!
echo ============================================================
echo.
echo Next steps:
echo 1. Check the results above
echo 2. Open Jupyter notebook for detailed analysis:
echo    jupyter notebook notebooks\FSLSM_Analysis.ipynb
echo.
echo 3. Read CAPSTONE_LEAD_RESPONSE.md for full explanation
echo.

pause
