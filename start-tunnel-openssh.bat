@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Tunnel SSH vers PostgreSQL (OpenSSH)
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
echo    Mot de passe SSH: X0D8i6O6b7u1m9m
echo.

ssh -L %LOCAL_PORT%:localhost:%REMOTE_PORT% %VPS_USER%@%VPS_IP% -N

echo.
echo ❌ Tunnel fermé
pause







