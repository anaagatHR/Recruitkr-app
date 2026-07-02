@echo off
REM ============================================
REM   RecruitKR - APK banane ke liye (cloud build)
REM   Pehli baar Expo account login maangega.
REM ============================================
title RecruitKR - Build APK
cd /d "%~dp0mobile"

echo ============================================
echo   RecruitKR APK Builder
echo ============================================
echo.
echo Yeh process Expo ke cloud par APK banayega.
echo Agar login maange to apna Expo account email/password daalna.
echo (Account free hai: https://expo.dev par bana lo)
echo.
echo Build 10-15 minute lega. Khatam hone par DOWNLOAD LINK milega.
echo.
pause

echo.
echo --- Step 1: Expo login ---
call npx eas-cli login
if errorlevel 1 (
  echo.
  echo Login fail hua. Expo account banao: https://expo.dev
  echo Phir yeh file dobara double-click karo.
  pause
  exit /b
)

echo.
echo --- Step 2: APK build start (cloud, 10-15 min) ---
call npx eas-cli build -p android --profile preview

echo.
echo ============================================
echo  Ho gaya! Upar jo link aaya hai usse APK
echo  download karo aur phone me install karo.
echo  Agar error aaya to is window ka screenshot bhejo.
echo ============================================
pause
