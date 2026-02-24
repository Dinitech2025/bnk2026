# 📋 Commandes VPS - Version Simplifiée

**Puisque SSH demande le mot de passe, exécutez ces commandes manuellement sur votre VPS :**

## 🚀 Configuration Rapide (3 commandes)

**1️⃣ Connectez-vous :**
```bash
ssh root@180.149.199.175
# Mot de passe: X0D8i6O6b7u1m9m
```

**2️⃣ Exécutez ces 3 commandes :**

```bash
# Commande 1: Redémarrer et configurer
docker restart postgres && sleep 3

# Commande 2: Ouvrir le port firewall
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# Commande 3: Test de connexion
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"
```

**3️⃣ Si le test échoue, exécutez :**

```bash
# Trouver les fichiers de config
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1)

# Configurer postgresql.conf
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""

# Configurer pg_hba.conf
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""

# Redémarrer PostgreSQL
docker restart postgres
sleep 3

# Test final
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;"
```

**4️⃣ Quitter et tester :**
```bash
exit
npx prisma db push
```

---

## 🔧 Commande complète (tout en une fois)

```bash
docker restart postgres && \
sleep 3 && \
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT && \
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" 2>/dev/null && \
echo "✅ Configuration réussie!" || \
(echo "📋 Configuration avancée..." && \
PG_CONF=$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1) && \
PG_HBA=$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1) && \
docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\"" && \
docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\"" && \
docker restart postgres && \
sleep 3 && \
docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;" && \
echo "✅ Configuration terminée!")
```

---

## 📋 Ce que ça fait :

1. **Redémarre PostgreSQL** pour qu'il écoute sur 0.0.0.0:5432
2. **Ouvre le port 5432** dans le firewall
3. **Test la connexion externe**
4. **Si ça échoue**, configure les fichiers de PostgreSQL

## ✅ Résultat attendu :

- `docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT 1;"` → ✅
- `npx prisma db push` → ✅

**🎯 Copiez-collez la commande complète dans votre terminal VPS !**

**Si vous avez une erreur, copiez-la moi !** 🔧







