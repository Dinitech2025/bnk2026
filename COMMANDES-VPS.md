# 📋 Commandes à exécuter sur le VPS

**Puisque vous êtes déjà connecté au VPS, copiez-collez ces commandes :**

## 1️⃣ Configuration PostgreSQL

```bash
# Variables
CONTAINER="postgres"
DB_NAME="dinitech-base"

# 1. Explorer le conteneur
echo "📋 Structure du conteneur:"
docker exec $CONTAINER ls -la /

# 2. Trouver les fichiers de configuration
echo "📋 Recherche postgresql.conf:"
docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null

echo "📋 Recherche pg_hba.conf:"
docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null

# 3. Configuration (remplacez /chemin/réel/ par le vrai chemin)
PG_CONF="/chemin/réel/postgresql.conf"
PG_HBA="/chemin/réel/pg_hba.conf"

# Configurer postgresql.conf
docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""

# Configurer pg_hba.conf
docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""

# 4. Redémarrer PostgreSQL
docker restart $CONTAINER
sleep 3

# 5. Configurer le firewall
ufw allow 5432/tcp
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# 6. Vérifier
echo "📋 Ports ouverts:"
netstat -tuln | grep 5432 || ss -tuln | grep 5432

echo "📋 Bases de données:"
docker exec $CONTAINER psql -U postgres -c "\l" | grep dinitech-base

echo "✅ Configuration terminée!"
```

## 2️⃣ Commandes de vérification

```bash
# Voir les logs PostgreSQL
docker logs $CONTAINER

# Se connecter à PostgreSQL
docker exec -it $CONTAINER psql -U postgres -d dinitech-base

# Voir les connexions actives
docker exec $CONTAINER psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Tester depuis le VPS
docker exec $CONTAINER psql -U postgres -h 0.0.0.0 -p 5432 -d dinitech-base -c "SELECT version();"
```

## 3️⃣ Commandes de dépannage

```bash
# Si PostgreSQL ne démarre pas
docker logs $CONTAINER

# Vérifier la configuration
docker exec $CONTAINER cat /chemin/réel/postgresql.conf | grep listen_addresses
docker exec $CONTAINER cat /chemin/réel/pg_hba.conf | grep "0.0.0.0"

# Redémarrer proprement
docker stop $CONTAINER
docker start $CONTAINER

# Vérifier le firewall
ufw status | grep 5432
iptables -L | grep 5432
```

---

## 🎯 Commandes simplifiées (copiez-collez tout)

```bash
CONTAINER="postgres" && \
echo "🔍 Configuration PostgreSQL..." && \
docker exec $CONTAINER psql -U postgres -c "CREATE DATABASE \"dinitech-base\";" 2>/dev/null || echo "✅ DB existe" && \
docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1 | xargs -I {} docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> {}" && \
docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1 | xargs -I {} docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> {}" && \
docker restart $CONTAINER && \
sleep 3 && \
ufw allow 5432/tcp && \
echo "✅ Configuration terminée!"
```

---

## ✅ Une fois configuré

**Quittez le VPS :**
```bash
exit
```

**Puis sur votre machine Windows :**
```bash
# Test de connexion
npx prisma db push

# Si ça fonctionne :
npx prisma generate
npm run dev
```

**🎉 Votre application devrait maintenant fonctionner !**







