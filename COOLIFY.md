# Déploiement sur Coolify — Next.js + Prisma + PostgreSQL

## 1. Créer la base de données PostgreSQL dans Coolify

1. Dans Coolify → **Databases** → **+ New Database** → choisir **PostgreSQL**.
2. Donner un nom (ex: `bnk2026-db-prod` pour la prod, `bnk2026-db-sandbox` pour le sandbox).
3. Après création, copier la **Connection String** (format `postgresql://...`).

## 2. Créer l'application Next.js dans Coolify

1. **Nouvelle ressource** → **Public Repository** (ou dépôt privé avec GitHub App).
2. **URL du dépôt** : `https://github.com/Dinitech2025/bnk2026`
3. **Branche** :
   - Production → `main`
   - Sandbox → `sandbox`
4. **Build Pack** : Nixpacks (détection automatique de Next.js).
5. **Commandes** :
   - Install : `npm install`
   - Build : `npm run build` (inclut `prisma generate` automatiquement)
   - Start : `npm run start`
6. **Port** : `3000`

## 3. Variables d'environnement dans Coolify

Dans l'onglet **Environment Variables** de chaque ressource, ajouter :

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
NODE_ENV=production
```

> Utiliser la Connection String copiée à l'étape 1.

## 4. Migrations de base de données

Après chaque modification du schéma Prisma, exécuter les migrations.

**Option A — Via Coolify (recommandé)**
Ajouter dans les variables d'environnement un script post-déploiement ou utiliser la commande :
```
npx prisma migrate deploy
```

**Option B — En local avant le push**
```bash
npx prisma migrate dev --name nom_de_la_migration
git add prisma/migrations
git commit -m "migration: ..."
git push
```

## 5. Branches et environnements

| Branche  | Base de données         | URL Coolify                  |
|----------|-------------------------|------------------------------|
| `main`   | `bnk2026-db-prod`       | `bnk2026.com`                |
| `sandbox`| `bnk2026-db-sandbox`    | `sandbox.bnk2026.com`        |

## 6. Commandes utiles en local

```bash
npm run dev          # Serveur de développement (localhost:3000)
npm run build        # Build production
npm run db:migrate   # Appliquer les migrations
npm run db:studio    # Ouvrir Prisma Studio (interface visuelle DB)
npx prisma migrate dev --name ma_migration  # Créer une migration
```
