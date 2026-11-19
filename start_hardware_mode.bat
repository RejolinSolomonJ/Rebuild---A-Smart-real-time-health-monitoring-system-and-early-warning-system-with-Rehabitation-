@echo off
title ReBuild - Live Hardware Mode
echo ========================================================
echo ReBuild Sentinel - Live Hardware Serial Connection
echo ========================================================
echo.
echo [1/2] Setting Environment for Live Arduino Hardware...
set USE_SIMULATOR=false
set SERIAL_PORT=AUTO
set BAUD=115200

echo [2/2] Launching Backend Server on port 8000...
echo Ensure your Arduino Uno/Nano is plugged in and Arduino IDE Serial Monitor is closed!
echo.
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
