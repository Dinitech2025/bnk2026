@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Configuration Base de Données VPS
echo ========================================
echo.

REM Informations VPS
set VPS_IP=180.149.199.175
set VPS_USER=root
set DB_NAME=dinitech-base

echo 📋 Informations VPS:
echo    IP: %VPS_IP%
echo    User: %VPS_USER%
echo    Database: %DB_NAME%
echo.

REM Demander le mot de passe PostgreSQL
set /p PG_PASSWORD="🔑 Mot de passe PostgreSQL (défaut: postgres): "
if "%PG_PASSWORD%"=="" set PG_PASSWORD=postgres

REM Demander le port
set /p PG_PORT="🔌 Port PostgreSQL (défaut: 5432): "
if "%PG_PORT%"=="" set PG_PORT=5432

REM Demander l'utilisateur
set /p PG_USER="👤 Utilisateur PostgreSQL (défaut: postgres): "
if "%PG_USER%"=="" set PG_USER=postgres

REM Construire l'URL
set DATABASE_URL=postgresql://%PG_USER%:%PG_PASSWORD%@%VPS_IP%:%PG_PORT%/%DB_NAME%?schema=public

echo.
echo 📝 Création du fichier .env.local...

REM Créer le fichier .env.local
(
echo # Base de données VPS PostgreSQL
echo DATABASE_URL="%DATABASE_URL%"
echo.
echo # NextAuth
echo NEXTAUTH_SECRET="votre_secret_nextauth_a_changer"
echo NEXTAUTH_URL="http://localhost:3000"
) > .env.local

echo ✅ Fichier .env.local créé!
echo.

REM Générer le client Prisma
echo 🔄 Génération du client Prisma...
call npx prisma generate
echo.

REM Demander si on veut pousser le schéma
set /p PUSH_SCHEMA="📤 Pousser le schéma vers la base de données? (o/N): "
if /i "%PUSH_SCHEMA%"=="o" (
    echo.
    echo 📤 Push du schéma...
    call npx prisma db push
    echo.
)

echo.
echo ========================================
echo 🎉 Configuration terminée!
echo ========================================
echo.
echo 📋 Prochaines étapes:
echo    1. Vérifiez le fichier .env.local
echo    2. Exécutez: npm run dev
echo    3. Testez votre application
echo.
pause







