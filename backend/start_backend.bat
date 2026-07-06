@echo off
echo ========================================
echo Starting ML Monitoring Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting backend server...
echo Backend will be available at: http://127.0.0.1:8001
echo API Docs will be available at: http://127.0.0.1:8001/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python run_server.py

pause
