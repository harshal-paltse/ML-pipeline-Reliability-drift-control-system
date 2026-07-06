@echo off
echo ========================================
echo Starting ML Monitoring Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies (if needed)...
call npm install

echo.
echo Starting frontend development server...
echo Frontend will be available at: http://localhost:3000
echo.
echo Make sure the backend is running on http://127.0.0.1:8001
echo.

REM Disable ESLint cache to avoid permission issues
set ESLINT_NO_DEV_ERRORS=true
set DISABLE_ESLINT_PLUGIN=false

call npm start

pause
