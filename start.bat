@echo off
echo ============================================
echo   ML Drift Control Platform - Starting...
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend on http://localhost:8000
start "ML Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait 3 seconds
timeout /t 3 /nobreak > nul

:: Start Frontend
echo [2/2] Starting Frontend on http://localhost:5173
start "ML Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak > nul

:: Open browser
echo.
echo Opening browser...
start http://localhost:5173/login

echo.
echo ============================================
echo   Both servers are running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo   Login    : admin / admin123
echo ============================================
