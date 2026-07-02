@echo off
REM ============================================
REM   RecruitKR - Backend (demo) chalane ke liye
REM   Bas is file par DOUBLE-CLICK karo.
REM   Pehli baar database download hoga - wait karo.
REM ============================================
title RecruitKR Backend
cd /d "%~dp0backend"

echo.
echo ==========================================
echo   RecruitKR backend start ho raha hai...
echo   (Yeh window khuli rehne do - band mat karo)
echo ==========================================
echo.

call npm run demo

echo.
echo ==========================================
echo  Agar error aaya to is window ka screenshot bhejo.
echo ==========================================
pause
