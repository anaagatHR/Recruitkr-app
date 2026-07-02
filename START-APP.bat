@echo off
REM ============================================
REM   RecruitKR - App ko phone par chalane ke liye
REM   Bas is file par DOUBLE-CLICK karo.
REM ============================================
title RecruitKR App
cd /d "%~dp0mobile"

echo.
echo ==========================================
echo   RecruitKR app start ho rahi hai...
echo   (Yeh window khuli rehne do - band mat karo)
echo ==========================================
echo.
echo Niche QR code aayega. Use phone ki "Expo Go" app se scan karo.
echo.

call npx expo start --lan

echo.
echo ==========================================
echo  Agar upar error aaya hai to yeh window ka
echo  screenshot lekar bhejo.
echo ==========================================
pause
