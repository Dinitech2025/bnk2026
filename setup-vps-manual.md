# 🚀 Configuration VPS PostgreSQL - Guide Manuel

**Puisque SSH demande le mot de passe interactivement, voici les étapes manuelles :**

## 📋 Commandes à exécuter sur votre VPS

**1️⃣ Connectez-vous au VPS :**
```bash
ssh root@180.149.199.175
# Mot de passe: X0D8i6O6b7u1m9m
```

**2️⃣ Exécutez ces commandes une par une :**

```bash
# 1. Vérifier le conteneur
docker ps | grep postgres

# 2. Trouver les fichiers de config
docker exec postgres find / -name postgresql.conf
docker exec postgres find / -name pg_hba.conf

# 3. Configurer postgresql.conf (remplacez /chemin/réel/)
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> /chemin/réel/postgresql.conf"

# 4. Configurer pg_hba.conf (remplacez /chemin/réel/)
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> /chemin/réel/pg_hba.conf"

# 5. Redémarrer PostgreSQL
docker restart postgres

# 6. Attendre 3 secondes
sleep 3

# 7. Ouvrir le port
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# 8. Vérifier
docker exec postgres netstat -tuln | grep 5432
```

**3️⃣ Quitter le VPS :**
```bash
exit
```

**4️⃣ Sur Windows, tester :**
```bash
npx prisma db push
```

---

## 🔧 Script complet (si vous voulez tout d'un coup)

```bash
#!/bin/bash
CONTAINER="postgres"
echo "🔧 Configuration PostgreSQL..."
PG_CONF=$(docker exec $CONTAINER find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec $CONTAINER find / -name pg_hba.conf 2>/dev/null | head -1)
echo "✅ Config: $PG_CONF"
docker exec $CONTAINER bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
docker exec $CONTAINER bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
docker restart $CONTAINER
sleep 3
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
echo "✅ Terminé!"
```

---

## 📋 Dépannage

**Si vous avez une erreur :**

1. **"postgresql.conf not found"**
   ```bash
   # Trouver le vrai chemin
   docker exec postgres find / -name postgresql.conf
   # Puis utiliser le vrai chemin
   ```

2. **"Connection refused"**
   ```bash
   # Vérifier le port
   docker exec postgres netstat -tuln | grep 5432

   # Vérifier le firewall
   iptables -L | grep 5432

   # Redémarrer PostgreSQL
   docker restart postgres
   ```

3. **"Authentication failed"**
   ```bash
   # Changer le mot de passe
   docker exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'dinyoili@PJB24';"
   ```

---

## ✅ Vérification finale

**Sur le VPS :**
```bash
# Test de connexion local
docker exec postgres psql -U postgres -h localhost -p 5432 -c "SELECT 1;"

# Test de connexion externe
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;"
```

**Sur Windows :**
```bash
# Test final
npx prisma db push
```

**🎉 Si tout fonctionne, votre application démarrera sans erreurs !**







