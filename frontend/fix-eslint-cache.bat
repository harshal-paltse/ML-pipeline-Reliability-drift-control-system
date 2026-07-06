@echo off
echo Fixing ESLint cache permission issue...
echo.

cd /d "%~dp0"

echo Stopping any running processes that might be using the cache...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Attempting to delete ESLint cache...
if exist "node_modules\.cache\.eslintcache" (
    del /F /Q "node_modules\.cache\.eslintcache" 2>nul
    if errorlevel 1 (
        echo Cache file is locked. Please close any running Node.js processes and try again.
        echo Or manually delete: node_modules\.cache\.eslintcache
    ) else (
        echo Cache file deleted successfully!
    )
) else (
    echo Cache file not found - already cleaned!
)

echo.
echo You can now start the frontend with: npm start
echo.
pause
