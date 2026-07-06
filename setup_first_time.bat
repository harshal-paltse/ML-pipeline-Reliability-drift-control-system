@echo off
echo ============================================
echo   FIRST TIME SETUP - ML Drift Platform
echo ============================================
echo.

echo [Step 1/5] Creating Python virtual environment...
cd backend
python -m venv venv
echo Done.
echo.

echo [Step 2/5] Installing Python packages...
call venv\Scripts\activate
pip install -r requirements.txt
echo Done.
echo.

echo [Step 3/5] Generating demo ML models...
python create_demo_models.py
echo Done.
echo.

echo [Step 4/5] Installing Node.js packages...
cd ..\frontend
npm install
echo Done.
echo.

echo [Step 5/5] Setup complete!
echo.
echo ============================================
echo   Run start.bat to launch the application
echo ============================================
pause
