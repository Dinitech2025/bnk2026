@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 Configuration automatique du VPS
echo ========================================
echo.

set VPS_IP=180.149.199.175
set VPS_USER=root
set VPS_PASS=X0D8i6O6b7u1m9m

echo 📋 Connexion au VPS: %VPS_IP%
echo.

REM Créer un script temporaire pour le VPS
(
echo echo "1️⃣ Recherche du conteneur PostgreSQL..."
echo CONTAINER=$(docker ps --format '{{.Names}}' ^| grep -i postgres ^| head -n 1^)
echo if [ -z "$CONTAINER" ]; then
echo   echo "❌ Aucun conteneur PostgreSQL trouvé"
echo   docker ps -a ^| grep postgres
echo   exit 1
echo fi
echo echo "✅ Conteneur: $CONTAINER"
echo echo ""
echo.
echo echo "2️⃣ Création de la base de données..."
echo docker exec $CONTAINER psql -U postgres -lqt ^| cut -d \^| -f 1 ^| grep -qw dinitech-base
echo if [ $? -ne 0 ]; then
echo   docker exec $CONTAINER psql -U postgres -c "CREATE DATABASE \"dinitech-base\";"
echo   echo "✅ Base de données créée"
echo else
echo   echo "✅ Base de données existe déjà"
echo fi
echo echo ""
echo.
echo echo "3️⃣ Configuration de l'accès distant..."
echo docker exec $CONTAINER bash -c "grep -q \"listen_addresses = '\*'\" /var/lib/postgresql/data/postgresql.conf ^|^| echo \"listen_addresses = '*'\" ^>^> /var/lib/postgresql/data/postgresql.conf"
echo docker exec $CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" /var/lib/postgresql/data/pg_hba.conf ^|^| echo \"host all all 0.0.0.0/0 md5\" ^>^> /var/lib/postgresql/data/pg_hba.conf"
echo echo "✅ Configuration mise à jour"
echo echo ""
echo.
echo echo "4️⃣ Redémarrage de PostgreSQL..."
echo docker restart $CONTAINER
echo sleep 3
echo echo "✅ PostgreSQL redémarré"
echo echo ""
echo.
echo echo "5️⃣ Configuration du firewall..."
echo ufw allow 5432/tcp 2^>^&1 ^|^| iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2^>^&1 ^|^| echo "Firewall configuré"
echo echo "✅ Port 5432 ouvert"
echo echo ""
echo.
echo echo "6️⃣ Vérification..."
echo netstat -tuln ^| grep 5432 ^|^| ss -tuln ^| grep 5432
echo echo ""
echo echo "✅ Configuration terminée!"
) > vps-setup.sh

echo 📤 Envoi du script au VPS...
scp -o StrictHostKeyChecking=no vps-setup.sh %VPS_USER%@%VPS_IP%:/tmp/

echo 🔧 Exécution du script sur le VPS...
ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_IP% "bash /tmp/vps-setup.sh && rm /tmp/vps-setup.sh"

echo.
echo ========================================
echo ✅ Configuration du VPS terminée!
echo ========================================
echo.

echo 🧪 Test de connexion à la base de données...
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
del vps-setup.sh 2>nul
pause







