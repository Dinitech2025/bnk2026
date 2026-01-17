@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Configuration automatique VPS PostgreSQL
echo ========================================
echo.

set VPS_IP=180.149.199.175
set VPS_USER=root
set VPS_PASS=X0D8i6O6b7u1m9m

echo 📋 Vérification de plink (PuTTY)...
plink -V >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ plink (PuTTY) non trouvé
    echo.
    echo 📝 Installez PuTTY:
    echo    https://www.putty.org/
    echo.
    echo    OU utilisez Git Bash:
    echo    bash configure-vps.sh
    echo.
    pause
    exit /b 1
)

echo ✅ plink trouvé
echo.

REM Script à exécuter sur le VPS
set VPS_SCRIPT=^
echo "🚀 Configuration PostgreSQL..." ^&^& ^
echo "" ^&^& ^
echo "1️⃣ Vérification du conteneur..." ^&^& ^
if not docker ps ^| findstr postgres ^>nul 2^>^&1 ( echo "❌ Conteneur PostgreSQL non trouvé" ^&^& docker ps -a ^&^& exit 1 ) ^&^& ^
echo "✅ Conteneur trouvé" ^&^& ^
echo "" ^&^& ^
echo "2️⃣ Recherche des fichiers de configuration..." ^&^& ^
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2^>/dev/null ^| head -1) ^&^& ^
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2^>/dev/null ^| head -1) ^&^& ^
echo "📋 postgresql.conf: $PG_CONF" ^&^& ^
echo "📋 pg_hba.conf: $PG_HBA" ^&^& ^
echo "" ^&^& ^
echo "3️⃣ Configuration postgresql.conf..." ^&^& ^
if defined PG_CONF ( docker exec postgres bash -c "grep -q \"listen_addresses = '\\*'\" \"$PG_CONF\" ^|^| echo \"listen_addresses = '*'\" ^>^> \"$PG_CONF\"" ^&^& echo "✅ listen_addresses configuré" ) else ( echo "❌ postgresql.conf non trouvé" ) ^&^& ^
echo "" ^&^& ^
echo "4️⃣ Configuration pg_hba.conf..." ^&^& ^
if defined PG_HBA ( docker exec postgres bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" \"$PG_HBA\" ^|^| echo \"host all all 0.0.0.0/0 md5\" ^>^> \"$PG_HBA\"" ^&^& echo "✅ Accès distant configuré" ) else ( echo "❌ pg_hba.conf non trouvé" ) ^&^& ^
echo "" ^&^& ^
echo "5️⃣ Redémarrage de PostgreSQL..." ^&^& ^
docker restart postgres ^&^& ^
sleep 3 ^&^& ^
echo "✅ PostgreSQL redémarré" ^&^& ^
echo "" ^&^& ^
echo "6️⃣ Configuration du firewall..." ^&^& ^
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2^>nul ^|^| echo "iptables déjà configuré" ^&^& ^
echo "✅ Port 5432 ouvert" ^&^& ^
echo "" ^&^& ^
echo "7️⃣ Vérification..." ^&^& ^
echo "📋 Ports:" ^&^& ^
docker exec postgres netstat -tuln ^| grep 5432 ^|^| docker exec postgres ss -tuln ^| grep 5432 ^&^& ^
echo "" ^&^& ^
echo "📋 Test de connexion:" ^&^& ^
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT version();" 2^>/dev/null ^&^& echo "✅ Connexion externe OK" ^|^| echo "❌ Connexion externe échoue" ^&^& ^
echo "" ^&^& ^
echo "✅ Configuration terminée!"

echo 📤 Exécution du script sur le VPS...
echo y | plink -ssh -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "%VPS_SCRIPT%"

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







