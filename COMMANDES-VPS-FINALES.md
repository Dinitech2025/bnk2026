# 📋 Commandes VPS - Configuration Finale

**Puisque les scripts automatiques ont des problèmes, voici les commandes manuelles :**

## 🚀 Étapes à suivre

### 1️⃣ Connectez-vous au VPS

```bash
ssh root@180.149.199.175
# Mot de passe: X0D8i6O6b7u1m9m
```

### 2️⃣ Exécutez ces commandes une par une

```bash
# 1. Vérifier le conteneur
docker ps | grep postgres

# 2. Trouver les fichiers de configuration
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1)

echo "📋 Config trouvé: $PG_CONF"

# 3. Configurer postgresql.conf
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""

# 4. Configurer pg_hba.conf
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""

# 5. Redémarrer PostgreSQL
docker restart postgres

# 6. Attendre
sleep 3

# 7. Ouvrir le port
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# 8. Vérifier
docker exec postgres netstat -tuln | grep 5432
echo "✅ Terminé!"
```

### 3️⃣ Quitter le VPS

```bash
exit
```

### 4️⃣ Sur Windows, tester

```bash
npx prisma db push
npx prisma generate
npm run dev
```

---

## 🔧 Commande complète (copiez-collez tout)

```bash
CONTAINER="postgres" && \
echo "🚀 Configuration PostgreSQL..." && \
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1) && \
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1) && \
echo "✅ Config: $PG_CONF" && \
docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\"" && \
docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\"" && \
docker restart $CONTAINER && \
sleep 3 && \
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT && \
docker exec $CONTAINER netstat -tuln | grep 5432 && \
echo "✅ Configuration terminée!"
```

---

## 📝 Dépannage

**Si "postgresql.conf not found":**
```bash
# Trouver le vrai chemin
docker exec postgres find / -name postgresql.conf

# Puis utiliser le vrai chemin dans les commandes
```

**Si "Connection refused" après config:**
```bash
# Vérifier que PostgreSQL écoute
docker exec postgres netstat -tuln | grep 5432

# Vérifier le firewall
iptables -L | grep 5432

# Redémarrer PostgreSQL
docker restart postgres
```

**Si "Authentication failed":**
```bash
# Changer le mot de passe PostgreSQL
docker exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'dinyoili@PJB24';"
```

---

## ✅ Résultat attendu

**Sur le VPS:**
- PostgreSQL écoute sur `0.0.0.0:5432`
- Le port 5432 est ouvert dans le firewall
- Base de données `dinitech-base` accessible

**Sur Windows:**
- `npx prisma db push` fonctionne ✅
- `npm run dev` démarre sans erreurs 500 ✅

**🎉 Votre application BoutikNaka va fonctionner parfaitement !**

---

## 🚨 Si vous avez des erreurs

**Copiez-moi les messages d'erreur** et je vous aiderai à les corriger immédiatement. 🔧







