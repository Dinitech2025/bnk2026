@echo off
echo 🚀 Démarrage du serveur de développement...
echo.

REM Libérer le port 3000
echo 🧹 Nettoyage du port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Arrêt du processus %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ Port 3000 libéré
echo.

REM Démarrer le serveur
echo 🌐 Démarrage de l'application...
npm run dev

pause 