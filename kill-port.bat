@echo off
echo 🧹 Nettoyage du port 3000...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Arrêt du processus %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ Port 3000 libéré
echo.
pause 