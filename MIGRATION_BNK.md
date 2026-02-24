# Migration BoutikNaka vers bnk2026

## Architecture

- **Code** : Développement sur PC Windows (`C:\Users\OiliDINY\Bnk2026`)
- **Base de données** : PostgreSQL sur Raspberry Pi (via Docker Compose)
- **Images** : MinIO sur Raspberry Pi (via Docker Compose)
- **Déploiement** : Raspberry Pi via Docker Compose (build local)

## Configuration

### 1. Sur votre PC Windows

Le fichier `.env` pointe vers le Raspberry Pi via Tailscale :

```env
# PostgreSQL sur Raspberry Pi
DATABASE_URL="postgresql://bnk2026:bnk2026_secure_pass@100.70.249.11:5432/bnk2026?schema=public"

# MinIO sur Raspberry Pi
MINIO_ENDPOINT=http://100.70.249.11:9000
MINIO_PUBLIC_URL=http://100.70.249.11:9000
MINIO_ACCESS_KEY=bnk2026admin
MINIO_SECRET_KEY=bnk2026_minio_pass
MINIO_BUCKET=bnk2026
MINIO_REGION=us-east-1

# NextAuth
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# PayPal (sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Aeuzx1YSLM6KdZ5Diepn0yHLyGkcdXERENMGbMJQMCv4niQ3kT2eOhaeOVLAhJDU8E5rNRXq0qF9ULux
PAYPAL_CLIENT_SECRET=EGsWRAZhV1-aVb1U7B13lel1k0p2-IVmEAkVt-vYHmXM18xxEltFUx1rErHHm0iNWcXq1S_FGIhq8Kko
PAYPAL_MODE=sandbox
```

### 2. Sur le Raspberry Pi

Copiez `.env.raspberry` en `.env` dans le dossier du projet :

```bash
ssh pi
cd ~/bnk2026
cp .env.raspberry .env
```

## Développement local (PC)

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Créer/appliquer les migrations
npx prisma migrate dev

# Lancer le serveur de développement
npm run dev
```

L'application se connecte automatiquement à PostgreSQL et MinIO sur le Raspberry Pi via Tailscale.

## Déploiement sur Raspberry Pi

### 1. Première fois

```bash
# SSH vers le Pi
ssh pi

# Cloner le projet
cd ~
git clone https://github.com/Dinitech2025/bnk2026.git
cd bnk2026

# Configurer l'environnement
cp .env.raspberry .env
nano .env  # Vérifier les valeurs

# Lancer les services
docker compose up -d
```

### 2. Mises à jour

```bash
ssh pi
cd ~/bnk2026
git pull origin main
docker compose up -d --build
```

## Accès aux services

- **Application** : http://100.70.249.11:3000
- **MinIO Console** : http://100.70.249.11:9001
- **PostgreSQL** : 100.70.249.11:5432

## Migrations de données

Les migrations Prisma s'exécutent automatiquement au démarrage du conteneur via `docker-entrypoint.sh`.

## Changements par rapport à l'ancien projet

1. **Stockage** : Cloudinary/ImageKit → MinIO (self-hosted)
2. **Base de données** : Prisma Accelerate (cloud) → PostgreSQL (Raspberry Pi)
3. **Déploiement** : Coolify → Docker Compose direct
4. **Images** : Optimisation automatique en WebP avec Sharp
