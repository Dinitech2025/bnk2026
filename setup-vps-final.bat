@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Configuration finale VPS PostgreSQL
echo ========================================
echo.

set VPS_IP=180.149.199.175
set VPS_USER=root
set VPS_PASS=X0D8i6O6b7u1m9m

echo 📋 Test de connexion SSH...
echo y | "C:\Program Files\PuTTY\plink.exe" -ssh -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "echo '✅ SSH OK'"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur SSH
    pause
    exit /b 1
)

echo ✅ Connexion SSH réussie
echo.

echo 🔧 Configuration PostgreSQL...

REM Commandes à exécuter (simplifiées)
set COMMAND=^
docker ps ^| grep postgres ^&^& ^
echo "" ^&^& ^
echo "🔍 Recherche configuration..." ^&^& ^
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2^>/dev/null ^| head -1) ^&^& ^
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2^>/dev/null ^| head -1) ^&^& ^
echo "✅ Config: $PG_CONF" ^&^& ^
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\"" ^&^& ^
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\"" ^&^& ^
docker restart postgres ^&^& ^
sleep 3 ^&^& ^
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT ^&^& ^
echo "✅ Configuration terminée!" ^&^& ^
echo "" ^&^& ^
docker exec postgres netstat -tuln ^| grep 5432 ^|^| docker exec postgres ss -tuln ^| grep 5432

echo 📤 Exécution des commandes...
echo y | "C:\Program Files\PuTTY\plink.exe" -ssh -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "%COMMAND%"

echo.
echo ========================================
echo ✅ Configuration terminée!
echo ========================================
echo.

echo 🧪 Test de connexion depuis Windows...
npx prisma db push --skip-generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Connexion à la base de données réussie!
    echo.
    echo 📋 Prochaines étapes:
    echo    1. npx prisma generate
    echo    2. npm run dev
    echo.
    echo 🎉 Votre application va maintenant fonctionner!
) else (
    echo.
    echo ❌ Erreur de connexion à la base de données
    echo.
    echo 📝 Dépannage:
    echo    - Vérifiez que PostgreSQL écoute sur 0.0.0.0:5432
    echo    - Vérifiez que le port 5432 est ouvert
    echo    - Vérifiez les credentials dans .env.local
)

echo.
pause







