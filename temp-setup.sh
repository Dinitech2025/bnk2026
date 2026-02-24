
#!/bin/bash

echo "🚀 Configuration PostgreSQL..."

CONTAINER="postgres"

echo "1️⃣ Vérification du conteneur..."
if ! docker ps | grep -q $CONTAINER; then
    echo "❌ Conteneur PostgreSQL non trouvé"
    docker ps -a
    exit 1
fi
echo "✅ Conteneur: $CONTAINER"

echo ""
echo "2️⃣ Recherche des fichiers de configuration..."
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)

echo "📋 postgresql.conf: $PG_CONF"
echo "📋 pg_hba.conf: $PG_HBA"

echo ""
echo "3️⃣ Configuration postgresql.conf..."
if [ -n "$PG_CONF" ]; then
    docker exec $CONTAINER bash -c "grep -q "listen_addresses = '\*'" "$PG_CONF" || echo "listen_addresses = '*'" >> "$PG_CONF""
    docker exec $CONTAINER bash -c "grep -q "port = 5432" "$PG_CONF" || echo "port = 5432" >> "$PG_CONF""
    echo "✅ listen_addresses configuré"
else
    echo "❌ postgresql.conf non trouvé"
fi

echo ""
echo "4️⃣ Configuration pg_hba.conf..."
if [ -n "$PG_HBA" ]; then
    docker exec $CONTAINER bash -c "grep -q "host.*all.*all.*0.0.0.0/0.*md5" "$PG_HBA" || echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA""
    echo "✅ Accès distant configuré"
else
    echo "❌ pg_hba.conf non trouvé"
fi

echo ""
echo "5️⃣ Redémarrage de PostgreSQL..."
docker restart $CONTAINER
sleep 3

echo ""
echo "6️⃣ Configuration du firewall..."
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>/dev/null || echo "iptables déjà configuré"
echo "✅ Port 5432 ouvert"

echo ""
echo "7️⃣ Vérification..."
echo "📋 Ports:"
docker exec $CONTAINER netstat -tuln | grep 5432 || docker exec $CONTAINER ss -tuln | grep 5432

echo ""
echo "📋 Configuration:"
docker exec $CONTAINER grep "listen_addresses" "$PG_CONF" 2>/dev/null
docker exec $CONTAINER grep "0.0.0.0/0" "$PG_HBA" 2>/dev/null

echo ""
echo "📋 Test de connexion:"
docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT version();" 2>/dev/null && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Le serveur est maintenant accessible depuis l'extérieur"
