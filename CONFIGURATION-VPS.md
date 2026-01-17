# 🚀 Configuration VPS PostgreSQL - Guide Rapide

## ⚡ Configuration Rapide (2 minutes)

### Étape 1 : Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec ce contenu :

```env
# Base de données VPS PostgreSQL
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE_POSTGRES@180.149.199.175:5432/dinitech-base?schema=public"

# NextAuth (générez un secret aléatoire)
NEXTAUTH_SECRET="changez_moi_par_un_secret_aleatoire_long"
NEXTAUTH_URL="http://localhost:3000"
```

**⚠️ Remplacez `VOTRE_MOT_DE_PASSE_POSTGRES` par le vrai mot de passe PostgreSQL de votre VPS**

### Étape 2 : Vérifier PostgreSQL sur le VPS

Connectez-vous à votre VPS :

```bash
ssh root@180.149.199.175
# Mot de passe SSH: X0D8i6O6b7u1m9m
```

Vérifiez que PostgreSQL tourne :

```bash
docker ps | grep postgres
```

Si PostgreSQL n'est pas démarré :

```bash
docker start postgres  # ou le nom de votre conteneur
```

### Étape 3 : Configurer l'accès distant (IMPORTANT)

Sur le VPS, trouvez le nom du conteneur PostgreSQL :

```bash
docker ps
```

Puis configurez PostgreSQL pour accepter les connexions distantes :

```bash
# Remplacez <container_name> par le nom réel
docker exec -it <container_name> bash

# Éditer postgresql.conf
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

# Éditer pg_hba.conf
echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf

# Sortir du conteneur
exit

# Redémarrer PostgreSQL
docker restart <container_name>
```

### Étape 4 : Ouvrir le port 5432

```bash
# Sur le VPS
ufw allow 5432/tcp
# ou
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

### Étape 5 : Vérifier la base de données

```bash
# Sur le VPS
docker exec -it <container_name> psql -U postgres

# Dans psql
\l  # Lister les bases de données
# Vérifier que 'dinitech-base' existe

# Si elle n'existe pas, la créer :
CREATE DATABASE "dinitech-base";

\q  # Quitter
```

### Étape 6 : Pousser le schéma Prisma

Sur votre machine locale (Windows) :

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données VPS
npx prisma db push

# (Optionnel) Seed la base de données
npx prisma db seed
```

### Étape 7 : Démarrer l'application

```bash
npm run dev
```

## 🔧 Troubleshooting

### ❌ Erreur : "Can't reach database server"

**Solutions :**
1. Vérifiez que PostgreSQL écoute sur `0.0.0.0:5432` (pas seulement `127.0.0.1`)
2. Vérifiez que le firewall autorise le port 5432
3. Vérifiez que le mot de passe dans `.env.local` est correct

**Commande de test :**
```bash
# Depuis votre machine Windows
telnet 180.149.199.175 5432
# ou
Test-NetConnection -ComputerName 180.149.199.175 -Port 5432
```

### ❌ Erreur : "password authentication failed"

**Solution :**
Vérifiez le mot de passe PostgreSQL :

```bash
# Sur le VPS
docker exec -it <container_name> psql -U postgres
# Si ça demande un mot de passe, c'est celui-là que vous devez mettre dans .env.local
```

Pour changer le mot de passe :

```bash
docker exec -it <container_name> psql -U postgres -c "ALTER USER postgres PASSWORD 'nouveau_mot_de_passe';"
```

### ❌ Erreur : "database does not exist"

**Solution :**
```bash
docker exec -it <container_name> psql -U postgres -c "CREATE DATABASE \"dinitech-base\";"
```

## 📝 Exemple de fichier .env.local complet

```env
# Base de données VPS PostgreSQL
DATABASE_URL="postgresql://postgres:monmotdepasse123@180.149.199.175:5432/dinitech-base?schema=public&connect_timeout=30"

# NextAuth
NEXTAUTH_SECRET="super_secret_aleatoire_tres_long_et_securise_123456789"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (si vous l'utilisez)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre_cloud_name"
CLOUDINARY_API_KEY="votre_api_key"
CLOUDINARY_API_SECRET="votre_api_secret"

# ImageKit (si vous l'utilisez)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="votre_public_key"
IMAGEKIT_PRIVATE_KEY="votre_private_key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/votre_id"
```

## ✅ Vérification finale

Une fois tout configuré, vérifiez que tout fonctionne :

```bash
# Tester la connexion Prisma
npx prisma db execute --stdin < /dev/null

# Démarrer l'application
npm run dev
```

Allez sur http://localhost:3000 et vérifiez qu'il n'y a plus d'erreurs 500 ! 🎉







