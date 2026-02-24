@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Tunnel SSH vers PostgreSQL
echo ========================================
echo.

set VPS_IP=180.149.199.175
set VPS_USER=root
set LOCAL_PORT=5433
set REMOTE_PORT=5432

echo 📋 Configuration:
echo    VPS: %VPS_IP%
echo    Port local: %LOCAL_PORT%
echo    Port distant: %REMOTE_PORT%
echo.

echo 🔧 Création du tunnel SSH...
echo    Laissez cette fenêtre ouverte pendant que vous travaillez
echo.

"C:\Program Files\PuTTY\plink.exe" -ssh -L %LOCAL_PORT%:localhost:%REMOTE_PORT% %VPS_USER%@%VPS_IP% -N

echo.
echo ❌ Tunnel fermé
pause







