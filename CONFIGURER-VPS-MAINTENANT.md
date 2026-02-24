# 🚀 Configuration VPS PostgreSQL - À FAIRE MAINTENANT

## ⚡ Étapes Rapides (5 minutes)

### 1. Connectez-vous à votre VPS

```bash
ssh root@180.149.199.175
# Mot de passe: X0D8i6O6b7u1m9m
```

### 2. Trouvez le conteneur PostgreSQL

```bash
docker ps | grep postgres
```

**Notez le nom du conteneur** (par exemple: `postgres`, `postgresql`, `db`, etc.)

### 3. Créez la base de données (si elle n'existe pas)

```bash
# Remplacez <nom_conteneur> par le nom réel
docker exec -it <nom_conteneur> psql -U postgres

# Dans psql, exécutez:
CREATE DATABASE "dinitech-base";
\q
```

### 4. Configurez PostgreSQL pour accepter les connexions distantes

```bash
# Remplacez <nom_conteneur> par le nom réel
CONTAINER_NAME="<nom_conteneur>"

# Configurer listen_addresses
docker exec $CONTAINER_NAME bash -c "echo \"listen_addresses = '*'\" >> /var/lib/postgresql/data/postgresql.conf"

# Configurer pg_hba.conf
docker exec $CONTAINER_NAME bash -c "echo \"host all all 0.0.0.0/0 md5\" >> /var/lib/postgresql/data/pg_hba.conf"

# Redémarrer PostgreSQL
docker restart $CONTAINER_NAME
```

### 5. Ouvrez le port 5432 dans le firewall

```bash
# Avec ufw (Ubuntu/Debian)
ufw allow 5432/tcp

# OU avec iptables
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
iptables-save > /etc/iptables/rules.v4

# OU avec firewalld (CentOS/RHEL)
firewall-cmd --permanent --add-port=5432/tcp
firewall-cmd --reload
```

### 6. Vérifiez que PostgreSQL écoute sur toutes les interfaces

```bash
netstat -tuln | grep 5432
# ou
ss -tuln | grep 5432

# Vous devriez voir: 0.0.0.0:5432 ou :::5432
```

### 7. Testez depuis votre machine Windows

Déconnectez-vous du VPS (`exit`) et sur votre machine Windows, exécutez:

```bash
npx prisma db push
```

Si ça fonctionne, vous verrez : ✅ "Your database is now in sync with your Prisma schema"

---

## 🔧 Script Automatique (Alternative)

Si vous préférez, exécutez ce script automatique sur votre machine Windows :

```powershell
# Avec PowerShell
.\configure-vps-postgres.ps1

# Ou avec Git Bash
bash configure-vps-postgres.sh
```

---

## ❌ Dépannage

### Erreur: "Can't reach database server"

**Causes possibles:**
1. PostgreSQL n'écoute pas sur 0.0.0.0
2. Le firewall bloque le port 5432
3. Le conteneur PostgreSQL n'est pas démarré

**Solutions:**

```bash
# Sur le VPS, vérifiez:
docker ps | grep postgres  # Le conteneur doit être "Up"
docker logs <nom_conteneur>  # Vérifiez les erreurs

# Vérifiez la configuration:
docker exec <nom_conteneur> cat /var/lib/postgresql/data/postgresql.conf | grep listen
docker exec <nom_conteneur> cat /var/lib/postgresql/data/pg_hba.conf | grep "0.0.0.0"

# Vérifiez le firewall:
ufw status | grep 5432
# ou
iptables -L | grep 5432
```

### Erreur: "password authentication failed"

Le mot de passe dans `.env.local` ne correspond pas.

**Solution:**

```bash
# Sur le VPS, changez le mot de passe:
docker exec -it <nom_conteneur> psql -U postgres -c "ALTER USER postgres PASSWORD 'dinyoili@PJB24';"
```

### Le port 5432 n'est pas ouvert

**Vérifiez avec:**

```bash
# Depuis votre machine Windows
Test-NetConnection -ComputerName 180.149.199.175 -Port 5432

# Ou avec telnet
telnet 180.149.199.175 5432
```

Si ça ne fonctionne pas, le firewall bloque le port.

---

## ✅ Une fois que tout fonctionne

Sur votre machine Windows:

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Pousser le schéma
npx prisma db push

# 3. (Optionnel) Seed la base de données
npx prisma db seed

# 4. Démarrer l'application
npm run dev
```

🎉 **Votre application devrait maintenant fonctionner sans erreurs !**

---

## 📝 Commandes Utiles

```bash
# Sur le VPS

# Voir les logs PostgreSQL
docker logs -f <nom_conteneur>

# Se connecter à PostgreSQL
docker exec -it <nom_conteneur> psql -U postgres -d dinitech-base

# Lister les bases de données
docker exec <nom_conteneur> psql -U postgres -c "\l"

# Voir les connexions actives
docker exec <nom_conteneur> psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Redémarrer PostgreSQL
docker restart <nom_conteneur>
```







