# Configuration de la base de données VPS

## Informations de connexion
- **IP VPS**: 180.149.199.175
- **User SSH**: root
- **Database**: dinitech-base

## Étapes de configuration

### 1. Vérifier PostgreSQL sur le VPS

Connectez-vous au VPS et vérifiez PostgreSQL :

```bash
ssh root@180.149.199.175

# Vérifier les conteneurs Docker
docker ps | grep postgres

# Si PostgreSQL n'est pas en cours d'exécution, le démarrer
docker start postgres  # ou le nom du conteneur

# Vérifier les informations de connexion
docker exec -it <container_name> psql -U postgres -c "\l"
```

### 2. Créer la base de données (si elle n'existe pas)

```bash
# Se connecter au conteneur PostgreSQL
docker exec -it <container_name> psql -U postgres

# Créer la base de données
CREATE DATABASE "dinitech-base";

# Créer un utilisateur (optionnel)
CREATE USER boutiknaka WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE "dinitech-base" TO boutiknaka;
```

### 3. Configurer l'accès distant

Modifier `postgresql.conf` pour écouter sur toutes les interfaces :

```bash
docker exec -it <container_name> bash
nano /var/lib/postgresql/data/postgresql.conf

# Modifier la ligne :
listen_addresses = '*'
```

Modifier `pg_hba.conf` pour autoriser les connexions distantes :

```bash
nano /var/lib/postgresql/data/pg_hba.conf

# Ajouter cette ligne :
host    all             all             0.0.0.0/0               md5
```

Redémarrer PostgreSQL :

```bash
docker restart <container_name>
```

### 4. Ouvrir le port 5432 sur le firewall

```bash
# Sur le VPS
ufw allow 5432/tcp
# ou
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

### 5. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Base de données VPS PostgreSQL
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@180.149.199.175:5432/dinitech-base?schema=public"

# Si vous avez créé un utilisateur spécifique :
# DATABASE_URL="postgresql://boutiknaka:votre_mot_de_passe@180.149.199.175:5432/dinitech-base?schema=public"

# NextAuth
NEXTAUTH_SECRET="votre_secret_nextauth"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Pousser le schéma Prisma vers la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push

# Seed la base de données (optionnel)
npx prisma db seed
```

### 7. Redémarrer le serveur de développement

```bash
npm run dev
```

## Troubleshooting

### Erreur de connexion
- Vérifier que PostgreSQL écoute sur 0.0.0.0:5432
- Vérifier que le firewall autorise le port 5432
- Vérifier les credentials dans DATABASE_URL

### Erreur de permission
- Vérifier que l'utilisateur a les droits sur la base de données
- Exécuter : `GRANT ALL PRIVILEGES ON DATABASE "dinitech-base" TO votre_user;`

### Port déjà utilisé
- Vérifier avec : `docker ps`
- Mapper un autre port : `-p 5433:5432`







