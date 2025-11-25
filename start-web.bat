@echo off
REM Code2Video Web Interface Startup Script for Windows

echo ======================================
echo   Code2Video Web Interface Launcher  
echo ======================================
echo.

REM Check if node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Navigate to web-interface directory
cd /d "%~dp0web-interface"

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

if not exist "client\node_modules\" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

REM Start the server
echo Starting Code2Video Web Interface...
echo Server: http://localhost:3000
echo Frontend Dev: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev
pause
