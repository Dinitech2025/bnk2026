#!/bin/bash

echo "🚀 Configuration automatique complète de PostgreSQL..."
echo ""

# Variables
CONTAINER="postgres"
DB_NAME="dinitech-base"

echo "1️⃣ Test de connexion locale..."
if docker exec $CONTAINER psql -U postgres -h localhost -p 5432 -c "SELECT 1;" 2>/dev/null; then
    echo "✅ PostgreSQL fonctionne localement"
else
    echo "❌ PostgreSQL ne fonctionne pas localement"
    echo "📋 Redémarrage du conteneur..."
    docker restart $CONTAINER
    sleep 5
fi

echo ""
echo "2️⃣ Vérification du mapping des ports..."
docker ps | grep $CONTAINER

echo ""
echo "3️⃣ Test d'écoute sur 0.0.0.0..."
if docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" 2>/dev/null; then
    echo "✅ PostgreSQL écoute sur 0.0.0.0"
else
    echo "❌ PostgreSQL n'écoute pas sur 0.0.0.0"
    echo "📋 Configuration des fichiers..."

    # Trouver et configurer postgresql.conf
    PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
    if [ -n "$PG_CONF" ]; then
        echo "📋 Configuration postgresql.conf..."
        docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
        docker exec $CONTAINER bash -c "grep -q \"port = 5432\" \"$PG_CONF\" || echo \"port = 5432\" >> \"$PG_CONF\""
    fi

    # Trouver et configurer pg_hba.conf
    PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)
    if [ -n "$PG_HBA" ]; then
        echo "📋 Configuration pg_hba.conf..."
        docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
        docker exec $CONTAINER bash -c "echo \"host all all ::/0 md5\" >> \"$PG_HBA\""
    fi

    echo "📋 Redémarrage PostgreSQL..."
    docker restart $CONTAINER
    sleep 5
fi

echo ""
echo "4️⃣ Configuration du firewall..."
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>/dev/null || echo "iptables déjà configuré"
ufw allow 5432/tcp 2>/dev/null || echo "ufw non disponible"

echo ""
echo "5️⃣ Vérifications finales..."
echo "📋 Ports:"
docker exec $CONTAINER netstat -tuln | grep 5432 || docker exec $CONTAINER ss -tuln | grep 5432

echo ""
echo "📋 Test externe:"
if docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT version();" 2>/dev/null; then
    echo "✅ Connexion externe OK"
else
    echo "❌ Connexion externe échoue"
fi

echo ""
echo "📋 Base de données:"
docker exec $CONTAINER psql -U postgres -c "\l" | grep $DB_NAME || docker exec $CONTAINER psql -U postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Testez maintenant depuis Windows:"
echo "   npx prisma db push"







