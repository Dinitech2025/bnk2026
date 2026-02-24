
echo "1️⃣ Recherche du conteneur PostgreSQL..."
CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)

if [ -z "$CONTAINER" ]; then
  echo "❌ Aucun conteneur PostgreSQL trouvé"
  docker ps -a | grep postgres
  exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER"
echo ""

echo "2️⃣ Vérification/Création de la base de données..."
docker exec $CONTAINER psql -U postgres -lqt | cut -d \| -f 1 | grep -qw dinitech-base
if [ $? -ne 0 ]; then
  docker exec $CONTAINER psql -U postgres -c "CREATE DATABASE \"dinitech-base\";"
  echo "✅ Base de données créée"
else
  echo "✅ Base de données existe déjà"
fi
echo ""

echo "3️⃣ Configuration de l'accès distant..."
docker exec $CONTAINER bash -c "grep -q \"listen_addresses = '\*'\" /var/lib/postgresql/data/postgresql.conf || echo \"listen_addresses = '*'\" >> /var/lib/postgresql/data/postgresql.conf"
docker exec $CONTAINER bash -c "grep -q \"host.*all.*all.*0.0.0.0/0.*md5\" /var/lib/postgresql/data/pg_hba.conf || echo \"host all all 0.0.0.0/0 md5\" >> /var/lib/postgresql/data/pg_hba.conf"
echo "✅ Configuration PostgreSQL mise à jour"
echo ""

echo "4️⃣ Redémarrage de PostgreSQL..."
docker restart $CONTAINER
sleep 3
echo "✅ PostgreSQL redémarré"
echo ""

echo "5️⃣ Configuration du firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 5432/tcp 2>&1 || echo "ufw déjà configuré"
  echo "✅ Port 5432 ouvert avec ufw"
elif command -v iptables &> /dev/null; then
  iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>&1 || echo "iptables déjà configuré"
  echo "✅ Port 5432 ouvert avec iptables"
fi
echo ""

echo "6️⃣ Vérification du port..."
netstat -tuln | grep 5432 || ss -tuln | grep 5432
echo ""

echo "✅ Configuration terminée!"
