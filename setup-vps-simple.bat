@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Configuration VPS PostgreSQL
echo ========================================
echo.

set VPS_IP=180.149.199.175
set VPS_USER=root
set VPS_PASS=X0D8i6O6b7u1m9m

echo 📋 Test de connexion au VPS...
echo y | "C:\Program Files\PuTTY\plink.exe" -ssh -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "echo '✅ Connexion OK'"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur de connexion SSH
    echo    Vérifiez le mot de passe ou l'adresse IP
    pause
    exit /b 1
)

echo ✅ Connexion SSH réussie
echo.

echo 🔧 Configuration PostgreSQL...
echo.

REM Commandes à exécuter sur le VPS
set COMMANDS=^
docker ps ^| grep postgres ^&^& ^
echo "" ^&^& ^
echo "🔍 Recherche des fichiers de configuration..." ^&^& ^
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2^>/dev/null ^| head -1) ^&^& ^
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2^>/dev/null ^| head -1) ^&^& ^
echo "✅ Config trouvé: $PG_CONF" ^&^& ^
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\"" ^&^& ^
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\"" ^&^& ^
docker restart postgres ^&^& ^
sleep 3 ^&^& ^
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT ^&^& ^
echo "✅ Configuration terminée!" ^&^& ^
echo "" ^&^& ^
echo "🧪 Test de connexion:" ^&^& ^
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" 2^>/dev/null ^&^& echo "✅ Connexion externe OK" ^|^| echo "❌ Connexion externe échoue"

echo 📤 Exécution des commandes...
echo y | "C:\Program Files\PuTTY\plink.exe" -ssh -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "%COMMANDS%"

echo.
echo ========================================
echo ✅ Configuration terminée!
echo ========================================
echo.

echo 🧪 Test de connexion depuis Windows...
npx prisma db push --skip-generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Connexion réussie!
    echo.
    echo 📋 Prochaines étapes:
    echo    1. npx prisma generate
    echo    2. npm run dev
) else (
    echo.
    echo ❌ Erreur de connexion
    echo    Vérifiez les logs ci-dessus
)

echo.
pause







