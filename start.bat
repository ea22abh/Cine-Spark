@echo off
title CineSpark Launcher
set ROOT=%~dp0
set BACKEND=%ROOT%Cine_spark_Backend
set FRONTEND=%ROOT%cinespark_frontend_react_js

echo ============================================
echo   CineSpark - Full Auto Startup
echo ============================================
echo.

REM ── Step 1: Start MySQL if not already running ──────────────────────────────
echo [1/5] Checking MySQL...
C:\xampp\mysql\bin\mysqladmin.exe -u root status >nul 2>&1
if %errorlevel% EQU 0 goto MYSQL_READY

echo       MySQL not running. Starting it now...
start /B "" C:\xampp\mysql\bin\mysqld.exe --standalone --console >nul 2>&1
echo       Waiting for MySQL to be ready...

:WAIT_MYSQL
timeout /t 2 /nobreak >nul
C:\xampp\mysql\bin\mysqladmin.exe -u root status >nul 2>&1
if %errorlevel% NEQ 0 goto WAIT_MYSQL
echo       MySQL started successfully.
goto STEP2

:MYSQL_READY
echo       MySQL is already running.

:STEP2
REM ── Step 2: Create the database if it does not exist ────────────────────────
echo [2/5] Creating database if not exists...
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS cinespark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
echo       Database 'cinespark' is ready.

REM ── Step 3: Install backend dependencies if missing ─────────────────────────
echo [3/5] Checking backend dependencies...
if not exist "%BACKEND%\node_modules" (
    echo       Installing backend packages ^(first run only^)...
    cd /d "%BACKEND%"
    call npm install
)
echo       Backend dependencies ready.

REM ── Step 4: Install frontend dependencies if missing ────────────────────────
echo [4/5] Checking frontend dependencies...
if not exist "%FRONTEND%\node_modules" (
    echo       Installing frontend packages ^(first run only^)...
    cd /d "%FRONTEND%"
    call npm install
)
echo       Frontend dependencies ready.

REM ── Step 5: Start both servers ───────────────────────────────────────────────
echo [5/5] Starting servers...
start "CineSpark Backend"  cmd /k "cd /d %BACKEND% && npm run dev"
start "CineSpark Frontend" cmd /k "cd /d %FRONTEND% && npm run dev"

echo.
echo ============================================
echo   Both servers starting in separate windows
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo ============================================
pause >nul
